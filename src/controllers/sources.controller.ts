import { BaseProvider } from '@ethersproject/providers';
import { inject } from 'inversify';
import { BaseHttpController, controller, httpGet } from 'inversify-express-utils';
import { Example, Get, Route, Tags } from 'tsoa';
import { SELL_SOURCE_FILTER_BY_CHAIN_ID } from '../constants';
import { LiquiditySource } from '../types';
import { HTTPException } from '@tsed/exceptions';

@Route('/sources')
@controller('/sources')
export class SourcesController extends BaseHttpController {

  constructor(@inject('BaseProvider') private _provider: BaseProvider) {
    super();
  }

  /**
   * Returns supported liquidity sources for current network
   *
   * @summary Liquidity Sources
   */
  @Get('/')
  @Example<LiquiditySource[]>([
    LiquiditySource.Uniswap,
    LiquiditySource.UniswapV2,
    LiquiditySource.UniswapV3,
  ])
  @Tags('Source')
  @httpGet('/')
  async getSources(): Promise<LiquiditySource[]> {
    const { chainId } = await this._provider.getNetwork();
    if (!(chainId in SELL_SOURCE_FILTER_BY_CHAIN_ID)) {
      throw new HTTPException(500, `Unsupported chain id - ${chainId}`);
    }
    return SELL_SOURCE_FILTER_BY_CHAIN_ID[chainId].sources.sort((a, b) => a.localeCompare(b));
  }
}
