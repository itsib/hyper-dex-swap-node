import { BridgeSource } from '../quote/bridge-source';
import { DexFillData } from '../sampler/dex-fill-data';

export type GasScheduleEstimate = (fillData?: DexFillData) => string | number;
export type GasSchedule = { [key in BridgeSource]?: GasScheduleEstimate };
