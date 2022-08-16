import Big from 'big.js';
import {
  BancorFillData,
  BridgeSource,
  CurveFillData,
  DexFillData,
  DodoFillData,
  ExchangeGasOverhead,
  GasSchedule,
  LiquidityProviderFillData,
  MakerPsmFillData,
  SamplerOptions,
  SwapQuoteFillInfoOpts,
  UniswapV2FillData,
  UniswapV3FillData,
} from '../types';

/**
 * To get gas schedule for uniswap v2
 * @param fillData
 */
const uniswapV2GasSchedule = (fillData?: DexFillData) => {
  let gas = 90e3;
  const path = (fillData as UniswapV2FillData).tokenAddressPath;
  if (path.length > 2) {
    gas += (path.length - 2) * 60e3; // +60k for each hop.
  }
  return gas;
};

/**
 * Base transaction gas
 */
export const TX_BASE_GAS = 21e3;

/**
 * Default protocol gas
 */
export const PROTOCOL_BASE_GAS = 150e3;

/**
 * Number of samples to take for each DEX quote.
 */
export const SAMPLER_AMOUNT_NUM_SAMPLES = 5;

/**
 * The exponential sampling distribution base.
 * A value of 1 will result in evenly spaced samples.
 * > 1 will result in more samples at lower sizes.
 * < 1 will result in more samples at higher sizes.
 * Default: 1.25.
 */
export const SAMPLER_AMOUNT_SAMPLE_DISTRIBUTION_BASE = 1.25;

/**
 * The maximum price slippage allowed in the fallback quote.
 * If the slippage between the optimal quote and the fallback
 * quote is greater than this percentage, no fallback quote will be provided.
 */
export const SAMPLER_MAX_FALLBACK_SLIPPAGE = 0.015; // 1.5% Slippage in a fallback route

/**
 * Complexity limit on the search algorithm, i.e., maximum number of nodes to visit. Default is 1024.
 */
export const SAMPLER_RUN_LIMIT = 2 ** 8;

/**
 * Calculated gross gas cost of the underlying exchange.
 * The cost of switching from one source to another, assuming
 * we are in the middle of a transaction.
 * I.e. remove the overhead cost of ExchangeProxy (130k) and
 * the ethereum transaction cost (21k)
 */
export const DEFAULT_GAS_SCHEDULE: GasSchedule = {
  [BridgeSource.Uniswap]: () => 90e3,
  [BridgeSource.LiquidityProvider]: fillData => {
    return (fillData as LiquidityProviderFillData).gasCost || 100e3;
  },
  [BridgeSource.Eth2Dai]: () => 400e3,
  [BridgeSource.Kyber]: () => 450e3,
  [BridgeSource.Curve]: fillData => (fillData as CurveFillData).pool.gasSchedule,
  [BridgeSource.CurveV2]: fillData => (fillData as CurveFillData).pool.gasSchedule,
  [BridgeSource.Swerve]: fillData => (fillData as CurveFillData).pool.gasSchedule,
  [BridgeSource.SnowSwap]: fillData => (fillData as CurveFillData).pool.gasSchedule,
  [BridgeSource.Nerve]: fillData => (fillData as CurveFillData).pool.gasSchedule,
  [BridgeSource.Belt]: fillData => (fillData as CurveFillData).pool.gasSchedule,
  [BridgeSource.Ellipsis]: fillData => (fillData as CurveFillData).pool.gasSchedule,
  [BridgeSource.Smoothy]: fillData => (fillData as CurveFillData).pool.gasSchedule,
  [BridgeSource.Saddle]: fillData => (fillData as CurveFillData).pool.gasSchedule,
  [BridgeSource.IronSwap]: fillData => (fillData as CurveFillData).pool.gasSchedule,
  [BridgeSource.XSigma]: fillData => (fillData as CurveFillData).pool.gasSchedule,
  [BridgeSource.FirebirdOneSwap]: fillData => (fillData as CurveFillData).pool.gasSchedule,
  [BridgeSource.MultiBridge]: () => 350e3,
  [BridgeSource.UniswapV2]: uniswapV2GasSchedule,
  [BridgeSource.SushiSwap]: uniswapV2GasSchedule,
  [BridgeSource.CryptoCom]: uniswapV2GasSchedule,
  [BridgeSource.Linkswap]: uniswapV2GasSchedule,
  [BridgeSource.ShibaSwap]: uniswapV2GasSchedule,
  [BridgeSource.Balancer]: () => 120e3,
  [BridgeSource.BalancerV2]: () => 100e3,
  [BridgeSource.Cream]: () => 120e3,
  [BridgeSource.MStable]: () => 200e3,
  [BridgeSource.MakerPsm]: (fillData?: DexFillData) => {
    const psmFillData = fillData as MakerPsmFillData;
    return psmFillData.sellToken === psmFillData.gemTokenAddress ? 210e3 : 290e3;
  },
  [BridgeSource.Mooniswap]: () => 130e3,
  [BridgeSource.Shell]: () => 170e3,
  [BridgeSource.Component]: () => 188e3,
  [BridgeSource.MultiHop]: (fillData?: DexFillData) => {
    // const firstHop = (fillData as MultiHopFillData).firstHopSource;
    // const secondHop = (fillData as MultiHopFillData).secondHopSource;
    // const firstHopGas = DEFAULT_GAS_SCHEDULE[firstHop.source](firstHop.fillData);
    // const secondHopGas = DEFAULT_GAS_SCHEDULE[secondHop.source](secondHop.fillData);
    // return Big(firstHopGas)
    //   .plus(secondHopGas)
    //   .plus(30e3)
    //   .toNumber();
    return 0;
  },
  [BridgeSource.Dodo]: (fillData?: DexFillData) => {
    const isSellBase = (fillData as DodoFillData).isSellBase;
    // Sell base is cheaper as it is natively supported
    // sell quote requires additional calculation and overhead
    return isSellBase ? 180e3 : 300e3;
  },
  [BridgeSource.DodoV2]: () => 100e3,
  [BridgeSource.Bancor]: (fillData?: DexFillData) => {
    let gas = 200e3;
    const path = (fillData as BancorFillData).path;
    if (path.length > 2) {
      gas += (path.length - 2) * 60e3; // +60k for each hop.
    }
    return gas;
  },
  [BridgeSource.KyberDmm]: (fillData?: DexFillData) => {
    // TODO: Different base cost if to/from ETH.
    let gas = 95e3;
    const path = (fillData as UniswapV2FillData).tokenAddressPath;
    if (path.length > 2) {
      gas += (path.length - 2) * 65e3; // +65k for each hop.
    }
    return gas;
  },
  [BridgeSource.UniswapV3]: (fillData?: DexFillData) => {
    let gas = 100e3;
    const path = (fillData as UniswapV3FillData).tokenAddressPath;
    if (path.length > 2) {
      gas += (path.length - 2) * 32e3; // +32k for each hop.
    }
    return gas;
  },
  [BridgeSource.Lido]: () => 226e3,
  [BridgeSource.Clipper]: () => 170e3,
  [BridgeSource.PancakeSwap]: uniswapV2GasSchedule,
  [BridgeSource.PancakeSwapV2]: uniswapV2GasSchedule,
  [BridgeSource.BakerySwap]: uniswapV2GasSchedule,
  [BridgeSource.ApeSwap]: uniswapV2GasSchedule,
  [BridgeSource.CafeSwap]: uniswapV2GasSchedule,
  [BridgeSource.CheeseSwap]: uniswapV2GasSchedule,
  [BridgeSource.JulSwap]: uniswapV2GasSchedule,
  [BridgeSource.WaultSwap]: uniswapV2GasSchedule,
  [BridgeSource.ACryptos]: fillData => (fillData as CurveFillData).pool.gasSchedule,
  [BridgeSource.QuickSwap]: uniswapV2GasSchedule,
  [BridgeSource.ComethSwap]: uniswapV2GasSchedule,
  [BridgeSource.Dfyn]: uniswapV2GasSchedule,
  [BridgeSource.Polydex]: uniswapV2GasSchedule,
  [BridgeSource.JetSwap]: uniswapV2GasSchedule,
};

/**
 * Used in Dex fill and Dex path
 */
export const BRIDGE_SOURCE_FLAGS: { [key in BridgeSource]: bigint } = Object.assign(
  {},
  ...Object.values(BridgeSource).map((source, index) => ({ [source]: BigInt(1) << BigInt(index) })),
);

/**
 * Estimated gas consumed by each liquidity source.
 * @constructor
 */
const MULTIPLEX_BATCH_FILL_SOURCE_FLAGS = BRIDGE_SOURCE_FLAGS.Uniswap_V2 | BRIDGE_SOURCE_FLAGS.SushiSwap | BRIDGE_SOURCE_FLAGS.LiquidityProvider | BRIDGE_SOURCE_FLAGS.Uniswap_V3;
const MULTIPLEX_MULTIHOP_FILL_SOURCE_FLAGS = BRIDGE_SOURCE_FLAGS.Uniswap_V2 | BRIDGE_SOURCE_FLAGS.SushiSwap | BRIDGE_SOURCE_FLAGS.LiquidityProvider | BRIDGE_SOURCE_FLAGS.Uniswap_V3;
export const DEFAULT_EXCHANGE_GAS_OVERHEAD: ExchangeGasOverhead = (sourceFlags: bigint) => {
  if ([BRIDGE_SOURCE_FLAGS.Uniswap_V2, BRIDGE_SOURCE_FLAGS.SushiSwap].includes(sourceFlags)) {
    // Uniswap and forks VIP
    return TX_BASE_GAS;
  } else if (
    [
      BRIDGE_SOURCE_FLAGS.SushiSwap,
      BRIDGE_SOURCE_FLAGS.PancakeSwap,
      BRIDGE_SOURCE_FLAGS.PancakeSwap_V2,
      BRIDGE_SOURCE_FLAGS.BakerySwap,
      BRIDGE_SOURCE_FLAGS.ApeSwap,
      BRIDGE_SOURCE_FLAGS.CafeSwap,
      BRIDGE_SOURCE_FLAGS.CheeseSwap,
      BRIDGE_SOURCE_FLAGS.JulSwap,
    ].includes(sourceFlags)) {
    // PancakeSwap and forks VIP
    return TX_BASE_GAS;
  } else if (BRIDGE_SOURCE_FLAGS.Uniswap_V3 === sourceFlags) {
    // Uniswap V3 VIP
    return Big(TX_BASE_GAS).plus(5e3).toNumber();
  } else if (BRIDGE_SOURCE_FLAGS.Curve === sourceFlags) {
    // Curve pseudo-VIP
    return Big(TX_BASE_GAS).plus(40e3).toNumber();
  } else if (BRIDGE_SOURCE_FLAGS.LiquidityProvider === sourceFlags) {
    // PLP VIP
    return Big(TX_BASE_GAS).plus(10e3).toNumber();
  } else if ((MULTIPLEX_BATCH_FILL_SOURCE_FLAGS | sourceFlags) === MULTIPLEX_BATCH_FILL_SOURCE_FLAGS) {
    // Multiplex batch fill
    return Big(TX_BASE_GAS).plus(15e3).toNumber();
  } else if (
    (MULTIPLEX_MULTIHOP_FILL_SOURCE_FLAGS | sourceFlags) ===
    (MULTIPLEX_MULTIHOP_FILL_SOURCE_FLAGS | BRIDGE_SOURCE_FLAGS.MultiHop)
  ) {
    // Multiplex multi-hop fill
    return Big(TX_BASE_GAS).plus(25e3).toNumber();
  } else {
    return PROTOCOL_BASE_GAS;
  }
};

/**
 * Default sampler options
 */
export const DEFAULT_SAMPLER_OPTS: Required<SamplerOptions> = {
  excludedSources: [],
  slippagePercentage: 0.01,
  gasSchedule: DEFAULT_GAS_SCHEDULE,
  exchangeOverhead: DEFAULT_EXCHANGE_GAS_OVERHEAD,
};

export const DEFAULT_SIMULATED_FILL_QUOTE_INFO_OPTS: SwapQuoteFillInfoOpts = {
  gasSchedule: {},
  protocolFeeMultiplier: '70000',
  slippage: 0,
};
