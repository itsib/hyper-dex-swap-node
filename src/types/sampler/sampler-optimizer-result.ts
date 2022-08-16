import { CollapsedDexPath } from '../../utils';
import { CollapsedDexFill } from './dex-fill';
import { MultiHopFillData } from './dex-fill-data';
import { DexOrder } from './dex-order';
import { DexSample } from './dex-sample';
import { MarketSideLiquidity } from './market-side-liquidity';

export interface SamplerOptimizerResult {
  optimizedOrders: DexOrder[];
  sourceFlags: bigint;
  liquidityDelivered: CollapsedDexFill[] | DexSample<MultiHopFillData>;
  marketSideLiquidity: MarketSideLiquidity;
  adjustedRate: string;
  unoptimizedPath?: CollapsedDexPath;
  sellAmountPerEth: string;
  buyAmountPerEth: string;
}

export interface SamplerOptimizerResultWithReport extends SamplerOptimizerResult {
  quoteReport?: any;
  priceComparisonsReport?: any;
}
