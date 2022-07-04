import { HTTPException } from '@tsed/exceptions';

export function parseRpcCallError(error: any): HTTPException {
  if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
    try {
      const errorBody = JSON.parse(error.error.body);
      return new HTTPException(500, errorBody.error.message);
    } catch (e) {
      return new HTTPException(500, error.reason);
    }
  }
  if (error.code === 'INSUFFICIENT_FUNDS') {
    return new HTTPException(500, 'Insufficient funds for intrinsic transaction cost');
  }
  if (error.code === 'CALL_EXCEPTION') {
    if (error.errorSignature === 'Error(string)') {
      return new HTTPException(500, `Contract Exception: ${error.errorArgs[0]}`);
    }
  }

  return new HTTPException(500, error.reason || error.message);

  // const serverError = getServerError(error);
  // if (!serverError) {
  //   return undefined;
  // }
  //
  // let rpcError: RpcError;
  // try {
  //   const body = JSON.parse(serverError.body);
  //   const requestBody = JSON.parse(serverError.requestBody);
  //
  //   rpcError = {
  //     code: body.error.code,
  //     message: body.error.message,
  //     data: body.error.data,
  //     requestBody: {
  //       method: requestBody.method,
  //       params: requestBody.params,
  //     }
  //   }
  // } catch (e) {
  //   return undefined;
  // }
  //
  // const result = /0x08c379a0([0-9A-Fa-f]*)/.exec(rpcError.data);
  // if (!result) {
  //   return rpcError.message;
  // }
  // try {
  //   const [, data] = result;
  //   const [message] = defaultAbiCoder.decode(['string'], `0x${data}`);
  //   rpcError.message = message;
  // } catch (e) {}
  //
  // return rpcError.message;
}

function getServerError(error: any): any {
  if (error.code === 'INSUFFICIENT_FUNDS') {
    return error;
  }
  if (error.error && error.error.code === 'SERVER_ERROR') {
    return error.error;
  }
  return undefined;
}
