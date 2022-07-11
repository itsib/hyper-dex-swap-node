import { BigNumber, CalldataInfo, MarketOperation, SwapQuote, SwapQuoteConsumer, SwapQuoter } from '@0x/asset-swapper';
import { BadRequest } from '@tsed/exceptions';
import { Contract } from 'ethers';
import { inject, injectable } from 'inversify';
import wethAbi from '../abi/weth.json';
import { DEFAULT_QUOTE_OPTS, NULL_ADDRESS } from '../constants';
import { GetSwapQuoteRequest, GetSwapQuoteResponse, Provider, QuoteParams } from '../types';
import {
  FakeOrderbook,
  getSwapQuotePrice,
  getSwapQuoteSources,
  parseAddress,
  parseAmount,
  parseLiquiditySources,
  Web3Provider,
} from '../utils';
import { OptionsService } from './options-service';

export interface ISwapService {
  getQuote(req: QuoteParams): Promise<any>;
}

@injectable()
export class SwapService implements ISwapService {

  private readonly _swapQuoter: Promise<SwapQuoter>;

  private readonly _swapQuoteConsumer: Promise<SwapQuoteConsumer>;

  private readonly _wethContract: Promise<Contract>;

  constructor(
    @inject('Provider') private _provider: Provider,
    @inject('OptionsService') private _optionsService: OptionsService,
  ) {
    this._swapQuoter = this._optionsService.getSwapQuoterOptions().then(o => new SwapQuoter(new Web3Provider(this._provider), new FakeOrderbook(), o));

    this._swapQuoteConsumer = this._optionsService.getSwapQuoterOptions().then(o => new SwapQuoteConsumer(o));

    this._wethContract = this._optionsService.getWrappedAddress().then(address => new Contract(address, wethAbi, this._provider));
  }

  async getQuote(params: QuoteParams): Promise<any> {
    const quoteRequest: GetSwapQuoteRequest = await this._parseQuoteParams(params);

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
  private async _getWrapQuote(quoteRequest: GetSwapQuoteRequest): Promise<GetSwapQuoteResponse> {
    const { chainId } = await this._provider.getNetwork();
    const nativeAddress = await this._optionsService.getNativeAddress();
    const wethContract = await this._wethContract;
    const data = wethContract.interface.encodeFunctionData('deposit', []);
    const value = quoteRequest.amount;

    return {
      chainId,
      buyAmount: quoteRequest.amount.toString(),
      sellAmount: quoteRequest.amount.toString(),
      buyTokenAddress: wethContract.address,
      sellTokenAddress: nativeAddress,

      price: '1',
      guaranteedPrice: '1',
      sources: [],
      sellTokenToEthRate: '1',
      buyTokenToEthRate: '1',
      allowanceTarget: NULL_ADDRESS,

      from: quoteRequest.takerAddress,
      to: wethContract.address,
      value: value.toString(),
      data,
    };
  }

  /**
   * Calculate quote for unwrap native currency
   * @param quoteRequest
   * @private
   */
  private async _getUnwrapQuote(quoteRequest: GetSwapQuoteRequest): Promise<any> {
    const { chainId } = await this._provider.getNetwork();
    const nativeAddress = await this._optionsService.getNativeAddress();
    const wethContract = await this._wethContract;
    const data = wethContract.interface.encodeFunctionData('withdraw', [quoteRequest.amount.toString()]);

    return {
      chainId,
      buyAmount: quoteRequest.amount.toString(),
      sellAmount: quoteRequest.amount.toString(),
      buyTokenAddress: nativeAddress,
      sellTokenAddress: wethContract.address,

      price: '1',
      guaranteedPrice: '1',
      sources: [],
      sellTokenToEthRate: '1',
      buyTokenToEthRate: '1',
      allowanceTarget: wethContract.address,

      from: quoteRequest.takerAddress,
      to: wethContract.address,
      value: '0',
      data,
    };
  }

  /**
   * Swap quote calculation
   * @param quoteRequest
   * @private
   */
  private async _getSwapQuote(quoteRequest: GetSwapQuoteRequest): Promise<GetSwapQuoteResponse> {
    const { chainId } = await this._provider.getNetwork();
    const swapQuoter = await this._swapQuoter;
    const swapQuoteConsumer = await this._swapQuoteConsumer;
    const nativeAddress = await this._optionsService.getNativeAddress();
    const contractAddresses = await this._optionsService.getContractAddresses();

    const options = {
      ...DEFAULT_QUOTE_OPTS,
      excludedSources: quoteRequest.excludedSources,
      bridgeSlippage: quoteRequest.slippagePercentage,
    };

    const swapQuote: SwapQuote = await swapQuoter.getSwapQuoteAsync(
      quoteRequest.buyToken,
      quoteRequest.sellToken,
      quoteRequest.amount,
      quoteRequest.tradeType,
      options,
    );

    const callDataInfo: CalldataInfo = await swapQuoteConsumer.getCalldataOrThrowAsync(swapQuote, {
      extensionContractOpts: {
        isFromETH: quoteRequest.isNativeSell,
        isToETH: quoteRequest.isNativeBuy,
        isMetaTransaction: false,
        shouldSellEntireBalance: false,
      },
    });

    const { price, guaranteedPrice } = getSwapQuotePrice(swapQuote);
    const sellTokenToEthRate = swapQuote.takerAmountPerEth.times(new BigNumber(10).pow(18 - swapQuote.takerTokenDecimals)).decimalPlaces(swapQuote.takerTokenDecimals);
    const buyTokenToEthRate = swapQuote.makerAmountPerEth.times(new BigNumber(10).pow(18 - swapQuote.makerTokenDecimals)).decimalPlaces(swapQuote.makerTokenDecimals);

    const value = quoteRequest.isNativeSell ? swapQuote.worstCaseQuoteInfo.protocolFeeInWeiAmount.plus(swapQuote.worstCaseQuoteInfo.takerAmount) : swapQuote.worstCaseQuoteInfo.protocolFeeInWeiAmount;

    return {
      chainId,
      buyAmount: swapQuote.bestCaseQuoteInfo.makerAmount.toString(),
      sellAmount: swapQuote.bestCaseQuoteInfo.totalTakerAmount.toString(),
      buyTokenAddress: quoteRequest.isNativeBuy ? nativeAddress : quoteRequest.buyToken,
      sellTokenAddress: quoteRequest.isNativeSell ? nativeAddress : quoteRequest.sellToken,

      price: price.toString(),
      guaranteedPrice: guaranteedPrice.toString(),
      sources: getSwapQuoteSources(swapQuote, chainId),
      sellTokenToEthRate: sellTokenToEthRate.toString(),
      buyTokenToEthRate: buyTokenToEthRate.toString(),
      allowanceTarget: quoteRequest.isNativeSell ? NULL_ADDRESS : contractAddresses.exchangeProxy,

      from: quoteRequest.takerAddress,
      to: callDataInfo.toAddress,
      value: value.toString(),
      data: callDataInfo.calldataHexString,
    };
  }

  /**
   * Build quote request
   * @param params
   * @private
   */
  private async _parseQuoteParams(params: QuoteParams): Promise<GetSwapQuoteRequest> {
    const wrappedAddress = await this._optionsService.getWrappedAddress();
    const defaultExcludedSources = await this._optionsService.getDefaultExcludedSources();

    const isNativeSell = params.sellToken === 'NATIVE';
    const isNativeBuy = params.buyToken === 'NATIVE';
    const sellToken = isNativeSell ? wrappedAddress : parseAddress(params.sellToken, 'sellToken');
    const buyToken = isNativeBuy ? wrappedAddress : parseAddress(params.buyToken, 'buyToken');
    const isWrap = isNativeSell && buyToken === wrappedAddress;
    const isUnwrap = isNativeBuy && sellToken === wrappedAddress;
    const tradeType = params.sellAmount ? MarketOperation.Sell : MarketOperation.Buy;
    const amount = tradeType === MarketOperation.Sell ? parseAmount(params.sellAmount, 'sellAmount') : parseAmount(params.buyAmount, 'buyAmount');
    const takerAddress = parseAddress(params.takerAddress, 'takerAddress');
    const slippagePercentage = params.slippagePercentage === undefined ? DEFAULT_QUOTE_OPTS.bridgeSlippage : Number.parseFloat(params.slippagePercentage);
    const excludedSources = parseLiquiditySources(params.excludedSources, defaultExcludedSources, 'excludedSources');

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
}
