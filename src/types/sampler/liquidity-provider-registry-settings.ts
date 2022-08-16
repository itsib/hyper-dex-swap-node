export interface LiquidityProviderRegistrySettings {
  poolAddress: string;
  tokens: string[];
  gasCost: number | ((takerToken: string, makerToken: string) => number);
}
