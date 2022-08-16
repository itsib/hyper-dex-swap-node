import { BigNumber } from 'ethers';
import { MAX_UINT256, ZERO_AMOUNT } from '../constants';
import {
  BridgeSource,
  CollapsedDexFill,
  CreateDexOrderOpts,
  DexFillData,
  DexOrder,
  DexSample,
  MarketSide,
  MultiHopFillData,
  UniswapV3FillData,
} from '../types';

export const getBuySellTokens = (opts: CreateDexOrderOpts): [string, string] => {
  const makerToken = opts.side === MarketSide.Sell ? opts.outputToken : opts.inputToken;
  const takerToken = opts.side === MarketSide.Sell ? opts.inputToken : opts.outputToken;
  return [makerToken, takerToken];
};

export const getFillTokenAmounts = (fill: CollapsedDexFill, side: MarketSide): [BigNumber, BigNumber] => {
  return [
    // Maker asset amount.
    side === MarketSide.Sell ? fill.output : fill.input,
    // Taker asset amount.
    side === MarketSide.Sell ? fill.input : fill.output,
  ];
};

export const createDexOrder = (fill: CollapsedDexFill, buyToken: string, sellToken: string, side: MarketSide): DexOrder => {
  const [buyAmount, sellAmount] = getFillTokenAmounts(fill, side);
  return {
    id: fill.id,
    buyToken,
    sellToken,
    buyAmount,
    sellAmount,
    fillData: createFinalDexOrderFillDataFromCollapsedFill(fill),
    source: fill.source,
    fills: [fill],
  };
};

export const createOrdersFromTwoHopSample = (sample: DexSample<MultiHopFillData>, opts: CreateDexOrderOpts): DexOrder[] => {
  const [makerToken, takerToken] = getBuySellTokens(opts);
  const { firstHopSource, secondHopSource, intermediateToken } = sample.fillData;
  const firstHopFill: CollapsedDexFill = {
    id: '',
    source: firstHopSource.source,
    input: opts.side === MarketSide.Sell ? sample.input : ZERO_AMOUNT,
    output: opts.side === MarketSide.Sell ? ZERO_AMOUNT : sample.output,
    subFills: [],
    fillData: firstHopSource.fillData,
  };
  const secondHopFill: CollapsedDexFill = {
    id: '',
    source: secondHopSource.source,
    input: opts.side === MarketSide.Sell ? MAX_UINT256 : sample.input,
    output: opts.side === MarketSide.Sell ? sample.output : MAX_UINT256,
    subFills: [],
    fillData: secondHopSource.fillData,
  };
  return [
    createDexOrder(firstHopFill, intermediateToken, takerToken, opts.side),
    createDexOrder(secondHopFill, makerToken, intermediateToken, opts.side),
  ];
}

export const createFinalDexOrderFillDataFromCollapsedFill = (fill: CollapsedDexFill): DexFillData => {
  switch (fill.source) {
    case BridgeSource.UniswapV3: {
      const fd = fill.fillData as UniswapV3FillData;
      return {
        router: fd.router,
        tokenAddressPath: fd.tokenAddressPath,
        uniswapPath: getBestUniswapV3PathForInputAmount(fd, fill.input),
      };
    }
    default:
      break;
  }
  return fill.fillData;
};

export const getBestUniswapV3PathForInputAmount = (fillData: UniswapV3FillData, inputAmount: BigNumber): string => {
  if (fillData.pathAmounts.length === 0) {
    throw new Error(`No Uniswap V3 paths`);
  }
  // Find the best path that can satisfy `inputAmount`.
  // Assumes `fillData.pathAmounts` is sorted ascending.
  for (const { inputAmount: pathInputAmount, uniswapPath } of fillData.pathAmounts) {
    if (pathInputAmount.gte(inputAmount)) {
      return uniswapPath;
    }
  }
  return fillData.pathAmounts[fillData.pathAmounts.length - 1].uniswapPath;
};
