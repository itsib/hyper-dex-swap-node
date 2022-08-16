import { Interface } from '@ethersproject/abi';
import Big from 'big.js';
import { BigNumber, Contract } from 'ethers';
import { inject, injectable } from 'inversify';
import exchangeProxyAbi from '../abi/ExchangeProxy.json';
import multiplexAbi from '../abi/Multiplex.json';
import wethAbi from '../abi/WETH.json';
import { CONFIG } from '../config';
import {
  CURVE_LIQUIDITY_PROVIDER,
  ETH_NATIVE_ADDRESS,
  MAX_UINT256,
  MOONISWAP_LIQUIDITY_PROVIDER,
  NULL_ADDRESS,
  NULL_BYTES,
  WRAPPED_NATIVE_ADDRESS, ZERO_AMOUNT,
} from '../constants';
import {
  BridgeSource,
  ChainId,
  CreateTxCalldataOpts,
  CurveFillData,
  DexOrder,
  FillQuoteTransformerSide,
  FinalUniswapV3FillData,
  LiquidityProviderFillData,
  MarketBuySwapQuote,
  MarketSellSwapQuote,
  MarketSide,
  MooniswapFillData,
  SwapQuote,
  TxCalldata,
  UniswapV2FillData,
} from '../types';
import {
  createBridgeDataForBridgeOrder,
  CURVE_LIQUIDITY_PROVIDER_DATA_ABI_CODER,
  FILL_QUOTE_TRANSFORMER_ABI_CODER,
  findTransformerNonce,
  getBridgeSourceToBridgeProtocol,
  isDirectSwapCompatible,
  MULTIPLEX_PLP_ABI_CODER,
  MULTIPLEX_TRANSFORM_ABI_CODER,
  MULTIPLEX_UNISWAP_ABI_CODER,
  PAY_TAKER_TRANSFORMER_ABI_CODER,
  POOL_ADDRESS_ABI_CODER,
  slipOrders,
  WETH_TRANSFORMER_ABI_CODER,
} from '../utils';

// makerToken === buyToken
// takerToken === sellToken

/**
 * Use the same order in IPancakeSwapFeature.sol
 */
const PANCAKE_SWAP_FORKS = [
  BridgeSource.PancakeSwap,
  BridgeSource.PancakeSwapV2,
  BridgeSource.BakerySwap,
  BridgeSource.SushiSwap,
  BridgeSource.ApeSwap,
  BridgeSource.CafeSwap,
  BridgeSource.CheeseSwap,
  BridgeSource.JulSwap,
];

/**
 * Use Multiplex if the non-fallback sources are a subset of
 * {UniswapV2, Sushiswap, UniswapV3}
 */
const MULTIPLEX_BATCH_FILL_SOURCES = [
  BridgeSource.UniswapV2,
  BridgeSource.SushiSwap,
  BridgeSource.LiquidityProvider,
  BridgeSource.UniswapV3,
];

const MULTIPLEX_MULTIHOP_FILL_SOURCES = [
  BridgeSource.UniswapV2,
  BridgeSource.SushiSwap,
  BridgeSource.LiquidityProvider,
];

@injectable()
export class SwapConsumerService {

  private readonly _exchangeProxy: Contract;

  private readonly _multiplex: Interface;

  private readonly _weth: Interface;

  private readonly _transformerNonces: {
    wethTransformer: number;
    payTakerTransformer: number;
    fillQuoteTransformer: number;
    affiliateFeeTransformer: number;
    positiveSlippageFeeTransformer: number;
  };

  constructor(@inject('ChainId') private _chainId: ChainId) {
    this._exchangeProxy = new Contract(CONFIG.EXCHANGE_PROXY, exchangeProxyAbi);
    this._multiplex = new Interface(multiplexAbi);
    this._weth = new Interface(wethAbi);
    this._transformerNonces = {
      wethTransformer: findTransformerNonce(
        CONFIG.WETH_TRANSFORMER,
        CONFIG.EXCHANGE_PROXY_TRANSFORMER_DEPLOYER,
      ),
      payTakerTransformer: findTransformerNonce(
        CONFIG.PAY_TAKER_TRANSFORMER,
        CONFIG.EXCHANGE_PROXY_TRANSFORMER_DEPLOYER,
      ),
      fillQuoteTransformer: findTransformerNonce(
        CONFIG.FILL_QUOTE_TRANSFORMER,
        CONFIG.EXCHANGE_PROXY_TRANSFORMER_DEPLOYER,
      ),
      affiliateFeeTransformer: findTransformerNonce(
        CONFIG.AFFILIATE_FEE_TRANSFORMER,
        CONFIG.EXCHANGE_PROXY_TRANSFORMER_DEPLOYER,
      ),
      positiveSlippageFeeTransformer: findTransformerNonce(
        CONFIG.POSITIVE_SLIPPAGE_FEE_TRANSFORMER,
        CONFIG.EXCHANGE_PROXY_TRANSFORMER_DEPLOYER,
      ),
    };
  }

  /**
   * Create transaction call data
   * @param quote
   * @param opts
   */
  async getTxCalldata(quote: MarketBuySwapQuote | MarketSellSwapQuote, opts: CreateTxCalldataOpts): Promise<TxCalldata> {
    const { isNativeBuy, isNativeSell } = opts;
    const { sellToken, buyToken } = quote;

    // Take the bounds from the worst case
    const sellAmount = quote.bestCaseQuoteInfo.totalSellAmount.gt(quote.worstCaseQuoteInfo.totalSellAmount)
      ? quote.bestCaseQuoteInfo.totalSellAmount
      : quote.worstCaseQuoteInfo.totalSellAmount;

    let minBuyAmount = quote.worstCaseQuoteInfo.buyAmount;
    let ethAmount = quote.worstCaseQuoteInfo.protocolFeeInWeiAmount;

    if (isNativeSell) {
      ethAmount = ethAmount.add(sellAmount);
    }

    const slippedOrders: DexOrder[] = slipOrders(quote);

    // VIP routes.
    if (this._chainId === ChainId.MAINNET && isDirectSwapCompatible(quote, [BridgeSource.UniswapV2, BridgeSource.SushiSwap])) {
      const source = slippedOrders[0].source;
      const fillData = (slippedOrders[0] as DexOrder<UniswapV2FillData>).fillData;

      const tokens = fillData.tokenAddressPath.map((tokenAddress, i) => {
        if (i === 0 && isNativeSell) {
          return ETH_NATIVE_ADDRESS;
        }
        if (i === fillData.tokenAddressPath.length - 1 && isNativeBuy) {
          return ETH_NATIVE_ADDRESS;
        }
        return tokenAddress;
      })

      return {
        to: this._exchangeProxy.address,
        data: this._exchangeProxy.interface.encodeFunctionData('sellToUniswap', [
          tokens,
          sellAmount,
          minBuyAmount,
          source === BridgeSource.SushiSwap,
        ]),
        value: BigNumber.from(isNativeSell ? sellAmount : 0).toHexString(),
        allowanceTarget: this._exchangeProxy.address,
        gasOverhead: '0x0',
      };
    }

    if (this._chainId === ChainId.MAINNET && isDirectSwapCompatible(quote, [BridgeSource.UniswapV3])) {
      const fillData = (slippedOrders[0] as DexOrder<FinalUniswapV3FillData>).fillData;

      let _data;
      if (isNativeSell) {
        _data = this._exchangeProxy.interface.encodeFunctionData('sellEthForTokenToUniswapV3', [
          fillData.uniswapPath,
          minBuyAmount,
          NULL_ADDRESS,
        ]);
      } else if (isNativeBuy) {
        _data = this._exchangeProxy.interface.encodeFunctionData('sellTokenForEthToUniswapV3', [
          fillData.uniswapPath,
          sellAmount,
          minBuyAmount,
          NULL_ADDRESS,
        ]);
      } else {
        _data = this._exchangeProxy.interface.encodeFunctionData('sellTokenForTokenToUniswapV3', [
          fillData.uniswapPath,
          sellAmount,
          minBuyAmount,
          NULL_ADDRESS,
        ]);
      }
      return {
        to: this._exchangeProxy.address,
        data: _data,
        value: BigNumber.from(isNativeSell ? sellAmount : '0').toHexString(),
        allowanceTarget: this._exchangeProxy.address,
        gasOverhead: '0x0',
      };
    }

    if (
      this._chainId === ChainId.BSC &&
      isDirectSwapCompatible(quote, [
        BridgeSource.PancakeSwap,
        BridgeSource.PancakeSwapV2,
        BridgeSource.BakerySwap,
        BridgeSource.SushiSwap,
        BridgeSource.ApeSwap,
        BridgeSource.CafeSwap,
        BridgeSource.CheeseSwap,
        BridgeSource.JulSwap,
      ])
    ) {
      const source = slippedOrders[0].source;
      const fillData = (slippedOrders[0] as DexOrder<UniswapV2FillData>).fillData;

      const tokens = fillData.tokenAddressPath.map((tokenAddress, i) => {
        if (i === 0 && isNativeSell) {
          return ETH_NATIVE_ADDRESS;
        }
        if (i === fillData.tokenAddressPath.length - 1 && isNativeBuy) {
          return ETH_NATIVE_ADDRESS;
        }
        return tokenAddress;
      })

      return {
        to: this._exchangeProxy.address,
        data: this._exchangeProxy.interface.encodeFunctionData('sellToPancakeSwap', [
          tokens,
          sellAmount,
          minBuyAmount,
          PANCAKE_SWAP_FORKS.indexOf(source),
        ]),
        value: BigNumber.from(isNativeSell ? sellAmount : 0).toHexString(),
        allowanceTarget: this._exchangeProxy.address,
        gasOverhead: '0x0',
      };
    }

    if ([ChainId.MAINNET, ChainId.BSC].includes(this._chainId) && isDirectSwapCompatible(quote, [BridgeSource.LiquidityProvider])) {
      const fillData = (slippedOrders[0] as DexOrder<LiquidityProviderFillData>).fillData;
      const target = fillData.poolAddress;
      return {
        to: this._exchangeProxy.address,
        data: this._exchangeProxy.interface.encodeFunctionData('sellToLiquidityProvider', [
          isNativeSell ? ETH_NATIVE_ADDRESS : sellToken,
          isNativeBuy ? ETH_NATIVE_ADDRESS : buyToken,
          target,
          NULL_ADDRESS,
          sellAmount,
          minBuyAmount,
          NULL_BYTES,
        ]),
        value: BigNumber.from(isNativeSell ? sellAmount : 0).toHexString(),
        allowanceTarget: this._exchangeProxy.address,
        gasOverhead: '0x0',
      };
    }

    // Curve VIP cannot currently support WETH buy/sell as the functionality needs to WITHDRAW or DEPOSIT
    // into WETH prior/post the trade.
    // ETH buy/sell is supported
    if (
      this._chainId === ChainId.MAINNET &&
      isDirectSwapCompatible(quote, [BridgeSource.Curve, BridgeSource.Swerve]) &&
      ![sellToken, buyToken].includes(WRAPPED_NATIVE_ADDRESS[ChainId.MAINNET])
    ) {
      const fillData = slippedOrders[0].fills[0].fillData as CurveFillData;
      return {
        to: this._exchangeProxy.address,
        data: this._exchangeProxy.interface.encodeFunctionData('sellToLiquidityProvider', [
          isNativeSell ? ETH_NATIVE_ADDRESS : sellToken,
          isNativeSell ? ETH_NATIVE_ADDRESS : buyToken,
          CURVE_LIQUIDITY_PROVIDER[this._chainId],
          NULL_ADDRESS,
          sellAmount,
          minBuyAmount,
          CURVE_LIQUIDITY_PROVIDER_DATA_ABI_CODER.encode([
            fillData.pool.poolAddress,
            fillData.pool.exchangeFunctionSelector,
            BigNumber.from(fillData.pool.sellTokenIdx),
            BigNumber.from(fillData.pool.buyTokenIdx),
          ]),
        ]),
        value: BigNumber.from(isNativeSell ? sellAmount : 0).toHexString(),
        allowanceTarget: this._exchangeProxy.address,
        gasOverhead: '0x0',
      };
    }

    if (this._chainId === ChainId.MAINNET && isDirectSwapCompatible(quote, [BridgeSource.Mooniswap])) {
      const fillData = slippedOrders[0].fills[0].fillData as MooniswapFillData;

      return {
        to: this._exchangeProxy.address,
        data: this._exchangeProxy.interface.encodeFunctionData('sellToLiquidityProvider', [
          isNativeSell ? ETH_NATIVE_ADDRESS : sellToken,
          isNativeSell ? ETH_NATIVE_ADDRESS : buyToken,
          MOONISWAP_LIQUIDITY_PROVIDER[this._chainId],
          NULL_ADDRESS,
          sellAmount,
          minBuyAmount,
          POOL_ADDRESS_ABI_CODER.encode([fillData.poolAddress]),
        ]),
        value: BigNumber.from(isNativeSell ? sellAmount : 0).toHexString(),
        allowanceTarget: this._exchangeProxy.address,
        gasOverhead: '0x0',
      };
    }

    // Used if a quote can be filled via `MultiplexFeature.batchFill`.
    // {UniswapV2, Sushiswap, UniswapV3}
    if (
      this._chainId === ChainId.MAINNET &&
      !quote.isTwoHop &&
      !isNativeSell &&
      !opts.isNativeBuy &&
      Object.keys(quote.sourceBreakdown).every(source => MULTIPLEX_BATCH_FILL_SOURCES.includes(source as BridgeSource))
    ) {
      return {
        to: this._exchangeProxy.address,
        data: this._encodeMultiplexBatchFillCalldata({ ...quote, orders: slippedOrders }),
        value: BigNumber.from(ethAmount).toHexString(),
        allowanceTarget: this._exchangeProxy.address,
        gasOverhead: '0x0',
      };
    }

    if (
      this._chainId === ChainId.MAINNET &&
      quote.isTwoHop &&
      MULTIPLEX_MULTIHOP_FILL_SOURCES.includes(quote.orders[0].source) &&
      MULTIPLEX_MULTIHOP_FILL_SOURCES.includes(quote.orders[1].source)
    ) {
      return {
        to: this._exchangeProxy.address,
        data: this._encodeMultiplexMultiHopFillCalldata(
          { ...quote, orders: slippedOrders },
          opts,
        ),
        value: BigNumber.from(ethAmount).toHexString(),
        allowanceTarget: this._exchangeProxy.address,
        gasOverhead: '0x0',
      };
    }

    // Build up the transforms.
    const transforms = [];
    if (isNativeSell) {
      // Create a WETH wrapper if coming from ETH.
      transforms.push({
        deploymentNonce: this._transformerNonces.wethTransformer,
        data: WETH_TRANSFORMER_ABI_CODER.encode([
          {
            token: ETH_NATIVE_ADDRESS,
            amount: BigNumber.from(sellAmount).toHexString(),
          }
        ]),
      });
    }

    // If it's two hop we have an intermediate token this is needed to encode the individual FQT
    // and we also want to ensure no dust amount is left in the flash wallet
    const intermediateToken = quote.isTwoHop ? slippedOrders[0].buyToken : NULL_ADDRESS;
    // This transformer will fill the quote.
    if (quote.isTwoHop) {
      const [firstHopOrder, secondHopOrder] = slippedOrders;
      transforms.push({
        deploymentNonce: this._transformerNonces.fillQuoteTransformer,
        data: FILL_QUOTE_TRANSFORMER_ABI_CODER.encode([
          {
            side: FillQuoteTransformerSide.Sell,
            sellToken,
            buyToken: intermediateToken,
            bridgeOrders: [{
              bridgeData: createBridgeDataForBridgeOrder(firstHopOrder),
              makerTokenAmount: firstHopOrder.buyAmount,
              takerTokenAmount: firstHopOrder.sellAmount,
              source: getBridgeSourceToBridgeProtocol(firstHopOrder.source),
            }],
            limitOrders: [],
            rfqOrders: [],
            fillSequence: [0],
            refundReceiver: NULL_ADDRESS,
            fillAmount: firstHopOrder.sellAmount,
          }
        ]),
      });
      transforms.push({
        deploymentNonce: this._transformerNonces.fillQuoteTransformer,
        data: FILL_QUOTE_TRANSFORMER_ABI_CODER.encode([
          {
            side: FillQuoteTransformerSide.Sell,
            buyToken,
            sellToken: intermediateToken,
            bridgeOrders: [{
              bridgeData: createBridgeDataForBridgeOrder(secondHopOrder),
              makerTokenAmount: secondHopOrder.buyAmount,
              takerTokenAmount: secondHopOrder.sellAmount,
              source: getBridgeSourceToBridgeProtocol(secondHopOrder.source),
            }],
            limitOrders: [],
            rfqOrders: [],
            fillSequence: [0],
            refundReceiver: NULL_ADDRESS,
            fillAmount: MAX_UINT256,
          }
        ]),
      });
    } else {
      const fillAmount = quote.side === MarketSide.Buy ? quote.buyTokenFillAmount : quote.sellTokenFillAmount;
      transforms.push({
        deploymentNonce: this._transformerNonces.fillQuoteTransformer,
        data: FILL_QUOTE_TRANSFORMER_ABI_CODER.encode([
          {
            side: quote.side === MarketSide.Buy ? FillQuoteTransformerSide.Buy : FillQuoteTransformerSide.Sell,
            sellToken,
            buyToken,
            bridgeOrders: slippedOrders.map(order => ({
              bridgeData: createBridgeDataForBridgeOrder(order),
              makerTokenAmount: order.buyAmount,
              takerTokenAmount: order.sellAmount,
              source: getBridgeSourceToBridgeProtocol(order.source),
            })),
            limitOrders: [],
            rfqOrders: [],
            fillSequence: [slippedOrders.map(() => 0)],
            refundReceiver: NULL_ADDRESS,
            fillAmount,
          }
        ]),
      });
    }

    // Create a WETH unwrapper if going to ETH.
    if (isNativeBuy) {
      transforms.push({
        deploymentNonce: this._transformerNonces.wethTransformer,
        data: WETH_TRANSFORMER_ABI_CODER.encode([
          {
            token: WRAPPED_NATIVE_ADDRESS[this._chainId],
            amount: MAX_UINT256,
          }
        ]),
      });
    }

    // The final transformer will send all funds to the taker.
    transforms.push({
      deploymentNonce: this._transformerNonces.payTakerTransformer,
      data: PAY_TAKER_TRANSFORMER_ABI_CODER.encode([
        {
          tokens: [sellToken, buyToken, ETH_NATIVE_ADDRESS].concat(quote.isTwoHop ? intermediateToken : []),
          amounts: [],
        }
      ]),
    });

    return {
      to: this._exchangeProxy.address,
      data: this._exchangeProxy.interface.encodeFunctionData('transformERC20', [
        isNativeSell ? ETH_NATIVE_ADDRESS : sellToken,
        isNativeBuy ? ETH_NATIVE_ADDRESS : buyToken,
        sellAmount,
        minBuyAmount,
        transforms,
      ]),
      value: BigNumber.from(ethAmount).toHexString(),
      allowanceTarget: this._exchangeProxy.address,
      gasOverhead: '0x0',
    };
  }

  private _encodeMultiplexBatchFillCalldata(quote: SwapQuote): string {
    const wrappedBatchCalls = [];

    for_loop: for (const [i, order] of quote.orders.entries()) {
      switch_statement: switch (order.source) {
        case BridgeSource.UniswapV2:
        case BridgeSource.SushiSwap:
          wrappedBatchCalls.push({
            selector: this._multiplex.getSighash('_sellToUniswap'),
            sellAmount: order.sellAmount,
            data: MULTIPLEX_UNISWAP_ABI_CODER.encode([
              (order.fillData as UniswapV2FillData).tokenAddressPath,
              order.source === BridgeSource.SushiSwap,
            ]),
          });
          break switch_statement;
        case BridgeSource.LiquidityProvider:
          wrappedBatchCalls.push({
            selector: this._multiplex.getSighash('_sellToLiquidityProvider'),
            sellAmount: order.sellAmount,
            data: MULTIPLEX_PLP_ABI_CODER.encode([
              (order.fillData as LiquidityProviderFillData).poolAddress,
              NULL_BYTES,
            ]),
          });
          break switch_statement;
        case BridgeSource.UniswapV3:
          const fillData = (order as DexOrder<FinalUniswapV3FillData>).fillData;
          wrappedBatchCalls.push({
            selector: this._exchangeProxy.getSighash('sellTokenForTokenToUniswapV3'),
            sellAmount: order.sellAmount,
            data: fillData.uniswapPath,
          });
          break switch_statement;
        default:
          const orders = quote.orders.slice(i);
          const fqtData = FILL_QUOTE_TRANSFORMER_ABI_CODER.encode([
            {
              side: FillQuoteTransformerSide.Sell,
              sellToken: quote.sellToken,
              buyToken: quote.buyToken,
              bridgeOrders: orders.map(order => ({
                bridgeData: createBridgeDataForBridgeOrder(order),
                makerTokenAmount: order.buyAmount,
                takerTokenAmount: order.sellAmount,
                source: getBridgeSourceToBridgeProtocol(order.source),
              })),
              limitOrders: [],
              rfqOrders: [],
              fillSequence: [orders.map(() => 0)],
              refundReceiver: NULL_ADDRESS,
              fillAmount: MAX_UINT256,
            },
          ]);
          const transformations = [
            {
              deploymentNonce: this._transformerNonces.fillQuoteTransformer,
              data: fqtData,
            },
            {
              deploymentNonce: this._transformerNonces.payTakerTransformer,
              data: PAY_TAKER_TRANSFORMER_ABI_CODER.encode([
                { tokens: [quote.sellToken, quote.buyToken], amounts: [] },
              ]),
            },
          ];
          wrappedBatchCalls.push({
            selector: this._exchangeProxy.getSelector('_transformERC20'),
            sellAmount: quote.orders.slice(i).reduce<BigNumber>((sum, order) => sum.add(order.sellAmount), ZERO_AMOUNT).toString(),
            data: MULTIPLEX_TRANSFORM_ABI_CODER.encode([
              transformations,
              '0x0',
            ]),
          });
          break for_loop;
      }
    }

    return this._exchangeProxy.interface.encodeFunctionData('batchFill', [
      {
        inputToken: quote.sellToken,
        outputToken: quote.buyToken,
        sellAmount: quote.worstCaseQuoteInfo.totalSellAmount,
        calls: wrappedBatchCalls,
      },
      quote.worstCaseQuoteInfo.buyAmount,
    ]);
  }

  private _encodeMultiplexMultiHopFillCalldata(quote: SwapQuote, opts: CreateTxCalldataOpts): string {
    const wrappedMultiHopCalls = [];
    const tokens: string[] = [];
    if (opts.isNativeSell) {
      wrappedMultiHopCalls.push({
        selector: this._weth.getSighash('deposit'),
        data: NULL_BYTES,
      });
      tokens.push(ETH_NATIVE_ADDRESS);
    }
    const [firstHopOrder, secondHopOrder] = quote.orders;
    const intermediateToken = firstHopOrder.buyToken;
    tokens.push(quote.sellToken, intermediateToken, quote.buyToken);
    for (const order of [firstHopOrder, secondHopOrder]) {
      switch (order.source) {
        case BridgeSource.UniswapV2:
        case BridgeSource.SushiSwap:
          wrappedMultiHopCalls.push({
            selector: this._multiplex.getSighash('_sellToUniswap'),
            data: MULTIPLEX_UNISWAP_ABI_CODER.encode([
              (order.fillData as UniswapV2FillData).tokenAddressPath,
              order.source === BridgeSource.SushiSwap,
            ]),
          });
          break;
        case BridgeSource.LiquidityProvider:
          wrappedMultiHopCalls.push({
            selector: this._multiplex.getSighash('_sellToLiquidityProvider'),
            data: MULTIPLEX_PLP_ABI_CODER.encode([
              (order.fillData as LiquidityProviderFillData).poolAddress,
              NULL_BYTES,
            ]),
          });
          break;
        default:
          // Note: we'll need to redeploy TransformERC20Feature before we can
          //       use other sources
          // Should never happen because we check `isMultiplexMultiHopFillCompatible`
          // before calling this function.
          throw new Error(`Multiplex multi-hop unsupported source: ${order.source}`);
      }
    }
    if (opts.isNativeBuy) {
      wrappedMultiHopCalls.push({
        selector: this._weth.getSighash('withdraw'),
        data: NULL_BYTES,
      });
      tokens.push(ETH_NATIVE_ADDRESS);
    }


    return this._exchangeProxy.interface.encodeFunctionData('multiHopFill', [
      {
        tokens,
        sellAmount: quote.worstCaseQuoteInfo.totalSellAmount,
        calls: wrappedMultiHopCalls,
      },
      quote.worstCaseQuoteInfo.buyAmount,
    ]);
  }
}
