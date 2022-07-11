import { BigNumber, MarketOperation, SwapQuote } from '@0x/asset-swapper';

export function getSwapQuotePrice(quote: SwapQuote): { price: BigNumber; guaranteedPrice: BigNumber } {
  const isSelling = quote.type === MarketOperation.Sell;
  const { makerAmount, totalTakerAmount } = quote.bestCaseQuoteInfo;
  const { makerAmount: guaranteedMakerAmount, totalTakerAmount: guaranteedTotalTakerAmount } = quote.worstCaseQuoteInfo;
  const roundingStrategy = isSelling ? BigNumber.ROUND_FLOOR : BigNumber.ROUND_CEIL;
  const unitMakerAmount = makerAmount.div(new BigNumber(10).pow(quote.makerTokenDecimals));
  const unitTakerAmount = totalTakerAmount.div(new BigNumber(10).pow(quote.takerTokenDecimals));
  const guaranteedUnitMakerAmount = guaranteedMakerAmount.div(new BigNumber(10).pow(quote.makerTokenDecimals));
  const guaranteedUnitTakerAmount = guaranteedTotalTakerAmount.div(new BigNumber(10).pow(quote.takerTokenDecimals));

  // Best price
  const price = isSelling
    ? unitMakerAmount
      .dividedBy(unitTakerAmount)
      .decimalPlaces(quote.makerTokenDecimals, roundingStrategy)
    : unitTakerAmount
      .dividedBy(unitMakerAmount)
      .decimalPlaces(quote.takerTokenDecimals, roundingStrategy);
  // Guaranteed price before revert occurs
  const guaranteedPrice = isSelling
    ? guaranteedUnitMakerAmount
      .dividedBy(guaranteedUnitTakerAmount)
      .decimalPlaces(quote.makerTokenDecimals, roundingStrategy)
    : guaranteedUnitTakerAmount
      .dividedBy(guaranteedUnitMakerAmount)
      .decimalPlaces(quote.takerTokenDecimals, roundingStrategy);

  return { price, guaranteedPrice };
}
