import { BatchedOperation } from './batched-operation';

export type BatchedOperationResult<T> = T extends BatchedOperation<infer TResult> ? TResult : never;
