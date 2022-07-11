import { ERC20BridgeSource, OrderPrunerPermittedFeeTypes, SELL_SOURCE_FILTER_BY_CHAIN_ID } from '@0x/asset-swapper';
import { SwapQuoterOpts } from '@0x/asset-swapper/lib/src/types';
import { ContractAddresses } from '@0x/contract-wrappers';
import { HTTPException } from '@tsed/exceptions';
import { inject, injectable } from 'inversify';
import { CONFIG } from '../config';
import { NATIVE_ADDRESS, WRAPPED_ADDRESS } from '../constants';
import { ChainId, Provider } from '../types';

export interface IOptionsService {
  getSwapQuoterOptions(): Promise<Partial<SwapQuoterOpts>>;
  getWrappedAddress(): Promise<string>;
  getNativeAddress(): Promise<string>;
  getDefaultExcludedSources(): Promise<ERC20BridgeSource[]>;
}

@injectable()
export class OptionsService implements IOptionsService {

  private readonly _wrappedAddress: Promise<string>;

  private readonly _nativeAddress: Promise<string>;

  private readonly _contractAddresses: Promise<ContractAddresses>;

  private readonly _swapQuoterOptions: Promise<Partial<SwapQuoterOpts>>;

  private readonly _defaultExcludedSources: Promise<ERC20BridgeSource[]>;

  constructor(@inject('Provider') private _provider: Provider) {
    this._wrappedAddress = new Promise(async (resolve, reject) => {
      const { chainId } = await this._provider.getNetwork();
      if (!(chainId in WRAPPED_ADDRESS)) {
        return reject(new HTTPException(500, `Unsupported chain id - ${chainId}`));
      }
      resolve(WRAPPED_ADDRESS[chainId]);
    });

    this._nativeAddress = new Promise(async (resolve, reject) => {
      const { chainId } = await this._provider.getNetwork();
      if (!(chainId in NATIVE_ADDRESS)) {
        return reject(new HTTPException(500, `Unsupported chain id - ${chainId}`));
      }
      return resolve(NATIVE_ADDRESS[chainId]);
    });

    this._contractAddresses = new Promise(async (resolve, reject) => {
      const { chainId } = await this._provider.getNetwork();
      if (!(chainId in NATIVE_ADDRESS)) {
        return reject(new HTTPException(500, `Unsupported chain id - ${chainId}`));
      }
      return resolve({
        erc20Proxy: '0x0000000000000000000000000000000000000000',
        erc721Proxy: '0x0000000000000000000000000000000000000000',
        zrxToken: '0x0000000000000000000000000000000000000000',
        etherToken: NATIVE_ADDRESS[chainId], // 0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270
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
        exchangeProxy: '0xdef1c0ded9bec7f1a1670819833240f027b25eff', // 0xdef1c0ded9bec7f1a1670819833240f027b25eff
        exchangeProxyTransformerDeployer: '0xe6d9207df11c55bce2f7a189ae95e3222d5484d3',
        exchangeProxyFlashWallet: '0xdb6f1920a889355780af7570773609bd8cb1f498',
        exchangeProxyLiquidityProviderSandbox: '0x4dd97080adf36103bd3db822f9d3c0e44890fd69',
        zrxTreasury: '0x0000000000000000000000000000000000000000',
        transformers: {
          wethTransformer: '0xe309d011cc6f189a3e8dcba85922715a019fed38',
          payTakerTransformer: '0x5ba7b9be86cda01cfbf56e0fb97184783be9dda1',
          affiliateFeeTransformer: '0xbed27284b42e5684e987169cf1da09c5d6c49fa8',
          fillQuoteTransformer: '0xd4a518760030dae1adbde9496f8a3b478e83932a',
          positiveSlippageFeeTransformer: '0x4cd8f1c0df4d40fcc1e073845d5f6f4ed5cc8dab',
        },
      });
    });

    this._swapQuoterOptions = new Promise<Partial<SwapQuoterOpts>>(async resolve => {
      const { chainId } = await this._provider.getNetwork();
      const contractAddresses = await this._contractAddresses;

      return resolve({
        chainId,
        expiryBufferMs: CONFIG.QUOTE_ORDER_EXPIRATION_BUFFER_MS,
        permittedOrderFeeTypes: new Set([OrderPrunerPermittedFeeTypes.NoFees]),
        contractAddresses,
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
    return this._wrappedAddress;
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
    return this._contractAddresses;
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
