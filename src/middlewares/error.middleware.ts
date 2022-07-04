import { NextFunction, Request, Response } from 'express';
import { HTTPException } from '@tsed/exceptions';
import { logger, parseRpcCallError } from '../utils';

export const errorMiddleware = (error: HTTPException | Error, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof HTTPException) {
    if (error.status >= 500) {
      logger.error(error);

      res.status(error.status).json({ status: error.status, message: error.message });
    } else {
      logger.warn(error);

      if (error.status === 400) {
        res.status(error.status).json({ status: error.status, message: error.message, validationErrors: error.body || [] });
      } else {
        res.status(error.status).json({ status: error.status, message: error.message });
      }
    }
  } else {
    const parsedException: HTTPException = parseRpcCallError(error);

    logger.error(parsedException);
    logger.error(parsedException.stack);
    res.status(parsedException.status).json({ status: parsedException.status, message: parsedException.message });
  }
};
