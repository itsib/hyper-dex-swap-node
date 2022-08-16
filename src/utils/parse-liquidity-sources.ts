import { BadRequest } from '@tsed/exceptions';
import { BridgeSource } from '../types';

export function parseLiquiditySources(value: string | undefined, defaultSources: BridgeSource[], field: string): BridgeSource[] {
  if (!value) {
    return defaultSources;
  }
  const sources = value.split(',').map(i => i.trim()) as BridgeSource[];
  const supportedSources = Object.values(BridgeSource);
  const unsupportedSources = sources.filter(i => !supportedSources.includes(i));

  if (unsupportedSources.length) {
    throw new BadRequest('Validation error', [{
      field,
      message: `${field} unsupported liquidity sources: ${unsupportedSources.join(',')}`,
    }]);
  }

  return Array.from(new Set([...sources, ...defaultSources]));
}
