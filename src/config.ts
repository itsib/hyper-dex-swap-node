import { isAddress } from 'ethers/lib/utils';
import { existsSync } from 'fs';
import path from 'path';
import { LogLevel } from './types';

require('dotenv').config(dotenvConfig());

export const CONFIG = {
  // Server settings
  LOG_LEVEL: validateEnum<LogLevel>([LogLevel.ERROR, LogLevel.WARN, LogLevel.DEBUG, LogLevel.INFO], process.env.LOG_LEVEL, LogLevel.DEBUG),
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 3000,
  CORS_CREDENTIALS: process.env.CORS_CREDENTIALS === 'true',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  // Chain settings
  RPC_URL: required(process.env.RPC_URL, 'The environment variable RPC_URL is not set.'),
  // Quoter settings
  QUOTE_ORDER_EXPIRATION_BUFFER_MS: 60000,
}

function dotenvConfig(): { path: string } | undefined {
  function findEnv(envPath: string): string | undefined {
    if (envPath === '/') {
      return undefined;
    }
    if (existsSync(`${envPath}/.env`)) {
      return `${envPath}/.env`;
    }
    return findEnv(path.resolve(`${envPath}/..`));
  }

  const envFile = findEnv(__dirname);

  return envFile ? { path: envFile } : undefined;
}

function required(variable: string, errorMessage?: string): string {
  if (!variable) {
    throw new Error(errorMessage || 'Value is required');
  }
  return variable;
}

function validateEnum<T extends string>(enumerate: T[], value: string, defaultValue: T, errorMessage?: string): T {
  value = value ? value : defaultValue;
  if (enumerate.includes(value as T)) {
    return value as T;
  }
  throw new Error(errorMessage || `Values are supported ${enumerate.join(',')}`);
}

function validateAddress(value?: string, isRequired: boolean = false, errorMessage?: string): string | undefined {
  if (!value) {
    if (isRequired) {
      throw new Error(errorMessage || `Address is required`);
    }
    return undefined;
  }
  if (!isAddress(value)) {
    throw new Error('Invalid wallet address');
  }
  return value;
}

function validateInteger(value: string, defaultValue: string, errorMessage?: string): string {
  value = value ? value : defaultValue;
  if (/^\d+$/.test(value)) {
    return value;
  }
  throw new Error(errorMessage || `Value should be valid integer number`);
}

