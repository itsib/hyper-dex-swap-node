import { HTTPException } from '@tsed/exceptions';
import { inject } from 'inversify';
import { BaseHttpController, controller, httpGet } from 'inversify-express-utils';
import { Example, Get, Route, Tags } from 'tsoa';
import { SELL_SOURCE_FILTERS } from '../constants';
import { BridgeSource, Provider } from '../types';

@Route('/sources')
@controller('/sources')
export class SourcesController extends BaseHttpController {

  constructor(@inject('Provider') private _provider: Provider) {
    super();
  }

  /**
   * Returns supported liquidity sources for current network
   *
   * @summary Liquidity Sources
   */
  @Get('/')
  @Example<BridgeSource[]>([
    BridgeSource.Uniswap,
    BridgeSource.UniswapV2,
    BridgeSource.UniswapV3,
  ])
  @Tags('Source')
  @httpGet('/')
  async getSources(): Promise<BridgeSource[]> {
    const { chainId } = await this._provider.getNetwork();
    if (!(chainId in SELL_SOURCE_FILTERS)) {
      throw new HTTPException(500, `Unsupported chain id - ${chainId}`);
    }
    return SELL_SOURCE_FILTERS[chainId].getSources().sort((a, b) => a.localeCompare(b));
  }
}
