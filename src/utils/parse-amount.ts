import { BadRequest } from '@tsed/exceptions';
import { BigNumber } from '@0x/asset-swapper';

export function parseAmount(value: string, fieldName: string): BigNumber {
  try {
    return new BigNumber(value);
  } catch (e) {
    throw new BadRequest('Validation error', [{
      field: fieldName,
      message: `${fieldName} invalid amount value`,
    }]);
  }
}
