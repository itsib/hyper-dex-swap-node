import { BigNumber } from 'ethers';
import { GasSchedule } from '../fees/gas-schedule';
import { DexOrder } from '../sampler/dex-order';
import { BridgeSource } from './bridge-source';
import { MarketSide } from './market-side';

/**
 * feeTakerTokenAmount: The amount of takerAsset reserved for paying takerFees when swapping for desired assets.
 * takerTokenAmount: The amount of takerAsset swapped for desired makerAsset.
 * totalTakerTokenAmount: The total amount of takerAsset required to complete the swap (filling orders, and paying takerFees).
 * makerTokenAmount: The amount of makerAsset that will be acquired through the swap.
 * protocolFeeInWeiAmount: The amount of ETH to pay (in WEI) as protocol fee to perform the swap for desired asset.
 * gas: Amount of estimated gas needed to fill the quote.
 */
export interface SwapQuoteInfo {
  feeSellTokenAmount: BigNumber;
  sellAmount: BigNumber;
  totalSellAmount: BigNumber;
  buyAmount: BigNumber;
  protocolFeeInWeiAmount: BigNumber;
  gas: number;
}

/**
 * percentage breakdown of each liquidity source used in quote
 */
export type SwapQuoteOrdersBreakdown = Partial<{ [key in Exclude<BridgeSource, typeof BridgeSource.MultiHop>]: string } & {
  [BridgeSource.MultiHop]: {
    proportion: string;
    intermediateToken: string;
    hops: BridgeSource[];
  };
}>;

/**
 * takerToken: Address of the taker asset.
 * makerToken: Address of the maker asset.
 * gasPrice: gas price used to determine protocolFee amount, default to ethGasStation fast amount.
 * orders: An array of objects conforming to OptimizedMarketOrder. These orders can be used to cover the requested assetBuyAmount plus slippage.
 * bestCaseQuoteInfo: Info about the best case price for the asset.
 * worstCaseQuoteInfo: Info about the worst case price for the asset.
 */
export interface SwapQuoteBase {
  sellToken: string;
  buyToken: string;
  orders: DexOrder[];
  bestCaseQuoteInfo: SwapQuoteInfo;
  worstCaseQuoteInfo: SwapQuoteInfo;
  sourceBreakdown: SwapQuoteOrdersBreakdown;
  quoteReport?: any;
  priceComparisonsReport?: any;
  isTwoHop: boolean;
  buyTokenDecimals: number;
  sellTokenDecimals: number;
  buyAmountPerEth: string;
  sellAmountPerEth: string;
}

/**
 * takerAssetFillAmount: The amount of takerAsset sold for makerAsset.
 * type: Specified MarketOperation the SwapQuote is provided for
 */
export interface MarketSellSwapQuote extends SwapQuoteBase {
  sellTokenFillAmount: BigNumber;
  side: MarketSide.Sell;
}

/**
 * makerAssetFillAmount: The amount of makerAsset bought with takerAsset.
 * type: Specified MarketOperation the SwapQuote is provided for
 */
export interface MarketBuySwapQuote extends SwapQuoteBase {
  buyTokenFillAmount: BigNumber;
  side: MarketSide.Buy;
}

export type SwapQuote = MarketBuySwapQuote | MarketSellSwapQuote;

export interface SwapQuoteFillInfoOpts {
  gasSchedule: GasSchedule;
  protocolFeeMultiplier: string;
  slippage: number;
}

export interface SwapQuoteFillInfo {
  orders: DexOrder[];
  amount: BigNumber;
  gasPrice: string;
  side: MarketSide;
  opts: Partial<SwapQuoteFillInfoOpts>;
}

export interface SwapQuoteFillResult {
  // Maker asset bought.
  buyAssetAmount: BigNumber;
  // Taker asset sold.
  sellAssetAmount: BigNumber;
  // Taker fees that can be paid with the buy asset.
  sellFeeMakerAssetAmount: BigNumber;
  // Taker fees that can be paid with the sell asset.
  sellFeeTakerAssetAmount: BigNumber;
  // Total buy asset amount bought (including fees).
  totalBuyAssetAmount: BigNumber;
  // Total sell asset amount sold (including fees).
  totalSellAssetAmount: BigNumber;
  // Protocol fees paid.
  protocolFeeAmount: BigNumber;
  // (Estimated) gas used.
  gas: number;
  // Fill amounts by source.
  // For sells, this is the taker assets sold.
  // For buys, this is the maker assets bought.
  fillAmountBySource: { [source: string]: BigNumber };
}

export interface SwapQuoteFillOrderCall {
  order: DexOrder;
  // Total input amount defined in the order.
  totalOrderInput: BigNumber;
  // Total output amount defined in the order.
  totalOrderOutput: BigNumber;
  // Total fees payable with input token, defined in the order.
  // Positive for sells, negative for buys.
  totalOrderInputFee: BigNumber;
  // Total fees payable with output token, defined in the order.
  // Negative for sells, positive for buys.
  totalOrderOutputFee: BigNumber;
}

export interface IntermediateSwapQuoteFillResult {
  // Input tokens filled. Taker asset for sells, maker asset for buys.
  input: BigNumber;
  // Output tokens filled. Maker asset for sells, taker asset for buys.
  output: BigNumber;
  // Taker fees that can be paid with the input token.
  // Positive for sells, negative for buys.
  inputFee: BigNumber;
  // Taker fees that can be paid with the output token.
  // Negative for sells, positive for buys.
  outputFee: BigNumber;
  // Protocol fees paid.
  protocolFee: BigNumber;
  // (Estimated) gas used.
  gas: number;
  // Input amounts filled by sources.
  inputBySource: { [source: string]: BigNumber };
}
