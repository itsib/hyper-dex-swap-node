import { BytesLike } from 'ethers';
import { AbiCoder, ParamType } from 'ethers/lib/utils';
import { BridgeSource } from '../types';

export interface AbiDataItem {
  name: string;
  type: string;
  internalType?: string;
  components?: AbiDataItem[];
}

export interface Result extends ReadonlyArray<any> {
  readonly [key: string]: any;
}

export class SimpleAbiCoder {

  private readonly _abiCoder: AbiCoder;

  private readonly _types: ParamType[];

  constructor(abi: AbiDataItem | AbiDataItem[]) {
    this._abiCoder = new AbiCoder();
    this._types = (Array.isArray(abi) ? abi : [abi]).map(type => ParamType.from(type));
  }

  encode(values: ReadonlyArray<any>): string {
    return this._abiCoder.encode(this._types, values);
  }

  decode(data: BytesLike, loose?: boolean): Result {
    return this._abiCoder.decode(this._types, data, loose);
  }
}

export const POOL_ADDRESS_ABI_CODER = new SimpleAbiCoder([{ name: 'poolAddress', type: 'address' }]);

export const CURVE_LIQUIDITY_PROVIDER_DATA_ABI_CODER = new SimpleAbiCoder([
  { name: 'curveAddress', type: 'address' },
  { name: 'exchangeFunctionSelector', type: 'bytes4' },
  { name: 'fromCoinIdx', type: 'int128' },
  { name: 'toCoinIdx', type: 'int128' },
]);

export const MULTIPLEX_UNISWAP_ABI_CODER = new SimpleAbiCoder([
  { name: 'tokens', type: 'address[]' },
  { name: 'isSushi', type: 'bool' },
]);

export const MULTIPLEX_PLP_ABI_CODER = new SimpleAbiCoder([
  { name: 'provider', type: 'address' },
  { name: 'auxiliaryData', type: 'bytes' },
]);

export const MULTIPLEX_TRANSFORM_ABI_CODER = new SimpleAbiCoder([
  {
    name: 'transformations',
    type: 'tuple[]',
    components: [
      { name: 'deploymentNonce', type: 'uint32' },
      { name: 'data', type: 'bytes' },
    ],
  },
  { name: 'ethValue', type: 'uint256' },
]);

/**
 * ABI encoder for `WethTransformer.TransformData`
 */
export const WETH_TRANSFORMER_ABI_CODER = new SimpleAbiCoder([
  {
    name: 'data',
    type: 'tuple',
    components: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
  },
]);

/**
 * ABI encoder for `PayTakerTransformer.TransformData`
 */
export const PAY_TAKER_TRANSFORMER_ABI_CODER = new SimpleAbiCoder([
  {
    name: 'data',
    type: 'tuple',
    components: [
      { name: 'tokens', type: 'address[]' },
      { name: 'amounts', type: 'uint256[]' },
    ],
  },
]);

/**
 * ABI encoder for `FillQuoteTransformer.TransformData`
 */
export const FILL_QUOTE_TRANSFORMER_ABI_CODER = new SimpleAbiCoder([
  {
    name: 'data',
    type: 'tuple',
    components: [
      { name: 'side', type: 'uint8' },
      { name: 'sellToken', type: 'address' },
      { name: 'buyToken', type: 'address' },
      {
        name: 'bridgeOrders',
        type: 'tuple[]',
        components: [
          { name: 'source', type: 'bytes32' },
          { name: 'takerTokenAmount', type: 'uint256' },
          { name: 'makerTokenAmount', type: 'uint256' },
          { name: 'bridgeData', type: 'bytes' },
        ],
      },
      {
        name: 'limitOrders',
        type: 'tuple[]',
        components: [
          {
            name: 'order',
            type: 'tuple',
            components: [
              { type: 'address', name: 'makerToken' },
              { type: 'address', name: 'takerToken' },
              { type: 'uint128', name: 'makerAmount' },
              { type: 'uint128', name: 'takerAmount' },
              { type: 'uint128', name: 'takerTokenFeeAmount' },
              { type: 'address', name: 'maker' },
              { type: 'address', name: 'taker' },
              { type: 'address', name: 'sender' },
              { type: 'address', name: 'feeRecipient' },
              { type: 'bytes32', name: 'pool' },
              { type: 'uint64', name: 'expiry' },
              { type: 'uint256', name: 'salt' },
            ],
          },
          {
            name: 'signature',
            type: 'tuple',
            components: [
              { name: 'signatureType', type: 'uint8' },
              { name: 'v', type: 'uint8' },
              { name: 'r', type: 'bytes32' },
              { name: 's', type: 'bytes32' },
            ],
          },
          { name: 'maxTakerTokenFillAmount', type: 'uint256' },
        ],
      },
      {
        name: 'rfqOrders',
        type: 'tuple[]',
        components: [
          {
            name: 'order',
            type: 'tuple',
            components: [
              { type: 'address', name: 'makerToken' },
              { type: 'address', name: 'takerToken' },
              { type: 'uint128', name: 'makerAmount' },
              { type: 'uint128', name: 'takerAmount' },
              { type: 'address', name: 'maker' },
              { type: 'address', name: 'taker' },
              { type: 'address', name: 'txOrigin' },
              { type: 'bytes32', name: 'pool' },
              { type: 'uint64', name: 'expiry' },
              { type: 'uint256', name: 'salt' },
            ],
          },
          {
            name: 'signature',
            type: 'tuple',
            components: [
              { name: 'signatureType', type: 'uint8' },
              { name: 'v', type: 'uint8' },
              { name: 'r', type: 'bytes32' },
              { name: 's', type: 'bytes32' },
            ],
          },
          { name: 'maxTakerTokenFillAmount', type: 'uint256' },
        ],
      },
      { name: 'fillSequence', type: 'uint8[]' },
      { name: 'fillAmount', type: 'uint256' },
      { name: 'refundReceiver', type: 'address' },
    ],
  },
]);

export const MAKER_PSM_ABI_CODER = new SimpleAbiCoder([
  { name: 'psmAddress', type: 'address' },
  { name: 'gemTokenAddress', type: 'address' },
]);

export const BALANCER_V2_ABI_CODER = new SimpleAbiCoder([
  { name: 'vault', type: 'address' },
  { name: 'poolId', type: 'bytes32' },
]);

export const ROUTER_ADDRESS_PATH_ABI_CODER = new SimpleAbiCoder([
  { name: 'router', type: 'address' },
  { name: 'path', type: 'address[]' },
]);

export const TOKEN_ADDRESS_ABI_CODER = new SimpleAbiCoder([{ name: 'tokenAddress', type: 'address' }]);

export const BRIDGE_ABI_CODER: { [key in Exclude<BridgeSource, BridgeSource.MultiHop | BridgeSource.MultiBridge>]: SimpleAbiCoder } = {
  [BridgeSource.LiquidityProvider]: new SimpleAbiCoder([
    { name: 'provider', type: 'address' },
    { name: 'data', type: 'bytes' },
  ]),
  [BridgeSource.Kyber]: new SimpleAbiCoder([
    { name: 'kyberNetworkProxy', type: 'address' },
    { name: 'hint', type: 'bytes' },
  ]),
  [BridgeSource.Dodo]: new SimpleAbiCoder([
    { name: 'helper', type: 'address' },
    { name: 'poolAddress', type: 'address' },
    { name: 'isSellBase', type: 'bool' },
  ]),
  [BridgeSource.DodoV2]: new SimpleAbiCoder([
    { name: 'poolAddress', type: 'address' },
    { name: 'isSellBase', type: 'bool' },
  ]),
  // Curve like
  [BridgeSource.Curve]: CURVE_LIQUIDITY_PROVIDER_DATA_ABI_CODER,
  [BridgeSource.CurveV2]: CURVE_LIQUIDITY_PROVIDER_DATA_ABI_CODER,
  [BridgeSource.Swerve]: CURVE_LIQUIDITY_PROVIDER_DATA_ABI_CODER,
  [BridgeSource.SnowSwap]: CURVE_LIQUIDITY_PROVIDER_DATA_ABI_CODER,
  [BridgeSource.Nerve]: CURVE_LIQUIDITY_PROVIDER_DATA_ABI_CODER,
  [BridgeSource.Belt]: CURVE_LIQUIDITY_PROVIDER_DATA_ABI_CODER,
  [BridgeSource.Ellipsis]: CURVE_LIQUIDITY_PROVIDER_DATA_ABI_CODER,
  [BridgeSource.Smoothy]: CURVE_LIQUIDITY_PROVIDER_DATA_ABI_CODER,
  [BridgeSource.Saddle]: CURVE_LIQUIDITY_PROVIDER_DATA_ABI_CODER,
  [BridgeSource.XSigma]: CURVE_LIQUIDITY_PROVIDER_DATA_ABI_CODER,
  [BridgeSource.FirebirdOneSwap]: CURVE_LIQUIDITY_PROVIDER_DATA_ABI_CODER,
  [BridgeSource.IronSwap]: CURVE_LIQUIDITY_PROVIDER_DATA_ABI_CODER,
  [BridgeSource.ACryptos]: CURVE_LIQUIDITY_PROVIDER_DATA_ABI_CODER,
  // UniswapV2 like, (router, address[])
  [BridgeSource.Bancor]: ROUTER_ADDRESS_PATH_ABI_CODER,
  [BridgeSource.UniswapV2]: ROUTER_ADDRESS_PATH_ABI_CODER,
  [BridgeSource.SushiSwap]: ROUTER_ADDRESS_PATH_ABI_CODER,
  [BridgeSource.CryptoCom]: ROUTER_ADDRESS_PATH_ABI_CODER,
  [BridgeSource.Linkswap]: ROUTER_ADDRESS_PATH_ABI_CODER,
  [BridgeSource.ShibaSwap]: ROUTER_ADDRESS_PATH_ABI_CODER,
  // BSC
  [BridgeSource.PancakeSwap]: ROUTER_ADDRESS_PATH_ABI_CODER,
  [BridgeSource.PancakeSwapV2]: ROUTER_ADDRESS_PATH_ABI_CODER,
  [BridgeSource.BakerySwap]: ROUTER_ADDRESS_PATH_ABI_CODER,
  [BridgeSource.ApeSwap]: ROUTER_ADDRESS_PATH_ABI_CODER,
  [BridgeSource.CafeSwap]: ROUTER_ADDRESS_PATH_ABI_CODER,
  [BridgeSource.CheeseSwap]: ROUTER_ADDRESS_PATH_ABI_CODER,
  [BridgeSource.JulSwap]: ROUTER_ADDRESS_PATH_ABI_CODER,
  [BridgeSource.WaultSwap]: ROUTER_ADDRESS_PATH_ABI_CODER,
  // Polygon
  [BridgeSource.QuickSwap]: ROUTER_ADDRESS_PATH_ABI_CODER,
  [BridgeSource.ComethSwap]: ROUTER_ADDRESS_PATH_ABI_CODER,
  [BridgeSource.Dfyn]: ROUTER_ADDRESS_PATH_ABI_CODER,
  [BridgeSource.Polydex]: ROUTER_ADDRESS_PATH_ABI_CODER,
  [BridgeSource.JetSwap]: ROUTER_ADDRESS_PATH_ABI_CODER,
  // Generic pools
  [BridgeSource.Shell]: POOL_ADDRESS_ABI_CODER,
  [BridgeSource.Component]: POOL_ADDRESS_ABI_CODER,
  [BridgeSource.Mooniswap]: POOL_ADDRESS_ABI_CODER,
  [BridgeSource.Eth2Dai]: POOL_ADDRESS_ABI_CODER,
  [BridgeSource.MStable]: POOL_ADDRESS_ABI_CODER,
  [BridgeSource.Balancer]: POOL_ADDRESS_ABI_CODER,
  [BridgeSource.Cream]: POOL_ADDRESS_ABI_CODER,
  [BridgeSource.Uniswap]: POOL_ADDRESS_ABI_CODER,
  // Custom integrations
  [BridgeSource.MakerPsm]: MAKER_PSM_ABI_CODER,
  [BridgeSource.BalancerV2]: BALANCER_V2_ABI_CODER,
  [BridgeSource.UniswapV3]: new SimpleAbiCoder([
    { name: 'router', type: 'address' },
    { name: 'path', type: 'bytes' },
  ]),
  [BridgeSource.KyberDmm]: new SimpleAbiCoder([
    { name: 'router', type: 'address' },
    { name: 'poolsPath', type: 'address[]' },
    { name: 'tokenAddressPath', type: 'address[]' },
  ]),
  [BridgeSource.Lido]: new SimpleAbiCoder([{ name: 'stEthTokenAddress', type: 'address' }]),
  [BridgeSource.Clipper]: new SimpleAbiCoder([
    { name: 'provider', type: 'address' },
    { name: 'data', type: 'bytes' },
  ]),
};
