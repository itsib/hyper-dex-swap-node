import { LiquiditySource } from '../types';

export class SourceFilters {
  private readonly _validSources: LiquiditySource[];
  private readonly _excludedSources: LiquiditySource[];
  private readonly _includedSources: LiquiditySource[];

  constructor(validSources: LiquiditySource[] = [], excludedSources: LiquiditySource[] = [], includedSources: LiquiditySource[] = []) {
    this._validSources = Array.from(new Set(validSources));
    this._excludedSources = Array.from(new Set(excludedSources));
    this._includedSources = Array.from(new Set(includedSources));
  }

  /**
   * Is allowed liquidity source
   * @param source
   */
  isAllowed(source: LiquiditySource): boolean {
    // Must be in list of valid sources.
    if (this._validSources.length > 0 && !this._validSources.includes(source)) {
      return false;
    }
    // Must not be excluded.
    if (this._excludedSources.includes(source)) {
      return false;
    }
    // If we have an inclusion list, it must be in that list.
    return !(this._includedSources.length > 0 && !this._includedSources.includes(source));
  }

  /**
   * Returns supported sources
   */
  get sources(): LiquiditySource[] {
    return this._validSources.filter(s => this.isAllowed(s));
  }
}
