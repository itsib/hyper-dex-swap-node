import Big from 'big.js';
import { BigNumber } from 'ethers';
import { BRIDGE_SOURCE_FLAGS } from '../constants';
import { BridgeSource, DexSample, ExchangeGasOverhead, GasSchedule, MarketSide, MultiHopFillData } from '../types';

/**
 * Returns the fee-adjusted rate of a two-hop quote. Returns zero if the
 * quote falls short of the target input.
 */
export const getTwoHopAdjustedRate = (
  side: MarketSide,
  twoHopQuote: DexSample<MultiHopFillData>,
  targetInput: BigNumber,
  outputAmountPerEth: string,
  gasSchedule: GasSchedule = {},
  exchangeGasOverhead: ExchangeGasOverhead = () => '0',
): string => {
  const { output, input, fillData } = twoHopQuote;
  if (input.lt(targetInput) || output.eq(0)) {
    return '0';
  }
  const exchangeGas = exchangeGasOverhead(
    BRIDGE_SOURCE_FLAGS.MultiHop |
    BRIDGE_SOURCE_FLAGS[fillData.firstHopSource.source] |
    BRIDGE_SOURCE_FLAGS[fillData.secondHopSource.source],
  )

  const multihopGas = gasSchedule[BridgeSource.MultiHop]!(fillData)

  const penalty = Big(outputAmountPerEth).times(Big(exchangeGas).plus(multihopGas)).toString();
  const adjustedOutput = side === MarketSide.Sell ? output.toBig().sub(penalty).toFixed(0) : output.toBig().add(penalty).toFixed(0);
  return side === MarketSide.Sell ? Big(adjustedOutput).div(input.toBig()).toString() : Big(input.toBig()).div(adjustedOutput).toString();
}

/**
 * Computes the "complete" rate given the input/output of a path.
 * This value penalizes the path if it falls short of the target input.
 */
export const getCompleteRate = (side: MarketSide, input: Big, output: Big, targetInput: Big): Big => {
  if (input.eq(0) || output.eq(0) || targetInput.eq(0)) {
    return Big(0);
  }
  // Penalize paths that fall short of the entire input amount by a factor of
  // input / targetInput => (i / t)
  if (side === MarketSide.Sell) {
    // (o / i) * (i / t) => (o / t)
    return output.div(targetInput);
  }
  // (i / o) * (i / t)
  return input.div(output).times(input.div(targetInput));
};

/**
 * Computes the rate given the input/output of a path.
 */
export const getRate = (side: MarketSide, input: Big, output: Big): Big => {
  if (input.eq(0) || output.eq(0)) {
    return Big(0);
  }
  return side === MarketSide.Sell ? output.div(input) : input.div(output);
};
