import { fetchJson } from '@ethersproject/web';
import { Web3JsV3Provider } from 'ethereum-types';
import { Provider } from '../types';

export class Web3Provider implements Web3JsV3Provider {

  private _nextId: number;

  constructor(private _provider: Provider) {
    this._nextId = 1;
  }

  async send(method: string, params?: any[]): Promise<any> {
    const id = this._nextId++;
    const request = { method, params, id, jsonrpc: '2.0' };
    return fetchJson(this._provider.connection, JSON.stringify(request));
  }
}
