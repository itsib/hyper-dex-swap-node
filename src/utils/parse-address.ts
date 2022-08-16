import { getAddress } from '@ethersproject/address';
import { BadRequest } from '@tsed/exceptions';

export function parseAddress(address: string, fieldName: string): string {
  try {
    return getAddress(address).toLowerCase();
  } catch (e) {
    throw new BadRequest('Validation error', [{
      field: fieldName,
      message: `${fieldName} invalid address`,
    }]);
  }
}
