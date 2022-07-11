export interface QuoteParams {
  sellToken: string;
  buyToken: string;
  sellAmount?: string;
  buyAmount?: string;
  takerAddress?: string;
  slippagePercentage?: string;
  excludedSources?: string;
}
