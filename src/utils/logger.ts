import winston from 'winston';
import chalk from 'chalk';
import { CONFIG } from '../config';

const logSimpleFormat = winston.format.printf(({ level, message }) => `[${chalk.bold(level.toUpperCase())}]: ${message}`);

const logPrettyFormat = winston.format.printf(({ timestamp, level, message }) => {
  const prettyTimestamp = chalk.gray(timestamp);

  let prettyLevel: string;
  switch (level) {
    case 'error':
      prettyLevel = chalk.red('[ERROR]');
      break;
    case 'warm':
      prettyLevel = chalk.yellow('[WARN]');
      break;
    case 'debug':
      prettyLevel = chalk.blue('[DEBUG]');
      break;
    default:
      prettyLevel = chalk.whiteBright(`[${level.toUpperCase()}]`);
      break;
  }

  return `${prettyTimestamp} ${prettyLevel}: ${message}`
});

const logger = winston.createLogger({
  level: CONFIG.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    CONFIG.NODE_ENV === 'development' ? logPrettyFormat : logSimpleFormat,
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

export { logger };
