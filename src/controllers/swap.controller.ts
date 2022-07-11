import { inject } from 'inversify';
import { BaseHttpController, controller, httpPost, requestBody } from 'inversify-express-utils';
import { Body, Example, Post, Route, Tags } from 'tsoa';
import { POST_QUOTE_REQUEST_SCHEMA } from '../schemas/post-quote-request.schema';
import { SwapService } from '../services';
import { QuoteParams } from '../types';
import { validatorMiddlewareFactory } from '../utils';

@Route('/swap')
@controller('/swap')
export class SwapController extends BaseHttpController {
  constructor(@inject('SwapService') private _swapService: SwapService) {
    super();
  }

  /**
   * Nearly identical to /swap/quote, but with a few key differences:
   * Rather than returning a transaction that can be submitted to an Ethereum node,
   * this resource simply indicates the pricing that would be
   * available for an analogous call to /swap/quote.
   *
   * @summary Get Swap quote
   */
  @Post('/quote')
  @Example<QuoteParams>({
    sellToken: '0xaD6D458402F60fD3Bd25163575031ACDce07538D',
    buyToken: '0x07865c6E87B9F70255377e024ace6630C1Eaa37F',
    sellAmount: '9995002498750625',
    takerAddress: '0xf18A3af576c7871fEA9f8F3E54e8d0E71C98F206',
    slippagePercentage: '0.01',
    excludedSources: 'Uniswap,Uniswap_V3',
  })
  @Tags('Swap')
  @httpPost('/quote', validatorMiddlewareFactory(POST_QUOTE_REQUEST_SCHEMA))
  async postPrice(@requestBody() @Body() body: QuoteParams) {
    return this._swapService.getQuote(body);
  }
}
