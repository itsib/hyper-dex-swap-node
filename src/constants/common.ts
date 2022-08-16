import { BigNumber } from 'ethers';

export const ONE_SECOND_MS = 1000;
export const ONE_MINUTE_MS = 60 * ONE_SECOND_MS;
export const ONE_HOUR_MS = 60 * ONE_MINUTE_MS
export const ONE_DAY_MS = 24 * ONE_HOUR_MS;

export const NULL_BYTES = '0x';
export const ONE_ETHER = BigNumber.from(10).pow(18);
export const MAX_UINT256 = BigNumber.from(2).pow(256).sub(1);
export const ZERO_AMOUNT = BigNumber.from(0);
