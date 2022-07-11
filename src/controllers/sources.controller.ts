import { ERC20BridgeSource, SELL_SOURCE_FILTER_BY_CHAIN_ID } from '@0x/asset-swapper';
import { HTTPException } from '@tsed/exceptions';
import { inject } from 'inversify';
import { BaseHttpController, controller, httpGet } from 'inversify-express-utils';
import { Example, Get, Route, Tags } from 'tsoa';
import { Provider } from '../types';

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
  @Example<ERC20BridgeSource[]>([
    ERC20BridgeSource.Uniswap,
    ERC20BridgeSource.UniswapV2,
    ERC20BridgeSource.UniswapV3,
  ])
  @Tags('Source')
  @httpGet('/')
  async getSources(): Promise<ERC20BridgeSource[]> {
    const { chainId } = await this._provider.getNetwork();
    if (!(chainId in SELL_SOURCE_FILTER_BY_CHAIN_ID)) {
      throw new HTTPException(500, `Unsupported chain id - ${chainId}`);
    }
    return SELL_SOURCE_FILTER_BY_CHAIN_ID[chainId].sources
      .map((s) => (s === ERC20BridgeSource.Native ? '0x' : s))
      .sort((a, b) => a.localeCompare(b));
  }
}
