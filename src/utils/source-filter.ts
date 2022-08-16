import { BridgeSource } from '../types';

export class SourceFilter {
  // All valid sources.
  private readonly _sources: BridgeSource[];

  constructor(sources: BridgeSource[]) {
    this._sources = sources;
  }

  getSources(excluded: BridgeSource[] = []): BridgeSource[] {
    if (!excluded.length) {
      return this._sources;
    }
    return this._sources.filter(i => !excluded.includes(i));
  }
}
