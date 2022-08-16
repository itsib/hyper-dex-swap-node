import { BridgeSource } from '../quote/bridge-source';
import { DexFillData } from './dex-fill-data';

export interface BatchedOperation<TResult> {
  callData: string;
  onSuccess(callResults: string): TResult;
  onError(callResults: string): TResult;
}

export interface SourceQuoteOperation<TResult, TFillData extends DexFillData = DexFillData> extends BatchedOperation<TResult> {
  readonly source: BridgeSource;
  fillData: TFillData;
}
