export interface SwapQuoteLiquiditySource {
  /**
   * Liquidity source name
   */
  name: string;
  /**
   * Shows how much interest the source of liquidity is used
   */
  proportion: string;
  intermediateToken?: string;
  hops?: string[];
}
