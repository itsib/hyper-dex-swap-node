import { BigNumber } from 'ethers';
import { BridgeSource } from '../quote/bridge-source';
import { MarketSide } from '../quote/market-side';
import { MultiHopFillData } from './dex-fill-data';
import { DexSample } from './dex-sample';

export interface MarketSideLiquidity {
  side: MarketSide;
  inputAmount: BigNumber;
  inputToken: string;
  outputToken: string;
  outputAmountPerEth: string;
  inputAmountPerEth: string;
  quoteSources: BridgeSource[];
  buyTokenDecimals: number;
  sellTokenDecimals: number;
  samples: {
    twoHopSamples: DexSample<MultiHopFillData>[];
    dexSamples: DexSample[][];
  }
}
