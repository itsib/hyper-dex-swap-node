import { BigNumber } from 'ethers';
import { SourceQuoteOperation } from './batched-operation';
import { CurvePoolSettings } from './curve-pool-settings';
import { DexSample } from './dex-sample';

/**
 * Internal `fillData` field for `Fill` objects.
 */
export interface DexFillData {}

export interface CurveFillData extends DexFillData {
  pool: CurvePoolSettings;
}

export interface BalancerFillData extends DexFillData {
  poolAddress: string;
}

export interface BalancerV2FillData extends DexFillData {
  vault: string;
  poolId: string;
}

export interface UniswapV2FillData extends DexFillData {
  tokenAddressPath: string[];
  router: string;
}

export interface KyberDmmFillData extends UniswapV2FillData {
  poolsPath: string[];
}

export interface FinalUniswapV3FillData extends Omit<UniswapV3FillData, 'uniswapPaths'> {
  // The uniswap-encoded path that can fll the maximum input amount.
  uniswapPath: string;
}

export interface UniswapV3FillData extends DexFillData {
  tokenAddressPath: string[];
  router: string;
  pathAmounts: { uniswapPath: string; inputAmount: BigNumber }[];
}

export interface KyberFillData extends DexFillData {
  hint: string;
  reserveId: string;
  networkProxy: string;
}

export interface ShellFillData extends DexFillData {
  poolAddress: string;
}

export interface LiquidityProviderFillData extends DexFillData {
  poolAddress: string;
  gasCost: number;
}

export interface BancorFillData extends DexFillData {
  path: string[];
  networkAddress: string;
}

export interface MooniswapFillData extends DexFillData {
  poolAddress: string;
}

export interface DodoFillData extends DexFillData {
  poolAddress: string;
  isSellBase: boolean;
  helperAddress: string;
}

export interface DodoV2FillData extends DexFillData {
  poolAddress: string;
  isSellBase: boolean;
}

export interface GenericRouterFillData extends DexFillData {
  router: string;
}

export interface LidoFillData extends DexFillData {
  stEthTokenAddress: string;
  wstEthTokenAddress: string;
  sellToken: string;
  buyToken: string;
}

/**
 * Configuration for a specific PSM vault
 */
export interface PsmInfo {
  psmAddress: string;
  ilkIdentifier: string;
  gemTokenAddress: string;
}

export interface MakerPsmExtendedData {
  isSellOperation: boolean;
  sellToken: string;
  buyToken: string;
}

export type MakerPsmFillData = DexFillData & MakerPsmExtendedData & PsmInfo;

export interface MultiHopFillData extends DexFillData {
  firstHopSource: SourceQuoteOperation<DexSample[]>;
  secondHopSource: SourceQuoteOperation<DexSample[]>;
  intermediateToken: string;
}
