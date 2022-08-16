import { ExchangeGasOverhead } from '../fees/exchange-gas-overhead';
import { GasSchedule } from '../fees/gas-schedule';
import { BridgeSource } from '../quote/bridge-source';

export interface SamplerOptions {
  /**
   * Liquidity sources to exclude.
   */
  excludedSources?: BridgeSource[];
  /**
   * When generating bridge orders, we use sampled rate * (1 - bridgeSlippage) as the
   * rate for calculating maker/taker asset amounts. This should be a small
   * positive number (e.g., 0.0005) to make up for small discrepancies
   * between samples and truth. Default is 0.0005 (5 basis points).
   */
  slippagePercentage?: number;
  /**
   * Estimated gas consumed by each liquidity source.
   */
  gasSchedule?: GasSchedule;
  /**
   * Exchange proxy overhead
   */
  exchangeOverhead?: ExchangeGasOverhead;
}
