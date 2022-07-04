import { ChainId, LiquiditySource } from '../types';
import { SourceFilters } from '../utils';

export const SELL_SOURCE_FILTER_BY_CHAIN_ID: { [chainId in ChainId]: SourceFilters } = {
  [ChainId.Mainnet]: new SourceFilters([
    LiquiditySource.Native,
    LiquiditySource.Uniswap,
    LiquiditySource.UniswapV2,
    LiquiditySource.Curve,
    LiquiditySource.Balancer,
    LiquiditySource.BalancerV2,
    LiquiditySource.Bancor,
    LiquiditySource.BancorV3,
    LiquiditySource.MStable,
    LiquiditySource.Mooniswap,
    LiquiditySource.SushiSwap,
    LiquiditySource.Shell,
    LiquiditySource.MultiHop,
    LiquiditySource.Dodo,
    LiquiditySource.DodoV2,
    LiquiditySource.Cream,
    LiquiditySource.LiquidityProvider,
    LiquiditySource.CryptoCom,
    LiquiditySource.Lido,
    LiquiditySource.MakerPsm,
    LiquiditySource.KyberDmm,
    LiquiditySource.Component,
    LiquiditySource.Saddle,
    LiquiditySource.XSigma,
    LiquiditySource.UniswapV3,
    LiquiditySource.CurveV2,
    LiquiditySource.ShibaSwap,
    LiquiditySource.Synapse,
    // TODO: enable after FQT has been redeployed on Ethereum mainnet
    // ERC20BridgeSource.AaveV2,
    // ERC20BridgeSource.Compound,
  ]),
  [ChainId.Ropsten]: new SourceFilters([
    LiquiditySource.Native,
    LiquiditySource.SushiSwap,
    LiquiditySource.Uniswap,
    LiquiditySource.UniswapV2,
    LiquiditySource.UniswapV3,
    LiquiditySource.Curve,
    LiquiditySource.Mooniswap,
  ]),
  [ChainId.Rinkeby]: new SourceFilters([LiquiditySource.Native]),
  [ChainId.Kovan]: new SourceFilters([LiquiditySource.Native]),
  [ChainId.Ganache]: new SourceFilters([LiquiditySource.Native]),
  [ChainId.BSC]: new SourceFilters([
    LiquiditySource.BakerySwap,
    LiquiditySource.Belt,
    LiquiditySource.Dodo,
    LiquiditySource.DodoV2,
    LiquiditySource.Ellipsis,
    LiquiditySource.Mooniswap,
    LiquiditySource.MultiHop,
    LiquiditySource.Nerve,
    LiquiditySource.Synapse,
    LiquiditySource.PancakeSwap,
    LiquiditySource.PancakeSwapV2,
    LiquiditySource.SushiSwap,
    LiquiditySource.ApeSwap,
    LiquiditySource.CheeseSwap,
    LiquiditySource.LiquidityProvider,
    LiquiditySource.WaultSwap,
    LiquiditySource.FirebirdOneSwap,
    LiquiditySource.ACryptos,
    LiquiditySource.KyberDmm,
    LiquiditySource.BiSwap,
    LiquiditySource.MDex,
    LiquiditySource.KnightSwap,
  ]),
  [ChainId.Polygon]: new SourceFilters([
    LiquiditySource.SushiSwap,
    LiquiditySource.QuickSwap,
    LiquiditySource.Dfyn,
    LiquiditySource.MStable,
    LiquiditySource.Curve,
    LiquiditySource.DodoV2,
    LiquiditySource.Dodo,
    LiquiditySource.CurveV2,
    LiquiditySource.WaultSwap,
    LiquiditySource.ApeSwap,
    LiquiditySource.FirebirdOneSwap,
    LiquiditySource.BalancerV2,
    LiquiditySource.KyberDmm,
    LiquiditySource.LiquidityProvider,
    LiquiditySource.MultiHop,
    LiquiditySource.IronSwap,
    LiquiditySource.AaveV2,
    LiquiditySource.UniswapV3,
    LiquiditySource.Synapse,
    LiquiditySource.MeshSwap,
  ]),
  [ChainId.PolygonMumbai]: new SourceFilters([LiquiditySource.Native]),
  [ChainId.Avalanche]: new SourceFilters([
    LiquiditySource.MultiHop,
    LiquiditySource.Pangolin,
    LiquiditySource.TraderJoe,
    LiquiditySource.SushiSwap,
    LiquiditySource.Curve,
    LiquiditySource.CurveV2,
    LiquiditySource.KyberDmm,
    LiquiditySource.AaveV2,
    LiquiditySource.Synapse,
    LiquiditySource.GMX,
    LiquiditySource.Platypus,
  ]),
  [ChainId.Fantom]: new SourceFilters([
    LiquiditySource.MultiHop,
    LiquiditySource.Beethovenx,
    LiquiditySource.Curve,
    LiquiditySource.CurveV2,
    LiquiditySource.Geist,
    LiquiditySource.MorpheusSwap,
    LiquiditySource.SpiritSwap,
    LiquiditySource.SpookySwap,
    LiquiditySource.SushiSwap,
    LiquiditySource.Synapse,
    LiquiditySource.Yoshi,
  ]),
  [ChainId.Celo]: new SourceFilters([
    LiquiditySource.UbeSwap,
    LiquiditySource.SushiSwap,
    LiquiditySource.MultiHop,
    LiquiditySource.MobiusMoney,
  ]),
  [ChainId.Optimism]: new SourceFilters([
    LiquiditySource.UniswapV3,
    LiquiditySource.Synapse,
    LiquiditySource.Curve,
    LiquiditySource.CurveV2,
    LiquiditySource.MultiHop,
    LiquiditySource.Velodrome,
  ]),
};
