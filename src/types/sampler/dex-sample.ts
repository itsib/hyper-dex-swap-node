import { BigNumber } from 'ethers';
import { BridgeSource } from '../quote/bridge-source';
import { DexFillData } from './dex-fill-data';

export interface DexSample<TFillData extends DexFillData = DexFillData> {
  source: BridgeSource;
  fillData: TFillData;
  input: BigNumber;
  output: BigNumber;
}
