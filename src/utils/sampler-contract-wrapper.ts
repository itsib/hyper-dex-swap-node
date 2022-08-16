import { BlockTag, Provider, TransactionRequest } from '@ethersproject/abstract-provider';
import { deepCopy, Deferrable, resolveProperties } from '@ethersproject/properties';
import { fetchJson } from '@ethersproject/web';
import { Contract } from 'ethers';
import samplerAbi from '../abi/ERC20BridgeSampler.json';
import samplerBuild from '../artifacts/contracts/ERC20BridgeSampler.sol/ERC20BridgeSampler.json';
import { NULL_BYTES, SAMPLER_ADDRESS } from '../constants';
import { BatchedOperation, BatchedOperationResult } from '../types';

function getResult(payload: { error?: { code?: number, data?: any, message?: string }, result?: any }): any {
  if (payload.error) {
    // @TODO: not any
    const error: any = new Error(payload.error.message);
    error.code = payload.error.code;
    error.data = payload.error.data;
    throw error;
  }

  return payload.result;
}

export class SamplerContractWrapper extends Contract {
  /**
   * Default sampler calls gas limit
   * @private
   */
  private readonly _defaultGasLimit: string;

  constructor(provider?: Provider) {
    super(SAMPLER_ADDRESS, samplerAbi, provider);

    this._defaultGasLimit = `0x${(500e6).toString(16)}`;

    // Rewrite the call for override support
    async function callFn(transaction: Deferrable<TransactionRequest>, blockTag?: BlockTag | Promise<BlockTag>): Promise<string> {
      await this.getNetwork();

      const resolved = await resolveProperties({
        transaction: this._getTransactionRequest(transaction),
        blockTag: this._getBlockTag(blockTag),
      });

      // Set default gas limit
      if (!resolved.transaction.gasLimit) {
        resolved.transaction.gasLimit = `0x${(500e6).toString(16)}`;
      }

      const request = {
        method: 'eth_call',
        params: [
          resolved.transaction,
          resolved.blockTag,
          { [resolved.transaction.to]: { code: samplerBuild.deployedBytecode } },
        ],
        id: (this._nextId++),
        jsonrpc: '2.0',
      };

      this.emit('debug', {
        action: 'request',
        request: deepCopy(request),
        provider: this,
      });

      return fetchJson(this.connection, JSON.stringify(request), getResult)
        .then((result) => {
          this.emit('debug', {
            action: 'response',
            request: request,
            response: result,
            provider: this,
          });

          return result;

        })
        .catch((error) => {
          this.emit('debug', {
            action: 'response',
            error: error,
            request: request,
            provider: this,
          });

          throw error;
        });
    }

    provider.call = callFn.bind(provider);
  }

  public async execute<T1>(...operations: [T1]): Promise<[BatchedOperationResult<T1>]>;
  public async execute<T1, T2>(...operations: [T1, T2]): Promise<[BatchedOperationResult<T1>, BatchedOperationResult<T2>]>;
  public async execute<T1, T2, T3>(...operations: [T1, T2, T3]): Promise<[BatchedOperationResult<T1>, BatchedOperationResult<T2>, BatchedOperationResult<T3>]>;
  public async execute<T1, T2, T3, T4>(...operations: [T1, T2, T3, T4]): Promise<[
    BatchedOperationResult<T1>,
    BatchedOperationResult<T2>,
    BatchedOperationResult<T3>,
    BatchedOperationResult<T4>
  ]>;
  public async execute<T1, T2, T3, T4, T5>(...operations: [T1, T2, T3, T4, T5]): Promise<[
    BatchedOperationResult<T1>,
    BatchedOperationResult<T2>,
    BatchedOperationResult<T3>,
    BatchedOperationResult<T4>,
    BatchedOperationResult<T5>
  ]>;
  public async execute<T1, T2, T3, T4, T5, T6>(...operations: [T1, T2, T3, T4, T5, T6]): Promise<[
    BatchedOperationResult<T1>,
    BatchedOperationResult<T2>,
    BatchedOperationResult<T3>,
    BatchedOperationResult<T4>,
    BatchedOperationResult<T5>,
    BatchedOperationResult<T6>
  ]>;
  public async execute<T1, T2, T3, T4, T5, T6, T7>(...operations: [T1, T2, T3, T4, T5, T6, T7]): Promise<[
    BatchedOperationResult<T1>,
    BatchedOperationResult<T2>,
    BatchedOperationResult<T3>,
    BatchedOperationResult<T4>,
    BatchedOperationResult<T5>,
    BatchedOperationResult<T6>,
    BatchedOperationResult<T7>
  ]>;
  public async execute<T1, T2, T3, T4, T5, T6, T7, T8>(...operations: [T1, T2, T3, T4, T5, T6, T7, T8]): Promise<[
    BatchedOperationResult<T1>,
    BatchedOperationResult<T2>,
    BatchedOperationResult<T3>,
    BatchedOperationResult<T4>,
    BatchedOperationResult<T5>,
    BatchedOperationResult<T6>,
    BatchedOperationResult<T7>,
    BatchedOperationResult<T8>
  ]>;
  /**
   * Run a series of operations in a single transaction.
   */
  public async execute(...operations: any[]): Promise<any[]> {
    return this._executeOperations(operations);
  }

  /**
   * Run a series of operations in a single transaction.
   * Takes an arbitrary length array, but is not typesafe.
   */
  private async _executeOperations<T extends Array<BatchedOperation<any>>>(operations: T): Promise<any[]> {
    const callDatas = operations.map(({ callData }) => callData);

    // All operations are NOOPs
    if (callDatas.every(callData => callData === NULL_BYTES)) {
      return operations.map(operation => operation.onSuccess(NULL_BYTES));
    }

    // Execute all non-empty callDatas.
    const rawCallResults = await this.callStatic.batchCall(callDatas.filter(callData => callData !== NULL_BYTES));

    // Return the parsed results.
    let rawCallResultsIdx = 0;
    return operations.map(operation => {
      const { data, success } = operation.callData !== NULL_BYTES ? rawCallResults[rawCallResultsIdx++] : { success: true, data: NULL_BYTES };

      return success ? operation.onSuccess(data) : operation.onError(data);
    });
  }
}
