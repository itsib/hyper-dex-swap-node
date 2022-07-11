import { SwapQuoteRequestOpts } from '@0x/asset-swapper/lib/src/types';

export const DEFAULT_QUOTE_OPTS: Partial<SwapQuoteRequestOpts> = {
  bridgeSlippage: 0.01, // 1% Slippage
  maxFallbackSlippage: 0.015, // 1.5% Slippage in a fallback route
  numSamples: 5,
  sampleDistributionBase: 1.25,
  runLimit: 2 ** 8,
  shouldGenerateQuoteReport: true,
  shouldIncludePriceComparisonsReport: false,
};
