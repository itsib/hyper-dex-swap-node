import Big from 'big.js';
import { BigNumber } from 'ethers';
import { BRIDGE_SOURCE_FLAGS, DEFAULT_SIMULATED_FILL_QUOTE_INFO_OPTS, ZERO_AMOUNT } from '../constants';
import {
  BridgeSource,
  DexOrder,
  GasSchedule,
  IntermediateSwapQuoteFillResult,
  MarketSide,
  SamplerOptimizerResultWithReport,
  SwapQuote,
  SwapQuoteFillInfo,
  SwapQuoteFillOrderCall,
  SwapQuoteFillResult,
  SwapQuoteInfo,
  SwapQuoteOrdersBreakdown,
} from '../types';

const EMPTY_QUOTE_INTERMEDIATE_FILL_RESULT = {
  input: ZERO_AMOUNT,
  output: ZERO_AMOUNT,
  outputFee: ZERO_AMOUNT,
  inputFee: ZERO_AMOUNT,
  protocolFee: ZERO_AMOUNT,
  gas: 0,
};

export const createSwapQuote = (
  optimizerResult: SamplerOptimizerResultWithReport,
  buyToken: string,
  sellToken: string,
  side: MarketSide,
  amount: BigNumber,
  gasPrice: string,
  gasSchedule: GasSchedule,
  slippage: number,
): SwapQuote => {
  const {
    optimizedOrders,
    quoteReport,
    sourceFlags,
    sellAmountPerEth,
    buyAmountPerEth,
    priceComparisonsReport,
  } = optimizerResult;
  const isTwoHop = sourceFlags === BRIDGE_SOURCE_FLAGS[BridgeSource.MultiHop];

  // Calculate quote info
  const { bestCaseQuoteInfo, worstCaseQuoteInfo, sourceBreakdown } = isTwoHop
    ? calculateTwoHopQuoteInfo(optimizedOrders, side, gasSchedule, slippage)
    : calculateQuoteInfo(optimizedOrders, side, amount, gasPrice, gasSchedule, slippage);

  // Put together the swap quote
  const { buyTokenDecimals, sellTokenDecimals } = optimizerResult.marketSideLiquidity;
  const swapQuote = {
    buyToken,
    sellToken,
    gasPrice,
    orders: optimizedOrders,
    bestCaseQuoteInfo,
    worstCaseQuoteInfo,
    sourceBreakdown,
    buyTokenDecimals,
    sellTokenDecimals,
    sellAmountPerEth,
    buyAmountPerEth,
    quoteReport,
    isTwoHop,
    priceComparisonsReport,
  };

  if (side === MarketSide.Buy) {
    return {
      ...swapQuote,
      side: MarketSide.Buy,
      buyTokenFillAmount: amount,
    };
  } else {
    return {
      ...swapQuote,
      side: MarketSide.Sell,
      sellTokenFillAmount: amount,
    };
  }
}

export const calculateQuoteInfo = (
  optimizedOrders: DexOrder[],
  side: MarketSide,
  amount: BigNumber,
  gasPrice: string,
  gasSchedule: GasSchedule,
  slippage: number,
): { bestCaseQuoteInfo: SwapQuoteInfo; worstCaseQuoteInfo: SwapQuoteInfo; sourceBreakdown: SwapQuoteOrdersBreakdown } => {
  const bestCaseFillResult = simulateBestCaseFill({
    gasPrice,
    orders: optimizedOrders,
    side,
    amount,
    opts: { gasSchedule },
  });

  const worstCaseFillResult = simulateWorstCaseFill({
    gasPrice,
    orders: optimizedOrders,
    side,
    amount,
    opts: { gasSchedule, slippage },
  });

  return {
    bestCaseQuoteInfo: fillResultsToQuoteInfo(bestCaseFillResult),
    worstCaseQuoteInfo: fillResultsToQuoteInfo(worstCaseFillResult),
    sourceBreakdown: getSwapQuoteOrdersBreakdown(bestCaseFillResult.fillAmountBySource),
  };
};

export const calculateTwoHopQuoteInfo = (
  optimizedOrders: DexOrder[],
  side: MarketSide,
  gasSchedule: GasSchedule,
  slippage: number,
): { bestCaseQuoteInfo: SwapQuoteInfo; worstCaseQuoteInfo: SwapQuoteInfo; sourceBreakdown: SwapQuoteOrdersBreakdown } => {
  const [firstHopOrder, secondHopOrder] = optimizedOrders;
  const [firstHopFill] = firstHopOrder.fills;
  const [secondHopFill] = secondHopOrder.fills;
  const gas = Big(
    gasSchedule[BridgeSource.MultiHop]!({
      firstHopSource: { source: firstHopFill.source, fillData: firstHopFill.fillData },
      secondHopSource: { source: secondHopFill.source, fillData: secondHopFill.fillData },
    }),
  ).toNumber();
  return {
    bestCaseQuoteInfo: {
      buyAmount: side === MarketSide.Sell ? secondHopFill.output : secondHopFill.input,
      sellAmount: side === MarketSide.Sell ? firstHopFill.input : firstHopFill.output,
      totalSellAmount: side === MarketSide.Sell ? firstHopFill.input : firstHopFill.output,
      feeSellTokenAmount: ZERO_AMOUNT,
      protocolFeeInWeiAmount: ZERO_AMOUNT,
      gas,
    },
    // TODO jacob consolidate this with quote simulation worstCase
    worstCaseQuoteInfo: {
      buyAmount: MarketSide.Sell
        ? secondHopOrder.buyAmount.toBig().times(1 - slippage).round(0, 0).toBigNumber()
        : secondHopOrder.sellAmount,
      sellAmount: MarketSide.Sell
        ? firstHopOrder.sellAmount
        : firstHopOrder.sellAmount.toBig().times(1 + slippage).round(0, 0).toBigNumber(),
      totalSellAmount: MarketSide.Sell
        ? firstHopOrder.sellAmount
        : firstHopOrder.sellAmount.toBig().times(1 + slippage).round(0, 0).toBigNumber(),
      feeSellTokenAmount: ZERO_AMOUNT,
      protocolFeeInWeiAmount: ZERO_AMOUNT,
      gas,
    },
    sourceBreakdown: {
      [BridgeSource.MultiHop]: {
        proportion: '1',
        intermediateToken: secondHopOrder.sellToken,
        hops: [firstHopFill.source, secondHopFill.source],
      },
    },
  };
};

/**
 * Simulates filling a quote in the best case.
 * @param quoteInfo
 */
export const simulateBestCaseFill = (quoteInfo: SwapQuoteFillInfo): SwapQuoteFillResult => {
  const opts = {
    ...DEFAULT_SIMULATED_FILL_QUOTE_INFO_OPTS,
    ...quoteInfo.opts,
  };
  const protocolFeePerFillOrder = Big(quoteInfo.gasPrice).times(opts.protocolFeeMultiplier).toString();
  const result = fillQuoteOrders(
    createBestCaseFillOrderCalls(quoteInfo),
    quoteInfo.amount,
    protocolFeePerFillOrder,
    opts.gasSchedule,
  );
  return fromIntermediateQuoteFillResult(result, quoteInfo);
};

/**
 * Simulates filling a quote in the worst case.
 * @param quoteInfo
 */
export const simulateWorstCaseFill = (quoteInfo: SwapQuoteFillInfo): SwapQuoteFillResult => {
  const opts = {
    ...DEFAULT_SIMULATED_FILL_QUOTE_INFO_OPTS,
    ...quoteInfo.opts,
  };
  const protocolFeePerFillOrder = Big(quoteInfo.gasPrice).times(opts.protocolFeeMultiplier).toString();
  const bestCase = createBestCaseFillOrderCalls(quoteInfo);
  const result = {
    ...fillQuoteOrders(bestCase, quoteInfo.amount, protocolFeePerFillOrder, opts.gasSchedule),
    // Worst case gas and protocol fee is hitting all orders.
    gas: getTotalGasUsedByFills(quoteInfo.orders, opts.gasSchedule),
    protocolFee: ZERO_AMOUNT,
  };
  // Adjust the output by 1-slippage for the worst case if it is a sell
  // Adjust the output by 1+slippage for the worst case if it is a buy
  result.output =
    quoteInfo.side === MarketSide.Sell
      ? result.output.toBig().times(1 - opts.slippage).round(0, 0).toBigNumber()
      : result.output.toBig().times(1 + opts.slippage).round(0, 3).toBigNumber();
  return fromIntermediateQuoteFillResult(result, quoteInfo);
};

export const fillQuoteOrders = (
  fillOrders: SwapQuoteFillOrderCall[],
  amount: BigNumber,
  protocolFeePerFillOrder: string,
  gasSchedule: GasSchedule,
): IntermediateSwapQuoteFillResult => {
  const result: IntermediateSwapQuoteFillResult = {
    ...EMPTY_QUOTE_INTERMEDIATE_FILL_RESULT,
    inputBySource: {},
  };
  let remainingInput = amount;
  for (const fo of fillOrders) {
    if (remainingInput.lte(0)) {
      break;
    }
    for (const fill of fo.order.fills) {
      if (remainingInput.lte(0)) {
        break;
      }
      const { source, fillData } = fill;
      const gas = gasSchedule[source] === undefined ? 0 : gasSchedule[source]!(fillData) || 0;
      result.gas += Big(gas).toNumber();
      result.inputBySource[source] = result.inputBySource[source] || ZERO_AMOUNT;

      // Actual rates are rarely linear, so fill subfills individually to
      // get a better approximation of fill size.
      for (const subFill of fill.subFills) {
        if (remainingInput.lte(0)) {
          break;
        }
        const filledInput = solveForInputFillAmount(
          remainingInput,
          subFill.input,
          fo.totalOrderInput,
          fo.totalOrderInputFee,
        );
        const filledOutput = subFill.output.mul(filledInput.toBig().div(subFill.input.toBig()).toBigNumber());
        const filledInputFee = filledInput.toBig().div(fo.totalOrderInput.toBig()).times(fo.totalOrderInputFee.toBig()).toBigNumber();
        const filledOutputFee = filledOutput.toBig().div(fo.totalOrderOutput.toBig()).times(fo.totalOrderOutputFee.toBig()).toBigNumber();

        result.inputBySource[source] = result.inputBySource[source].add(filledInput);
        result.input = result.input.add(filledInput);
        result.output = result.output.add(filledOutput);
        result.inputFee = result.inputFee.add(filledInputFee);
        result.outputFee = result.outputFee.add(filledOutputFee);
        remainingInput = remainingInput.sub(filledInput.add(filledInputFee));
      }
    }
  }
  return result;
};

export const solveForInputFillAmount = (remainingInput: BigNumber, fillableInput: BigNumber, totalOrderInput: BigNumber, totalOrderInputFee: BigNumber): BigNumber => {
  // When accounting for input token taker fees, the effective input amount is
  // given by:
  //   i' = i + f * i / o
  // where:
  //   i' - The effective input amount, including fees
  //   i  - An input amount
  //   f  - totalOrderInputFee
  //   o  - totalOrderInput
  // Solving for i we get:
  //   i = (i' * o) / (f + o)
  const denom = totalOrderInput.add(totalOrderInputFee);
  if (denom.eq(0)) {
    // A zero denominator would imply an order whose fees are >= the input
    // token amount.
    // For sells, takerFeeAmount >= takerAssetAmount (technically OK but really undesirable).
    // For buys, takerFeeAmount >= makerAssetAmount (losing all your returns to fees).
    return fillableInput;
  }

  const effectiveInputAmount = remainingInput.toBig().times(totalOrderInput.toBig()).div(denom.toBig()).toBigNumber();

  return effectiveInputAmount.lt(fillableInput) ? effectiveInputAmount : fillableInput;
};

export const createBestCaseFillOrderCalls = (quoteInfo: SwapQuoteFillInfo): SwapQuoteFillOrderCall[] => {
  const { orders, side } = quoteInfo;
  return orders.map(o => ({
    order: o,
    ...(side === MarketSide.Sell
      ? {
        totalOrderInput: o.sellAmount,
        totalOrderOutput: o.buyAmount,
        totalOrderInputFee: ZERO_AMOUNT,
        totalOrderOutputFee: ZERO_AMOUNT, // makerToken fees are not supported in v4 (sell output)
      }
      : // Buy
      {
        totalOrderInput: o.buyAmount,
        totalOrderOutput: o.sellAmount,
        totalOrderInputFee: ZERO_AMOUNT, // makerToken fees are not supported in v4 (buy input)
        totalOrderOutputFee: ZERO_AMOUNT,
      }),
  }));
};

export const fromIntermediateQuoteFillResult = (ir: IntermediateSwapQuoteFillResult, quoteInfo: SwapQuoteFillInfo): SwapQuoteFillResult => {
  const { side } = quoteInfo;
  const _ir = roundIntermediateFillResult(ir, side);
  return {
    ...(side === MarketSide.Sell
      ? // Sell
      {
        buyAssetAmount: _ir.output,
        sellAssetAmount: _ir.input,
        sellFeeMakerAssetAmount: _ir.outputFee,
        sellFeeTakerAssetAmount: _ir.inputFee,
        totalBuyAssetAmount: _ir.output.add(_ir.outputFee),
        totalSellAssetAmount: _ir.input.add(_ir.inputFee),
      }
      : // Buy
      {
        buyAssetAmount: _ir.input,
        sellAssetAmount: _ir.output,
        sellFeeMakerAssetAmount: _ir.inputFee,
        sellFeeTakerAssetAmount: _ir.outputFee,
        totalBuyAssetAmount: _ir.input.add(_ir.inputFee),
        totalSellAssetAmount: _ir.output.add(_ir.outputFee),
      }),
    protocolFeeAmount: _ir.protocolFee,
    gas: _ir.gas,
    fillAmountBySource: _ir.inputBySource,
  };
};

export const roundIntermediateFillResult = (ir: IntermediateSwapQuoteFillResult, side: MarketSide): IntermediateSwapQuoteFillResult => {
  return {
    input: roundInputAmount(ir.input, side),
    output: roundOutputAmount(ir.output, side),
    inputFee: roundInputAmount(ir.inputFee, side),
    outputFee: roundOutputAmount(ir.outputFee, side),
    protocolFee: ir.protocolFee.toBig().round(0, 3).toBigNumber(),
    gas: Math.ceil(ir.gas),
    inputBySource: Object.assign(
      {},
      ...Object.entries(ir.inputBySource).map(([k, v]) => ({ [k]: roundInputAmount(v, side) })),
    ),
  };
};

export const roundOutputAmount = (amount: BigNumber, side: MarketSide): BigNumber => {
  return amount.toBig().round(0, side === MarketSide.Sell ? 0 : 3).toBigNumber();
};

export const roundInputAmount = (amount: BigNumber, side: MarketSide): BigNumber => {
  return amount.toBig().round(0, side === MarketSide.Sell ? 3 : 0).toBigNumber();
};

export const getTotalGasUsedByFills = (fills: DexOrder[], gasSchedule: GasSchedule): number => {
  let gasUsed = 0;
  for (const f of fills) {
    const fee = gasSchedule[f.source] === undefined ? 0 : gasSchedule[f.source]!(f.fillData);
    gasUsed += Big(fee).toNumber();
  }
  return gasUsed;
};

export const fillResultsToQuoteInfo = (fr: SwapQuoteFillResult): SwapQuoteInfo => {
  return {
    buyAmount: fr.totalBuyAssetAmount,
    sellAmount: fr.sellAssetAmount,
    totalSellAmount: fr.totalSellAssetAmount,
    feeSellTokenAmount: fr.sellFeeTakerAssetAmount,
    protocolFeeInWeiAmount: fr.protocolFeeAmount,
    gas: fr.gas,
  };
};

export const getSwapQuoteOrdersBreakdown = (fillAmountBySource: { [source: string]: BigNumber }): SwapQuoteOrdersBreakdown => {
  const totalFillAmount = Object.values(fillAmountBySource).reduce<BigNumber>((total, amount) => total.add(amount), ZERO_AMOUNT);
  const breakdown: SwapQuoteOrdersBreakdown = {};
  Object.entries(fillAmountBySource).forEach(([s, fillAmount]) => {
    const source = s as keyof SwapQuoteOrdersBreakdown;
    if (source === BridgeSource.MultiHop) {
      // TODO jacob has a different breakdown
    } else {
      breakdown[source] = fillAmount.toBig().div(totalFillAmount.toBig()).toString();
    }
  });
  return breakdown;
};
