import Big, { BigSource } from 'big.js';

/**
 *  Returns |                                                               |
 * :-------:|:--------------------------------------------------------------|
 *     1    | If the value of "a" is greater than the value of "b"
 *    -1    | If the value of "a" is less than the value of "b"
 *     0    | If "a" and "b" have the same value
 *    NaN   | If the value of either is invalid
 *
 * @param a
 * @param b
 */
export const compareTo = (a: BigSource, b: BigSource): number => {
  try {
    const bA = Big(a);
    const bB = Big(b);
    return bA.eq(bB) ? 0 : bA.gt(bB) ? 1 : -1;
  } catch (e) {
    return NaN;
  }
};
