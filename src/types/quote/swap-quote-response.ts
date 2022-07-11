import { ChainId } from '../common/chain-id';
import { SwapQuoteLiquiditySource } from './swap-quote-liquidity-source';

export interface SwapQuoteResponse {
  /**
   * Current chain ID
   */
  chainId: ChainId;
  /**
   * The amount of buyToken (in buyToken units) that would be bought
   * in this swap. Certain on-chain sources do not
   * allow specifying buyAmount, when using buyAmount these sources are excluded.
   */
  buyAmount: string;
  /**
   * The amount of sellToken (in sellToken units) that would be
   * sold in this swap. Specifying sellAmount is the
   * recommended way to interact with Hyper DEX API as it covers all on-chain sources.
   */
  sellAmount: string;
  /**
   * The ERC20 token address of the token you want to receive in quote.
   */
  buyTokenAddress: string;
  /**
   * The ERC20 token address of the token you want to sell with quote.
   */
  sellTokenAddress: string;
  /**
   * The target contract address for which the
   * user needs to have an allowance in order to be able
   * to complete the swap. For swaps with "ETH"
   * as sellToken, wrapping "ETH" to "WETH" or
   * unwrapping "WETH" to "ETH" no allowance is needed,
   * a null address of 0x0000000000000000000000000000000000000000 is then returned instead.
   */
  allowanceTarget?: string;
  /**
   * If buyAmount was specified in the request it provides the price
   * of buyToken in sellToken and vice versa. This price does not
   * include the slippage provided in the request above, and therefore represents the best possible price.
   */
  price: string;
  /**
   * The price which must be met or else the entire transaction will revert.
   * This price is influenced by the slippagePercentage parameter.
   * On-chain sources may encounter price movements from quote to settlement.
   */
  guaranteedPrice: string;
  /**
   * The percentage distribution of buyAmount or sellAmount
   * split between each liquidity source.
   * Ex: [{ name: '0x', proportion: "0.8" }, { name: 'Kyber', proportion: "0.2"}, ...]
   */
  sources: SwapQuoteLiquiditySource[];
  /**
   * The rate between ETH and sellToken
   */
  sellTokenToEthRate: string;
  /**
   * The rate between ETH and buyToken
   */
  buyTokenToEthRate: string;
  /**
   * The maximum amount of ether that will be paid
   * towards the protocol fee (in wei), and what
   * is used to compute the value field of the transaction.
   */
  protocolFee: string;
  /**
   * The minimum amount of ether that will
   * be paid towards the protocol fee (in wei)
   * during the transaction.
   */
  minimumProtocolFee: string;
  /**
   * Taker account address
   */
  from: string;
  /**
   * The address of the contract to send call data to.
   */
  to: string;
  /**
   * The amount of ether (in wei) that should be sent with the transaction.
   * (Assuming protocolFee is paid in ether).
   */
  value: string;
  /**
   * The call data required to be sent to the to contract address.
   */
  data: string;
}
