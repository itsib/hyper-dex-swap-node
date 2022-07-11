import { NextFunction, Request, Response } from 'express';
import { BadRequest, HTTPException } from '@tsed/exceptions';
import { logger, parseRpcCallError } from '../utils';

export const errorMiddleware = (error: HTTPException | Error, req: Request, res: Response, next: NextFunction) => {
  if ((error as any).type === 'HTTP_EXCEPTION') {
    const status = (error as HTTPException).status;

    if (status >= 500) {
      logger.error(error);

      res.status(status).json({ status: status, message: error.message });
    } else {
      logger.warn(error);

      if (status === 400) {
        res.status(status).json({ status: status, message: error.message, validationErrors: (error as BadRequest).body || [] });
      } else {
        res.status(status).json({ status: status, message: error.message });
      }
    }
  } else {
    const parsedException: HTTPException = parseRpcCallError(error);

    logger.error(parsedException);
    logger.error(parsedException.stack);
    res.status(parsedException.status).json({ status: parsedException.status, message: parsedException.message });
  }
};
