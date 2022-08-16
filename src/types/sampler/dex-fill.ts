import { BigNumber } from 'ethers';
import { BridgeSource } from '../quote/bridge-source';
import { DexFillData } from './dex-fill-data';

export interface DexFill<TFillData extends DexFillData = DexFillData> {
  /**
   * Unique ID of the original source path this fill belongs to.
   * This is generated when the path is generated and is useful to distinguish
   * paths that have the same `source` IDs but are distinct (e.g., Curves).
   */
  id: string;
  /**
   * Fill source
   */
  source: BridgeSource;
  /**
   * Quote fill data
   */
  fillData: TFillData;
  /**
   * Input fill amount (taker asset amount in a sell, maker asset amount in a buy).
   */
  input: BigNumber;
  /**
   * Output fill amount (maker asset amount in a sell, taker asset amount in a buy).
   */
  output: BigNumber;
  /**
   * The output fill amount, ajdusted by fees.
   */
  adjustedOutput: string;
  /**
   * Fill that must precede this one. This enforces certain fills to be contiguous.
   */
  parent?: DexFill;
  /**
   * The index of the fill in the original path.
   */
  index: number;
  /**
   * See `BRIDGE_SOURCE_FLAGS`.
   */
  flags: bigint;
}

/**
 * Represents continuous fills on a path that have been merged together.
 */
export interface CollapsedDexFill<TFillData extends DexFillData = DexFillData> {
  /**
   * Unique ID of the original source path this fill belongs to.
   * This is generated when the path is generated and is useful to distinguish
   * paths that have the same `source` IDs but are distinct (e.g., Curves).
   */
  id: string;
  /**
   * Fill source
   */
  source: BridgeSource;
  /**
   * Quote fill data
   */
  fillData: TFillData;
  /**
   * Total input amount (sum of `subFill`s)
   */
  input: BigNumber;
  /**
   * Total output amount (sum of `subFill`s)
   */
  output: BigNumber;
  /**
   * Quantities of all the fills that were collapsed.
   */
  subFills: {
    input: BigNumber;
    output: BigNumber;
  }[];
}
