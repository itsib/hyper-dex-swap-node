import axios from 'axios';
import Big from 'big.js';
import {
  BALANCER_MAX_POOLS_FETCHED,
  BALANCER_SUBGRAPH_URL,
  BALANCER_TOP_POOLS_FETCHED,
  BALANCER_V2_SUBGRAPH_URL, CREAM_SUBGRAPH_URL,
  ONE_DAY_MS,
  ONE_HOUR_MS,
} from '../constants';
import { ChainId, Pool, PoolCache, RawBalancerPool, RawBalancerV2Pool, RawBalancerV2PoolWithSwaps } from '../types';
import { logger } from './logger';

export abstract class PoolsCache {

  private _cache: { [key: string]: PoolCache };

  protected readonly _cacheTimeMs: number;

  protected readonly _timeoutMs: number;

  protected static _isExpired(value: PoolCache): boolean {
    return Date.now() >= value.expiresAt;
  }

  protected constructor(cacheTimeMs) {
    this._cache = {};
    this._cacheTimeMs = cacheTimeMs;
    this._timeoutMs = 1000;
  }

  async getFreshPoolsForPairAsync(sellToken: string, buyToken: string): Promise<Pool[]> {
    const timeout = new Promise<Pool[]>(resolve => setTimeout(resolve, this._timeoutMs, []));
    return Promise.race([this._getAndSaveFreshPoolsForPairAsync(sellToken, buyToken), timeout]);
  }

  getCachedPoolAddressesForPair(sellToken: string, buyToken: string, ignoreExpired: boolean = true): string[] | undefined {
    const key = JSON.stringify([sellToken, buyToken]);
    const value = this._cache[key];
    if (ignoreExpired) {
      return value === undefined ? [] : value.pools.map(pool => pool.id);
    }
    if (!value) {
      return undefined;
    }
    if (PoolsCache._isExpired(value)) {
      return undefined;
    }
    return (value.pools || []).map(pool => pool.id);
  }

  isFresh(sellToken: string, buyToken: string): boolean {
    const cached = this.getCachedPoolAddressesForPair(sellToken, buyToken, false);
    return cached !== undefined;
  }

  protected async _getAndSaveFreshPoolsForPairAsync(sellToken: string, buyToken: string): Promise<Pool[]> {
    const key = JSON.stringify([sellToken, buyToken]);
    const value = this._cache[key];
    if (value === undefined || value.expiresAt >= Date.now()) {
      const pools = await this._fetchPoolsForPair(sellToken, buyToken);
      const expiresAt = Date.now() + this._cacheTimeMs;
      this._cachePoolsForPair(sellToken, buyToken, pools, expiresAt);
    }
    return this._cache[key].pools;
  }

  protected _cachePoolsForPair(sellToken: string, buyToken: string, pools: Pool[], expiresAt: number): void {
    const key = JSON.stringify([sellToken, buyToken]);
    this._cache[key] = {
      pools,
      expiresAt,
    };
  }

  protected abstract _fetchPoolsForPair(sellToken: string, buyToken: string): Promise<Pool[]>;
}

export class BalancerPoolsCache extends PoolsCache {

  private readonly _subgraphUrl: string | undefined;

  private readonly _topPoolsFetched: number;

  private readonly _maxPoolsFetched: number;

  /**
   * Returns standard pool info
   * @param rawPool
   * @param from - In token address
   * @param to - Out token address
   * @private
   */
  static parseRawPool(rawPool: RawBalancerPool, from: string, to: string): Pool | undefined {
    const tokenIn = rawPool.tokens.find(token => token.address.toLowerCase() === from.toLowerCase());
    const tokenOut = rawPool.tokens.find(token => token.address.toLowerCase() === to.toLowerCase());

    const pool: Pool = {
      id: rawPool.id,
      balanceIn: Big(tokenIn.balance).times(Big(10).pow(tokenIn.decimals)).toFixed(0, 0),
      balanceOut: Big(tokenOut.balance).times(Big(10).pow(tokenOut.decimals)).toFixed(0, 0),
      weightIn: Big(tokenIn.denormWeight).div(rawPool.totalWeight).times(Big(10).pow(18)).toFixed(0, 0),
      weightOut: Big(tokenOut.denormWeight).div(rawPool.totalWeight).times(Big(10).pow(18)).toFixed(0, 0),
      swapFee: Big(rawPool.swapFee).times(Big(10).pow(18)).toFixed(0, 0),
    };
    if (Big(pool.balanceIn).gt(0) && Big(pool.balanceOut).gt(0)) {
      return pool;
    } else {
      return undefined;
    }
  }

  constructor(chainId: ChainId) {
    super(ONE_HOUR_MS / 2);
    this._subgraphUrl = BALANCER_SUBGRAPH_URL[chainId];
    this._topPoolsFetched = BALANCER_TOP_POOLS_FETCHED;
    this._maxPoolsFetched = BALANCER_MAX_POOLS_FETCHED;

    void this._loadTopPools();
    // Reload the top pools every 12 hours
    setInterval(async () => void this._loadTopPools(), ONE_DAY_MS / 2);
  }

  protected async _fetchPoolsForPair(sellToken: string, buyToken: string): Promise<Pool[]> {
    try {
      const rawPools = await this._fetchPoolsByTokens(sellToken, buyToken);
      // Sort by maker token balance (descending)
      const pools = rawPools
        .map(rawPool => BalancerPoolsCache.parseRawPool(rawPool, sellToken, buyToken))
        .filter(Boolean)
        .sort((poolA, poolB) => Big(poolB.balanceOut).minus(poolA.balanceOut).toNumber());

      return pools.length > this._maxPoolsFetched ? pools.slice(0, this._maxPoolsFetched) : pools;
    } catch (err) {
      return [];
    }
  }

  /**
   * To load raw pools and parse it
   * @private
   */
  private async _loadTopPools(): Promise<void> {
    const fromToPools: { [from: string]: { [to: string]: Pool[] } } = {};
    const rawPools = await this._fetchTopPools();

    for (const rawPool of rawPools) {
      const { tokensList } = rawPool;
      for (const from of tokensList) {
        for (const to of tokensList.filter(t => t.toLowerCase() !== from.toLowerCase())) {
          fromToPools[from] = fromToPools[from] || {};
          fromToPools[from][to] = fromToPools[from][to] || [];

          try {
            // The list of pools must be relevant to `from` and `to`  for `parsePoolData`
            const pool = BalancerPoolsCache.parseRawPool(rawPool, from, to);
            if (pool) {
              fromToPools[from][to].push(pool);
              // Cache this as we progress through
              const expiresAt = Date.now() + this._cacheTimeMs;
              this._cachePoolsForPair(from, to, fromToPools[from][to], expiresAt);
            }
          } catch (e) {
            logger.error(e);
          }
        }
      }
    }
  }

  /**
   * Fetch Balancer pools from the graph
   * @protected
   */
  private async _fetchTopPools(): Promise<RawBalancerPool[]> {
    if (!this._subgraphUrl) {
      return [];
    }

    const query = `query fetchTopPools($topPoolsFetched: Int!) {
      pools(
          first: $topPoolsFetched
          where: { publicSwap: true, liquidity_gt: 0 }
          orderBy: swapsCount
          orderDirection: desc
      ) {
        id
        publicSwap
        swapFee
        totalWeight
        tokensList
        tokens {
          id
          address
          balance
          decimals
          symbol
          denormWeight
        }
      }
    }`.replace(/\s+/g, ' ');

    try {
      const { data: { data: { pools } } } = await axios({
        url: this._subgraphUrl,
        method: 'POST',
        data: JSON.stringify({
          query,
          variables: {
            topPoolsFetched: this._topPoolsFetched,
          },
        }),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      return pools;
    } catch (err) {
      return [];
    }
  }

  /**
   * Fetch one pool by tokens
   * @param sellToken
   * @param buyToken
   * @private
   */
  private async _fetchPoolsByTokens(sellToken: string, buyToken: string): Promise<RawBalancerPool[]> {
    if (!this._subgraphUrl) {
      return [];
    }

    const query = `query ($tokens: [Bytes!]) {
      pools (first: 1000, where: {tokensList_contains: $tokens, publicSwap: true}) {
        id
        publicSwap
        swapFee
        totalWeight
        tokensList
        tokens {
          id
          address
          balance
          decimals
          symbol
          denormWeight
        }
      }
    }`.replace(/\s+/g, ' ');

    try {
      const { data: { data: { pools } } } = await axios({
        url: this._subgraphUrl,
        method: 'POST',
        data: JSON.stringify({
          query,
          variables: {
            tokens: [sellToken, buyToken],
          },
        }),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      return pools;
    } catch (e) {
      console.error(e);
    }
  }
}

export class BalancerV2PoolsCache extends PoolsCache {

  private readonly _subgraphUrl: string | undefined;

  private readonly _topPoolsFetched: number;

  private readonly _maxPoolsFetched: number;

  /**
   * Returns standard pool info
   * @param rawPool
   * @param from - In token address
   * @param to - Out token address
   * @private
   */
  static parseRawPool(rawPool: RawBalancerV2Pool | RawBalancerV2PoolWithSwaps, from: string, to: string): Pool | undefined {
    const tokenIn = rawPool.tokens.find(token => token.address.toLowerCase() === from.toLowerCase());
    const tokenOut = rawPool.tokens.find(token => token.address.toLowerCase() === to.toLowerCase());

    const swap = (rawPool as RawBalancerV2PoolWithSwaps).swaps && (rawPool as RawBalancerV2PoolWithSwaps).swaps[0];
    const tokenAmountOut = swap ? swap.tokenAmountOut : undefined;
    const tokenAmountIn = swap ? swap.tokenAmountIn : undefined;
    const spotPrice = tokenAmountOut && tokenAmountIn ? Big(tokenAmountOut).div(tokenAmountIn).toString() : undefined;

    return {
      id: rawPool.id,
      balanceIn: tokenIn.balance,
      balanceOut: tokenOut.balance,
      weightIn: tokenIn.weight,
      weightOut: tokenOut.weight,
      swapFee: rawPool.swapFee,
      spotPrice,
    };
  }

  constructor(chainId: ChainId) {
    super(ONE_HOUR_MS / 2);

    this._subgraphUrl = BALANCER_V2_SUBGRAPH_URL[chainId];
    this._topPoolsFetched = BALANCER_TOP_POOLS_FETCHED;
    this._maxPoolsFetched = BALANCER_MAX_POOLS_FETCHED;

    void this._loadTopPools();
    // Reload the top pools every 12 hours
    setInterval(async () => void this._loadTopPools(), ONE_DAY_MS / 2);
  }

  protected async _fetchPoolsForPair(sellToken: string, buyToken: string): Promise<Pool[]> {
    try {
      const rawPools = await this._fetchPoolsByTokens(sellToken, buyToken);
      return rawPools.map(rawPool => BalancerV2PoolsCache.parseRawPool(rawPool, sellToken, buyToken))
    } catch (err) {
      return [];
    }
  }

  /**
   * To load raw pools and parse it
   * @private
   */
  private async _loadTopPools(): Promise<void> {
    const fromToPools: { [from: string]: { [to: string]: Pool[] } } = {};
    const rawPools = await this._fetchTopPools();

    for (const rawPool of rawPools) {
      const { tokensList } = rawPool;
      for (const from of tokensList) {
        for (const to of tokensList.filter(t => t.toLowerCase() !== from.toLowerCase())) {
          fromToPools[from] = fromToPools[from] || {};
          fromToPools[from][to] = fromToPools[from][to] || [];

          try {
            // The list of pools must be relevant to `from` and `to`  for `parsePoolData`
            const pool = BalancerV2PoolsCache.parseRawPool(rawPool, from, to);
            fromToPools[from][to].push(pool);
            // Cache this as we progress through
            const expiresAt = Date.now() + this._cacheTimeMs;
            this._cachePoolsForPair(from, to, fromToPools[from][to], expiresAt);
          } catch (err) {
            logger.error(`Failed to load Balancer V2 top pools`);
            logger.error(err);
          }
        }
      }
    }
  }

  /**
   * Fetch Balancer V2 pools from the graph
   * @protected
   */
  private async _fetchTopPools(): Promise<RawBalancerV2Pool[]> {
    if (!this._subgraphUrl) {
      return [];
    }

    const query = `query fetchTopPools($topPoolsFetched: Int!) {
      pools(
          first: $topPoolsFetched
          where: { totalLiquidity_gt: 0 }
          orderBy: swapsCount
          orderDirection: desc
      ) {
        id
        swapFee
        totalWeight
        amp
        totalShares
        tokensList
        tokens {
          id
          address
          balance
          decimals
          symbol
          weight
        }
      }
    }`.replace(/\s+/g, ' ');

    try {
      const { data: { data: { pools } } } = await axios({
        url: this._subgraphUrl,
        method: 'POST',
        data: JSON.stringify({
          query,
          variables: {
            topPoolsFetched: this._topPoolsFetched,
          },
        }),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      return pools;
    } catch (err) {
      return [];
    }
  }

  /**
   * Fetch pools by tokens
   * @param sellToken
   * @param buyToken
   * @private
   */
  private async _fetchPoolsByTokens(sellToken: string, buyToken: string): Promise<RawBalancerV2PoolWithSwaps[]> {
    if (!this._subgraphUrl) {
      return [];
    }

    const query = `query {
      pools(first: ${this._maxPoolsFetched}, where: { tokensList_contains: ["${sellToken}", "${buyToken}"] }) {
        id
        swapFee
        tokens {
          address
          balance
          weight
        }
        swaps( orderBy: timestamp, orderDirection: desc, first: 1, where: { tokenIn: "${sellToken}", tokenOut: "${buyToken}" } ) {
          tokenAmountIn
          tokenAmountOut
        }
      }
    }`.replace(/\s+/g, ' ');

    try {
      const { data: { data: { pools } } } = await axios({
        url: this._subgraphUrl,
        method: 'POST',
        data: JSON.stringify({ query }),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      return pools;
    } catch (err) {
      return [];
    }
  }
}

export class CreamPoolsCache extends PoolsCache {

  private readonly _subgraphUrl: string | undefined;

  private readonly _maxPoolsFetched: number;

  constructor(chainId: ChainId) {
    super(ONE_HOUR_MS / 2);

    this._subgraphUrl = CREAM_SUBGRAPH_URL[chainId];
    this._maxPoolsFetched = BALANCER_MAX_POOLS_FETCHED;
  }

  protected async _fetchPoolsForPair(sellToken: string, buyToken: string): Promise<Pool[]> {
    try {
      const rawPools = await this._fetchPoolsByTokens(sellToken, buyToken);
      // Sort by maker token balance (descending)
      const pools = rawPools
        .map(rawPool => BalancerPoolsCache.parseRawPool(rawPool, sellToken, buyToken))
        .filter(Boolean)
        .sort((poolA, poolB) => Big(poolB.balanceOut).minus(poolA.balanceOut).toNumber())

      return pools.slice(0, this._maxPoolsFetched);
    } catch (err) {
      return [];
    }
  }

  /**
   * Fetch pools by tokens from Cream subgraph
   * @param sellToken
   * @param buyToken
   * @private
   */
  private async _fetchPoolsByTokens(sellToken: string, buyToken: string): Promise<RawBalancerPool[]> {
    if (!this._subgraphUrl) {
      return [];
    }

    const query = `
      query ($tokens: [Bytes!]) {
        pools (first: 1000, where: {tokensList_contains: $tokens, publicSwap: true}) {
          id
          publicSwap
          swapFee
          totalWeight
          tokensList
          tokens {
            id
            address
            balance
            decimals
            symbol
            denormWeight
          }
        }
      }
    `.replace(/\s+/g, ' ');

    try {
      const { data: { data: { pools } } } = await axios({
        url: this._subgraphUrl,
        method: 'POST',
        data: JSON.stringify({
          query,
          variables: {
            tokens: [sellToken, buyToken],
          },
        }),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      return pools;
    } catch (err) {
      return [];
    }
  }
}
