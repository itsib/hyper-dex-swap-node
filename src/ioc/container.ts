import { sync } from 'glob';
import * as inversify from 'inversify';
import { Container } from 'inversify';
import { join } from 'path';
import { CONFIG } from '../config';
import { SamplerService, SwapService } from '../services';
import { SwapConsumerService } from '../services/swap-consumer-service';
import { ChainId, Provider } from '../types';
import { getProvider, logger } from '../utils';

/**
 * Dynamic import all controllers
 */
const [, ext] = __filename.match(/\.(\w+)$/);
sync(join(__dirname, '../controllers', '**', `*.controller.${ext}`)).forEach((filename: string): void => require(filename));

/**
 * Container factory
 */
export async function buildContainer(): Promise<inversify.interfaces.Container> {
  const provider = getProvider(CONFIG.RPC_URL);
  const supportedChainIds: ChainId[] = Object.values(ChainId).filter((i: any) => typeof i === 'number') as ChainId[];
  const { chainId } = await provider.getNetwork();

  logger.info(`RPC_URL: ${CONFIG.RPC_URL}`);
  logger.info(`CHAIN_ID: ${chainId}`);

  if (!supportedChainIds.includes(chainId)) {
    throw new Error(`Unsupported chain id - ${chainId}`);
  }

  /**
   * Creates container that will contain all dependencies
   */
  const container = new Container({ defaultScope: 'Singleton' });

  container.bind<Provider>('Provider').toConstantValue(getProvider(CONFIG.RPC_URL));
  container.bind<ChainId>('ChainId').toConstantValue(chainId);
  container.bind<SwapService>('SwapService').to(SwapService);
  container.bind<SamplerService>('SamplerService').to(SamplerService);
  container.bind<SwapConsumerService>('SwapConsumerService').to(SwapConsumerService);

  return container;
}
