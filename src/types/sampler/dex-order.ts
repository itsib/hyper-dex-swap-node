import { BigNumber } from 'ethers';
import { BridgeSource } from '../quote/bridge-source';
import { MarketSide } from '../quote/market-side';
import { CollapsedDexFill } from './dex-fill';
import { DexFillData } from './dex-fill-data';

/**
 * Order domain keys: chainId and exchange
 */
export interface DexOrderDomain {
  chainId: number;
  exchangeAddress: string;
}

export interface CreateDexOrderOpts {
  side: MarketSide;
  inputToken: string;
  outputToken: string;
  orderDomain: DexOrderDomain;
  slippagePercentage: number;
}

export interface DexOrder<TFillData extends DexFillData = DexFillData> {

  id: string;

  source: BridgeSource;

  fillData: TFillData;

  buyToken: string;

  sellToken: string;
  /**
   * The amount we wish to buy from this order, e.g. inclusive of any previous partial fill
   */
  buyAmount: BigNumber;
  /**
   * The amount we wish to fill this for, e.g. inclusive of any previous partial fill
   */
  sellAmount: BigNumber;

  fills: CollapsedDexFill[];
}
