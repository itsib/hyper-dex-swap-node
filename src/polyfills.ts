import 'reflect-metadata';
import { BigNumber } from '@ethersproject/bignumber';
import Big from 'big.js';

declare module '@ethersproject/bignumber' {
  interface BigNumber {
    toBig(): Big;
  }
}

declare module 'big.js' {
  interface Big {
    toBigNumber(): BigNumber;
  }
}

BigNumber.prototype.toBig = function () {
  return Big(this.toString());
}

Big.prototype.toBigNumber = function () {
  return BigNumber.from(this.toFixed(0, 0));
}
