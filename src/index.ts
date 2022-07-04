import './polyfills';
import { InversifyExpressServer } from 'inversify-express-utils';
import { resolve } from 'path';
import { NotFound } from '@tsed/exceptions';
import compression from 'compression';
import cors from 'cors';
import express, { Application } from 'express';
import { CONFIG } from './config';
import { logger } from './utils';
import { container } from './ioc/container';
import { errorMiddleware, httpLogMiddleware } from './middlewares';

process.on('uncaughException', (e) => {
  console.error('Unhandled Error:');
  console.error(e);
  process.exit(-1);
});

process.on('unhandledRejection', (e) => {
  console.error('Unhandled Error:');
  console.error(e);
  process.exit(-1);
});

logger.info('Starting application...');

startApp().catch(e => {
  console.error('Unhandled Error:');
  console.error(e);
  process.exit(-1);
});

async function startApp(): Promise<void> {
  const server = new InversifyExpressServer(container);

  server.setConfig((app: Application) => {
    app.use('/', express.static(resolve(`${__dirname}/../public`), { redirect: true }));
    app.use(cors({ origin: CONFIG.CORS_ORIGIN, credentials: CONFIG.CORS_CREDENTIALS }));
    app.use(compression());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(httpLogMiddleware);
  });

  server.setErrorConfig((app: Application) => {
    // Handle not found error
    app.use('/*', () => {
      throw new NotFound('Route is not found');
    });

    // Catch and handle all errors
    app.use(errorMiddleware);
  });

  const app = server.build();

  app.listen(CONFIG.PORT, () => {
    logger.info(`ENV: ${CONFIG.NODE_ENV}`);
    logger.info(`LOG_LEVEL: ${CONFIG.LOG_LEVEL}`);
    logger.info(`RPC_URL: ${CONFIG.RPC_URL}`);
    logger.info(`App listening on the port ${CONFIG.PORT}`);
  });
}
