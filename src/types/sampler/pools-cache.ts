import { BridgeSource } from '../quote/bridge-source';

export type BridgeSourceWithPoolsCache = BridgeSource.Balancer | BridgeSource.BalancerV2 | BridgeSource.Cream;

export interface Pool {
  id: string;
  balanceIn: string;
  balanceOut: string;
  weightIn: string;
  weightOut: string;
  swapFee: string;
  spotPrice?: string;
  slippage?: string;
  limitAmount?: string;
}

export interface PoolCache {
  expiresAt: number;
  pools: Pool[];
}

export interface RawBalancerPool {
  id: string;
  swapFee: string;
  publicSwap: boolean;
  totalWeight: string;
  tokensList: string[];
  tokens: {
    id: string;
    address: string;
    symbol: string;
    balance: string;
    decimals: number;
    denormWeight: string;
  }[];
}

export interface RawBalancerV2Pool {
  id: string;
  swapFee: string;
  totalWeight: string;
  amp: string | null;
  totalShares: string;
  tokensList: string[];
  tokens: {
    id: string;
    address: string;
    balance: string;
    decimals: number;
    symbol: string;
    weight: string;
  }[];
}

export interface RawBalancerV2PoolWithSwaps {
  id: string;
  swapFee: string;
  tokens: {
    address: string;
    balance: string;
    weight: string;
  }[];
  swaps: {
    tokenAmountIn: string;
    tokenAmountOut: string;
  }[];
}
