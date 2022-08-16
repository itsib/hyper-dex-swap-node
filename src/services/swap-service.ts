import { BadRequest } from '@tsed/exceptions';
import Big from 'big.js';
import { Contract } from 'ethers';
import { inject, injectable } from 'inversify';
import wethAbi from '../abi/WETH.json';
import { CONFIG } from '../config';
import {
  DEFAULT_SAMPLER_OPTS,
  NATIVE_ADDRESS,
  NULL_ADDRESS,
  SELL_SOURCE_FILTERS,
  WRAPPED_NATIVE_ADDRESS,
} from '../constants';
import {
  BridgeSource,
  ChainId,
  MarketSide,
  Provider,
  SamplerOptimizerResultWithReport,
  SamplerOptions,
  SwapQuote,
  SwapQuoteLiquiditySource,
  SwapQuoteOrdersBreakdown,
  SwapQuoteParsedParams,
  SwapQuoteQuery,
  SwapQuoteResponse,
} from '../types';
import { createSwapQuote, parseAddress, parseAmount, parseLiquiditySources } from '../utils';
import { SamplerService } from './sampler-service';
import { SwapConsumerService } from './swap-consumer-service';

function getDefaultExcludedSources(chainId: ChainId): BridgeSource[] {
  const allBridgeSources = Object.values(BridgeSource);
  switch (chainId) {
    case ChainId.MAINNET:
      return [BridgeSource.MultiBridge];
    case ChainId.KOVAN:
      return allBridgeSources.filter(source => source !== BridgeSource.UniswapV2);
    case ChainId.ROPSTEN:
      const supportedRopstenSources = new Set([
        BridgeSource.SushiSwap,
        BridgeSource.Uniswap,
        BridgeSource.UniswapV2,
        BridgeSource.UniswapV3,
        BridgeSource.Curve,
        BridgeSource.Mooniswap,
      ]);
      return allBridgeSources.filter((s) => !supportedRopstenSources.has(s));
    case ChainId.BSC:
    case ChainId.MATIC:
    case ChainId.AVALANCHE:
    case ChainId.FANTOM:
      return [BridgeSource.MultiBridge];
    default:
      return [];
  }
}

@injectable()
export class SwapService {

  private readonly _wethContract: Contract;

  private readonly _defaultExcludedSources: BridgeSource[];

  constructor(
    @inject('Provider') private _provider: Provider,
    @inject('ChainId') private _chainId: ChainId,
    @inject('SamplerService') private _samplerService: SamplerService,
    @inject('SwapConsumerService') private _swapConsumerService: SwapConsumerService,
  ) {
    this._wethContract = new Contract(WRAPPED_NATIVE_ADDRESS[this._chainId], wethAbi, this._provider);

    this._defaultExcludedSources = getDefaultExcludedSources(this._chainId);
  }

  async getQuote(params: SwapQuoteQuery): Promise<SwapQuoteResponse> {
    const quoteRequest: SwapQuoteParsedParams = await this._parseQuoteParams(params);

    if (quoteRequest.isWrap) {
      return this._getWrapQuote(quoteRequest);
    } else if (quoteRequest.isUnwrap) {
      return this._getUnwrapQuote(quoteRequest);
    } else {
      return this._getSwapQuote(quoteRequest);
    }
  }

  /**
   * Calculate quote for wrap native currency
   * @param quoteRequest
   * @private
   */
  private async _getWrapQuote(quoteRequest: SwapQuoteParsedParams): Promise<SwapQuoteResponse> {
    return {
      chainId: this._chainId,
      buyAmount: quoteRequest.amount.toString(),
      sellAmount: quoteRequest.amount.toString(),
      buyTokenAddress: WRAPPED_NATIVE_ADDRESS[this._chainId],
      sellTokenAddress: NATIVE_ADDRESS[this._chainId],
      allowanceTarget: NULL_ADDRESS,

      price: '1',
      guaranteedPrice: '1',
      sources: [],
      sellTokenToEthRate: '1',
      buyTokenToEthRate: '1',
      protocolFee: '0',
      minimumProtocolFee: '0',

      from: quoteRequest.takerAddress,
      to: WRAPPED_NATIVE_ADDRESS[this._chainId],
      value: quoteRequest.amount.toString(),
      data: this._wethContract.interface.encodeFunctionData('deposit', []),
    };
  }

  /**
   * Calculate quote for unwrap native currency
   * @param quoteRequest
   * @private
   */
  private async _getUnwrapQuote(quoteRequest: SwapQuoteParsedParams): Promise<SwapQuoteResponse> {
    return {
      chainId: this._chainId,
      buyAmount: quoteRequest.amount.toString(),
      sellAmount: quoteRequest.amount.toString(),
      buyTokenAddress: NATIVE_ADDRESS[this._chainId],
      sellTokenAddress: WRAPPED_NATIVE_ADDRESS[this._chainId],
      allowanceTarget: WRAPPED_NATIVE_ADDRESS[this._chainId],

      price: '1',
      guaranteedPrice: '1',
      sources: [],
      sellTokenToEthRate: '1',
      buyTokenToEthRate: '1',
      protocolFee: '0',
      minimumProtocolFee: '0',

      from: quoteRequest.takerAddress,
      to: WRAPPED_NATIVE_ADDRESS[this._chainId],
      value: '0',
      data: this._wethContract.interface.encodeFunctionData('withdraw', [quoteRequest.amount.toString()]),
    };
  }

  /**
   * Swap quote calculation
   * @param quoteRequest
   * @private
   */
  private async _getSwapQuote(quoteRequest: SwapQuoteParsedParams): Promise<SwapQuoteResponse> {
    const samplerOpts: Required<SamplerOptions> = {
      ...DEFAULT_SAMPLER_OPTS,
      excludedSources: quoteRequest.excludedSources,
      slippagePercentage: quoteRequest.slippagePercentage,
    }

    const optimizerResult: SamplerOptimizerResultWithReport = await this._samplerService.getOptimizerResult(
      quoteRequest.buyToken,
      quoteRequest.sellToken,
      quoteRequest.amount,
      quoteRequest.tradeType,
      samplerOpts,
    );

    const swapQuote: SwapQuote = createSwapQuote(
      optimizerResult,
      quoteRequest.buyToken,
      quoteRequest.sellToken,
      quoteRequest.tradeType,
      quoteRequest.amount,
      '10',
      DEFAULT_SAMPLER_OPTS.gasSchedule,
      quoteRequest.slippagePercentage,
    );

    // Use the raw gas, not scaled by gas price
    const exchangeProxyOverhead = Big(samplerOpts.exchangeOverhead(optimizerResult.sourceFlags)).toNumber();
    swapQuote.bestCaseQuoteInfo.gas += exchangeProxyOverhead;
    swapQuote.worstCaseQuoteInfo.gas += exchangeProxyOverhead;

    const txCalldata = await this._swapConsumerService.getTxCalldata(swapQuote, {
      isNativeSell: quoteRequest.isNativeSell,
      isNativeBuy: quoteRequest.isNativeBuy
    });

    const { price, guaranteedPrice } = this._getSwapQuotePrice(swapQuote);

    const sellTokenToEthRate = Big(swapQuote.sellAmountPerEth).times(Math.pow(10, 18 - swapQuote.sellTokenDecimals)).toFixed(swapQuote.sellTokenDecimals);
    const buyTokenToEthRate = Big(swapQuote.buyAmountPerEth).times(Math.pow(10, 18 - swapQuote.buyTokenDecimals)).toFixed(swapQuote.buyTokenDecimals);

    const minimumProtocolFee = swapQuote.worstCaseQuoteInfo.protocolFeeInWeiAmount.lt(swapQuote.bestCaseQuoteInfo.protocolFeeInWeiAmount) ? swapQuote.worstCaseQuoteInfo.protocolFeeInWeiAmount : swapQuote.bestCaseQuoteInfo.protocolFeeInWeiAmount;

    const value = quoteRequest.isNativeSell ? swapQuote.worstCaseQuoteInfo.protocolFeeInWeiAmount.add(swapQuote.worstCaseQuoteInfo.sellAmount) : swapQuote.worstCaseQuoteInfo.protocolFeeInWeiAmount;

    return {
      chainId: this._chainId,
      buyAmount: swapQuote.bestCaseQuoteInfo.buyAmount.toString(),
      sellAmount: swapQuote.bestCaseQuoteInfo.sellAmount.toString(),
      buyTokenAddress: quoteRequest.isNativeBuy ? NATIVE_ADDRESS[this._chainId] : quoteRequest.buyToken,
      sellTokenAddress: quoteRequest.isNativeSell ? NATIVE_ADDRESS[this._chainId] : quoteRequest.sellToken,
      allowanceTarget: quoteRequest.isNativeSell ? NULL_ADDRESS : CONFIG.EXCHANGE_PROXY,

      price: price.toString(),
      guaranteedPrice: guaranteedPrice.toString(),
      sources: this._getSwapQuoteSources(swapQuote),
      sellTokenToEthRate: sellTokenToEthRate.toString(),
      buyTokenToEthRate: buyTokenToEthRate.toString(),
      protocolFee: swapQuote.worstCaseQuoteInfo.protocolFeeInWeiAmount.toString(),
      minimumProtocolFee: minimumProtocolFee.toString(),

      from: quoteRequest.takerAddress,
      to: txCalldata.to,
      value: value.toString(),
      data: txCalldata.data,
    };
  }

  /**
   * Build quote request
   * @param params
   * @private
   */
  private async _parseQuoteParams(params: SwapQuoteQuery): Promise<SwapQuoteParsedParams> {
    const isNativeSell = params.sellToken === 'NATIVE';
    const isNativeBuy = params.buyToken === 'NATIVE';
    const sellToken = isNativeSell ? WRAPPED_NATIVE_ADDRESS[this._chainId] : parseAddress(params.sellToken, 'sellToken');
    const buyToken = isNativeBuy ? WRAPPED_NATIVE_ADDRESS[this._chainId] : parseAddress(params.buyToken, 'buyToken');
    const isWrap = isNativeSell && buyToken === WRAPPED_NATIVE_ADDRESS[this._chainId];
    const isUnwrap = isNativeBuy && sellToken === WRAPPED_NATIVE_ADDRESS[this._chainId];
    const tradeType = params.sellAmount ? MarketSide.Sell : MarketSide.Buy;
    const amount = tradeType === MarketSide.Sell ? parseAmount(params.sellAmount, 'sellAmount') : parseAmount(params.buyAmount, 'buyAmount');
    const takerAddress = parseAddress(params.takerAddress, 'takerAddress');
    const slippagePercentage = params.slippagePercentage === undefined ? DEFAULT_SAMPLER_OPTS.slippagePercentage : Number.parseFloat(params.slippagePercentage);
    const excludedSources = parseLiquiditySources(params.excludedSources, this._defaultExcludedSources, 'excludedSources');

    // If token addresses are the same but unwrap or wrap operation is requested
    if (!isUnwrap && !isWrap && sellToken === buyToken) {
      throw new BadRequest('Validation Error', ['buyToken', 'sellToken'].map(field => ({
        field,
        message: 'buyToken and sellToken must be different',
      })));
    }

    // If some token addresses are null address
    if (sellToken === NULL_ADDRESS || buyToken === NULL_ADDRESS) {
      const errorDetail: { field: string; message: string }[] = [];
      if (sellToken === NULL_ADDRESS) {
        errorDetail.push({ field: 'sellToken', message: 'sellToken should not be null address' });
      }
      if (buyToken === NULL_ADDRESS) {
        errorDetail.push({ field: 'buyToken', message: 'buyToken should not be null address' });
      }
      throw new BadRequest('Validation Error', errorDetail);
    }

    // If taker address are null
    if (takerAddress === NULL_ADDRESS) {
      throw new BadRequest('Validation Error', [{
        field: 'takerAddress',
        message: 'takerAddress should not be null address',
      }]);
    }

    // If slippage percentage are invalid
    if (isNaN(slippagePercentage) || slippagePercentage > 1 || slippagePercentage < 0) {
      throw new BadRequest('Validation Error', [{
        field: 'slippagePercentage',
        message: 'slippagePercentage Must be a number less than one and greater than zero.',
      }]);
    }

    return {
      sellToken,
      buyToken,
      amount,
      tradeType,
      takerAddress,

      slippagePercentage,
      excludedSources,

      isWrap,
      isUnwrap,
      isNativeSell,
      isNativeBuy,
    }
  }

  /**
   * Calculate swap quote execute prices
   * @param quote
   * @private
   */
  private _getSwapQuotePrice(quote: SwapQuote): { price: string; guaranteedPrice: string } {
    const isSelling = quote.side === MarketSide.Sell;
    const { buyAmount, totalSellAmount } = quote.bestCaseQuoteInfo;
    const { buyAmount: guaranteedBuyAmount, totalSellAmount: guaranteedTotalSellAmount } = quote.worstCaseQuoteInfo;

    const roundingStrategy = isSelling ? 0 : 3;
    const buyAmountMultiplier = Math.pow(10, quote.buyTokenDecimals);
    const sellAmountMultiplier = Math.pow(10, quote.sellTokenDecimals);

    const unitBuyAmount = buyAmount.toBig().div(buyAmountMultiplier);
    const unitSellAmount = totalSellAmount.toBig().div(sellAmountMultiplier);
    const guaranteedUnitBuyAmount = guaranteedBuyAmount.toBig().div(buyAmountMultiplier);
    const guaranteedUnitSellAmount = guaranteedTotalSellAmount.toBig().div(sellAmountMultiplier);

    // Best price
    const price = isSelling
      ? unitBuyAmount
        .div(unitSellAmount)
        .times(buyAmountMultiplier)
        .toFixed(0, roundingStrategy)
      : unitSellAmount
        .div(unitBuyAmount)
        .times(sellAmountMultiplier)
        .toFixed(0, roundingStrategy);

    // Guaranteed price before revert occurs
    const guaranteedPrice = isSelling
      ? guaranteedUnitBuyAmount
        .div(guaranteedUnitSellAmount)
        .times(buyAmountMultiplier)
        .toFixed(0, roundingStrategy)
      : guaranteedUnitSellAmount
        .div(guaranteedUnitBuyAmount)
        .times(sellAmountMultiplier)
        .toFixed(0, roundingStrategy);

    return { price, guaranteedPrice };
  }

  private _getSwapQuoteSources(quote: SwapQuote): SwapQuoteLiquiditySource[] {
    const sourceBreakdown: SwapQuoteOrdersBreakdown = quote.sourceBreakdown;
    const defaultSourceBreakdown: SwapQuoteOrdersBreakdown[] = Object.assign(
      {},
      ...Object.values(SELL_SOURCE_FILTERS[this._chainId].getSources()).map((s) => ({ [s as any]: '0' })),
    );

    return Object.entries({ ...defaultSourceBreakdown, ...sourceBreakdown }).reduce<SwapQuoteLiquiditySource[]>((acc, [source, breakdown]) => {
      let obj;
      if (source === BridgeSource.MultiHop && typeof breakdown !== 'string') {
        obj = {
          ...(breakdown as any)!,
          name: BridgeSource.MultiHop,
          proportion: +Big((breakdown as any)!.proportion).toPrecision(4),
        };
      } else {
        obj = {
          name: source,
          proportion: +Big(breakdown as string).toPrecision(4),
        };
      }
      return [...acc, obj];
    }, []);
  }
}
