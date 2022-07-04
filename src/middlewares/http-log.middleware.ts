import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils';

export const httpLogMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const hasShowBody = !!Object.keys(req.body).length;
  logger.debug(`Request: ${req.method} ${req.url} ${hasShowBody ? 'BODY: ' : ''}`);

  if (hasShowBody) {
    console.log(bodyShortify(req.body));
  }

  next();
}

function bodyShortify(data: any) {
  if (Array.isArray(data)) {
    return data.map(i => bodyShortify(i));
  }
  switch (typeof data) {
    case 'bigint':
    case 'function':
    case 'undefined':
    case 'boolean':
    case 'number':
    case 'symbol':
      return data;
    case 'string':
      if (data.length <= 42) {
        return data;
      } else {
        return `${data.substring(0, 18)}...${data.substring(data.length - 18)}`
      }
    case 'object':
      if (data === null) {
        return null;
      } else {
        return Object.keys(data).reduce((acc, key) => {
          acc[key] = bodyShortify(data[key]);
          return acc;
        }, {})
      }
  }
}
