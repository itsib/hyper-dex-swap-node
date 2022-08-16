import Big from 'big.js';
import { BigNumber } from 'ethers';
import { CollapsedDexFill, CreateDexOrderOpts, DexFill, DexOrder, ExchangeGasOverhead, MarketSide } from '../types';
import { createDexOrder, getBuySellTokens } from './dex-order-utils';
import { getCompleteRate, getRate } from './fees-utils';
import { logger } from './logger';

export interface DexPathPenaltyOpts {
  outputAmountPerEth: string;
  inputAmountPerEth: string;
  exchangeOverhead: ExchangeGasOverhead;
}

export interface DexPathSize {
  input: Big;
  output: Big;
}

export class DexPath {

  collapsedFills?: ReadonlyArray<CollapsedDexFill>;

  orders?: DexOrder[];
  /**
   * Sell or Buy
   */
  readonly side: MarketSide;

  private readonly _fills: DexFill[];

  private readonly _targetInput: BigNumber;

  private readonly _inputAmountPerEth: Big;

  private readonly _outputAmountPerEth: Big;

  private readonly _exchangeOverhead: ExchangeGasOverhead;

  private _size: DexPathSize;

  private _adjustedSize: DexPathSize;
  /**
   * Determines which sources of liquidity DexPath uses
   * @private
   */
  private _sourceFlags: bigint;

  public static create(side: MarketSide, fills: DexFill[], targetInput: BigNumber, opts: DexPathPenaltyOpts) {
    const path = new DexPath(side, fills, targetInput, opts);
    fills.forEach(fill => {
      path._sourceFlags |= fill.flags;
      path._addFillSize(fill);
    });
    return path;
  }

  public static clone(base: DexPath): DexPath {
    const clonedPath = new DexPath(base.side, base.fills().slice(), base.targetInput(), base.penaltyOpts());
    clonedPath._sourceFlags = base._sourceFlags;
    clonedPath._size = { ...base._size };
    clonedPath._adjustedSize = { ...base._adjustedSize };
    clonedPath.collapsedFills = base.collapsedFills === undefined ? undefined : base.collapsedFills.slice();
    clonedPath.orders = base.orders === undefined ? undefined : base.orders.slice();
    return clonedPath;
  }

  protected constructor(side: MarketSide, fills: DexFill[], targetInput: BigNumber, opts: DexPathPenaltyOpts) {
    this.side = side;
    this._fills = fills;
    this._targetInput = targetInput;
    this._inputAmountPerEth = Big(opts.inputAmountPerEth);
    this._outputAmountPerEth = Big(opts.outputAmountPerEth);
    this._exchangeOverhead = opts.exchangeOverhead;

    this._size = { input: Big('0'), output: Big('0') };
    this._adjustedSize = { input: Big('0'), output: Big('0') };
    this._sourceFlags = BigInt(0);
  }

  /**
   * Append new dex fill to dex path
   * @param fill
   */
  append(fill: DexFill): this {
    this._fills.push(fill);
    this._sourceFlags |= fill.flags;
    this._addFillSize(fill);
    return this;
  }

  /**
   * Collapse this path
   * @param opts
   */
  collapse(opts: CreateDexOrderOpts): CollapsedDexPath {
    const [makerToken, takerToken] = getBuySellTokens(opts);
    const collapsedFills = this.collapsedFills === undefined ? this._collapseFills() : this.collapsedFills;
    this.orders = [];
    for (let i = 0; i < collapsedFills.length;) {
      // If there are contiguous bridge orders, we can batch them together.
      const contiguousBridgeFills = [collapsedFills[i]];
      for (let j = i + 1; j < collapsedFills.length; ++j) {
        contiguousBridgeFills.push(collapsedFills[j]);
      }

      this.orders.push(createDexOrder(contiguousBridgeFills[0], makerToken, takerToken, opts.side));
      i += 1;
    }
    return this as CollapsedDexPath;
  }

  /**
   * Returns source path id from first dex fill
   */
  id(): string {
    return this._fills[0].id;
  }

  /**
   * Get dex path size
   */
  size(): { input: string; output: string } {
    return {
      input: this._size.input.toString(),
      output: this._size.output.toString(),
    };
  }

  /**
   * Returns dex fills array
   */
  fills(): DexFill[] {
    return this._fills;
  }

  /**
   * Returns target input as string number
   */
  targetInput(): BigNumber {
    return this._targetInput;
  }

  /**
   * Returns sources of liquidity DexPath uses
   */
  sourceFlags(): bigint {
    return this._sourceFlags;
  }

  /**
   * Returns penalty pptions from current path
   */
  penaltyOpts(): DexPathPenaltyOpts {
    return {
      outputAmountPerEth: this._outputAmountPerEth.toString(),
      inputAmountPerEth: this._inputAmountPerEth.toString(),
      exchangeOverhead: this._exchangeOverhead,
    };
  }

  /**
   * Computes the "complete" rate given the input/output of a path.
   */
  adjustedCompleteRate(): string {
    const { input, output } = this._getAdjustedSize();
    return getCompleteRate(this.side, input, output, Big(this._targetInput.toString())).toString();
  }

  /**
   * Computes the rate given the input/output of a path.
   */
  adjustedRate(): string {
    const { input, output } = this._getAdjustedSize();
    return getRate(this.side, input, output).toString();
  }

  /**
   * Returns the best possible rate this path can offer, given the fills.
   */
  bestRate(): string {
    const best = this._fills.reduce((prevRate, curr) => {
      const currRate = getRate(this.side, Big(curr.input.toString()), Big(curr.output.toString()));
      return prevRate.lt(currRate) ? currRate : prevRate;
    }, new Big(0));

    return best.toString();
  }

  /**
   * Returns true if the current DexPath is better than the one passed.
   * @param other
   */
  isBetterThan(other: DexPath): boolean {
    if (!this._targetInput.eq(other.targetInput())) {
      throw new Error(`Target input mismatch: ${this._targetInput.toString()} !== ${other.targetInput()}`);
    }
    const { input } = this._size;
    const { input: otherInput } = other.size();
    if (input.lt(this._targetInput.toString()) || Big(otherInput).lt(this._targetInput.toString())) {
      return input.gt(otherInput);
    } else {
      return Big(this.adjustedCompleteRate()).gt(other.adjustedCompleteRate());
    }
  }

  /**
   * Does Path close the entire exchange
   */
  isComplete(): boolean {
    const { input } = this._size;
    return input.gte(this._targetInput.toString());
  }

  /**
   * Validate fills in this dex path
   * @param skipDuplicateCheck
   */
  isValid(skipDuplicateCheck: boolean = false): boolean {
    for (let i = 0; i < this._fills.length; ++i) {
      // Fill must immediately follow its parent.
      if (this._fills[i].parent) {
        if (i === 0 || this._fills[i - 1] !== this._fills[i].parent) {
          return false;
        }
      }
      if (!skipDuplicateCheck) {
        // Fill must not be duplicated.
        for (let j = 0; j < i; ++j) {
          if (this._fills[i] === this._fills[j]) {
            return false;
          }
        }
      }
    }
    return true;
  }

  /**
   * Validate the fill
   * @param fill
   */
  isValidNextFill(fill: DexFill): boolean {
    if (this._fills.length === 0) {
      return !fill.parent;
    }
    if (this._fills[this._fills.length - 1] === fill.parent) {
      return true;
    }
    return !fill.parent;
  }

  /**
   * Returns adjusted DexPathSize taking gas fee
   * @private
   */
  private _getAdjustedSize(): DexPathSize {
    try {
      const { input, output } = this._adjustedSize;
      const exchangeOverhead = this._exchangeOverhead(this._sourceFlags);
      const pathPenalty = !this._outputAmountPerEth.eq(0)
        ? this._outputAmountPerEth.times(exchangeOverhead)
        : this._inputAmountPerEth.times(exchangeOverhead).times(output.div(input).round(0, 0));

      return {
        input,
        output: this.side === MarketSide.Sell ? output.minus(pathPenalty) : output.plus(pathPenalty),
      };
    } catch (e) {
      logger.error('Couldn\'t calculate adjusted dex path size');
      throw e;
    }
  }

  /**
   * Add fill size to path size
   * @param fill
   * @private
   */
  private _addFillSize(fill: DexFill): void {
    if (this._size.input.add(fill.input.toBig()).gt(this._targetInput.toBig())) {
      const remainingInput = this._targetInput.toBig().sub(this._size.input);
      const scaledFillOutput = fill.output.toBig().times(remainingInput.div(fill.input.toBig()));
      this._size.input = this._targetInput.toBig();
      this._size.output = this._size.output.add(scaledFillOutput);
      // Penalty does not get interpolated.
      const penalty = Big(fill.adjustedOutput).minus(fill.output.toBig());
      this._adjustedSize.input = this._targetInput.toBig();
      this._adjustedSize.output = this._adjustedSize.output.plus(scaledFillOutput).plus(penalty);
    } else {
      this._size.input = this._size.input.plus(fill.input.toBig());
      this._size.output = this._size.output.plus(fill.output.toBig());
      this._adjustedSize.input = this._adjustedSize.input.plus(fill.input.toBig());
      this._adjustedSize.output = this._adjustedSize.output.plus(fill.adjustedOutput);
    }
  }

  /**
   * Collapse dex fills
   * @private
   */
  private _collapseFills(): ReadonlyArray<CollapsedDexFill> {
    this.collapsedFills = [];
    for (const fill of this._fills) {
      if (this.collapsedFills.length !== 0) {
        const prevFill = this.collapsedFills[this.collapsedFills.length - 1];
        // If the last fill is from the same source, merge them.
        if (prevFill.id === fill.id) {
          prevFill.input = prevFill.input.add(fill.input);
          prevFill.output = prevFill.output.add(fill.output);
          prevFill.fillData = fill.fillData;
          prevFill.subFills.push(fill);
          continue;
        }
      }
      (this.collapsedFills as CollapsedDexFill[]).push({
        id: fill.id,
        source: fill.source,
        fillData: fill.fillData,
        input: fill.input,
        output: fill.output,
        subFills: [fill],
      });
    }
    return this.collapsedFills;
  }
}

export interface CollapsedDexPath extends DexPath {
  readonly collapsedFills: ReadonlyArray<CollapsedDexFill>;
  readonly orders: DexOrder[];
}
