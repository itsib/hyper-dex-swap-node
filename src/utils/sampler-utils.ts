import Big from 'big.js';
import { randomBytes } from 'crypto';
import { BigNumber } from 'ethers';
import {
  BRIDGE_SOURCE_FLAGS,
  CURVE_LIKE_POOLS,
  KYBER_BANNED_RESERVES,
  KYBER_BRIDGED_LIQUIDITY_PREFIX,
  NULL_BYTES,
  SAMPLER_AMOUNT_NUM_SAMPLES,
  SAMPLER_AMOUNT_SAMPLE_DISTRIBUTION_BASE,
  SHELL_LIKE_POOLS,
  TOKEN_ADJACENCY_GRAPH_BY_CHAIN_ID,
} from '../constants';
import {
  BridgeSource,
  ChainId,
  CurveBridgeSource,
  CurvePoolSettings,
  DexFill,
  DexSample,
  GasSchedule,
  MarketSide,
} from '../types';

/**
 * Given a token pair, returns the intermediate tokens to consider for two-hop routes.
 * @param chainId
 * @param buyToken
 * @param sellToken
 * @private
 */
export const getIntermediateTokens = (chainId: ChainId, buyToken: string, sellToken: string): string[] => {
  const intermediateTokens: string[] = [
    ...(TOKEN_ADJACENCY_GRAPH_BY_CHAIN_ID[chainId][buyToken.toLowerCase()] || []),
    ...(TOKEN_ADJACENCY_GRAPH_BY_CHAIN_ID[chainId][sellToken.toLowerCase()] || []),
    ...TOKEN_ADJACENCY_GRAPH_BY_CHAIN_ID[chainId].default,
  ];
  return intermediateTokens.filter(token => token.toLowerCase() !== buyToken.toLowerCase() && token.toLowerCase() !== sellToken.toLowerCase())
};

/**
 * Split the payment into an increasing list of payments
 * @param amount
 * @private
 */
export const getSampleAmounts = (amount: BigNumber): BigNumber[] => {
  const distribution: Big[] = [...Array(SAMPLER_AMOUNT_NUM_SAMPLES)].map((_, i) => Big(SAMPLER_AMOUNT_SAMPLE_DISTRIBUTION_BASE).pow(i));
  const distributionSum: Big = distribution.reduce((sum, d) => sum.add(d), Big(0));
  const stepSizes: Big[] = distribution.map(d => d.div(distributionSum));

  return stepSizes.map((_, i) => {
    if (i === SAMPLER_AMOUNT_NUM_SAMPLES - 1) {
      return amount;
    }
    const multiplier = stepSizes.slice(0, i + 1).reduce((sum, i) => sum.add(i), Big(0));
    return amount.toBig().mul(multiplier).toBigNumber();
  });
};

/**
 * Build the fills objects by quotes samples
 * @param side
 * @param samples
 * @param targetInput
 * @param outAmountPerEth
 * @param inAmountPerEth
 * @param gasSchedule
 */
export const dexSamplesToFills = (side: MarketSide, samples: DexSample[], targetInput: BigNumber, outAmountPerEth: string, inAmountPerEth: string, gasSchedule: GasSchedule): DexFill[] => {
  const id = randomBytes(32).toString('hex');
  const fills: DexFill[] = [];
  // Drop any non-zero entries. This can occur if any fills on Kyber were UniswapReserves
  // We need not worry about Kyber fills going to UniswapReserve as the input amount
  // we fill is the same as we sampled. I.e. we received [0,20,30] output from [1,2,3] input
  // and we only fill [2,3] on Kyber (as 1 returns 0 output)
  const nonzeroSamples = samples.filter(q => q.output.gt(0));
  for (let i = 0; i < nonzeroSamples.length; i++) {
    const sample = nonzeroSamples[i];
    const prevSample = i === 0 ? undefined : nonzeroSamples[i - 1];
    const input = sample.input.sub(prevSample ? prevSample.input : 0);
    const output = sample.output.sub(prevSample ? prevSample.output : 0);
    const getGasFee = gasSchedule[sample.source]
    const gasFee = getGasFee === undefined ? 0 : getGasFee!(sample.fillData) || 0;

    let penalty = '0';
    if (i === 0) {
      // Only the first fill in a DEX path incurs a penalty.
      penalty = outAmountPerEth !== '0'
        ? Big(outAmountPerEth).times(gasFee).toString()
        : Big(inAmountPerEth).times(gasFee).times(Big(output.toString()).div(input.toNumber()).round(0, 0)).toString();
    }
    const adjustedOutput = side === MarketSide.Sell ? Big(output.toString()).minus(penalty).toString() : Big(output.toString()).plus(penalty).toString();

    fills.push({
      id,
      input,
      output,
      adjustedOutput,
      source: sample.source,
      fillData: sample.fillData,
      index: i,
      parent: i !== 0 ? fills[fills.length - 1] : undefined,
      flags: BRIDGE_SOURCE_FLAGS[sample.source],
    });
  }

  // Clip fills to input amount
  const clippedFills: DexFill[] = [];
  let input = BigNumber.from(0);
  for (const fill of fills) {
    if (input.gte(targetInput)) {
      break;
    }
    input = input.add(fill.input);
    clippedFills.push(fill);
  }

  return clippedFills;
};

/**
 * Filter Kyber reserves which should not be used (0xbb bridged reserves)
 * @param reserveId Kyber reserveId
 */
export const isAllowedKyberReserveId = (reserveId: string): boolean => {
  return (
    reserveId !== NULL_BYTES &&
    !reserveId.startsWith(KYBER_BRIDGED_LIQUIDITY_PREFIX) &&
    !KYBER_BANNED_RESERVES.includes(reserveId)
  );
};

/**
 * Returns Curve like pool configuration
 * @param source
 * @param chainId
 * @param sellToken
 * @param buyToken
 */
export const findCurveLikePoolSettings = (source: CurveBridgeSource, chainId: ChainId, sellToken: string, buyToken: string): CurvePoolSettings[] => {
  const settings = CURVE_LIKE_POOLS[source]?.[chainId];
  if (!settings) {
    return [];
  }

  const poolSettings = settings.filter(({ tokens, metaTokens }) => {
    return tokens.every(t => {
      return (tokens.includes(t) && metaTokens === undefined) || (tokens.includes(t) && [buyToken, sellToken].filter(v => metaTokens?.includes(v)).length > 0);
    });
  });

  return poolSettings.map(pool => {
    return {
      ...pool,
      buyTokenIdx: pool.tokens.indexOf(buyToken),
      sellTokenIdx: pool.tokens.indexOf(sellToken),
    };
  });
};

/**
 * Returns Shell like pool configuration
 * @param source
 * @param chainId
 * @param sellToken
 * @param buyToken
 */
export const findShellLikePoolSettings = (source: BridgeSource.Shell | BridgeSource.Component | BridgeSource.MStable, chainId: ChainId, sellToken: string, buyToken: string): string[] => {
  return (SHELL_LIKE_POOLS[source]?.[chainId] || [])
    .filter(({ tokens }) => tokens.includes(sellToken) && tokens.includes(buyToken))
    .map(({ pool }) => pool);
}
