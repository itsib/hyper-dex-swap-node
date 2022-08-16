import { BigNumber, Contract } from 'ethers';
import { BridgeSource, DexFillData, DexSample, SourceQuoteOperation } from '../types';
import { logger } from './logger';

export interface SamplerContractOperationOpts<TFillData> {
  source: BridgeSource;
  fillData?: TFillData;
  sampler: Contract;
  method: string;
  params: any[],
  amounts: BigNumber[],
  callback?: (callResults: string, fillData: TFillData) => DexSample<TFillData>[];
}

export class SamplerContractOperation<TFillData extends DexFillData = DexFillData> implements SourceQuoteOperation<DexSample<TFillData>[], TFillData> {
  /**
   * Used dex liquidity source
   */
  readonly source: BridgeSource;
  /**
   * Liquidity source fill data (used for the quote building and some features)
   */
  fillData: TFillData;
  /**
   * Sampler contract for encode/decode call data
   * @private
   */
  private readonly _sampler: Contract;
  /**
   * Sampler contract method name
   * @private
   */
  private readonly _method: string;
  /**
   * Sampler contract call method params
   * @private
   */
  private readonly _params: any[];
  /**
   * Sampled amount to decode call result
   * @private
   */
  private readonly _amounts: BigNumber[];
  /**
   * Success callback
   * @private
   */
  private readonly _callback?: (callResults: string, fillData: TFillData) => DexSample<TFillData>[];

  constructor(opts: SamplerContractOperationOpts<TFillData>) {
    this.source = opts.source;
    this.fillData = opts.fillData || {} as TFillData;

    this._sampler = opts.sampler;
    this._method = opts.method;
    this._params = opts.params;
    this._amounts = opts.amounts;
    this._callback = opts.callback;
  }

  /**
   * Success contract result handler.
   *
   * By default, contract methods return an array with output amount.
   * If the contract method works differently, pass the
   * callback method, and process the contract data in it.
   *
   * @param callResults
   */
  onSuccess(callResults: string): DexSample<TFillData>[] {
    if (this._callback !== undefined) {
      return this._callback(callResults, this.fillData);
    } else {
      const [outputs] = this._sampler.interface.decodeFunctionResult(this._method, callResults) as [BigNumber[]];

      return outputs.map<DexSample<TFillData>>((output, i) => {
        return {
          source: this.source,
          fillData: this.fillData,
          input: this._amounts[i] || BigNumber.from(0),
          output,
        };
      });
    }
  }

  /**
   * Handle revert contract call
   * @param callResults
   */
  onError(callResults: string): DexSample<TFillData>[] {
    logger.warn(`SamplerContractOperation: ${this.source}.${this._method} reverted`);
    return [];
  }

  /**
   * Contract method call data (hex string)
   */
  get callData(): string {
    return this._sampler.interface.encodeFunctionData(this._method, this._params);
  }
}
