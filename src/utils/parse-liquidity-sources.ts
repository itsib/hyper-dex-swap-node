import { ERC20BridgeSource } from '@0x/asset-swapper';
import { BadRequest } from '@tsed/exceptions';

export function parseLiquiditySources(value: string | undefined, defaultSources: ERC20BridgeSource[], field: string): ERC20BridgeSource[] {
  if (!value) {
    return defaultSources;
  }
  const sources = value.split(',').map(i => i.trim()) as ERC20BridgeSource[];
  const supportedSources = Object.values(ERC20BridgeSource);
  const unsupportedSources = sources.filter(i => !supportedSources.includes(i));

  if (unsupportedSources.length) {
    throw new BadRequest('Validation error', [{
      field,
      message: `${field} unsupported liquidity sources: ${unsupportedSources.join(',')}`,
    }]);
  }

  return Array.from(new Set([...sources, ...defaultSources]));
}
