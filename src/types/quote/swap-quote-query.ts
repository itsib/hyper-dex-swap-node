export interface SwapQuoteQuery {
  /**
   * The ERC 20 token address or symbol of the token you want to sell. Native token such as "ETH" can be provided as a 'NATIVE' keyword.
   */
  sellToken: string;
  /**
   * The ERC 20 token address or symbol of the token you want to receive. Native token such as "ETH" can be provided as a 'NATIVE' keyword.
   */
  buyToken: string;
  /**
   * The amount of sellToken (in sellToken base units) you want to send.
   */
  sellAmount?: string;
  /**
   * The amount of buyToken (in buyToken base units) you want to receive.
   */
  buyAmount?: string;
  /**
   * The address which will fill the quote.
   */
  takerAddress?: string;
  /**
   * The maximum acceptable slippage of the buyToken amount if sellAmount is provided;
   * The maximum acceptable slippage of the sellAmount amount if buyAmount is provided.
   * E.g 0.03 for 3% slippage allowed.
   */
  slippagePercentage?: string;
  /**
   * Liquidity sources (Uniswap, SushiSwap, 0x, Curve etc) that will not be
   * included in the provided quote. See here for a full list of sources
   */
  excludedSources?: string;
}
