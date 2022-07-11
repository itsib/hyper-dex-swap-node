import {
  BigNumber,
  ERC20BridgeSource,
  SELL_SOURCE_FILTER_BY_CHAIN_ID,
  SwapQuote,
  SwapQuoteOrdersBreakdown,
} from '@0x/asset-swapper';
import { ChainId, SwapQuoteLiquiditySource } from '../types';

export function getSwapQuoteSources(quote: SwapQuote, chainId: ChainId): SwapQuoteLiquiditySource[] {
  const sourceBreakdown: SwapQuoteOrdersBreakdown = quote.sourceBreakdown;
  const defaultSourceBreakdown: SwapQuoteOrdersBreakdown[] = Object.assign(
    {},
    // TODO Jacob SELL is a superset of BUY, but may not always be
    ...Object.values(SELL_SOURCE_FILTER_BY_CHAIN_ID[chainId].sources).map((s) => ({ [s as any]: new BigNumber(0) })),
  );

  return Object.entries({ ...defaultSourceBreakdown, ...sourceBreakdown }).reduce<SwapQuoteLiquiditySource[]>((acc, [source, breakdown]) => {
    let obj;
    if (source === ERC20BridgeSource.MultiHop && !BigNumber.isBigNumber(breakdown)) {
      obj = {
        ...(breakdown as any)!,
        name: ERC20BridgeSource.MultiHop,
        proportion: `${+(breakdown as any)!.proportion.toPrecision(4)}`,
      };
    } else {
      obj = {
        name: source === ERC20BridgeSource.Native ? '0x' : source,
        proportion: `${+(breakdown as BigNumber).toPrecision(4)}`,
      };
    }
    return [...acc, obj];
  }, []);
}
