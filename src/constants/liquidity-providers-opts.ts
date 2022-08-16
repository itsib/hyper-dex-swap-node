import { BigNumber } from 'ethers';
import { formatBytes32String } from 'ethers/lib/utils';
import {
  BridgeSource,
  ChainId,
  CurveFunctionSelectors,
  CurvePoolSettings,
  LiquidityProviderRegistrySettings,
  MakerPsmSettings,
} from '../types';
import { SourceFilter } from '../utils';
import { TOKENS } from './addresses';
import { ONE_ETHER } from './common';

export const SELL_SOURCE_FILTERS: { [chainId in ChainId]: SourceFilter } = {
  [ChainId.MAINNET]: new SourceFilter([
    BridgeSource.Uniswap,
    BridgeSource.UniswapV2,
    BridgeSource.Eth2Dai,
    BridgeSource.Kyber,
    BridgeSource.Curve,
    BridgeSource.Balancer,
    BridgeSource.BalancerV2,
    BridgeSource.Bancor,
    BridgeSource.MStable,
    BridgeSource.Mooniswap,
    BridgeSource.Swerve,
    BridgeSource.SnowSwap,
    BridgeSource.SushiSwap,
    BridgeSource.Shell,
    BridgeSource.MultiHop,
    BridgeSource.Dodo,
    BridgeSource.DodoV2,
    BridgeSource.Cream,
    BridgeSource.LiquidityProvider,
    BridgeSource.CryptoCom,
    BridgeSource.Linkswap,
    BridgeSource.Lido,
    BridgeSource.MakerPsm,
    BridgeSource.KyberDmm,
    BridgeSource.Smoothy,
    BridgeSource.Component,
    BridgeSource.Saddle,
    BridgeSource.XSigma,
    BridgeSource.UniswapV3,
    BridgeSource.CurveV2,
    BridgeSource.ShibaSwap,
    BridgeSource.Clipper,
  ]),
  [ChainId.ROPSTEN]: new SourceFilter([
    BridgeSource.Kyber,
    BridgeSource.SushiSwap,
    BridgeSource.Uniswap,
    BridgeSource.UniswapV2,
    BridgeSource.UniswapV3,
    BridgeSource.Curve,
    BridgeSource.Mooniswap,
  ]),
  [ChainId.RINKEBY]: new SourceFilter([]),
  [ChainId.KOVAN]: new SourceFilter([]),
  [ChainId.BSC]: new SourceFilter([
    BridgeSource.BakerySwap,
    BridgeSource.Belt,
    BridgeSource.Dodo,
    BridgeSource.DodoV2,
    BridgeSource.Ellipsis,
    BridgeSource.Mooniswap,
    BridgeSource.MultiHop,
    BridgeSource.Nerve,
    BridgeSource.PancakeSwap,
    BridgeSource.PancakeSwapV2,
    BridgeSource.SushiSwap,
    BridgeSource.Smoothy,
    BridgeSource.ApeSwap,
    BridgeSource.CafeSwap,
    BridgeSource.CheeseSwap,
    BridgeSource.JulSwap,
    BridgeSource.LiquidityProvider,
    BridgeSource.WaultSwap,
    BridgeSource.FirebirdOneSwap,
    BridgeSource.JetSwap,
    BridgeSource.ACryptos,
  ]),
  [ChainId.MATIC]: new SourceFilter([
    BridgeSource.SushiSwap,
    BridgeSource.QuickSwap,
    BridgeSource.ComethSwap,
    BridgeSource.Dfyn,
    BridgeSource.MStable,
    BridgeSource.Curve,
    BridgeSource.DodoV2,
    BridgeSource.Dodo,
    BridgeSource.CurveV2,
    BridgeSource.WaultSwap,
    BridgeSource.Polydex,
    BridgeSource.ApeSwap,
    BridgeSource.FirebirdOneSwap,
    BridgeSource.BalancerV2,
    BridgeSource.KyberDmm,
    BridgeSource.LiquidityProvider,
    BridgeSource.MultiHop,
    BridgeSource.JetSwap,
    BridgeSource.IronSwap,
  ]),
  [ChainId.MATIC_MUMBAI]: new SourceFilter([]),
  [ChainId.AVALANCHE]: new SourceFilter([]),
  [ChainId.FANTOM]: new SourceFilter([]),
  [ChainId.CELO]: new SourceFilter([]),
  [ChainId.OPTIMISM]: new SourceFilter([]),
};

export const BUY_SOURCE_FILTERS: { [chainId in ChainId]: SourceFilter } = {
  [ChainId.MAINNET]: new SourceFilter([
    BridgeSource.Uniswap,
    BridgeSource.UniswapV2,
    BridgeSource.Eth2Dai,
    BridgeSource.Kyber,
    BridgeSource.Curve,
    BridgeSource.Balancer,
    BridgeSource.BalancerV2,
    // BridgeSource.Bancor, // FIXME: Bancor Buys not implemented in Sampler
    BridgeSource.MStable,
    BridgeSource.Mooniswap,
    BridgeSource.Shell,
    BridgeSource.Swerve,
    BridgeSource.SnowSwap,
    BridgeSource.SushiSwap,
    BridgeSource.MultiHop,
    BridgeSource.Dodo,
    BridgeSource.DodoV2,
    BridgeSource.Cream,
    BridgeSource.Lido,
    BridgeSource.LiquidityProvider,
    BridgeSource.CryptoCom,
    BridgeSource.Linkswap,
    BridgeSource.MakerPsm,
    BridgeSource.KyberDmm,
    BridgeSource.Smoothy,
    BridgeSource.Component,
    BridgeSource.Saddle,
    BridgeSource.XSigma,
    BridgeSource.UniswapV3,
    BridgeSource.CurveV2,
    BridgeSource.ShibaSwap,
    BridgeSource.Clipper,
  ]),
  [ChainId.ROPSTEN]: new SourceFilter([
    BridgeSource.Kyber,
    BridgeSource.SushiSwap,
    BridgeSource.Uniswap,
    BridgeSource.UniswapV2,
    BridgeSource.UniswapV3,
    BridgeSource.Curve,
    BridgeSource.Mooniswap,
  ]),
  [ChainId.RINKEBY]: new SourceFilter([]),
  [ChainId.KOVAN]: new SourceFilter([]),
  [ChainId.BSC]: new SourceFilter([
    BridgeSource.BakerySwap,
    BridgeSource.Belt,
    BridgeSource.Dodo,
    BridgeSource.DodoV2,
    BridgeSource.Ellipsis,
    BridgeSource.Mooniswap,
    BridgeSource.MultiHop,
    BridgeSource.Nerve,
    BridgeSource.PancakeSwap,
    BridgeSource.PancakeSwapV2,
    BridgeSource.SushiSwap,
    BridgeSource.Smoothy,
    BridgeSource.ApeSwap,
    BridgeSource.CafeSwap,
    BridgeSource.CheeseSwap,
    BridgeSource.JulSwap,
    BridgeSource.LiquidityProvider,
    BridgeSource.WaultSwap,
    BridgeSource.FirebirdOneSwap,
    BridgeSource.JetSwap,
    BridgeSource.ACryptos,
  ]),
  [ChainId.MATIC]: new SourceFilter([
    BridgeSource.SushiSwap,
    BridgeSource.QuickSwap,
    BridgeSource.ComethSwap,
    BridgeSource.Dfyn,
    BridgeSource.MStable,
    BridgeSource.Curve,
    BridgeSource.DodoV2,
    BridgeSource.Dodo,
    BridgeSource.CurveV2,
    BridgeSource.WaultSwap,
    BridgeSource.Polydex,
    BridgeSource.ApeSwap,
    BridgeSource.FirebirdOneSwap,
    BridgeSource.BalancerV2,
    BridgeSource.KyberDmm,
    BridgeSource.LiquidityProvider,
    BridgeSource.MultiHop,
    BridgeSource.JetSwap,
    BridgeSource.IronSwap,
  ]),
  [ChainId.MATIC_MUMBAI]: new SourceFilter([]),
  [ChainId.AVALANCHE]: new SourceFilter([]),
  [ChainId.FANTOM]: new SourceFilter([]),
  [ChainId.CELO]: new SourceFilter([]),
  [ChainId.OPTIMISM]: new SourceFilter([]),
};

export const FEE_SOURCE_FILTERS: { [chainId in ChainId]: SourceFilter } = {
  [ChainId.MAINNET]: new SourceFilter([BridgeSource.UniswapV2, BridgeSource.SushiSwap, BridgeSource.UniswapV3]),
  [ChainId.ROPSTEN]: new SourceFilter([BridgeSource.UniswapV2, BridgeSource.SushiSwap]),
  [ChainId.RINKEBY]: new SourceFilter([]),
  [ChainId.KOVAN]: new SourceFilter([]),
  [ChainId.BSC]: new SourceFilter([BridgeSource.PancakeSwap, BridgeSource.Mooniswap, BridgeSource.SushiSwap]),
  [ChainId.MATIC]: new SourceFilter([BridgeSource.QuickSwap, BridgeSource.SushiSwap]),
  [ChainId.MATIC_MUMBAI]: new SourceFilter([]),
  [ChainId.AVALANCHE]: new SourceFilter([]),
  [ChainId.FANTOM]: new SourceFilter([]),
  [ChainId.CELO]: new SourceFilter([]),
  [ChainId.OPTIMISM]: new SourceFilter([]),
};

export const FEE_NATIVE_TOKEN_AMOUNT: { [chainId in ChainId]: BigNumber } = {
  [ChainId.MAINNET]: ONE_ETHER,
  [ChainId.ROPSTEN]: ONE_ETHER,
  [ChainId.RINKEBY]: ONE_ETHER,
  [ChainId.KOVAN]: ONE_ETHER,
  [ChainId.BSC]: ONE_ETHER,
  [ChainId.MATIC]: ONE_ETHER,
  [ChainId.MATIC_MUMBAI]: ONE_ETHER,
  [ChainId.AVALANCHE]: ONE_ETHER,
  [ChainId.FANTOM]: ONE_ETHER,
  [ChainId.CELO]: ONE_ETHER,
  [ChainId.OPTIMISM]: ONE_ETHER,
};

/**
 * Used for find the adjacent tokens in the provided token adjacency graph,
 * e.g. if this is DAI->USDC we may check for DAI->WETH->USDC
 */
export const TOKEN_ADJACENCY_GRAPH_BY_CHAIN_ID: { [chainId in ChainId]: { [token: string]: string[]; default: string[] } } = {
  [ChainId.MAINNET]: {
    [TOKENS[ChainId.MAINNET].MIR]: [TOKENS[ChainId.MAINNET].UST],
    [TOKENS[ChainId.MAINNET].UST]: [
      TOKENS[ChainId.MAINNET].MIR,
      TOKENS[ChainId.MAINNET].mAAPL,
      TOKENS[ChainId.MAINNET].mSLV,
      TOKENS[ChainId.MAINNET].mIAU,
      TOKENS[ChainId.MAINNET].mAMZN,
      TOKENS[ChainId.MAINNET].mGOOGL,
      TOKENS[ChainId.MAINNET].mTSLA,
      TOKENS[ChainId.MAINNET].mQQQ,
      TOKENS[ChainId.MAINNET].mTWTR,
      TOKENS[ChainId.MAINNET].mMSFT,
      TOKENS[ChainId.MAINNET].mNFLX,
      TOKENS[ChainId.MAINNET].mBABA,
      TOKENS[ChainId.MAINNET].mUSO,
      TOKENS[ChainId.MAINNET].mVIXY,
      TOKENS[ChainId.MAINNET].mLUNA,
    ],
    [TOKENS[ChainId.MAINNET].USDT]: [TOKENS[ChainId.MAINNET].UST],
    [TOKENS[ChainId.MAINNET].mAAPL]: [TOKENS[ChainId.MAINNET].UST],
    [TOKENS[ChainId.MAINNET].mSLV]: [TOKENS[ChainId.MAINNET].UST],
    [TOKENS[ChainId.MAINNET].mIAU]: [TOKENS[ChainId.MAINNET].UST],
    [TOKENS[ChainId.MAINNET].mAMZN]: [TOKENS[ChainId.MAINNET].UST],
    [TOKENS[ChainId.MAINNET].mGOOGL]: [TOKENS[ChainId.MAINNET].UST],
    [TOKENS[ChainId.MAINNET].mTSLA]: [TOKENS[ChainId.MAINNET].UST],
    [TOKENS[ChainId.MAINNET].mQQQ]: [TOKENS[ChainId.MAINNET].UST],
    [TOKENS[ChainId.MAINNET].mTWTR]: [TOKENS[ChainId.MAINNET].UST],
    [TOKENS[ChainId.MAINNET].mMSFT]: [TOKENS[ChainId.MAINNET].UST],
    [TOKENS[ChainId.MAINNET].mNFLX]: [TOKENS[ChainId.MAINNET].UST],
    [TOKENS[ChainId.MAINNET].mBABA]: [TOKENS[ChainId.MAINNET].UST],
    [TOKENS[ChainId.MAINNET].mUSO]: [TOKENS[ChainId.MAINNET].UST],
    [TOKENS[ChainId.MAINNET].mVIXY]: [TOKENS[ChainId.MAINNET].UST],
    [TOKENS[ChainId.MAINNET].mLUNA]: [TOKENS[ChainId.MAINNET].UST],
    default: [
      TOKENS[ChainId.MAINNET].WETH,
      TOKENS[ChainId.MAINNET].USDT,
      TOKENS[ChainId.MAINNET].DAI,
      TOKENS[ChainId.MAINNET].USDC,
      TOKENS[ChainId.MAINNET].WBTC,
    ],
  },
  [ChainId.ROPSTEN]: {
    default: [
      TOKENS[ChainId.ROPSTEN].WETH,
      TOKENS[ChainId.ROPSTEN].DAI,
      TOKENS[ChainId.ROPSTEN].USDC,
    ],
  },
  [ChainId.RINKEBY]: { default: [] },
  [ChainId.KOVAN]: { default: [] },
  [ChainId.BSC]: {
    default: [
      TOKENS[ChainId.BSC].WBNB,
      TOKENS[ChainId.BSC].BUSD,
      TOKENS[ChainId.BSC].DAI,
      TOKENS[ChainId.BSC].USDC,
      TOKENS[ChainId.BSC].WETH,
      TOKENS[ChainId.BSC].USDT,
      TOKENS[ChainId.BSC].WEX,
    ],
  },
  [ChainId.MATIC]: {
    default: [
      TOKENS[ChainId.MATIC].WMATIC,
      TOKENS[ChainId.MATIC].WETH,
      TOKENS[ChainId.MATIC].USDC,
      TOKENS[ChainId.MATIC].DAI,
      TOKENS[ChainId.MATIC].USDT,
      TOKENS[ChainId.MATIC].WBTC,
    ],
  },
  [ChainId.MATIC_MUMBAI]: { default: [] },
  [ChainId.AVALANCHE]: { default: [] },
  [ChainId.FANTOM]: { default: [] },
  [ChainId.CELO]: { default: [] },
  [ChainId.OPTIMISM]: { default: [] },
};

/**
 * Addresses of tokens that do not participate in the creation of a quota for a certain liquidity provider
 */
export const BAD_TOKENS_BY_SOURCE: { [source in BridgeSource]?: string[] } = {
  [BridgeSource.Uniswap]: [
    '0xb8c77482e45f1f44de1745f52c74426c631bdd52', // BNB
  ],
};

export const LIQUIDITY_PROVIDER_REGISTRY: { [chainId in ChainId]?: LiquidityProviderRegistrySettings[] } = {
  [ChainId.MAINNET]: [
    {
      poolAddress: '0x1d0d407c5af8c86f0a6494de86e56ae21e46a951',
      tokens: [
        TOKENS[ChainId.MAINNET].WETH,
        TOKENS[ChainId.MAINNET].USDC,
        TOKENS[ChainId.MAINNET].USDT,
        TOKENS[ChainId.MAINNET].WBTC,
        TOKENS[ChainId.MAINNET].PAX,
        TOKENS[ChainId.MAINNET].LINK,
        TOKENS[ChainId.MAINNET].KNC,
        TOKENS[ChainId.MAINNET].MANA,
        TOKENS[ChainId.MAINNET].DAI,
        TOKENS[ChainId.MAINNET].BUSD,
        TOKENS[ChainId.MAINNET].AAVE,
        TOKENS[ChainId.MAINNET].HT,
      ],
      gasCost: (takerToken: string, makerToken: string) => [takerToken, makerToken].includes(TOKENS[ChainId.MAINNET].WETH) ? 160e3 : 280e3,
    }
  ],
};

export const OASIS_ROUTER_ADDRESSES: { [chainId in ChainId]?: string } = {
  [ChainId.MAINNET]: '0x5e3e0548935a83ad29fb2a9153d331dc6d49020f',
};

export const UNISWAP_V1_ROUTER_ADDRESSES: { [chainId in ChainId]?: string } = {
  [ChainId.MAINNET]: '0xc0a47dfe034b400b47bdad5fecda2621de6c4d95',
  [ChainId.ROPSTEN]: '0x9c83dce8ca20e9aaf9d3efc003b2ea62abc08351',
};

export const UNISWAP_V2_LIKE_ROUTER_ADDRESSES: { [source in BridgeSource]?: { [chainId in ChainId]?: string } } = {
  [BridgeSource.UniswapV2]: {
    [ChainId.MAINNET]: '0xf164fc0ec4e93095b804a4795bbe1e041497b92a',
    [ChainId.ROPSTEN]: '0xf164fc0ec4e93095b804a4795bbe1e041497b92a',
  },
  [BridgeSource.SushiSwap]: {
    [ChainId.MAINNET]: '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f',
    [ChainId.BSC]: '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506',
    [ChainId.ROPSTEN]: '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506',
    [ChainId.MATIC]: '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506',
  },
  [BridgeSource.CryptoCom]: {
    [ChainId.MAINNET]: '0xceb90e4c17d626be0facd78b79c9c87d7ca181b3',
  },
  [BridgeSource.PancakeSwap]: {
    [ChainId.BSC]: '0x05ff2b0db69458a0750badebc4f9e13add608c7f',
  },
  [BridgeSource.PancakeSwapV2]: {
    [ChainId.BSC]: '0x10ed43c718714eb63d5aa57b78b54704e256024e',
  },
  [BridgeSource.BakerySwap]: {
    [ChainId.BSC]: '0xcde540d7eafe93ac5fe6233bee57e1270d3e330f',
  },
  [BridgeSource.ApeSwap]: {
    [ChainId.BSC]: '0xc0788a3ad43d79aa53b09c2eacc313a787d1d607',
    [ChainId.MATIC]: '0xc0788a3ad43d79aa53b09c2eacc313a787d1d607',
  },
  [BridgeSource.CafeSwap]: {
    [ChainId.BSC]: '0x933daea3a5995fb94b14a7696a5f3ffd7b1e385a',
  },
  [BridgeSource.CheeseSwap]: {
    [ChainId.BSC]: '0x3047799262d8d2ef41ed2a222205968bc9b0d895',
  },
  [BridgeSource.JulSwap]: {
    [ChainId.BSC]: '0xbd67d157502a23309db761c41965600c2ec788b2',
  },
  [BridgeSource.QuickSwap]: {
    [ChainId.MATIC]: '0xa5e0829caced8ffdd4de3c43696c57f7d7a678ff',
  },
  [BridgeSource.ComethSwap]: {
    [ChainId.MATIC]: '0x93bcdc45f7e62f89a8e901dc4a0e2c6c427d9f25',
  },
  [BridgeSource.Dfyn]: {
    [ChainId.MATIC]: '0xa102072a4c07f06ec3b4900fdc4c7b80b6c57429',
  },
  [BridgeSource.WaultSwap]: {
    [ChainId.BSC]: '0xd48745e39bbed146eec15b79cbf964884f9877c2',
    [ChainId.MATIC]: '0x3a1d87f206d12415f5b0a33e786967680aab4f6d',
  },
  [BridgeSource.Polydex]: {
    [ChainId.MATIC]: '0xe5c67ba380fb2f70a47b489e94bced486bb8fb74',
  },
  [BridgeSource.ShibaSwap]: {
    [ChainId.MAINNET]: '0x03f7724180aa6b939894b5ca4314783b0b36b329',
  },
  [BridgeSource.JetSwap]: {
    [ChainId.BSC]: '0xbe65b8f75b9f20f4c522e0067a3887fada714800',
    [ChainId.MATIC]: '0x5c6ec38fb0e2609672bdf628b1fd605a523e5923',
  },
};

export const UNISWAP_V3_POOL: { [chainId in ChainId]?: { quoter: string, router: string } } = {
  [ChainId.MAINNET]: {
    quoter: '0xb27308f9f90d607463bb33ea1bebb41c27ce5ab6',
    router: '0xe592427a0aece92de3edee1f18e0157c05861564',
  },
  [ChainId.ROPSTEN]: {
    quoter: '0x2f9e608fd881861b8916257b76613cb22ee0652c',
    router: '0x03782388516e94fcd4c18666303601a12aa729ea',
  },
};

export const KYBER_DMM_ROUTER_ADDRESSES: { [chainId in ChainId]?: string } = {
  [ChainId.MAINNET]: '0x1c87257f5e8609940bc751a07bb085bb7f8cdbe6',
  [ChainId.MATIC]: '0x546c79662e028b661dfb4767664d0273184e4dd1',
};

/**
 * Kyber liquidity pools configuration
 */
export const KYBER_MAX_RESERVES_QUERIED = 5;
export const KYBER_BRIDGED_LIQUIDITY_PREFIX = '0xbb';
export const KYBER_BANNED_RESERVES = ['0xff4f6e65426974205175616e7400000000000000000000000000000000000000'];
export const KYBER_CONFIG: { [chainId in ChainId]?: { networkProxy: string; hintHandler: string; weth: string } } = {
  [ChainId.MAINNET]: {
    networkProxy: '0x9aab3f75489902f3a48495025729a0af77d4b11e',
    hintHandler: '0xa1c0fa73c39cfbcc11ec9eb1afc665aba9996e2c',
    weth: TOKENS[ChainId.MAINNET].WETH,
  },
  [ChainId.ROPSTEN]: {
    networkProxy: '0x818e6fecd516ecc3849daf6845e3ec868087b755',
    hintHandler: '0x63f773c026093eef988e803bdd5772dd235a8e71',
    weth: TOKENS[ChainId.ROPSTEN].WETH,
  },
};

/**
 * Curve like configuration
 * The tokens are in order of their index, which each curve defines
 * I.e DaiUsdc curve has DAI as index 0 and USDC as index 1
 */
export const CURVE_LIQUIDITY_PROVIDER: { [chainId in ChainId]?: string } = {
  [ChainId.MAINNET]: '0x561b94454b65614ae3db0897b74303f4acf7cc75',
  [ChainId.ROPSTEN]: '0xae241c6fc7f28f6dc0cb58b4112ba7f63fcaf5e2',
};
export const CURVE_LIKE_POOLS: { [source in BridgeSource]?: { [chainId in ChainId]?: Omit<CurvePoolSettings, 'buyTokenIdx' | 'sellTokenIdx'>[] } } = {
  [BridgeSource.Curve]: {
    [ChainId.MAINNET]: [
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].DAI, TOKENS[ChainId.MAINNET].USDC],
        metaTokens: undefined,
        poolAddress: '0xa2b47e3d5c44877cca798226b7b8118f9bfb7a56', // Compound,
        gasSchedule: 587e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].DAI, TOKENS[ChainId.MAINNET].USDC, TOKENS[ChainId.MAINNET].USDT, TOKENS[ChainId.MAINNET].PAX],
        metaTokens: undefined,
        poolAddress: '0x06364f10b501e868329afbc005b3492902d6c763', // PAX,
        gasSchedule: 742e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].DAI, TOKENS[ChainId.MAINNET].USDC, TOKENS[ChainId.MAINNET].USDT, TOKENS[ChainId.MAINNET].sUSD],
        metaTokens: undefined,
        poolAddress: '0xa5407eae9ba41422680e2e00537571bcc53efbfd', // sUSD,
        gasSchedule: 302e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].DAI, TOKENS[ChainId.MAINNET].USDC, TOKENS[ChainId.MAINNET].USDT, TOKENS[ChainId.MAINNET].sUSD],
        metaTokens: undefined,
        poolAddress: '0xa5407eae9ba41422680e2e00537571bcc53efbfd', // sUSD,
        gasSchedule: 302e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].DAI, TOKENS[ChainId.MAINNET].USDC, TOKENS[ChainId.MAINNET].USDT],
        metaTokens: undefined,
        poolAddress: '0xdebf20617708857ebe4f679508e7b7863a8a8eee', // aave,
        gasSchedule: 580e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].DAI, TOKENS[ChainId.MAINNET].sUSD],
        metaTokens: undefined,
        poolAddress: '0xeb16ae0052ed37f479f7fe63849198df1765a733', // saave,
        gasSchedule: 580e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].DAI, TOKENS[ChainId.MAINNET].USDC, TOKENS[ChainId.MAINNET].USDT],
        metaTokens: undefined,
        poolAddress: '0x2dded6da1bf5dbdf597c45fcfaa3194e53ecfeaf', // Iron Bank,
        gasSchedule: 646e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].RenBTC, TOKENS[ChainId.MAINNET].WBTC],
        metaTokens: undefined,
        poolAddress: '0x93054188d876f558f4a66b2ef1d97d16edf0895b', // renBTC,
        gasSchedule: 171e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].RenBTC, TOKENS[ChainId.MAINNET].WBTC, TOKENS[ChainId.MAINNET].sBTC],
        metaTokens: undefined,
        poolAddress: '0x7fc77b5c7614e1533320ea6ddc2eb61fa00a9714', // sBTC
        gasSchedule: 327e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].hBTC, TOKENS[ChainId.MAINNET].WBTC],
        metaTokens: undefined,
        poolAddress: '0x4ca9b3063ec5866a4b82e437059d2c43d1be596f', // HBTC
        gasSchedule: 210e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].DAI, TOKENS[ChainId.MAINNET].USDC, TOKENS[ChainId.MAINNET].USDT],
        metaTokens: undefined,
        poolAddress: '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7', // 3pool,
        gasSchedule: 176e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].EURS, TOKENS[ChainId.MAINNET].sEUR],
        metaTokens: undefined,
        poolAddress: '0x0ce6a5ff5217e38315f87032cf90686c96627caa', // eurs,
        gasSchedule: 320e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].aDAI, TOKENS[ChainId.MAINNET].aUSDC, TOKENS[ChainId.MAINNET].aUSDT],
        metaTokens: undefined,
        poolAddress: '0xdebf20617708857ebe4f679508e7b7863a8a8eee', // aave
        gasSchedule: 580e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].aDAI, TOKENS[ChainId.MAINNET].aSUSD],
        metaTokens: undefined,
        poolAddress: '0xeb16ae0052ed37f479f7fe63849198df1765a733', // saave,
        gasSchedule: 580e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].LINK, TOKENS[ChainId.MAINNET].sLINK],
        metaTokens: undefined,
        poolAddress: '0xf178c0b5bb7e7abf4e12a4838c7b7c5ba2c623c0', // link
        gasSchedule: 319e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].WETH, TOKENS[ChainId.MAINNET].stETH],
        metaTokens: undefined,
        poolAddress: '0xdc24316b9ae028f1497c275eb9192a3ea0f67022', // stETH,
        gasSchedule: 151e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].WETH, TOKENS[ChainId.MAINNET].sETH],
        metaTokens: undefined,
        poolAddress: '0xc5424b857f758e906013f3555dad202e4bdb4567', // sETH,
        gasSchedule: 187e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].WETH, TOKENS[ChainId.MAINNET].ankrETH],
        metaTokens: undefined,
        poolAddress: '0xa96a65c051bf88b4095ee1f2451c2a9d43f53ae2', // ankreth,
        gasSchedule: 125e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].GUSD, TOKENS[ChainId.MAINNET].DAI, TOKENS[ChainId.MAINNET].USDC, TOKENS[ChainId.MAINNET].USDT],
        metaTokens: [TOKENS[ChainId.MAINNET].GUSD],
        poolAddress: '0x4f062658eaaf2c1ccf8c8e36d6824cdf41167956', // GUSD,
        gasSchedule: 411e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].HUSD, TOKENS[ChainId.MAINNET].DAI, TOKENS[ChainId.MAINNET].USDC, TOKENS[ChainId.MAINNET].USDT],
        metaTokens: [TOKENS[ChainId.MAINNET].HUSD],
        poolAddress: '0x3ef6a01a0f81d6046290f3e2a8c5b843e738e604', // HUSD,
        gasSchedule: 396e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].USDN, TOKENS[ChainId.MAINNET].DAI, TOKENS[ChainId.MAINNET].USDC, TOKENS[ChainId.MAINNET].USDT],
        metaTokens: [TOKENS[ChainId.MAINNET].USDN],
        poolAddress: '0x0f9cb53ebe405d49a0bbdbd291a65ff571bc83e1', // USDN,
        gasSchedule: 398e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].mUSD, TOKENS[ChainId.MAINNET].DAI, TOKENS[ChainId.MAINNET].USDC, TOKENS[ChainId.MAINNET].USDT],
        metaTokens: [TOKENS[ChainId.MAINNET].mUSD],
        poolAddress: '0x8474ddbe98f5aa3179b3b3f5942d724afcdec9f6', // mUSD,
        gasSchedule: 385e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].dUSD, TOKENS[ChainId.MAINNET].DAI, TOKENS[ChainId.MAINNET].USDC, TOKENS[ChainId.MAINNET].USDT],
        metaTokens: [TOKENS[ChainId.MAINNET].dUSD],
        poolAddress: '0x8038c01a0390a8c547446a0b2c18fc9aefecc10c', // dUSD,
        gasSchedule: 371e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].UST, TOKENS[ChainId.MAINNET].DAI, TOKENS[ChainId.MAINNET].USDC, TOKENS[ChainId.MAINNET].USDT],
        metaTokens: [TOKENS[ChainId.MAINNET].UST],
        poolAddress: '0x890f4e345b1daed0367a877a1612f86a1f86985f', // UST,
        gasSchedule: 340e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].USDP, TOKENS[ChainId.MAINNET].DAI, TOKENS[ChainId.MAINNET].USDC, TOKENS[ChainId.MAINNET].USDT],
        metaTokens: [TOKENS[ChainId.MAINNET].USDP],
        poolAddress: '0x42d7025938bec20b69cbae5a77421082407f053a', // USDP,
        gasSchedule: 374e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].TUSD, TOKENS[ChainId.MAINNET].DAI, TOKENS[ChainId.MAINNET].USDC, TOKENS[ChainId.MAINNET].USDT],
        metaTokens: [TOKENS[ChainId.MAINNET].TUSD],
        poolAddress: '0xecd5e75afb02efa118af914515d6521aabd189f1', // TUSD,
        gasSchedule: 404e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].STABLEx, TOKENS[ChainId.MAINNET].DAI, TOKENS[ChainId.MAINNET].USDC, TOKENS[ChainId.MAINNET].USDT],
        metaTokens: [TOKENS[ChainId.MAINNET].STABLEx],
        poolAddress: '0x3252efd4ea2d6c78091a1f43982ee2c3659cc3d1', // STABLEx,
        gasSchedule: 397e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].alUSD, TOKENS[ChainId.MAINNET].DAI, TOKENS[ChainId.MAINNET].USDC, TOKENS[ChainId.MAINNET].USDT],
        metaTokens: [TOKENS[ChainId.MAINNET].alUSD],
        poolAddress: '0x43b4fdfd4ff969587185cdb6f0bd875c5fc83f8c', // alUSD,
        gasSchedule: 387e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].FRAX, TOKENS[ChainId.MAINNET].DAI, TOKENS[ChainId.MAINNET].USDC, TOKENS[ChainId.MAINNET].USDT],
        metaTokens: [TOKENS[ChainId.MAINNET].FRAX],
        poolAddress: '0xd632f22692fac7611d2aa1c0d552930d43caed3b', // FRAX,
        gasSchedule: 387e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].LUSD, TOKENS[ChainId.MAINNET].DAI, TOKENS[ChainId.MAINNET].USDC, TOKENS[ChainId.MAINNET].USDT],
        metaTokens: [TOKENS[ChainId.MAINNET].LUSD],
        poolAddress: '0xed279fdd11ca84beef15af5d39bb4d4bee23f0ca', // LUSD,
        gasSchedule: 387e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].BUSD, TOKENS[ChainId.MAINNET].DAI, TOKENS[ChainId.MAINNET].USDC, TOKENS[ChainId.MAINNET].USDT],
        metaTokens: [TOKENS[ChainId.MAINNET].BUSD],
        poolAddress: '0x4807862aa8b2bf68830e4c8dc86d0e9a998e085a', // BUSD,
        gasSchedule: 387e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].DSU, TOKENS[ChainId.MAINNET].DAI, TOKENS[ChainId.MAINNET].USDC, TOKENS[ChainId.MAINNET].USDT],
        metaTokens: [TOKENS[ChainId.MAINNET].DSU],
        poolAddress: '0x6ec80df362d7042c50d4469bcfbc174c9dd9109a', // DSU3CRV,
        gasSchedule: 387e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].tBTC, TOKENS[ChainId.MAINNET].RenBTC, TOKENS[ChainId.MAINNET].WBTC, TOKENS[ChainId.MAINNET].sBTC],
        metaTokens: [TOKENS[ChainId.MAINNET].tBTC],
        poolAddress: '0xc25099792e9349c7dd09759744ea681c7de2cb66', // tBTC,
        gasSchedule: 482e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].pBTC, TOKENS[ChainId.MAINNET].RenBTC, TOKENS[ChainId.MAINNET].WBTC, TOKENS[ChainId.MAINNET].sBTC],
        metaTokens: [TOKENS[ChainId.MAINNET].pBTC],
        poolAddress: '0x7f55dde206dbad629c080068923b36fe9d6bdbef', // pBTC,
        gasSchedule: 503e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].bBTC, TOKENS[ChainId.MAINNET].RenBTC, TOKENS[ChainId.MAINNET].WBTC, TOKENS[ChainId.MAINNET].sBTC],
        metaTokens: [TOKENS[ChainId.MAINNET].bBTC],
        poolAddress: '0x071c661b4deefb59e2a3ddb20db036821eee8f4b', // bBTC,
        gasSchedule: 497e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].oBTC, TOKENS[ChainId.MAINNET].RenBTC, TOKENS[ChainId.MAINNET].WBTC, TOKENS[ChainId.MAINNET].sBTC],
        metaTokens: [TOKENS[ChainId.MAINNET].oBTC],
        poolAddress: '0xd81da8d904b52208541bade1bd6595d8a251f8dd', // oBTC,
        gasSchedule: 488e3,
      },
    ],
    [ChainId.MATIC]: [
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MATIC].DAI, TOKENS[ChainId.MATIC].USDC, TOKENS[ChainId.MATIC].USDT],
        metaTokens: undefined,
        poolAddress: '0x445fe580ef8d70ff569ab36e80c647af338db351', // aave,
        gasSchedule: 300e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MATIC].amDAI, TOKENS[ChainId.MATIC].amUSDC, TOKENS[ChainId.MATIC].amUSDT],
        metaTokens: undefined,
        poolAddress: '0x445fe580ef8d70ff569ab36e80c647af338db351', // aave,
        gasSchedule: 150e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MATIC].WBTC, TOKENS[ChainId.MATIC].renBTC],
        metaTokens: undefined,
        poolAddress: '0xc2d95eef97ec6c17551d45e77b590dc1f9117c67', // ren,
        gasSchedule: 350e3,
      },
    ],
  },
  [BridgeSource.CurveV2]: {
    [ChainId.MAINNET]: [
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_v2,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_v2,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].USDT, TOKENS[ChainId.MAINNET].WBTC, TOKENS[ChainId.MAINNET].WETH],
        metaTokens: undefined,
        poolAddress: '0x80466c64868e1ab14a1ddf27a676c3fcbe638fe5', // tricrypto
        gasSchedule: 300e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_v2,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_v2,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].USDT, TOKENS[ChainId.MAINNET].WBTC, TOKENS[ChainId.MAINNET].WETH],
        metaTokens: undefined,
        poolAddress: '0xd51a44d3fae010294c616388b506acda1bfaae46', // tricrypto2
        gasSchedule: 300e3,
      },
    ],
    [ChainId.MATIC]: [
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying_v2,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying_v2,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MATIC].DAI, TOKENS[ChainId.MATIC].USDC, TOKENS[ChainId.MATIC].USDT, TOKENS[ChainId.MATIC].WBTC, TOKENS[ChainId.MATIC].WETH],
        metaTokens: [TOKENS[ChainId.MATIC].WBTC, TOKENS[ChainId.MATIC].WETH],
        poolAddress: '0x3fcd5de6a9fc8a99995c406c77dda3ed7e406f81', // atricrypto
        gasSchedule: 300e3,
      },
    ],
  },
  [BridgeSource.Swerve]: {
    [ChainId.MAINNET]: [
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].DAI, TOKENS[ChainId.MAINNET].USDC, TOKENS[ChainId.MAINNET].USDT, TOKENS[ChainId.MAINNET].TUSD],
        metaTokens: undefined,
        poolAddress: '0x329239599afb305da0a2ec69c58f8a6697f9f88d', // y
        gasSchedule: 140e3,
      },
    ],
  },
  [BridgeSource.SnowSwap]: {
    [ChainId.MAINNET]: [
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].yUSD, TOKENS[ChainId.MAINNET].ybCRV],
        metaTokens: undefined,
        poolAddress: '0xbf7ccd6c446acfcc5df023043f2167b62e81899b', // yUSD
        gasSchedule: 990e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].yCRV, TOKENS[ChainId.MAINNET].bCRV],
        metaTokens: undefined,
        poolAddress: '0xbf7ccd6c446acfcc5df023043f2167b62e81899b', // yUSD
        gasSchedule: 990e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].yDAI, TOKENS[ChainId.MAINNET].yUSDC, TOKENS[ChainId.MAINNET].yUSDT, TOKENS[ChainId.MAINNET].yTUSD],
        metaTokens: undefined,
        poolAddress: '0x4571753311e37ddb44faa8fb78a6df9a6e3c6c0b',
        gasSchedule: 1490e3,
      },
    ],
  },
  [BridgeSource.Nerve]: {
    [ChainId.BSC]: [
      {
        exchangeFunctionSelector: CurveFunctionSelectors.swap,
        sellQuoteFunctionSelector: CurveFunctionSelectors.calculateSwap,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.BSC].BUSD, TOKENS[ChainId.BSC].USDT, TOKENS[ChainId.BSC].USDC],
        metaTokens: undefined,
        poolAddress: '0x1b3771a66ee31180906972580ade9b81afc5fcdc', // 3pool
        gasSchedule: 140e3,
      },
    ],
  },
  [BridgeSource.Belt]: {
    [ChainId.BSC]: [
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.BSC].DAI, TOKENS[ChainId.BSC].USDC, TOKENS[ChainId.BSC].USDT, TOKENS[ChainId.BSC].BUSD],
        metaTokens: undefined,
        poolAddress: '0xf16d312d119c13dd27fd0dc814b0bcdcaaa62dfd', // vPool
        gasSchedule: 4490e3,
      },
    ],
  },
  [BridgeSource.Ellipsis]: {
    [ChainId.BSC]: [
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.BSC].BUSD, TOKENS[ChainId.BSC].USDC, TOKENS[ChainId.BSC].USDT],
        metaTokens: undefined,
        poolAddress: '0x160caed03795365f3a589f10c379ffa7d75d4e76', // 3pool
        gasSchedule: 140e3,
      },
    ],
  },
  [BridgeSource.Smoothy]: {
    [ChainId.MAINNET]: [
      {
        exchangeFunctionSelector: CurveFunctionSelectors.swap_uint256,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_swap_amount,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [
          TOKENS[ChainId.MAINNET].USDT,
          TOKENS[ChainId.MAINNET].USDC,
          TOKENS[ChainId.MAINNET].DAI,
          TOKENS[ChainId.MAINNET].TUSD,
          TOKENS[ChainId.MAINNET].sUSD,
          TOKENS[ChainId.MAINNET].BUSD,
          TOKENS[ChainId.MAINNET].PAX,
          TOKENS[ChainId.MAINNET].GUSD,
        ],
        metaTokens: undefined,
        poolAddress: '0xe5859f4efc09027a9b718781dcb2c6910cac6e91', // syUSD,
        gasSchedule: 190e3,
      },
    ],
    [ChainId.BSC]: [
      {
        exchangeFunctionSelector: CurveFunctionSelectors.swap_uint256,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_swap_amount,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.BSC].BUSD, TOKENS[ChainId.BSC].USDT, TOKENS[ChainId.BSC].USDC, TOKENS[ChainId.BSC].DAI, TOKENS[ChainId.BSC].PAX, TOKENS[ChainId.BSC].UST],
        metaTokens: undefined,
        poolAddress: '0xe5859f4efc09027a9b718781dcb2c6910cac6e91', // syUSD,
        gasSchedule: 90e3,
      },
    ],
  },
  [BridgeSource.Saddle]: {
    [ChainId.MAINNET]: [
      {
        exchangeFunctionSelector: CurveFunctionSelectors.swap,
        sellQuoteFunctionSelector: CurveFunctionSelectors.calculateSwap,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].DAI, TOKENS[ChainId.MAINNET].USDC, TOKENS[ChainId.MAINNET].USDT],
        metaTokens: undefined,
        poolAddress: '0x3911f80530595fbd01ab1516ab61255d75aeb066', // stables,
        gasSchedule: 150e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.swap,
        sellQuoteFunctionSelector: CurveFunctionSelectors.calculateSwap,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].tBTC, TOKENS[ChainId.MAINNET].WBTC, TOKENS[ChainId.MAINNET].RenBTC, TOKENS[ChainId.MAINNET].sBTC],
        metaTokens: undefined,
        poolAddress: '0x4f6a43ad7cba042606decaca730d4ce0a57ac62e', // bitcoins,
        gasSchedule: 150e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.swap,
        sellQuoteFunctionSelector: CurveFunctionSelectors.calculateSwap,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].WETH, TOKENS[ChainId.MAINNET].alETH, TOKENS[ChainId.MAINNET].sETH],
        metaTokens: undefined,
        poolAddress: '0xa6018520eaacc06c30ff2e1b3ee2c7c22e64196a', // alETH,
        gasSchedule: 200e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.swap,
        sellQuoteFunctionSelector: CurveFunctionSelectors.calculateSwap,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].alUSD, TOKENS[ChainId.MAINNET].FEI, TOKENS[ChainId.MAINNET].FRAX, TOKENS[ChainId.MAINNET].LUSD],
        metaTokens: undefined,
        poolAddress: '0xc69ddcd4dfef25d8a793241834d4cc4b3668ead6', // d4,
        gasSchedule: 150e3,
      },
    ],
  },
  [BridgeSource.XSigma]: {
    [ChainId.MAINNET]: [
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MAINNET].DAI, TOKENS[ChainId.MAINNET].USDC, TOKENS[ChainId.MAINNET].USDT],
        metaTokens: undefined,
        poolAddress: '0x3333333acdedbbc9ad7bda0876e60714195681c5', // Stable
        gasSchedule: 150e3,
      },
    ],
  },
  [BridgeSource.FirebirdOneSwap]: {
    [ChainId.BSC]: [
      {
        exchangeFunctionSelector: CurveFunctionSelectors.swap,
        sellQuoteFunctionSelector: CurveFunctionSelectors.calculateSwap,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.BSC].BUSD, TOKENS[ChainId.BSC].USDT, TOKENS[ChainId.BSC].DAI, TOKENS[ChainId.BSC].USDC],
        metaTokens: undefined,
        poolAddress: '0x01c9475dbd36e46d1961572c8de24b74616bae9e', // oneswap,
        gasSchedule: 100e3,
      },
    ],
    [ChainId.MATIC]: [
      {
        exchangeFunctionSelector: CurveFunctionSelectors.swap,
        sellQuoteFunctionSelector: CurveFunctionSelectors.calculateSwap,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MATIC].DAI, TOKENS[ChainId.MATIC].USDC, TOKENS[ChainId.MATIC].USDT],
        metaTokens: undefined,
        poolAddress: '0x01c9475dbd36e46d1961572c8de24b74616bae9e', // oneswap,
        gasSchedule: 100e3,
      },
    ],
  },
  [BridgeSource.IronSwap]: {
    [ChainId.MATIC]: [
      {
        exchangeFunctionSelector: CurveFunctionSelectors.swap,
        sellQuoteFunctionSelector: CurveFunctionSelectors.calculateSwap,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.MATIC].USDC, TOKENS[ChainId.MATIC].USDT, TOKENS[ChainId.MATIC].DAI],
        metaTokens: undefined,
        poolAddress: '0x837503e8a8753ae17fb8c8151b8e6f586defcb57', // is3usd,
        gasSchedule: 150e3,
      },
    ],
  },
  [BridgeSource.ACryptos]: {
    [ChainId.BSC]: [
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.BSC].BUSD, TOKENS[ChainId.BSC].USDT, TOKENS[ChainId.BSC].DAI, TOKENS[ChainId.BSC].USDC],
        metaTokens: undefined,
        poolAddress: '0xb3f0c9ea1f05e312093fdb031e789a756659b0ac', // acs4usd
        gasSchedule: 145e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.BSC].VAI, TOKENS[ChainId.BSC].BUSD, TOKENS[ChainId.BSC].USDT, TOKENS[ChainId.BSC].DAI, TOKENS[ChainId.BSC].USDC],
        metaTokens: [TOKENS[ChainId.BSC].VAI],
        poolAddress: '0x191409d5a4effe25b0f4240557ba2192d18a191e', // acs4vai
        gasSchedule: 300e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange_underlying,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy_underlying,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.BSC].UST, TOKENS[ChainId.BSC].BUSD, TOKENS[ChainId.BSC].USDT, TOKENS[ChainId.BSC].DAI, TOKENS[ChainId.BSC].USDC],
        metaTokens: [TOKENS[ChainId.BSC].UST],
        poolAddress: '0x99c92765efc472a9709ced86310d64c4573c4b77', // acs4ust
        gasSchedule: 300e3,
      },
      {
        exchangeFunctionSelector: CurveFunctionSelectors.exchange,
        sellQuoteFunctionSelector: CurveFunctionSelectors.get_dy,
        buyQuoteFunctionSelector: CurveFunctionSelectors.None,
        tokens: [TOKENS[ChainId.BSC].BTCB, TOKENS[ChainId.BSC].renBTC, TOKENS[ChainId.BSC].pBTC],
        metaTokens: undefined,
        poolAddress: '0xbe7caa236544d1b9a0e7f91e94b9f5bfd3b5ca81', // acs3btc
        gasSchedule: 145e3,
      },
    ],
  },
};

export const SHELL_LIKE_POOLS: { [source in BridgeSource]?: { [chainId in ChainId]?: { pool: string, tokens: string[] }[] } } = {
  [BridgeSource.Shell]: {
    [ChainId.MAINNET]: [
      {
        pool: '0x8f26d7bab7a73309141a291525c965ecdea7bf42',
        tokens: [TOKENS[ChainId.MAINNET].USDC, TOKENS[ChainId.MAINNET].USDT, TOKENS[ChainId.MAINNET].sUSD, TOKENS[ChainId.MAINNET].DAI],
      },
      {
        pool: '0xc2d019b901f8d4fdb2b9a65b5d226ad88c66ee8d',
        tokens: [TOKENS[ChainId.MAINNET].RenBTC, TOKENS[ChainId.MAINNET].WBTC, TOKENS[ChainId.MAINNET].sBTC],
      }
    ],
  },
  [BridgeSource.Component]: {
    [ChainId.MAINNET]: [
      {
        pool: '0x49519631b404e06ca79c9c7b0dc91648d86f08db',
        tokens: [TOKENS[ChainId.MAINNET].USDP, TOKENS[ChainId.MAINNET].USDC, TOKENS[ChainId.MAINNET].USDT],
      },
      {
        pool: '0x6477960dd932d29518d7e8087d5ea3d11e606068',
        tokens: [TOKENS[ChainId.MAINNET].USDP, TOKENS[ChainId.MAINNET].DAI, TOKENS[ChainId.MAINNET].sUSD],
      }
    ],
  },
  [BridgeSource.MStable]: {
    [ChainId.MAINNET]: [
      {
        pool: '0xe2f2a5c287993345a840db3b0845fbc70f5935a5',
        tokens: [TOKENS[ChainId.MAINNET].DAI, TOKENS[ChainId.MAINNET].USDC, TOKENS[ChainId.MAINNET].USDT],
      },
      {
        pool: '0x945facb997494cc2570096c74b5f66a3507330a1',
        tokens: [TOKENS[ChainId.MAINNET].WBTC, TOKENS[ChainId.MAINNET].RenBTC, TOKENS[ChainId.MAINNET].sBTC],
      }
    ],
    [ChainId.MATIC]: [
      {
        pool: '0xe840b73e5287865eec17d250bfb1536704b43b21',
        tokens: [TOKENS[ChainId.MATIC].DAI, TOKENS[ChainId.MATIC].USDC, TOKENS[ChainId.MATIC].USDT],
      }
    ],
  },
};

export const MOONISWAP_REGISTRIES: { [chainId in ChainId]?: string[] } = {
  [ChainId.MAINNET]: [
    '0x71cd6666064c3a1354a3b4dca5fa1e2d3ee7d303',
    '0xc4a8b7e29e3c8ec560cd4945c1cf3461a85a148d',
    '0xbaf9a5d4b0052359326a6cdab54babaa3a3a9643',
  ],
  [ChainId.BSC]: [
    '0xd41b24bba51fac0e4827b6f94c0d6ddeb183cd64',
  ],
};

export const MOONISWAP_LIQUIDITY_PROVIDER: { [chainId in ChainId]?: string } = {
  [ChainId.MAINNET]: '0xa2033d6ba88756ce6a87584d69dc87bda9a4f889',
  [ChainId.ROPSTEN]: '0x87e0393aee0fb8c10b8653c6507c182264fe5a34',
};

/**
 * Balancer pool settings
 */
export const BALANCER_TOP_POOLS_FETCHED = 250;
export const BALANCER_MAX_POOLS_FETCHED = 3;
export const BALANCER_V2_VAULT_ADDRESS: { [chainId in ChainId]?: string } = {
  [ChainId.MAINNET]: '0xba12222222228d8ba445958a75a0704d566bf2c8',
  [ChainId.MATIC]: '0xba12222222228d8ba445958a75a0704d566bf2c8',
};
export const BALANCER_SUBGRAPH_URL: { [chainId in ChainId]?: string } = {
  [ChainId.MAINNET]: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer'
};
export const BALANCER_V2_SUBGRAPH_URL: { [chainId in ChainId]?: string } = {
  [ChainId.MAINNET]: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-v2',
  [ChainId.MATIC]: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-polygon-v2',
};
export const CREAM_SUBGRAPH_URL: { [chainId in ChainId]?: string } = {
  [ChainId.MAINNET]: 'https://api.thegraph.com/subgraphs/name/alexkroeger/creamfinancepools'
};

export const DODO_CONFIG: { [chainId in ChainId]?: { helper: string; registry: string } } = {
  [ChainId.MAINNET]: {
    helper: '0x533da777aedce766ceae696bf90f8541a4ba80eb',
    registry: '0x3a97247df274a17c59a3bd12735ea3fcdfb49950',
  },
  [ChainId.BSC]: {
    helper: '0x0f859706aee7fcf61d5a8939e8cb9dbb6c1eda33',
    registry: '0xca459456a45e300aa7ef447dbb60f87cccb42828',
  },
  [ChainId.MATIC]: {
    helper: '0xdfaf9584f5d229a9dbe5978523317820a8897c5a',
    registry: '0x357c5e9cfa8b834edcef7c7aabd8f9db09119d11',
  },
};
export const DODO_V2_FACTORIES: { [chainId in ChainId]?: string[] } = {
  [ChainId.MAINNET]: [
    '0x6b4fa0bc61eddc928e0df9c7f01e407bfcd3e5ef', // Private Pool
    '0x72d220ce168c4f361dd4dee5d826a01ad8598f6c', // Vending Machine
    '0x6fddb76c93299d985f4d3fc7ac468f9a168577a4', // Stability Pool
  ],
  [ChainId.BSC]: [
    '0xafe0a75dffb395eaabd0a7e1bbbd0b11f8609eef', // Private Pool
    '0x790b4a80fb1094589a3c0efc8740aa9b0c1733fb', // Vending Machine
    '0x0fb9815938ad069bf90e14fe6c596c514bede767', // Stability Pool
  ],
  [ChainId.MATIC]: [
    '0x95e887adf9eaa22cc1c6e3cb7f07adc95b4b25a8', // Private Pool
    '0x79887f65f83bdf15bcc8736b5e5bcdb48fb8fe13', // Vending Machine
    '0x43c49f8dd240e1545f147211ec9f917376ac1e87', // Stability Pool
  ],
};
export const DODO_V2_MAX_POOLS_QUERIED = 3;

export const BANCOR_REGISTRY: { [chainId in ChainId]?: string } = {
  [ChainId.MAINNET]: '0x52ae12abe5d8bd778bd5397f99ca900624cfadd4',
};

export const LINKSWAP_ROUTER: { [chainId in ChainId]?: string } = {
  [ChainId.MAINNET]: '0xa7ece0911fe8c60bff9e99f8fafcdbe56e07aff1',
};

export const MAKER_PSM_CONFIG: { [chainId in ChainId]?: MakerPsmSettings } = {
  [ChainId.MAINNET]: {
    // Currently only USDC is supported
    gemTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    ilkIdentifier: formatBytes32String('PSM-USDC-A'),
    psmAddress: '0x89b78cfa322f6c5de0abceecab66aee45393cc5a',
  }
};

export const LIDO_POOLS_CONFIG: { [chainId in ChainId]?: { stEthToken: string; wethToken: string } } = {
  [ChainId.MAINNET]: {
    stEthToken: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
    wethToken: TOKENS[ChainId.MAINNET].WETH,
  }
};

export const CLIPPER_POOLS_CONFIG: { [chainId in ChainId]?: { poolAddress: string; tokens: string[] } } = {
  [ChainId.MAINNET]: {
    poolAddress: '0xe82906b6b1b04f631d126c974af57a3a7b6a99d9',
    tokens: [
      TOKENS[ChainId.MAINNET].WETH, // technically ETH but our sampler and mixin handle this
      TOKENS[ChainId.MAINNET].WBTC,
      TOKENS[ChainId.MAINNET].USDC,
      TOKENS[ChainId.MAINNET].USDT,
      TOKENS[ChainId.MAINNET].DAI,
    ],
  },
};
