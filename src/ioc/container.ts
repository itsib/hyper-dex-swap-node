import { sync } from 'glob';
import { Container } from 'inversify';
import { join } from 'path';
import { CONFIG } from '../config';
import { ISwapService, SwapService, IOptionsService, OptionsService } from '../services';
import { Provider } from '../types';
import { getProvider } from '../utils';

/**
 * Dynamic import all controllers
 */
const [, ext] = __filename.match(/\.(\w+)$/);
sync(join(__dirname, '../controllers', '**', `*.controller.${ext}`)).forEach((filename: string): void => require(filename));

/**
 * Creates container that will contain all dependencies
 */
const container = new Container({ defaultScope: 'Singleton' });

container.bind<Provider>('Provider').toConstantValue(getProvider(CONFIG.RPC_URL));
container.bind<ISwapService>('SwapService').to(SwapService);
container.bind<IOptionsService>('OptionsService').to(OptionsService);

export { container };
