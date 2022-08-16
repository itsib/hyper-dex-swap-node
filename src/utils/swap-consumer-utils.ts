import { utils } from 'ethers';
import { NULL_ADDRESS, NULL_BYTES } from '../constants';
import {
  BalancerFillData,
  BalancerV2FillData,
  BancorFillData,
  BridgeProtocol,
  BridgeSource,
  CurveFillData,
  DexOrder,
  DodoFillData,
  FinalUniswapV3FillData,
  GenericRouterFillData,
  KyberDmmFillData,
  KyberFillData,
  LidoFillData,
  LiquidityProviderFillData,
  MakerPsmFillData,
  MarketBuySwapQuote,
  MarketSellSwapQuote,
  MarketSide,
  MooniswapFillData,
  ShellFillData,
  SwapQuote,
  UniswapV2FillData,
} from '../types';
import { encode, intToHex } from './bytes-utils';
import { BRIDGE_ABI_CODER, TOKEN_ADDRESS_ABI_CODER } from './simple-abi-coder';

export const getMaxQuoteSlippageRate = (quote: MarketBuySwapQuote | MarketSellSwapQuote): number => {
  if (quote.side === MarketSide.Buy) {
    // (worstCaseTaker - bestCaseTaker) / bestCaseTaker
    // where worstCaseTaker >= bestCaseTaker
    return quote.worstCaseQuoteInfo.sellAmount.toBig()
      .minus(quote.bestCaseQuoteInfo.sellAmount.toBig())
      .div(quote.bestCaseQuoteInfo.sellAmount.toBig())
      .toNumber();
  }
  // (bestCaseMaker - worstCaseMaker) / bestCaseMaker
  // where bestCaseMaker >= worstCaseMaker
  return quote.bestCaseQuoteInfo.buyAmount.toBig()
    .minus(quote.worstCaseQuoteInfo.buyAmount.toBig())
    .div(quote.bestCaseQuoteInfo.buyAmount.toBig())
    .toNumber();
};

export const slipOrders = (quote: MarketSellSwapQuote | MarketBuySwapQuote): DexOrder[] => {
  const slippage = getMaxQuoteSlippageRate(quote);
  if (!slippage) {
    return quote.orders;
  }
  return quote.orders.map(order => {
    return {
      ...order,
      ...(quote.side === MarketSide.Sell
        ? { buyAmount: order.buyAmount.toBig().times(1 - slippage).round(0, 0).toBigNumber() }
        : { sellAmount: order.sellAmount.toBig().times(1 + slippage).round(0, 3).toBigNumber() }),
    };
  });
};

/**
 * Returns true iff a quote can be filled via a VIP feature.
 */
export const isDirectSwapCompatible = (quote: SwapQuote, directSources: BridgeSource[]): boolean => {
  // Must be a single order.
  if (quote.orders.length !== 1) {
    return false;
  }
  const order = quote.orders[0];

  return directSources.includes(order.source);
};

export const getBridgeSourceToBridgeProtocol = (source: BridgeSource): string => {
  switch (source) {
    case BridgeSource.Balancer:
      return encodeBridgeSourceId(BridgeProtocol.Balancer, 'Balancer');
    case BridgeSource.BalancerV2:
      return encodeBridgeSourceId(BridgeProtocol.BalancerV2, 'BalancerV2');
    case BridgeSource.Bancor:
      return encodeBridgeSourceId(BridgeProtocol.Bancor, 'Bancor');
    // case BridgeSource.CoFiX:
    //    return encodeBridgeSourceId(BridgeProtocol.CoFiX, 'CoFiX');
    case BridgeSource.Curve:
      return encodeBridgeSourceId(BridgeProtocol.Curve, 'Curve');
    case BridgeSource.Cream:
      return encodeBridgeSourceId(BridgeProtocol.Balancer, 'Cream');
    case BridgeSource.CryptoCom:
      return encodeBridgeSourceId(BridgeProtocol.CryptoCom, 'CryptoCom');
    case BridgeSource.Dodo:
      return encodeBridgeSourceId(BridgeProtocol.Dodo, 'Dodo');
    case BridgeSource.Kyber:
      return encodeBridgeSourceId(BridgeProtocol.Kyber, 'Kyber');
    case BridgeSource.LiquidityProvider:
      // "LiquidityProvider" is too long to encode (17 characters).
      return encodeBridgeSourceId(BridgeProtocol.Unknown, 'LP');
    case BridgeSource.MakerPsm:
      return encodeBridgeSourceId(BridgeProtocol.MakerPsm, 'MakerPsm');
    case BridgeSource.Mooniswap:
      return encodeBridgeSourceId(BridgeProtocol.Mooniswap, 'Mooniswap');
    case BridgeSource.MStable:
      return encodeBridgeSourceId(BridgeProtocol.MStable, 'MStable');
    case BridgeSource.Eth2Dai:
      return encodeBridgeSourceId(BridgeProtocol.Oasis, 'Eth2Dai');
    case BridgeSource.Shell:
      return encodeBridgeSourceId(BridgeProtocol.Shell, 'Shell');
    case BridgeSource.SnowSwap:
      return encodeBridgeSourceId(BridgeProtocol.Curve, 'SnowSwap');
    case BridgeSource.SushiSwap:
      return encodeBridgeSourceId(BridgeProtocol.UniswapV2, 'SushiSwap');
    case BridgeSource.Swerve:
      return encodeBridgeSourceId(BridgeProtocol.Curve, 'Swerve');
    case BridgeSource.Uniswap:
      return encodeBridgeSourceId(BridgeProtocol.Uniswap, 'Uniswap');
    case BridgeSource.UniswapV2:
      return encodeBridgeSourceId(BridgeProtocol.UniswapV2, 'UniswapV2');
    case BridgeSource.DodoV2:
      return encodeBridgeSourceId(BridgeProtocol.DodoV2, 'DodoV2');
    case BridgeSource.Linkswap:
      return encodeBridgeSourceId(BridgeProtocol.UniswapV2, 'Linkswap');
    case BridgeSource.PancakeSwap:
      return encodeBridgeSourceId(BridgeProtocol.UniswapV2, 'PancakeSwap');
    case BridgeSource.PancakeSwapV2:
      return encodeBridgeSourceId(BridgeProtocol.UniswapV2, 'PancakeSwapV2');
    case BridgeSource.BakerySwap:
      return encodeBridgeSourceId(BridgeProtocol.UniswapV2, 'BakerySwap');
    case BridgeSource.Nerve:
      return encodeBridgeSourceId(BridgeProtocol.Nerve, 'Nerve');
    case BridgeSource.Belt:
      return encodeBridgeSourceId(BridgeProtocol.Curve, 'Belt');
    case BridgeSource.Ellipsis:
      return encodeBridgeSourceId(BridgeProtocol.Curve, 'Ellipsis');
    case BridgeSource.Component:
      return encodeBridgeSourceId(BridgeProtocol.Shell, 'Component');
    case BridgeSource.Smoothy:
      return encodeBridgeSourceId(BridgeProtocol.Curve, 'Smoothy');
    case BridgeSource.Saddle:
      return encodeBridgeSourceId(BridgeProtocol.Nerve, 'Saddle');
    case BridgeSource.XSigma:
      return encodeBridgeSourceId(BridgeProtocol.Curve, 'xSigma');
    case BridgeSource.ApeSwap:
      return encodeBridgeSourceId(BridgeProtocol.UniswapV2, 'ApeSwap');
    case BridgeSource.CafeSwap:
      return encodeBridgeSourceId(BridgeProtocol.UniswapV2, 'CafeSwap');
    case BridgeSource.CheeseSwap:
      return encodeBridgeSourceId(BridgeProtocol.UniswapV2, 'CheeseSwap');
    case BridgeSource.JulSwap:
      return encodeBridgeSourceId(BridgeProtocol.UniswapV2, 'JulSwap');
    case BridgeSource.UniswapV3:
      return encodeBridgeSourceId(BridgeProtocol.UniswapV3, 'UniswapV3');
    case BridgeSource.KyberDmm:
      return encodeBridgeSourceId(BridgeProtocol.KyberDmm, 'KyberDmm');
    case BridgeSource.QuickSwap:
      return encodeBridgeSourceId(BridgeProtocol.UniswapV2, 'QuickSwap');
    case BridgeSource.ComethSwap:
      return encodeBridgeSourceId(BridgeProtocol.UniswapV2, 'ComethSwap');
    case BridgeSource.Dfyn:
      return encodeBridgeSourceId(BridgeProtocol.UniswapV2, 'Dfyn');
    case BridgeSource.CurveV2:
      return encodeBridgeSourceId(BridgeProtocol.CurveV2, 'CurveV2');
    case BridgeSource.WaultSwap:
      return encodeBridgeSourceId(BridgeProtocol.UniswapV2, 'WaultSwap');
    case BridgeSource.Polydex:
      return encodeBridgeSourceId(BridgeProtocol.UniswapV2, 'Polydex');
    case BridgeSource.FirebirdOneSwap:
      return encodeBridgeSourceId(BridgeProtocol.Nerve, 'FirebirdOneSwap');
    case BridgeSource.Lido:
      return encodeBridgeSourceId(BridgeProtocol.Lido, 'Lido');
    case BridgeSource.ShibaSwap:
      return encodeBridgeSourceId(BridgeProtocol.UniswapV2, 'ShibaSwap');
    case BridgeSource.JetSwap:
      return encodeBridgeSourceId(BridgeProtocol.UniswapV2, 'JetSwap');
    case BridgeSource.IronSwap:
      return encodeBridgeSourceId(BridgeProtocol.Nerve, 'IronSwap');
    case BridgeSource.ACryptos:
      return encodeBridgeSourceId(BridgeProtocol.Curve, 'ACryptoS');
    case BridgeSource.Clipper:
      return encodeBridgeSourceId(BridgeProtocol.Clipper, 'Clipper');
    default:
      throw new Error('NO_BRIDGE_FOR_SOURCE');
  }
};

export const createBridgeDataForBridgeOrder = (order: DexOrder): string => {
  if (order.source === BridgeSource.MultiHop || order.source === BridgeSource.MultiBridge) {
    throw new Error('Invalid order to encode for Bridge Data');
  }
  const encoder = BRIDGE_ABI_CODER[order.source];

  switch (order.source) {
    case BridgeSource.Curve:
    case BridgeSource.CurveV2:
    case BridgeSource.Swerve:
    case BridgeSource.SnowSwap:
    case BridgeSource.Nerve:
    case BridgeSource.Belt:
    case BridgeSource.Ellipsis:
    case BridgeSource.Smoothy:
    case BridgeSource.Saddle:
    case BridgeSource.XSigma:
    case BridgeSource.FirebirdOneSwap:
    case BridgeSource.IronSwap:
    case BridgeSource.ACryptos:
      const curveFillData = (order as DexOrder<CurveFillData>).fillData;
      return encoder.encode([
        curveFillData.pool.poolAddress,
        curveFillData.pool.exchangeFunctionSelector,
        curveFillData.pool.sellTokenIdx,
        curveFillData.pool.buyTokenIdx,
      ]);
    case BridgeSource.Balancer:
    case BridgeSource.Cream:
      const balancerFillData = (order as DexOrder<BalancerFillData>).fillData;
      return encoder.encode([balancerFillData.poolAddress]);
    case BridgeSource.BalancerV2:
      const balancerV2FillData = (order as DexOrder<BalancerV2FillData>).fillData;
      const { vault, poolId } = balancerV2FillData;
      return encoder.encode([vault, poolId]);
    case BridgeSource.Bancor:
      const bancorFillData = (order as DexOrder<BancorFillData>).fillData;
      return encoder.encode([bancorFillData.networkAddress, bancorFillData.path]);
    case BridgeSource.UniswapV2:
    case BridgeSource.SushiSwap:
    case BridgeSource.CryptoCom:
    case BridgeSource.Linkswap:
    case BridgeSource.PancakeSwap:
    case BridgeSource.PancakeSwapV2:
    case BridgeSource.BakerySwap:
    case BridgeSource.ApeSwap:
    case BridgeSource.CafeSwap:
    case BridgeSource.CheeseSwap:
    case BridgeSource.JulSwap:
    case BridgeSource.QuickSwap:
    case BridgeSource.ComethSwap:
    case BridgeSource.Dfyn:
    case BridgeSource.WaultSwap:
    case BridgeSource.Polydex:
    case BridgeSource.ShibaSwap:
    case BridgeSource.JetSwap:
      const uniswapV2FillData = (order as DexOrder<UniswapV2FillData>).fillData;
      return encoder.encode([uniswapV2FillData.router, uniswapV2FillData.tokenAddressPath]);
    case BridgeSource.Kyber:
      const kyberFillData = (order as DexOrder<KyberFillData>).fillData;
      return encoder.encode([kyberFillData.networkProxy, kyberFillData.hint]);
    case BridgeSource.Mooniswap:
      const mooniswapFillData = (order as DexOrder<MooniswapFillData>).fillData;
      return encoder.encode([mooniswapFillData.poolAddress]);
    case BridgeSource.Dodo:
      const dodoFillData = (order as DexOrder<DodoFillData>).fillData;
      return encoder.encode([
        dodoFillData.helperAddress,
        dodoFillData.poolAddress,
        dodoFillData.isSellBase,
      ]);
    case BridgeSource.DodoV2:
      const dodoV2FillData = (order as DexOrder<DodoFillData>).fillData;
      return encoder.encode([dodoV2FillData.poolAddress, dodoV2FillData.isSellBase]);
    case BridgeSource.Shell:
    case BridgeSource.Component:
      const shellFillData = (order as DexOrder<ShellFillData>).fillData;
      return encoder.encode([shellFillData.poolAddress]);
    case BridgeSource.LiquidityProvider:
      const lpFillData = (order as DexOrder<LiquidityProviderFillData>).fillData;
      return encoder.encode([lpFillData.poolAddress, TOKEN_ADDRESS_ABI_CODER.encode([order.sellToken])]);
    case BridgeSource.Uniswap:
      const uniFillData = (order as DexOrder<GenericRouterFillData>).fillData;
      return encoder.encode([uniFillData.router]);
    case BridgeSource.Eth2Dai:
      const oasisFillData = (order as DexOrder<GenericRouterFillData>).fillData;
      return encoder.encode([oasisFillData.router]);
    case BridgeSource.MStable:
      const mStableFillData = (order as DexOrder<GenericRouterFillData>).fillData;
      return encoder.encode([mStableFillData.router]);
    case BridgeSource.MakerPsm:
      const psmFillData = (order as DexOrder<MakerPsmFillData>).fillData;
      return encoder.encode([psmFillData.psmAddress, psmFillData.gemTokenAddress]);
    case BridgeSource.UniswapV3:
      const uniswapV3FillData = (order as DexOrder<FinalUniswapV3FillData>).fillData;
      return encoder.encode([uniswapV3FillData.router, uniswapV3FillData.uniswapPath]);
    case BridgeSource.KyberDmm:
      const kyberDmmFillData = (order as DexOrder<KyberDmmFillData>).fillData;
      return encoder.encode([
        kyberDmmFillData.router,
        kyberDmmFillData.poolsPath,
        kyberDmmFillData.tokenAddressPath,
      ]);
    case BridgeSource.Lido:
      const lidoFillData = (order as DexOrder<LidoFillData>).fillData;
      return encoder.encode([lidoFillData.stEthTokenAddress]);
    case BridgeSource.Clipper:
      const clipperFillData = (order as DexOrder<LiquidityProviderFillData>).fillData;
      return encoder.encode([clipperFillData.poolAddress, NULL_BYTES]);
    default:
      throw new Error('NO_BRIDGE_FOR_SOURCE');
  }
};

/**
 * Packs a bridge protocol ID and an ASCII DEX name into a single byte32.
 */
export const encodeBridgeSourceId = (protocol: BridgeProtocol, name: string): string => {
  const nameBuf = Buffer.from(name);
  if (nameBuf.length > 16) {
    throw new Error(`"${name}" is too long to be a bridge source name (max of 16 ascii chars)`);
  }

  return utils.hexConcat([
    utils.hexZeroPad(utils.hexlify(protocol), 16),
    utils.hexlify(Buffer.from(name)),
  ]).padEnd((32 * 2) + 2, '0');
};

/**
 * Find the nonce for a transformer given its deployer.
 * If `deployer` is the null address, zero will always be returned.
 */
export const findTransformerNonce = (transformer: string, deployer: string = NULL_ADDRESS, maxGuesses: number = 1024): number => {
  if (deployer === NULL_ADDRESS) {
    return 0;
  }
  const lowercaseTransformer = transformer.toLowerCase();
  // Try to guess the nonce.
  for (let nonce = 0; nonce < maxGuesses; ++nonce) {
    const deployedAddress = getTransformerAddress(deployer, nonce);
    if (deployedAddress === lowercaseTransformer) {
      return nonce;
    }
  }
  throw new Error(`${deployer} did not deploy ${transformer}!`);
};

/**
 * Compute the deployed address for a transformer given a deployer and nonce.
 */
export const getTransformerAddress = (deployer: string, nonce: number): string => {
  const encoded = encode([
    utils.arrayify(deployer),
    utils.arrayify(intToHex(nonce), { allowMissingPrefix: true })
  ]);
  return utils.hexlify(utils.keccak256(encoded).slice(26), { allowMissingPrefix: true });
}
