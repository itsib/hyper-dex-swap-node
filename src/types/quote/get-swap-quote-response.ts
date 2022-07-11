import { ChainId } from '../common/chain-id';
import { SwapQuoteLiquiditySource } from './swap-quote-liquidity-source';

export interface GetSwapQuoteResponse {
  chainId: ChainId;
  buyAmount: string;
  sellAmount: string;
  buyTokenAddress: string;
  sellTokenAddress: string;
  allowanceTarget?: string;

  price: string;
  guaranteedPrice: string;
  sources: SwapQuoteLiquiditySource[];
  sellTokenToEthRate: string;
  buyTokenToEthRate: string;

  from: string;
  to: string;
  value: string;
  data: string;
}
