import { Query } from '@tsoa/runtime/dist/decorators/parameter';
import { inject } from 'inversify';
import { BaseHttpController, controller, httpGet, httpPost, requestBody } from 'inversify-express-utils';
import { queryParam } from 'inversify-express-utils/lib/decorators';
import { Body, Example, Get, Post, Route, Tags } from 'tsoa';
import { QUOTE_REQUEST_SCHEMA } from '../schemas/quote-request.schema';
import { SwapService } from '../services';
import { SwapQuoteQuery, SwapQuoteResponse } from '../types';
import { validatorMiddlewareFactory } from '../utils';

@Route('/swap')
@controller('/swap')
export class SwapController extends BaseHttpController {
  constructor(@inject('SwapService') private _swapService: SwapService) {
    super();
  }

  /**
   * Get an easy-to-consume quote for buying or selling any ERC20 token.
   * The return format is a valid unsigned Ethereum transaction and can be submitted
   * directly to an Ethereum node (or the nodes of other chains if applicable)
   * to complete the swap. For transactions where the sellToken is not ETH, you will
   * have to set your allowances.
   *
   * @summary Get Swap quote
   */
  @Post('/quote')
  @Example<SwapQuoteQuery>({
    sellToken: '0xad6d458402f60fd3bd25163575031acdce07538d',
    buyToken: '0x07865c6e87b9f70255377e024ace6630c1eaa37f',
    sellAmount: '9995002498750625',
    takerAddress: '0xf18a3af576c7871fea9f8f3e54e8d0e71c98f206',
    slippagePercentage: '0.005',
    excludedSources: 'Uniswap,Uniswap_V3',
  })
  @Tags('Swap')
  @httpPost('/quote', validatorMiddlewareFactory(QUOTE_REQUEST_SCHEMA, 'body'))
  async postQuote(@requestBody() @Body() body: SwapQuoteQuery): Promise<SwapQuoteResponse> {
    return this._swapService.getQuote(body);
  }

  /**
   * Get an easy-to-consume quote for buying or selling any ERC20 token.
   * The return format is a valid unsigned Ethereum transaction and can be submitted
   * directly to an Ethereum node (or the nodes of other chains if applicable)
   * to complete the swap. For transactions where the sellToken is not ETH, you will
   * have to set your allowances.
   *
   * @summary Get Swap quote
   */
  @Get('/quote')
  @Example<SwapQuoteQuery>({
    sellToken: '0xad6d458402f60fd3bd25163575031acdce07538d',
    buyToken: '0x07865c6e87b9f70255377e024ace6630c1eaa37f',
    sellAmount: '9995002498750625',
    takerAddress: '0xf18a3af576c7871fea9f8f3e54e8d0e71c98f206',
    slippagePercentage: '0.005',
    excludedSources: 'Uniswap,Uniswap_V3',
  })
  @Tags('Swap')
  @httpGet('/quote', validatorMiddlewareFactory(QUOTE_REQUEST_SCHEMA, 'query'))
  async getQuote(
    @queryParam('sellToken') @Query() sellToken: SwapQuoteQuery['sellToken'],
    @queryParam('buyToken') @Query() buyToken: SwapQuoteQuery['buyToken'],
    @queryParam('sellAmount') @Query() sellAmount?: SwapQuoteQuery['sellAmount'],
    @queryParam('buyAmount') @Query() buyAmount?: SwapQuoteQuery['buyAmount'],
    @queryParam('takerAddress') @Query() takerAddress?: SwapQuoteQuery['takerAddress'],
    @queryParam('slippagePercentage') @Query() slippagePercentage?: SwapQuoteQuery['slippagePercentage'],
    @queryParam('excludedSources') @Query() excludedSources?: SwapQuoteQuery['excludedSources'],
  ): Promise<SwapQuoteResponse> {
    return this._swapService.getQuote({sellToken, buyToken, sellAmount, buyAmount, takerAddress, slippagePercentage, excludedSources});
  }
}
