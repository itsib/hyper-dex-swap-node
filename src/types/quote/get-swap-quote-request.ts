import { BigNumber, ERC20BridgeSource, MarketOperation } from '@0x/asset-swapper';

export interface GetSwapQuoteRequest {
  sellToken: string;
  buyToken: string;
  amount: BigNumber;
  tradeType: MarketOperation;
  takerAddress: string;

  slippagePercentage: number;
  excludedSources: ERC20BridgeSource[];

  isWrap: boolean;
  isUnwrap: boolean;
  isNativeSell: boolean;
  isNativeBuy: boolean;
}
