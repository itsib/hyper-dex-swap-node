import { BadRequest } from '@tsed/exceptions';
import { BigNumber } from 'ethers';

export function parseAmount(value: string, fieldName: string): BigNumber {
  try {
    return BigNumber.from(value);
  } catch (e) {
    throw new BadRequest('Validation error', [{
      field: fieldName,
      message: `${fieldName} invalid amount value`,
    }]);
  }
}
