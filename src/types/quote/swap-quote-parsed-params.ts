import { BigNumber } from 'ethers';
import { BridgeSource } from './bridge-source';
import { MarketSide } from './market-side';

export interface SwapQuoteParsedParams {
  sellToken: string;
  buyToken: string;
  amount: BigNumber;
  tradeType: MarketSide;
  takerAddress: string;

  slippagePercentage: number;
  excludedSources: BridgeSource[];

  isWrap: boolean;
  isUnwrap: boolean;
  isNativeSell: boolean;
  isNativeBuy: boolean;
}
