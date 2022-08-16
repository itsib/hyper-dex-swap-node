import Big from 'big.js';
import { BigNumber } from 'ethers';
import { isAddress } from 'ethers/lib/utils';
import { inject, injectable } from 'inversify';
import {
  BAD_TOKENS_BY_SOURCE,
  BALANCER_V2_VAULT_ADDRESS,
  BRIDGE_SOURCE_FLAGS,
  BUY_SOURCE_FILTERS,
  CLIPPER_POOLS_CONFIG,
  DODO_CONFIG,
  DODO_V2_FACTORIES,
  DODO_V2_MAX_POOLS_QUERIED,
  EXCHANGE_ADDRESSES,
  FEE_NATIVE_TOKEN_AMOUNT,
  FEE_SOURCE_FILTERS,
  KYBER_CONFIG,
  KYBER_DMM_ROUTER_ADDRESSES,
  KYBER_MAX_RESERVES_QUERIED,
  LIDO_POOLS_CONFIG,
  LINKSWAP_ROUTER,
  LIQUIDITY_PROVIDER_REGISTRY,
  MAKER_PSM_CONFIG,
  MOONISWAP_REGISTRIES,
  NULL_ADDRESS,
  NULL_BYTES,
  OASIS_ROUTER_ADDRESSES,
  SELL_SOURCE_FILTERS,
  TOKENS,
  UNISWAP_V1_ROUTER_ADDRESSES,
  UNISWAP_V2_LIKE_ROUTER_ADDRESSES,
  UNISWAP_V3_POOL,
  WRAPPED_NATIVE_ADDRESS,
  ZERO_AMOUNT,
} from '../constants';
import {
  BalancerFillData,
  BalancerV2FillData,
  BatchedOperation,
  BridgeSource,
  BridgeSourceWithPoolsCache,
  ChainId,
  CollapsedDexFill,
  CreateDexOrderOpts,
  CurveFillData,
  DexFill,
  DexSample,
  DodoFillData,
  DodoV2FillData,
  GenericRouterFillData,
  HopInfo,
  KyberDmmFillData,
  KyberFillData,
  LidoFillData,
  LiquidityProviderFillData,
  MakerPsmFillData,
  MakerPsmSettings,
  MarketSide,
  MarketSideLiquidity,
  MooniswapFillData,
  MultiHopFillData,
  Provider,
  SamplerOptimizerResultWithReport,
  SamplerOptions,
  ShellFillData,
  SourceQuoteOperation,
  UniswapV2FillData,
  UniswapV3FillData,
} from '../types';
import {
  createOrdersFromTwoHopSample,
  DexPathPenaltyOpts,
  dexSamplesToFills,
  fillsToSortedPaths,
  findCurveLikePoolSettings,
  findOptimalDexPathAsync,
  findShellLikePoolSettings,
  getBestTwoHopQuote,
  getIntermediateTokens,
  getSampleAmounts,
  isAllowedKyberReserveId,
  SamplerContractOperation,
  SamplerContractWrapper,
} from '../utils';
import { BalancerPoolsCache, BalancerV2PoolsCache, CreamPoolsCache, PoolsCache } from '../utils/pools-cache';

// makerToken === buyToken
// takerToken === sellToken

@injectable()
export class SamplerService {
  /**
   * Sampler contract instance
   * @private
   */
  private readonly _sampler: SamplerContractWrapper;

  private readonly _poolsCaches: { [key in BridgeSourceWithPoolsCache]: PoolsCache };

  constructor(
    @inject('Provider') private _provider: Provider,
    @inject('ChainId') private _chainId: ChainId,
  ) {
    this._sampler = new SamplerContractWrapper(this._provider);

    this._poolsCaches = {
      [BridgeSource.Balancer]: new BalancerPoolsCache(this._chainId),
      [BridgeSource.BalancerV2]: new BalancerV2PoolsCache(this._chainId),
      [BridgeSource.Cream]: new CreamPoolsCache(this._chainId),
    };
  }

  /**
   * Find optimal route
   * @param buyToken
   * @param sellToken
   * @param amount
   * @param side
   * @param opts
   */
  async getOptimizerResult(buyToken: string, sellToken: string, amount: BigNumber, side: MarketSide, opts: Required<SamplerOptions>): Promise<SamplerOptimizerResultWithReport> {
    const liquidity = side === MarketSide.Sell ? await this._getMarketSellLiquidity(buyToken, sellToken, amount, opts) : await this._getMarketBuyLiquidity(buyToken, sellToken, amount, opts)

    return await this._generateOptimizedOrders(liquidity, opts);
  }

  /**
   * To find sell liquidity in liquidity pools through sampler contract
   * @param buyToken
   * @param sellToken
   * @param amount
   * @param opts
   * @private
   */
  private async _getMarketSellLiquidity(buyToken: string, sellToken: string, amount: BigNumber, opts: Required<SamplerOptions>): Promise<MarketSideLiquidity> {
    const sampleAmounts = getSampleAmounts(amount);
    const quoteSources = SELL_SOURCE_FILTERS[this._chainId].getSources(opts.excludedSources);
    const feeSources = FEE_SOURCE_FILTERS[this._chainId].getSources(opts.excludedSources);

    const result = await this._sampler.execute(
      this._getTokenDecimals([buyToken, sellToken]),
      // Get NATIVE -> buy token price.
      this._getMedianSellRate(feeSources, buyToken),
      // Get NATIVE -> sell token price.
      this._getMedianSellRate(feeSources, sellToken),
      // Get sell quotes for sale -> buy token.
      this._getSellQuotes(quoteSources, buyToken, sellToken, sampleAmounts),
      // Get two hop sell quotes
      this._getTwoHopSellQuotes(quoteSources.includes(BridgeSource.MultiHop) ? quoteSources : [], buyToken, sellToken, amount),
    );

    const [[buyTokenDecimals, sellTokenDecimals], outputAmountPerEth, inputAmountPerEth, dexSamples, twoHopSamples] = result;

    return {
      side: MarketSide.Sell,
      inputAmount: amount,
      inputToken: sellToken,
      outputToken: buyToken,
      outputAmountPerEth,
      inputAmountPerEth,
      quoteSources,
      buyTokenDecimals,
      sellTokenDecimals,
      samples: {
        twoHopSamples,
        dexSamples,
      },
    };
  }

  /**
   * To find buy liquidity in liquidity pools through sampler contract
   * @param buyToken
   * @param sellToken
   * @param amount
   * @param opts
   * @private
   */
  private async _getMarketBuyLiquidity(buyToken: string, sellToken: string, amount: BigNumber, opts: Required<SamplerOptions>): Promise<any> {
    const sampleAmounts = getSampleAmounts(amount);
    const quoteSources = BUY_SOURCE_FILTERS[this._chainId].getSources(opts.excludedSources);
    const feeSources = FEE_SOURCE_FILTERS[this._chainId].getSources(opts.excludedSources);

    const result = await this._sampler.execute(
      this._getTokenDecimals([buyToken, sellToken]),
      // Get NATIVE -> sell token price.
      this._getMedianSellRate(feeSources, sellToken),
      // Get NATIVE -> buy token price.
      this._getMedianSellRate(feeSources, buyToken),
      // Get sell quotes for sale -> buy token.
      this._getBuyQuotes(quoteSources, buyToken, sellToken, sampleAmounts),
    );

    const [[buyTokenDecimals, sellTokenDecimals], outputAmountPerEth, inputAmountPerEth, dexSamples/*, twoHopSamples*/] = result;

    return {
      side: MarketSide.Buy,
      inputAmount: amount,
      inputToken: buyToken,
      outputToken: sellToken,
      outputAmountPerEth,
      inputAmountPerEth,
      quoteSources,
      buyTokenDecimals,
      sellTokenDecimals,
      samples: {
        twoHopSamples: [],
        dexSamples,
      },
    };
  }

  /**
   * Find optimal swap route
   * @param marketSideLiquidity
   * @param opts
   * @private
   */
  private async _generateOptimizedOrders(marketSideLiquidity: MarketSideLiquidity, opts: Required<SamplerOptions>): Promise<SamplerOptimizerResultWithReport> {
    const {
      side,
      samples,
      inputToken,
      outputToken,
      inputAmount,
      outputAmountPerEth,
      inputAmountPerEth,
    } = marketSideLiquidity;
    // Create and validate fills
    const fills = samples.dexSamples
      .map(samples => dexSamplesToFills(side, samples, inputAmount, outputAmountPerEth, inputAmountPerEth, opts.gasSchedule))
      .filter((fills: DexFill[]) => {
        if (fills.length === 0) {
          return false;
        }
        const totalInput = fills.reduce<BigNumber>((total, fill) => total.add(fill.input), ZERO_AMOUNT);
        const totalOutput = fills.reduce<BigNumber>((total, fill) => total.add(fill.output), ZERO_AMOUNT);

        return totalInput.gt(0) && totalOutput.gt(0);
      });

    // Create paths by fills
    const pathPenaltyOpts: DexPathPenaltyOpts = {
      inputAmountPerEth,
      outputAmountPerEth,
      exchangeOverhead: opts.exchangeOverhead,
    };
    const sortedDexPaths = fillsToSortedPaths(side, fills, inputAmount, pathPenaltyOpts);

    const createOrderOpts: CreateDexOrderOpts = {
      side,
      inputToken,
      outputToken,
      orderDomain: {
        chainId: this._chainId,
        exchangeAddress: EXCHANGE_ADDRESSES[this._chainId],
      },
      slippagePercentage: opts.slippagePercentage,
    };
    const unoptimizedDexPath = sortedDexPaths.length ? sortedDexPaths[0].collapse(createOrderOpts) : undefined;
    const optimalPath = await findOptimalDexPathAsync(side, sortedDexPaths, inputAmount);
    const optimalPathRate = optimalPath ? optimalPath.adjustedRate() : '0';

    const { adjustedRate: bestTwoHopRate, quote: bestTwoHopQuote } = getBestTwoHopQuote(
      marketSideLiquidity,
      opts.gasSchedule,
      opts.exchangeOverhead,
    );

    // Check best two hop quote
    if (bestTwoHopQuote && Big(bestTwoHopRate).gt(optimalPathRate)) {
      const twoHopOrders = createOrdersFromTwoHopSample(bestTwoHopQuote, createOrderOpts);
      return {
        optimizedOrders: twoHopOrders,
        liquidityDelivered: bestTwoHopQuote,
        sourceFlags: BRIDGE_SOURCE_FLAGS[BridgeSource.MultiHop],
        marketSideLiquidity,
        adjustedRate: bestTwoHopRate,
        unoptimizedPath: unoptimizedDexPath,
        sellAmountPerEth: inputAmountPerEth,
        buyAmountPerEth: outputAmountPerEth,
      };
    }

    if (!optimalPath) {
      throw new Error('NO_OPTIMAL_PATH');
    }

    // NOTE: For sale quotes input is the sell asset and for buy quotes input is the buy asset
    const sellAmountPerEth = side === MarketSide.Sell ? inputAmountPerEth : outputAmountPerEth;
    const buyAmountPerEth = side === MarketSide.Sell ? outputAmountPerEth : inputAmountPerEth;

    const collapsedPath = optimalPath.collapse(createOrderOpts);

    return {
      optimizedOrders: collapsedPath.orders,
      sourceFlags: collapsedPath.sourceFlags(),
      liquidityDelivered: collapsedPath.collapsedFills as CollapsedDexFill[],
      marketSideLiquidity,
      adjustedRate: optimalPathRate,
      unoptimizedPath: unoptimizedDexPath,
      sellAmountPerEth,
      buyAmountPerEth,
    };
  }

  /**
   * Build batched request for the fetch token decimals
   * @param tokens
   * @private
   */
  private _getTokenDecimals(tokens: string[]): BatchedOperation<number[]> {
    return {
      callData: this._sampler.interface.encodeFunctionData('getTokenDecimals', [tokens]),
      onSuccess: (data => {
        const [decimals] = this._sampler.interface.decodeFunctionResult('getTokenDecimals', data) as [BigNumber[]];
        return decimals.map(i => i.toNumber());
      }),
      onError: (): number[] => [],
    }
  }

  /**
   * Returns batched sell quote operations
   * @param sources
   * @param buyToken
   * @param sellToken
   * @param amounts
   * @private
   */
  private _getSellQuotes(sources: BridgeSource[], buyToken: string, sellToken: string, amounts: BigNumber[]): BatchedOperation<DexSample[][]> {
    const intermediateTokens = getIntermediateTokens(this._chainId, buyToken, sellToken);
    const operations = this._getSellQuoteOperations(sources, buyToken, sellToken, amounts, intermediateTokens);

    return this._createBatch(operations, results => results, () => []);
  }

  /**
   * Returns batched buy quote operations
   * @param sources
   * @param buyToken
   * @param sellToken
   * @param amounts
   * @private
   */
  private _getBuyQuotes(sources: BridgeSource[], buyToken: string, sellToken: string, amounts: BigNumber[]): BatchedOperation<DexSample[][]> {
    const intermediateTokens = getIntermediateTokens(this._chainId, buyToken, sellToken);
    const operations = this._getBuyQuoteOperations(sources, buyToken, sellToken, amounts, intermediateTokens);

    return this._createBatch(operations, results => results, () => []);
  }

  /**
   * Build two hop operations
   * @param sources
   * @param buyToken
   * @param sellToken
   * @param amount
   * @private
   */
  private _getTwoHopSellQuotes(sources: BridgeSource[], buyToken: string, sellToken: string, amount: BigNumber): BatchedOperation<DexSample<MultiHopFillData>[]> {
    sources = sources.filter(source => source !== BridgeSource.MultiHop);
    if (!sources.length) {
      return {
        callData: NULL_BYTES,
        onSuccess: () => [],
        onError: () => [],
      }
    }

    const intermediateTokens = getIntermediateTokens(this._chainId, buyToken, sellToken);

    const operations: SourceQuoteOperation<DexSample<MultiHopFillData>[], MultiHopFillData>[] = intermediateTokens.map(intermediateToken => {
      const firstHopOps = this._getSellQuoteOperations(sources, intermediateToken, sellToken, [ZERO_AMOUNT]);
      const secondHopOps = this._getSellQuoteOperations(sources, buyToken, intermediateToken, [ZERO_AMOUNT]);

      return new SamplerContractOperation<MultiHopFillData>({
        source: BridgeSource.MultiHop,
        fillData: { intermediateToken } as MultiHopFillData,
        sampler: this._sampler,
        method: 'sampleTwoHopSell',
        params: [
          firstHopOps.map(({ callData }) => callData),
          secondHopOps.map(({ callData }) => callData),
          amount,
        ],
        amounts: [],
        callback: (callResults, fillData) => {
          const [firstHop, secondHop, output] = this._sampler.interface.decodeFunctionResult('sampleTwoHopSell', callResults) as [HopInfo, HopInfo, BigNumber];

          fillData.firstHopSource = firstHopOps[firstHop.sourceIndex.toNumber()];
          fillData.secondHopSource = secondHopOps[secondHop.sourceIndex.toNumber()];

          if (output.isZero()) {
            return [];
          }

          fillData.firstHopSource.onSuccess(firstHop.returnData);
          fillData.secondHopSource.onSuccess(secondHop.returnData);

          return [{
            source: BridgeSource.MultiHop,
            fillData: fillData as MultiHopFillData,
            input: amount,
            output,
          }];
        },
      });
    });

    return this._createBatch(operations, results => results.flat(), () => []);
  }

  /**
   * Get NATIVE -> buy token price.
   * @param sources
   * @param buyToken
   * @private
   */
  private _getMedianSellRate(sources: BridgeSource[], buyToken: string): BatchedOperation<string> {
    const sellToken = WRAPPED_NATIVE_ADDRESS[this._chainId];
    const sellTokenAmount = FEE_NATIVE_TOKEN_AMOUNT[this._chainId];
    const operations = this._getSellQuoteOperations(sources, buyToken, sellToken, [sellTokenAmount]);

    return this._createBatch(operations, results => {
      if (sellToken.toLowerCase() === buyToken.toLowerCase()) {
        return '1';
      }

      if (results.length === 0) {
        return '0';
      }
      const buyAmounts = results
        .reduce<BigNumber[]>((acc, result) => acc.concat(...result.map(({ output }) => output)), [])
        .filter(amount => amount.gt(0))
        .sort((a, b) => a.eq(b) ? 0 : a.gt(b) ? 1 : -1);

      if (buyAmounts.length === 0) {
        return '0';
      }

      const medianBuyAmount = buyAmounts[Math.floor(buyAmounts.length / 2)];

      return medianBuyAmount.toBig().div(sellTokenAmount.toBig()).toString();
    }, () => '0');
  }

  /**
   * Build batched request operations for the fetch sell quotes
   * @param sources
   * @param buyToken
   * @param sellToken
   * @param amounts
   * @param intermediateTokens
   * @private
   */
  private _getSellQuoteOperations(sources: BridgeSource[], buyToken: string, sellToken: string, amounts: BigNumber[], intermediateTokens: string[] = []): SourceQuoteOperation<DexSample[]>[] {
    const paths: string[][] = [[sellToken, buyToken], ...intermediateTokens.map(t => [sellToken, t, buyToken])];

    return sources.map((source): SourceQuoteOperation<DexSample[]>[] => {
      if (BAD_TOKENS_BY_SOURCE[source]?.includes(buyToken) || BAD_TOKENS_BY_SOURCE[source]?.includes(sellToken)) {
        return [];
      }

      switch (source) {
        case BridgeSource.Eth2Dai:
          if (!isAddress(OASIS_ROUTER_ADDRESSES[this._chainId])) {
            return [];
          }
          return [new SamplerContractOperation<GenericRouterFillData>({
            source,
            fillData: { router: OASIS_ROUTER_ADDRESSES[this._chainId] },
            sampler: this._sampler,
            method: 'sampleSellsFromEth2Dai',
            params: [
              OASIS_ROUTER_ADDRESSES[this._chainId],
              sellToken,
              buyToken,
              amounts,
            ],
            amounts,
          })];
        case BridgeSource.Uniswap:
          if (!isAddress(UNISWAP_V1_ROUTER_ADDRESSES[this._chainId])) {
            return [];
          }
          // Uniswap uses ETH instead of WETH, represented by address(0)
          const uniswapSellToken = sellToken === WRAPPED_NATIVE_ADDRESS[this._chainId] ? NULL_ADDRESS : sellToken;
          const uniswapBuyToken = buyToken === WRAPPED_NATIVE_ADDRESS[this._chainId] ? NULL_ADDRESS : buyToken;
          return [new SamplerContractOperation<GenericRouterFillData>({
            source,
            fillData: { router: UNISWAP_V1_ROUTER_ADDRESSES[this._chainId] },
            sampler: this._sampler,
            method: 'sampleSellsFromUniswap',
            params: [
              UNISWAP_V1_ROUTER_ADDRESSES[this._chainId],
              uniswapSellToken,
              uniswapBuyToken,
              amounts,
            ],
            amounts,
          })];
        case BridgeSource.UniswapV2:
        case BridgeSource.SushiSwap:
        case BridgeSource.CryptoCom:
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
          const uniLikeRouter = UNISWAP_V2_LIKE_ROUTER_ADDRESSES[source]?.[this._chainId];
          if (!uniLikeRouter) {
            return [];
          }
          return paths.map(path => {
            return new SamplerContractOperation<UniswapV2FillData>({
              source,
              fillData: {
                tokenAddressPath: path,
                router: uniLikeRouter,
              },
              sampler: this._sampler,
              method: 'sampleSellsFromUniswapV2',
              params: [
                uniLikeRouter,
                path,
                amounts,
              ],
              amounts,
            });
          });
        case BridgeSource.UniswapV3: {
          const poolOpts = UNISWAP_V3_POOL[this._chainId];
          if (!poolOpts) {
            return [];
          }
          return paths.map(path => new SamplerContractOperation<UniswapV3FillData>({
            source,
            fillData: {
              router: poolOpts.router,
              tokenAddressPath: path,
            } as UniswapV3FillData,
            sampler: this._sampler,
            method: 'sampleSellsFromUniswapV3',
            params: [poolOpts.quoter, path, amounts],
            amounts,
            callback: (callResults: string, fillData) => {
              const [paths, outputs] = this._sampler.interface.decodeFunctionResult('sampleSellsFromUniswapV3', callResults) as [string[], BigNumber[]];

              fillData.pathAmounts = paths.map((uniswapPath, i) => ({ uniswapPath, inputAmount: amounts[i] }))

              return outputs.map<DexSample<UniswapV3FillData>>((output, i) => {
                return {
                  source: BridgeSource.UniswapV3,
                  fillData,
                  input: amounts[i],
                  output,
                }
              });
            },
          }));
        }
        case BridgeSource.KyberDmm:
          if (!isAddress(KYBER_DMM_ROUTER_ADDRESSES[this._chainId])) {
            return [];
          }
          return [new SamplerContractOperation<KyberDmmFillData>({
            source,
            fillData: {
              router: KYBER_DMM_ROUTER_ADDRESSES[this._chainId],
              tokenAddressPath: [sellToken, buyToken],
            } as KyberDmmFillData,
            sampler: this._sampler,
            method: 'sampleSellsFromKyberDmm',
            params: [
              KYBER_DMM_ROUTER_ADDRESSES[this._chainId],
              [sellToken, buyToken],
              amounts,
            ],
            amounts,
            callback: (callResults: string, fillData) => {
              const [poolsPath, outputs] = this._sampler.interface.decodeFunctionResult('sampleSellsFromKyberDmm', callResults) as [string[], BigNumber[]];
              fillData.poolsPath = poolsPath;
              return outputs.map<DexSample<KyberDmmFillData>>((output, i) => ({
                source: BridgeSource.KyberDmm,
                fillData,
                input: amounts[i],
                output,
              }));
            },
          })];
        case BridgeSource.Kyber:
          const kyberConfig = KYBER_CONFIG[this._chainId];
          if (!kyberConfig) {
            return [];
          }
          return Array(KYBER_MAX_RESERVES_QUERIED).fill(0).map((_v, offset) => {
            return new SamplerContractOperation<KyberFillData>({
              source,
              fillData: { networkProxy: kyberConfig.networkProxy } as KyberFillData,
              sampler: this._sampler,
              method: 'sampleSellsFromKyberNetwork',
              params: [
                { ...kyberConfig, reserveOffset: BigNumber.from(offset), hint: NULL_BYTES },
                sellToken,
                buyToken,
                amounts,
              ],
              amounts,
              callback: (callResults: string, fillData) => {
                const [reserveId, hint, outputs] = this._sampler.interface.decodeFunctionResult('sampleSellsFromKyberNetwork', callResults) as [string, string, BigNumber[]];
                fillData.hint = hint;
                fillData.reserveId = reserveId;

                if (!isAllowedKyberReserveId(reserveId)) {
                  return [];
                }

                return outputs.map<DexSample<KyberFillData>>((output, i) => ({
                  source: BridgeSource.Kyber,
                  fillData,
                  input: amounts[i],
                  output,
                }));
              },
            });
          });
        case BridgeSource.Curve:
        case BridgeSource.CurveV2:
        case BridgeSource.Swerve:
        case BridgeSource.SnowSwap:
        case BridgeSource.Nerve:
        case BridgeSource.Belt:
        case BridgeSource.Ellipsis:
        case BridgeSource.Saddle:
        case BridgeSource.XSigma:
        case BridgeSource.FirebirdOneSwap:
        case BridgeSource.IronSwap:
        case BridgeSource.ACryptos:
          return findCurveLikePoolSettings(source, this._chainId, sellToken, buyToken).map(pool => {
            return new SamplerContractOperation<CurveFillData>({
              source,
              fillData: { pool },
              sampler: this._sampler,
              method: 'sampleSellsFromCurve',
              params: [
                {
                  poolAddress: pool.poolAddress,
                  sellQuoteFunctionSelector: pool.sellQuoteFunctionSelector,
                  buyQuoteFunctionSelector: pool.buyQuoteFunctionSelector,
                },
                BigNumber.from(pool.sellTokenIdx),
                BigNumber.from(pool.buyTokenIdx),
                amounts,
              ],
              amounts,
            });
          });
        case BridgeSource.Smoothy:
          return findCurveLikePoolSettings(source, this._chainId, sellToken, buyToken).map(pool => {
            return new SamplerContractOperation<CurveFillData>({
              source,
              fillData: { pool },
              sampler: this._sampler,
              method: 'sampleSellsFromSmoothy',
              params: [
                {
                  poolAddress: pool.poolAddress,
                  sellQuoteFunctionSelector: pool.sellQuoteFunctionSelector,
                  buyQuoteFunctionSelector: pool.buyQuoteFunctionSelector,
                },
                BigNumber.from(pool.sellTokenIdx),
                BigNumber.from(pool.buyTokenIdx),
                amounts,
              ],
              amounts,
            });
          });
        case BridgeSource.Shell:
        case BridgeSource.Component:
          return findShellLikePoolSettings(source, this._chainId, sellToken, buyToken).map(poolAddress => {
            return new SamplerContractOperation<ShellFillData>({
              source,
              fillData: { poolAddress },
              sampler: this._sampler,
              method: 'sampleSellsFromShell',
              params: [
                poolAddress,
                sellToken,
                buyToken,
                amounts,
              ],
              amounts,
            });
          });
        case BridgeSource.MStable:
          return findShellLikePoolSettings(source, this._chainId, sellToken, buyToken).map(router => {
            return new SamplerContractOperation<GenericRouterFillData>({
              source,
              fillData: { router },
              sampler: this._sampler,
              method: 'sampleSellsFromMStable',
              params: [
                router,
                sellToken,
                buyToken,
                amounts,
              ],
              amounts,
            });
          });
        case BridgeSource.LiquidityProvider:
          return (LIQUIDITY_PROVIDER_REGISTRY[this._chainId] || [])
            .filter(({ tokens }) => tokens.includes(sellToken) && tokens.includes(buyToken))
            .map(({ poolAddress, gasCost }) => {
              return new SamplerContractOperation<LiquidityProviderFillData>({
                source,
                fillData: {
                  poolAddress,
                  gasCost: typeof gasCost === 'number' ? gasCost : gasCost(sellToken, buyToken),
                },
                sampler: this._sampler,
                method: 'sampleSellsFromLiquidityProvider',
                params: [
                  poolAddress,
                  sellToken,
                  buyToken,
                  amounts,
                ],
                amounts,
              });
            });
        case BridgeSource.Mooniswap:
          // Mooniswap uses ETH instead of WETH, represented by address(0)
          const mooniswapSellToken = sellToken === WRAPPED_NATIVE_ADDRESS[this._chainId] ? NULL_ADDRESS : sellToken;
          const mooniswapBuyToken = buyToken === WRAPPED_NATIVE_ADDRESS[this._chainId] ? NULL_ADDRESS : buyToken;

          return (MOONISWAP_REGISTRIES[this._chainId] || []).map(registry => {
            return new SamplerContractOperation<MooniswapFillData>({
              source,
              sampler: this._sampler,
              method: 'sampleSellsFromMooniswap',
              params: [
                registry,
                mooniswapSellToken,
                mooniswapBuyToken,
                amounts,
              ],
              amounts,
              callback: (callResults, fillData) => {
                const [poolAddress, outputs] = this._sampler.interface.decodeFunctionResult('sampleSellsFromMooniswap', callResults) as [string, BigNumber[]];
                fillData.poolAddress = poolAddress;

                return outputs.map<DexSample<MooniswapFillData>>((output, i) => ({
                  source: BridgeSource.Mooniswap,
                  fillData,
                  input: amounts[i],
                  output,
                }));
              },
            });
          });
        case BridgeSource.Balancer:
          return (this._poolsCaches[BridgeSource.Balancer].getCachedPoolAddressesForPair(sellToken, buyToken) || []).map(balancerPool => {
            return new SamplerContractOperation<BalancerFillData>({
              source,
              fillData: { poolAddress: balancerPool },
              sampler: this._sampler,
              method: 'sampleSellsFromBalancer',
              params: [
                balancerPool,
                sellToken,
                buyToken,
                amounts,
              ],
              amounts,
            });
          });
        case BridgeSource.BalancerV2:
          const poolIds = this._poolsCaches[BridgeSource.BalancerV2].getCachedPoolAddressesForPair(sellToken, buyToken) || [];

          const vault = BALANCER_V2_VAULT_ADDRESS[this._chainId];
          if (!vault) {
            return [];
          }
          return poolIds.map(poolId => {
            return new SamplerContractOperation<BalancerV2FillData>({
              source,
              fillData: { poolId, vault },
              sampler: this._sampler,
              method: 'sampleSellsFromBalancerV2',
              params: [
                { poolId, vault },
                sellToken,
                buyToken,
                amounts,
              ],
              amounts,
            });
          });
        case BridgeSource.Cream:
          return (this._poolsCaches[BridgeSource.Cream].getCachedPoolAddressesForPair(sellToken, buyToken) || []).map(creamPool => {
            return new SamplerContractOperation<BalancerFillData>({
              source,
              fillData: { poolAddress: creamPool },
              sampler: this._sampler,
              method: 'sampleSellsFromBalancer',
              params: [
                creamPool,
                sellToken,
                buyToken,
                amounts,
              ],
              amounts,
            });
          });
        case BridgeSource.Dodo:
          const dodoConfig = DODO_CONFIG[this._chainId];
          if (!dodoConfig) {
            return [];
          }

          return [
            new SamplerContractOperation<DodoFillData>({
              source,
              fillData: { helperAddress: dodoConfig.helper } as DodoFillData,
              sampler: this._sampler,
              method: 'sampleSellsFromDODO',
              params: [
                dodoConfig,
                sellToken,
                buyToken,
                amounts,
              ],
              amounts,
              callback: (callResults, fillData) => {
                const [isSellBase, poolAddress, outputs] = this._sampler.interface.decodeFunctionResult('sampleSellsFromDODO', callResults) as [boolean, string, BigNumber[]];
                fillData.isSellBase = isSellBase;
                fillData.poolAddress = poolAddress;

                return outputs.map<DexSample<DodoFillData>>((output, i) => ({
                  source: BridgeSource.Dodo,
                  fillData,
                  input: amounts[i],
                  output,
                }));
              },
            }),
          ];
        case BridgeSource.DodoV2:
          const dodoV2Factories = DODO_V2_FACTORIES[this._chainId];
          if (!dodoV2Factories) {
            return [];
          }
          return dodoV2Factories.map(factory => {
            return Array(DODO_V2_MAX_POOLS_QUERIED).fill(0).map((_, offset) => {
              return new SamplerContractOperation<DodoV2FillData>({
                source,
                sampler: this._sampler,
                method: 'sampleSellsFromDODOV2',
                params: [
                  factory,
                  BigNumber.from(offset),
                  sellToken,
                  buyToken,
                  amounts,
                ],
                amounts,
                callback: (callResults, fillData) => {
                  const [isSellBase, poolAddress, outputs] = this._sampler.interface.decodeFunctionResult('sampleSellsFromDODOV2', callResults) as [boolean, string, BigNumber[]];
                  fillData.isSellBase = isSellBase;
                  fillData.poolAddress = poolAddress;

                  return outputs.map<DexSample<DodoV2FillData>>((output, i) => ({
                    source: BridgeSource.DodoV2,
                    fillData,
                    input: amounts[i],
                    output,
                  }));
                },
              });
            });
          }).flat();
        case BridgeSource.Bancor:
          return [];
        //   const bancorRegistry = BANCOR_REGISTRY[this._chainId];
        //   if (!bancorRegistry) {
        //     return [];
        //   }
        // return this.getBancorSellQuotes(
        //   BANCOR_REGISTRY_BY_CHAIN_ID[this._chainId],
        //   buyToken,
        //   sellToken,
        //   amounts,
        // );
        // return [];
        case BridgeSource.Linkswap:
          const linkswapRouter = LINKSWAP_ROUTER[this._chainId];
          if (!linkswapRouter || this._chainId !== ChainId.MAINNET) {
            return [];
          }

          const linkswapIntermediateTokens = [TOKENS[ChainId.MAINNET].LINK, TOKENS[ChainId.MAINNET].WETH]
            .filter(token => token.toLowerCase() !== buyToken.toLowerCase() && token.toLowerCase() !== sellToken.toLowerCase())
          const linkswapPaths: string[][] = [[sellToken, buyToken], ...linkswapIntermediateTokens.map(t => [sellToken, t, buyToken])];

          return linkswapPaths.map(path => {
            return new SamplerContractOperation<UniswapV2FillData>({
              source,
              fillData: { tokenAddressPath: path, router: linkswapRouter },
              sampler: this._sampler,
              method: 'sampleSellsFromUniswapV2',
              params: [
                linkswapRouter,
                path,
                amounts,
              ],
              amounts,
            });
          });
        case BridgeSource.MakerPsm:
          const makerPsmPool: MakerPsmSettings = MAKER_PSM_CONFIG[this._chainId];
          if (!makerPsmPool) {
            return [];
          }

          return [
            new SamplerContractOperation<MakerPsmFillData>({
              source,
              fillData: {
                ...makerPsmPool,
                isSellOperation: true,
                sellToken,
                buyToken,
              },
              sampler: this._sampler,
              method: 'sampleSellsFromMakerPsm',
              params: [
                makerPsmPool,
                sellToken,
                buyToken,
                amounts,
              ],
              amounts,
            }),
          ];
        case BridgeSource.Lido: {
          const lidoConf = LIDO_POOLS_CONFIG[this._chainId];
          if (!lidoConf || sellToken.toLowerCase() !== lidoConf.wethToken.toLowerCase() || buyToken.toLowerCase() !== lidoConf.stEthToken.toLowerCase()) {
            return [];
          }
          return [
            new SamplerContractOperation<LidoFillData>({
              source,
              fillData: {
                stEthTokenAddress: lidoConf.stEthToken,
                wstEthTokenAddress: lidoConf.wethToken,
                sellToken,
                buyToken,
              },
              sampler: this._sampler,
              method: 'sampleSellsFromLido',
              params: [
                lidoConf,
                sellToken,
                buyToken,
                amounts,
              ],
              amounts,
            }),
          ];
        }
        case BridgeSource.Clipper:
          const clipperConf = CLIPPER_POOLS_CONFIG[this._chainId];
          if (!clipperConf || !clipperConf.tokens.includes(buyToken) || !clipperConf.tokens.includes(sellToken)) {
            return [];
          }

          // Clipper requires WETH to be represented as address(0)
          const adjustedSellToken = sellToken === WRAPPED_NATIVE_ADDRESS[this._chainId] ? NULL_ADDRESS : sellToken;
          const adjustedBuyToken = buyToken === WRAPPED_NATIVE_ADDRESS[this._chainId] ? NULL_ADDRESS : buyToken;

          return [
            new SamplerContractOperation<LiquidityProviderFillData>({
              source,
              fillData: {
                poolAddress: clipperConf.poolAddress,
                gasCost: 0,
              },
              sampler: this._sampler,
              method: 'sampleSellsFromLiquidityProvider',
              params: [
                clipperConf.poolAddress,
                adjustedSellToken,
                adjustedBuyToken,
                amounts,
              ],
              amounts,
            }),
          ];
        case BridgeSource.MultiHop:
          return [];
        default:
          throw new Error(`Unsupported sell sample source: ${source}`);
      }
    }).flat();
  }

  /**
   * Build batched request operations for the fetch buy quotes
   * @param sources
   * @param buyToken
   * @param sellToken
   * @param amounts
   * @param intermediateTokens
   * @private
   */
  private _getBuyQuoteOperations(sources: BridgeSource[], buyToken: string, sellToken: string, amounts: BigNumber[], intermediateTokens: string[] = []): SourceQuoteOperation<DexSample[]>[] {
    const paths: string[][] = [[sellToken, buyToken], ...intermediateTokens.map(t => [sellToken, t, buyToken])];

    return sources.map((source): SourceQuoteOperation<DexSample[]>[] => {
      switch (source) {
        case BridgeSource.Eth2Dai:
          if (!isAddress(OASIS_ROUTER_ADDRESSES[this._chainId])) {
            return [];
          }
          return [new SamplerContractOperation<GenericRouterFillData>({
            source,
            fillData: { router: OASIS_ROUTER_ADDRESSES[this._chainId] },
            sampler: this._sampler,
            method: 'sampleBuysFromEth2Dai',
            params: [
              OASIS_ROUTER_ADDRESSES[this._chainId],
              sellToken,
              buyToken,
              amounts,
            ],
            amounts,
          })];
        case BridgeSource.Uniswap:
          if (!isAddress(UNISWAP_V1_ROUTER_ADDRESSES[this._chainId])) {
            return [];
          }
          // Uniswap uses ETH instead of WETH, represented by address(0)
          const uniswapSellToken = sellToken === WRAPPED_NATIVE_ADDRESS[this._chainId] ? NULL_ADDRESS : sellToken;
          const uniswapBuyToken = buyToken === WRAPPED_NATIVE_ADDRESS[this._chainId] ? NULL_ADDRESS : buyToken;
          return [new SamplerContractOperation<GenericRouterFillData>({
            source,
            fillData: { router: UNISWAP_V1_ROUTER_ADDRESSES[this._chainId] },
            sampler: this._sampler,
            method: 'sampleBuysFromUniswap',
            params: [
              UNISWAP_V1_ROUTER_ADDRESSES[this._chainId],
              uniswapSellToken,
              uniswapBuyToken,
              amounts,
            ],
            amounts,
          })];
        case BridgeSource.UniswapV2:
        case BridgeSource.SushiSwap:
        case BridgeSource.CryptoCom:
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
          const uniLikeRouter = UNISWAP_V2_LIKE_ROUTER_ADDRESSES[source]?.[this._chainId];
          if (!uniLikeRouter) {
            return [];
          }
          return paths.map(path => {
            return new SamplerContractOperation<UniswapV2FillData>({
              source,
              fillData: {
                tokenAddressPath: path,
                router: uniLikeRouter,
              },
              sampler: this._sampler,
              method: 'sampleBuysFromUniswapV2',
              params: [
                uniLikeRouter,
                path,
                amounts,
              ],
              amounts,
            });
          });
        case BridgeSource.UniswapV3: {
          const poolOpts = UNISWAP_V3_POOL[this._chainId];
          if (!poolOpts) {
            return [];
          }
          return paths.map(path => new SamplerContractOperation<UniswapV3FillData>({
            source,
            fillData: {
              router: poolOpts.router,
              tokenAddressPath: path,
            } as UniswapV3FillData,
            sampler: this._sampler,
            method: 'sampleBuysFromUniswapV3',
            params: [poolOpts.quoter, path, amounts],
            amounts,
            callback: (callResults: string, fillData) => {
              const [paths, outputs] = this._sampler.interface.decodeFunctionResult('sampleBuysFromUniswapV3', callResults) as [string[], BigNumber[]];

              fillData.pathAmounts = paths.map((uniswapPath, i) => ({ uniswapPath, inputAmount: amounts[i] }))

              return outputs.map<DexSample<UniswapV3FillData>>((output, i) => {
                return {
                  source: BridgeSource.UniswapV3,
                  fillData,
                  input: amounts[i],
                  output,
                }
              });
            },
          }));
        }
        case BridgeSource.KyberDmm:
          if (!isAddress(KYBER_DMM_ROUTER_ADDRESSES[this._chainId])) {
            return [];
          }
          return [new SamplerContractOperation<KyberDmmFillData>({
            source,
            fillData: {
              router: KYBER_DMM_ROUTER_ADDRESSES[this._chainId],
              tokenAddressPath: [sellToken, buyToken],
            } as KyberDmmFillData,
            sampler: this._sampler,
            method: 'sampleBuysFromKyberDmm',
            params: [
              KYBER_DMM_ROUTER_ADDRESSES[this._chainId],
              [sellToken, buyToken],
              amounts,
            ],
            amounts,
            callback: (callResults: string, fillData) => {
              const [poolsPath, outputs] = this._sampler.interface.decodeFunctionResult('sampleBuysFromKyberDmm', callResults) as [string[], BigNumber[]];
              fillData.poolsPath = poolsPath;
              return outputs.map<DexSample<KyberDmmFillData>>((output, i) => ({
                source: BridgeSource.KyberDmm,
                fillData,
                input: amounts[i],
                output,
              }));
            },
          })];
        case BridgeSource.Kyber:
          const kyberConfig = KYBER_CONFIG[this._chainId];
          if (!kyberConfig) {
            return [];
          }
          return Array(KYBER_MAX_RESERVES_QUERIED).fill(0).map((_v, offset) => {
            return new SamplerContractOperation<KyberFillData>({
              source,
              fillData: { networkProxy: kyberConfig.networkProxy } as KyberFillData,
              sampler: this._sampler,
              method: 'sampleBuysFromKyberNetwork',
              params: [
                { ...kyberConfig, reserveOffset: BigNumber.from(offset), hint: NULL_BYTES },
                sellToken,
                buyToken,
                amounts,
              ],
              amounts,
              callback: (callResults: string, fillData) => {
                const [reserveId, hint, outputs] = this._sampler.interface.decodeFunctionResult('sampleBuysFromKyberNetwork', callResults) as [string, string, BigNumber[]];
                fillData.hint = hint;
                fillData.reserveId = reserveId;

                if (!isAllowedKyberReserveId(reserveId)) {
                  return [];
                }

                return outputs.map<DexSample<KyberFillData>>((output, i) => ({
                  source: BridgeSource.Kyber,
                  fillData,
                  input: amounts[i],
                  output,
                }));
              },
            });
          });
        case BridgeSource.Curve:
        case BridgeSource.CurveV2:
        case BridgeSource.Swerve:
        case BridgeSource.SnowSwap:
        case BridgeSource.Nerve:
        case BridgeSource.Belt:
        case BridgeSource.Ellipsis:
        case BridgeSource.Saddle:
        case BridgeSource.XSigma:
        case BridgeSource.FirebirdOneSwap:
        case BridgeSource.IronSwap:
        case BridgeSource.ACryptos:
          return findCurveLikePoolSettings(source, this._chainId, sellToken, buyToken).map(pool => {
            return new SamplerContractOperation<CurveFillData>({
              source,
              fillData: { pool },
              sampler: this._sampler,
              method: 'sampleBuysFromCurve',
              params: [
                {
                  poolAddress: pool.poolAddress,
                  sellQuoteFunctionSelector: pool.sellQuoteFunctionSelector,
                  buyQuoteFunctionSelector: pool.buyQuoteFunctionSelector,
                },
                BigNumber.from(pool.sellTokenIdx),
                BigNumber.from(pool.buyTokenIdx),
                amounts,
              ],
              amounts,
            });
          });
        case BridgeSource.Smoothy:
          return findCurveLikePoolSettings(source, this._chainId, sellToken, buyToken).map(pool => {
            return new SamplerContractOperation<CurveFillData>({
              source,
              fillData: { pool },
              sampler: this._sampler,
              method: 'sampleBuysFromSmoothy',
              params: [
                {
                  poolAddress: pool.poolAddress,
                  sellQuoteFunctionSelector: pool.sellQuoteFunctionSelector,
                  buyQuoteFunctionSelector: pool.buyQuoteFunctionSelector,
                },
                BigNumber.from(pool.sellTokenIdx),
                BigNumber.from(pool.buyTokenIdx),
                amounts,
              ],
              amounts,
            });
          });
        case BridgeSource.Shell:
        case BridgeSource.Component:
          return findShellLikePoolSettings(source, this._chainId, sellToken, buyToken).map(poolAddress => {
            return new SamplerContractOperation<ShellFillData>({
              source,
              fillData: { poolAddress },
              sampler: this._sampler,
              method: 'sampleBuysFromShell',
              params: [
                poolAddress,
                sellToken,
                buyToken,
                amounts,
              ],
              amounts,
            });
          });
        case BridgeSource.MStable:
          return findShellLikePoolSettings(source, this._chainId, sellToken, buyToken).map(router => {
            return new SamplerContractOperation<GenericRouterFillData>({
              source,
              fillData: { router },
              sampler: this._sampler,
              method: 'sampleBuysFromMStable',
              params: [
                router,
                sellToken,
                buyToken,
                amounts,
              ],
              amounts,
            });
          });
        case BridgeSource.LiquidityProvider:
          return (LIQUIDITY_PROVIDER_REGISTRY[this._chainId] || [])
            .filter(({ tokens }) => tokens.includes(sellToken) && tokens.includes(buyToken))
            .map(({ poolAddress, gasCost }) => {
              return new SamplerContractOperation<LiquidityProviderFillData>({
                source,
                fillData: {
                  poolAddress,
                  gasCost: typeof gasCost === 'number' ? gasCost : gasCost(sellToken, buyToken),
                },
                sampler: this._sampler,
                method: 'sampleBuysFromLiquidityProvider',
                params: [
                  poolAddress,
                  sellToken,
                  buyToken,
                  amounts,
                ],
                amounts,
              });
            });
        case BridgeSource.Mooniswap:
          // Mooniswap uses ETH instead of WETH, represented by address(0)
          const mooniswapSellToken = sellToken === WRAPPED_NATIVE_ADDRESS[this._chainId] ? NULL_ADDRESS : sellToken;
          const mooniswapBuyToken = buyToken === WRAPPED_NATIVE_ADDRESS[this._chainId] ? NULL_ADDRESS : buyToken;

          return (MOONISWAP_REGISTRIES[this._chainId] || []).map(registry => {
            return new SamplerContractOperation<MooniswapFillData>({
              source,
              sampler: this._sampler,
              method: 'sampleBuysFromMooniswap',
              params: [
                registry,
                mooniswapSellToken,
                mooniswapBuyToken,
                amounts,
              ],
              amounts,
              callback: (callResults, fillData) => {
                const [poolAddress, outputs] = this._sampler.interface.decodeFunctionResult('sampleBuysFromMooniswap', callResults) as [string, BigNumber[]];
                fillData.poolAddress = poolAddress;

                return outputs.map<DexSample<MooniswapFillData>>((output, i) => ({
                  source: BridgeSource.Mooniswap,
                  fillData,
                  input: amounts[i],
                  output,
                }));
              },
            });
          });
        case BridgeSource.Balancer:
          return (this._poolsCaches[BridgeSource.Balancer].getCachedPoolAddressesForPair(sellToken, buyToken) || []).map(balancerPool => {
            return new SamplerContractOperation<BalancerFillData>({
              source,
              fillData: { poolAddress: balancerPool },
              sampler: this._sampler,
              method: 'sampleBuysFromBalancer',
              params: [
                balancerPool,
                sellToken,
                buyToken,
                amounts,
              ],
              amounts,
            });
          });
        case BridgeSource.BalancerV2:
          const poolIds = this._poolsCaches[BridgeSource.BalancerV2].getCachedPoolAddressesForPair(sellToken, buyToken) || [];

          const vault = BALANCER_V2_VAULT_ADDRESS[this._chainId];
          if (!vault) {
            return [];
          }
          return poolIds.map(poolId => {
            return new SamplerContractOperation<BalancerV2FillData>({
              source,
              fillData: { poolId, vault },
              sampler: this._sampler,
              method: 'sampleBuysFromBalancerV2',
              params: [
                { poolId, vault },
                sellToken,
                buyToken,
                amounts,
              ],
              amounts,
            });
          });
        case BridgeSource.Cream:
          return (this._poolsCaches[BridgeSource.Cream].getCachedPoolAddressesForPair(sellToken, buyToken) || []).map(creamPool => {
            return new SamplerContractOperation<BalancerFillData>({
              source,
              fillData: { poolAddress: creamPool },
              sampler: this._sampler,
              method: 'sampleBuysFromBalancer',
              params: [
                creamPool,
                sellToken,
                buyToken,
                amounts,
              ],
              amounts,
            });
          });
        case BridgeSource.Dodo:
          const dodoConfig = DODO_CONFIG[this._chainId];
          if (!dodoConfig) {
            return [];
          }

          return [
            new SamplerContractOperation<DodoFillData>({
              source,
              fillData: { helperAddress: dodoConfig.helper } as DodoFillData,
              sampler: this._sampler,
              method: 'sampleBuysFromDODO',
              params: [
                dodoConfig,
                sellToken,
                buyToken,
                amounts,
              ],
              amounts,
              callback: (callResults, fillData) => {
                const [isSellBase, poolAddress, outputs] = this._sampler.interface.decodeFunctionResult('sampleBuysFromDODO', callResults) as [boolean, string, BigNumber[]];
                fillData.isSellBase = isSellBase;
                fillData.poolAddress = poolAddress;

                return outputs.map<DexSample<DodoFillData>>((output, i) => ({
                  source: BridgeSource.Dodo,
                  fillData,
                  input: amounts[i],
                  output,
                }));
              },
            }),
          ];
        case BridgeSource.DodoV2:
          const dodoV2Factories = DODO_V2_FACTORIES[this._chainId];
          if (!dodoV2Factories) {
            return [];
          }
          return dodoV2Factories.map(factory => {
            return Array(DODO_V2_MAX_POOLS_QUERIED).fill(0).map((_, offset) => {
              return new SamplerContractOperation<DodoV2FillData>({
                source,
                sampler: this._sampler,
                method: 'sampleBuysFromDODOV2',
                params: [
                  factory,
                  BigNumber.from(offset),
                  sellToken,
                  buyToken,
                  amounts,
                ],
                amounts,
                callback: (callResults, fillData) => {
                  const [isSellBase, poolAddress, outputs] = this._sampler.interface.decodeFunctionResult('sampleBuysFromDODOV2', callResults) as [boolean, string, BigNumber[]];
                  fillData.isSellBase = isSellBase;
                  fillData.poolAddress = poolAddress;

                  return outputs.map<DexSample<DodoV2FillData>>((output, i) => ({
                    source: BridgeSource.DodoV2,
                    fillData,
                    input: amounts[i],
                    output,
                  }));
                },
              });
            });
          }).flat();
        case BridgeSource.Bancor:
          // Unimplemented
          // return this.getBancorBuyQuotes(buyToken, sellToken, makerFillAmounts);
          return [];
        case BridgeSource.Linkswap:
          const linkswapRouter = LINKSWAP_ROUTER[this._chainId];
          if (!linkswapRouter || this._chainId !== ChainId.MAINNET) {
            return [];
          }

          const linkswapIntermediateTokens = [TOKENS[ChainId.MAINNET].LINK, TOKENS[ChainId.MAINNET].WETH]
            .filter(token => token.toLowerCase() !== buyToken.toLowerCase() && token.toLowerCase() !== sellToken.toLowerCase())
          const linkswapPaths: string[][] = [[sellToken, buyToken], ...linkswapIntermediateTokens.map(t => [sellToken, t, buyToken])];

          return linkswapPaths.map(path => {
            return new SamplerContractOperation<UniswapV2FillData>({
              source,
              fillData: { tokenAddressPath: path, router: linkswapRouter },
              sampler: this._sampler,
              method: 'sampleBuysFromUniswapV2',
              params: [
                linkswapRouter,
                path,
                amounts,
              ],
              amounts,
            });
          });
        case BridgeSource.MakerPsm:
          const makerPsmPool: MakerPsmSettings = MAKER_PSM_CONFIG[this._chainId];
          if (!makerPsmPool) {
            return [];
          }

          return [
            new SamplerContractOperation<MakerPsmFillData>({
              source,
              fillData: {
                ...makerPsmPool,
                isSellOperation: false,
                sellToken,
                buyToken,
              },
              sampler: this._sampler,
              method: 'sampleBuysFromMakerPsm',
              params: [
                makerPsmPool,
                sellToken,
                buyToken,
                amounts,
              ],
              amounts,
            }),
          ];
        case BridgeSource.Lido: {
          const lidoConf = LIDO_POOLS_CONFIG[this._chainId];
          if (!lidoConf || sellToken.toLowerCase() !== lidoConf.wethToken.toLowerCase() || buyToken.toLowerCase() !== lidoConf.stEthToken.toLowerCase()) {
            return [];
          }
          return [
            new SamplerContractOperation<LidoFillData>({
              source,
              fillData: {
                stEthTokenAddress: lidoConf.stEthToken,
                wstEthTokenAddress: lidoConf.wethToken,
                sellToken,
                buyToken,
              },
              sampler: this._sampler,
              method: 'sampleBuysFromLido',
              params: [
                lidoConf,
                sellToken,
                buyToken,
                amounts,
              ],
              amounts,
            }),
          ];
        }
        case BridgeSource.Clipper:
          const clipperConf = CLIPPER_POOLS_CONFIG[this._chainId];
          if (!clipperConf || !clipperConf.tokens.includes(buyToken) || !clipperConf.tokens.includes(sellToken)) {
            return [];
          }

          // Clipper requires WETH to be represented as address(0)
          const adjustedSellToken = sellToken === WRAPPED_NATIVE_ADDRESS[this._chainId] ? NULL_ADDRESS : sellToken;
          const adjustedBuyToken = buyToken === WRAPPED_NATIVE_ADDRESS[this._chainId] ? NULL_ADDRESS : buyToken;

          return [
            new SamplerContractOperation<LiquidityProviderFillData>({
              source,
              fillData: {
                poolAddress: clipperConf.poolAddress,
                gasCost: 0,
              },
              sampler: this._sampler,
              method: 'sampleBuysFromLiquidityProvider',
              params: [
                clipperConf.poolAddress,
                adjustedSellToken,
                adjustedBuyToken,
                amounts,
              ],
              amounts,
            }),
          ];
        case BridgeSource.MultiHop:
          return [];
        default:
          throw new Error(`Unsupported buy sample source: ${source}`);
      }
    }).flat();
  }

  /**
   * Wraps `operations` operations into a batch call to the sampler
   * @param operations
   * @param resultHandler The handler of the parsed batch results
   * @param revertHandler The handle for when the batch operation reverts. The result data is provided as an argument
   */
  private _createBatch<T, TResult>(operations: BatchedOperation<TResult>[], resultHandler: (results: TResult[]) => T, revertHandler: (result: string) => T): BatchedOperation<T> {
    return {
      callData: this._sampler.interface.encodeFunctionData('batchCall', [operations.map(({ callData }) => callData)]),
      onSuccess: callResult => {
        const [rawSubCallResults] = this._sampler.interface.decodeFunctionResult('batchCall', callResult);

        const results = operations.map((operation, i) => {
          const { success, data } = rawSubCallResults[i];
          return success ? operation.onSuccess(data) : operation.onError(data);
        });

        return resultHandler(results);
      },
      onError: revertHandler,
    };
  }
}
