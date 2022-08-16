import { BridgeSource } from '../quote/bridge-source';

export type CurveBridgeSource = BridgeSource.Curve
  | BridgeSource.CurveV2
  | BridgeSource.Swerve
  | BridgeSource.SnowSwap
  | BridgeSource.Nerve
  | BridgeSource.Belt
  | BridgeSource.Ellipsis
  | BridgeSource.Smoothy
  | BridgeSource.Saddle
  | BridgeSource.IronSwap
  | BridgeSource.XSigma
  | BridgeSource.FirebirdOneSwap
  | BridgeSource.ACryptos;

/**
 * Curve contract function selectors.
 */
export enum CurveFunctionSelectors {
  None = '0x00000000',
  exchange = '0x3df02124',
  exchange_underlying = '0xa6417ed6',
  get_dy_underlying = '0x07211ef7',
  get_dx_underlying = '0x0e71d1b9',
  get_dy = '0x5e0d443f',
  get_dx = '0x67df02ca',
  // Curve V2
  exchange_v2 = '0x5b41b908',
  exchange_underlying_v2 = '0x65b2489b',
  get_dy_v2 = '0x556d6e9f',
  get_dy_underlying_v2 = '0x85f11d1e',
  // Smoothy
  swap_uint256 = '0x5673b02d', // swap(uint256,uint256,uint256,uint256)
  get_swap_amount = '0x45cf2ef6', // getSwapAmount(uint256,uint256,uint256)
  // Nerve BSC, Saddle Mainnet
  swap = '0x91695586', // swap(uint8,uint8,uint256,uint256,uint256)
  calculateSwap = '0xa95b089f', // calculateSwap(uint8,uint8,uint256)
}

/**
 * Configuration info on a Curve pool.
 */
export interface CurvePoolSettings {
  exchangeFunctionSelector: CurveFunctionSelectors;
  sellQuoteFunctionSelector: CurveFunctionSelectors;
  buyQuoteFunctionSelector: CurveFunctionSelectors;
  poolAddress: string;
  tokens: string[];
  metaTokens: string[] | undefined;
  gasSchedule: number;
  buyTokenIdx: number;
  sellTokenIdx: number;
}
