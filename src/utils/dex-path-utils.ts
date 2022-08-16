import Big from 'big.js';
import { BigNumber } from 'ethers';
import { SAMPLER_RUN_LIMIT } from '../constants';
import {
  DexFill,
  DexSample,
  ExchangeGasOverhead,
  GasSchedule,
  MarketSide,
  MarketSideLiquidity,
  MultiHopFillData,
} from '../types';
import { compareTo } from './compare-to';
import { DexPath, DexPathPenaltyOpts } from './dex-path';
import { getTwoHopAdjustedRate } from './fees-utils';

/**
 * Create and sort dex path
 * @param side
 * @param fills
 * @param targetInput
 * @param opts
 */
export const fillsToSortedPaths = (side: MarketSide, fills: DexFill[][], targetInput: BigNumber, opts: DexPathPenaltyOpts): DexPath[] => {
  const paths = fills.map(singleSourceFills => DexPath.create(side, singleSourceFills, targetInput, opts));

  return paths.sort((a, b) => {
    let aRate: string;
    let bRate: string;

    // There is a case where the adjusted completed rate isn't sufficient for the desired amount
    try {
      aRate = a.adjustedCompleteRate();
    } catch (e) {
      return 1;
    }

    try {
      bRate = b.adjustedCompleteRate();
    } catch (e) {
      return -1;
    }

    return compareTo(bRate, aRate);
  });
};

/**
 * Find the optimal mixture of fills that maximizes (for sells) or minimizes
 * (for buys) output, while meeting the input requirement.
 */
export const findOptimalDexPathAsync = async (side: MarketSide, sortedPaths: DexPath[], targetInput: BigNumber): Promise<DexPath | undefined> => {
  const runLimitDecayFactor = 0.5;
  const runLimit = SAMPLER_RUN_LIMIT;

  // Remove any paths which cannot impact the optimal path
  const paths = reducePaths(sortedPaths);
  const rates = rateBySourcePathId(paths);

  let optimalPath = paths[0];
  for (const [i, path] of paths.slice(1).entries()) {
    optimalPath = mixPaths(side, optimalPath, path, targetInput, runLimit * runLimitDecayFactor ** i, rates);
    // Yield to event loop.
    await Promise.resolve();
  }
  return optimalPath.isComplete() ? optimalPath : undefined;
};

/**
 * Returns the best two-hop quote and the fee-adjusted rate of that quote.
 */
export const getBestTwoHopQuote = (
  marketSideLiquidity: Omit<MarketSideLiquidity, 'makerTokenDecimals' | 'takerTokenDecimals'>,
  gasSchedule?: GasSchedule,
  exchangeOverhead?: ExchangeGasOverhead,
): { quote: DexSample<MultiHopFillData> | undefined; adjustedRate: string } => {
  const { side, inputAmount, outputAmountPerEth, samples } = marketSideLiquidity;
  const { twoHopSamples } = samples;
  // Ensure the expected data we require exists. In the case where all hops reverted
  // or there were no sources included that allowed for multi hop,
  // we can end up with empty, but not undefined, fill data
  const filteredQuotes = twoHopSamples.filter(quote => quote && quote.fillData && quote.fillData.firstHopSource && quote.fillData.secondHopSource && quote.output.gt(0));
  if (filteredQuotes.length === 0) {
    return { quote: undefined, adjustedRate: '0' };
  }
  return filteredQuotes
    .map(quote => getTwoHopAdjustedRate(side, quote, inputAmount, outputAmountPerEth, gasSchedule, exchangeOverhead))
    .reduce((prev, curr, i) => {
      return Big(curr).gt(prev.adjustedRate) ? { adjustedRate: curr, quote: filteredQuotes[i] } : prev;
    }, {
      adjustedRate: getTwoHopAdjustedRate(
        side,
        filteredQuotes[0],
        inputAmount,
        outputAmountPerEth,
        gasSchedule,
        exchangeOverhead,
      ),
      quote: filteredQuotes[0],
    });
}

/**
 * Find the best dex path
 * @param side
 * @param pathA
 * @param pathB
 * @param targetInput
 * @param maxSteps
 * @param rates
 */
export const mixPaths = (side: MarketSide, pathA: DexPath, pathB: DexPath, targetInput: BigNumber, maxSteps: number, rates: { [id: string]: string }): DexPath => {
  const _maxSteps = Math.max(maxSteps, 32);
  let steps = 0;
  // We assume pathA is the better of the two initially.
  let bestPath: DexPath = pathA;

  const _walk = (path: DexPath, remainingFills: DexFill[]) => {
    steps += 1;
    if (path.isBetterThan(bestPath)) {
      bestPath = path;
    }
    const remainingInput = targetInput.toBig().minus(path.size().input);
    if (remainingInput.gt(0)) {
      for (let i = 0; i < remainingFills.length && steps < _maxSteps; ++i) {
        const fill = remainingFills[i];
        // Only walk valid paths.
        if (!path.isValidNextFill(fill)) {
          continue;
        }
        // Remove this fill from the next list of candidate fills.
        const nextRemainingFills = remainingFills.slice();
        nextRemainingFills.splice(i, 1);
        // Recurse.
        _walk(DexPath.clone(path).append(fill), nextRemainingFills);
      }
    }
  };

  const allFills = [...pathA.fills(), ...pathB.fills()];
  // Sort sub paths by rate and keep fills contiguous to improve our
  // chances of walking ideal, valid paths first.
  const sortedFills = allFills.sort((a, b) => {
    if (a.id !== b.id) {
      return compareTo(rates[b.id], rates[a.id]);
    }
    return a.index - b.index;
  });
  _walk(DexPath.create(side, [], targetInput, pathA.penaltyOpts()), sortedFills);
  if (!bestPath.isValid()) {
    throw new Error('nooope');
  }
  return bestPath;
};

/**
 * Remove paths which have no impact on the optimal path
 * @param sortedPaths
 */
export const reducePaths = (sortedPaths: DexPath[]): DexPath[] => {
  // Any path which has a min rate that is less than the best adjusted completed rate has no chance of improving
  // the overall route.
  const bestCompletePath = sortedPaths.filter(path => path.isComplete())[0];

  // If there is no complete path then just go ahead with the sorted paths
  // I.e. if the token only exists on sources which cannot sell to infinity
  // or buys where X is greater than all the tokens available in the pools
  if (!bestCompletePath) {
    return sortedPaths;
  }
  const bestCompletePathAdjustedRate = bestCompletePath.adjustedCompleteRate();
  if (!Big(bestCompletePathAdjustedRate).gte(0)) {
    return sortedPaths;
  }

  return sortedPaths.filter(path => Big(path.bestRate()).gte(bestCompletePathAdjustedRate));
};

/**
 * Indexing rate by source id
 * @param paths
 */
export const rateBySourcePathId = (paths: DexPath[]): { [id: string]: string } => {
  return paths.reduce<{ [id: string]: string }>((acc, path) => {
    acc[path.id()] = path.adjustedRate();
    return acc;
  }, {});
};
