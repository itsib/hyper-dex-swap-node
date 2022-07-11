import { ERC20BridgeSource, OrderPrunerPermittedFeeTypes, SELL_SOURCE_FILTER_BY_CHAIN_ID } from '@0x/asset-swapper';
import { SwapQuoterOpts } from '@0x/asset-swapper/lib/src/types';
import { ContractAddresses } from '@0x/contract-wrappers';
import { HTTPException } from '@tsed/exceptions';
import { inject, injectable } from 'inversify';
import { CONFIG } from '../config';
import { NATIVE_ADDRESS } from '../constants';
import { ChainId, Provider } from '../types';

export interface IOptionsService {
  getSwapQuoterOptions(): Promise<Partial<SwapQuoterOpts>>;
  getWrappedAddress(): Promise<string>;
  getNativeAddress(): Promise<string>;
  getDefaultExcludedSources(): Promise<ERC20BridgeSource[]>;
}

@injectable()
export class OptionsService implements IOptionsService {

  private readonly _nativeAddress: Promise<string>;

  private readonly _contractAddresses: ContractAddresses;

  private readonly _swapQuoterOptions: Promise<Partial<SwapQuoterOpts>>;

  private readonly _defaultExcludedSources: Promise<ERC20BridgeSource[]>;

  constructor(@inject('Provider') private _provider: Provider) {
    this._nativeAddress = new Promise(async (resolve, reject) => {
      const { chainId } = await this._provider.getNetwork();
      if (!(chainId in NATIVE_ADDRESS)) {
        return reject(new HTTPException(500, `Unsupported chain id - ${chainId}`));
      }
      return resolve(NATIVE_ADDRESS[chainId]);
    });

    this._contractAddresses = {
      erc20Proxy: '0x0000000000000000000000000000000000000000',
      erc721Proxy: '0x0000000000000000000000000000000000000000',
      zrxToken: '0x0000000000000000000000000000000000000000',
      etherToken: CONFIG.WRAPPED_NATIVE,
      exchangeV2: '0x0000000000000000000000000000000000000000',
      exchange: '0x0000000000000000000000000000000000000000',
      assetProxyOwner: '0x0000000000000000000000000000000000000000',
      zeroExGovernor: '0x0000000000000000000000000000000000000000',
      forwarder: '0x0000000000000000000000000000000000000000',
      coordinatorRegistry: '0x0000000000000000000000000000000000000000',
      coordinator: '0x0000000000000000000000000000000000000000',
      multiAssetProxy: '0x0000000000000000000000000000000000000000',
      staticCallProxy: '0x0000000000000000000000000000000000000000',
      erc1155Proxy: '0x0000000000000000000000000000000000000000',
      devUtils: '0x0000000000000000000000000000000000000000',
      zrxVault: '0x0000000000000000000000000000000000000000',
      staking: '0x0000000000000000000000000000000000000000',
      stakingProxy: '0x0000000000000000000000000000000000000000',
      erc20BridgeProxy: '0x0000000000000000000000000000000000000000',
      erc20BridgeSampler: '0x0000000000000000000000000000000000000000',
      chaiBridge: '0x0000000000000000000000000000000000000000',
      dydxBridge: '0x0000000000000000000000000000000000000000',
      godsUnchainedValidator: '0x0000000000000000000000000000000000000000',
      broker: '0x0000000000000000000000000000000000000000',
      chainlinkStopLimit: '0x0000000000000000000000000000000000000000',
      maximumGasPrice: '0x0000000000000000000000000000000000000000',
      dexForwarderBridge: '0x0000000000000000000000000000000000000000',
      exchangeProxyGovernor: '0x0000000000000000000000000000000000000000', // 0x4d3e56c56a55d23fc7aa9a9ffad61631cf7d1ae6
      exchangeProxy: CONFIG.EXCHANGE_PROXY,
      exchangeProxyTransformerDeployer: CONFIG.EXCHANGE_PROXY_TRANSFORMER_DEPLOYER,
      exchangeProxyFlashWallet: CONFIG.EXCHANGE_PROXY_FLASH_WALLET,
      exchangeProxyLiquidityProviderSandbox: CONFIG.EXCHANGE_PROXY_LIQUIDITY_PROVIDER_SANDBOX,
      zrxTreasury: '0x0000000000000000000000000000000000000000',
      transformers: {
        wethTransformer: CONFIG.WETH_TRANSFORMER,
        payTakerTransformer: CONFIG.PAY_TAKER_TRANSFORMER,
        affiliateFeeTransformer: CONFIG.AFFILIATE_FEE_TRANSFORMER,
        fillQuoteTransformer: CONFIG.FILL_QUOTE_TRANSFORMER,
        positiveSlippageFeeTransformer: CONFIG.POSITIVE_SLIPPAGE_FEE_TRANSFORMER,
      },
    };

    this._swapQuoterOptions = new Promise<Partial<SwapQuoterOpts>>(async resolve => {
      const { chainId } = await this._provider.getNetwork();

      return resolve({
        chainId,
        expiryBufferMs: CONFIG.QUOTE_ORDER_EXPIRATION_BUFFER_MS,
        permittedOrderFeeTypes: new Set([OrderPrunerPermittedFeeTypes.NoFees]),
        contractAddresses: this._contractAddresses,
      });
    });

    this._defaultExcludedSources = new Promise<ERC20BridgeSource[]>(async resolve => {
      const { chainId } = await this._provider.getNetwork();
      const allERC20BridgeSources = Object.values(ERC20BridgeSource);
      switch (chainId) {
        case ChainId.MAINNET:
          return resolve([ERC20BridgeSource.MultiBridge]);
        case ChainId.KOVAN:
          return resolve(allERC20BridgeSources.filter(
            (s) => s !== ERC20BridgeSource.Native && s !== ERC20BridgeSource.UniswapV2,
          ));
        case ChainId.ROPSTEN:
          const supportedRopstenSources = new Set([
            ERC20BridgeSource.Native,
            ERC20BridgeSource.SushiSwap,
            ERC20BridgeSource.Uniswap,
            ERC20BridgeSource.UniswapV2,
            ERC20BridgeSource.UniswapV3,
            ERC20BridgeSource.Curve,
            ERC20BridgeSource.Mooniswap,
          ]);
          return resolve(allERC20BridgeSources.filter((s) => !supportedRopstenSources.has(s)));
        case ChainId.BSC:
          return resolve([ERC20BridgeSource.MultiBridge, ERC20BridgeSource.Native]);
        case ChainId.MATIC:
          return resolve([ERC20BridgeSource.MultiBridge, ERC20BridgeSource.Native]);
        case ChainId.AVALANCHE:
          return resolve([ERC20BridgeSource.MultiBridge, ERC20BridgeSource.Native]);
        case ChainId.FANTOM:
          return resolve([ERC20BridgeSource.MultiBridge, ERC20BridgeSource.Native]);
        default:
          return resolve(allERC20BridgeSources.filter((s) => s !== ERC20BridgeSource.Native));
      }
    });
  }

  /**
   * Returns wrapped native currency token address
   */
  async getWrappedAddress(): Promise<string> {
    return CONFIG.WRAPPED_NATIVE;
  }

  /**
   * Returns native currency address
   */
  async getNativeAddress(): Promise<string> {
    return this._nativeAddress;
  }

  /**
   * Returns all used contract addresses
   */
  async getContractAddresses(): Promise<ContractAddresses> {
    return Promise.resolve(this._contractAddresses);
  }

  /**
   * Build and returns swap quoter options
   */
  async getSwapQuoterOptions(): Promise<Partial<SwapQuoterOpts>> {
    return this._swapQuoterOptions;
  }

  /**
   * Returns required default excluded liquidity source
   */
  async getDefaultExcludedSources(): Promise<ERC20BridgeSource[]> {
    return this._defaultExcludedSources;
  }
}
