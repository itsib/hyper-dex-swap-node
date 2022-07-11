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
  QUOTE_ORDER_EXPIRATION_BUFFER_MS: validateInteger(process.env.QUOTE_ORDER_EXPIRATION_BUFFER_MS,60000, 'QUOTE_ORDER_EXPIRATION_BUFFER should be valid number'),
  // Contracts addresses
  WRAPPED_NATIVE: validateAddress(process.env.WRAPPED_NATIVE, true, 'The environment variable WRAPPED_NATIVE is not set. You should provide valid contract address'),
  EXCHANGE_PROXY: validateAddress(process.env.EXCHANGE_PROXY, true, 'The environment variable EXCHANGE_PROXY is not set. You should provide valid contract address'),
  EXCHANGE_PROXY_TRANSFORMER_DEPLOYER: validateAddress(process.env.EXCHANGE_PROXY_TRANSFORMER_DEPLOYER, true, 'The environment variable EXCHANGE_PROXY_TRANSFORMER_DEPLOYER is not set. You should provide valid contract address'),
  EXCHANGE_PROXY_FLASH_WALLET: validateAddress(process.env.EXCHANGE_PROXY_FLASH_WALLET, true, 'The environment variable EXCHANGE_PROXY_FLASH_WALLET is not set. You should provide valid contract address'),
  EXCHANGE_PROXY_LIQUIDITY_PROVIDER_SANDBOX: validateAddress(process.env.EXCHANGE_PROXY_LIQUIDITY_PROVIDER_SANDBOX, true, 'The environment variable EXCHANGE_PROXY_LIQUIDITY_PROVIDER_SANDBOX is not set. You should provide valid contract address'),
  WETH_TRANSFORMER: validateAddress(process.env.WETH_TRANSFORMER, true, 'The environment variable WETH_TRANSFORMER is not set. You should provide valid contract address'),
  PAY_TAKER_TRANSFORMER: validateAddress(process.env.PAY_TAKER_TRANSFORMER, true, 'The environment variable PAY_TAKER_TRANSFORMER is not set. You should provide valid contract address'),
  AFFILIATE_FEE_TRANSFORMER: validateAddress(process.env.AFFILIATE_FEE_TRANSFORMER, true, 'The environment variable AFFILIATE_FEE_TRANSFORMER is not set. You should provide valid contract address'),
  FILL_QUOTE_TRANSFORMER: validateAddress(process.env.FILL_QUOTE_TRANSFORMER, true, 'The environment variable FILL_QUOTE_TRANSFORMER is not set. You should provide valid contract address'),
  POSITIVE_SLIPPAGE_FEE_TRANSFORMER: validateAddress(process.env.POSITIVE_SLIPPAGE_FEE_TRANSFORMER, true, 'The environment variable POSITIVE_SLIPPAGE_FEE_TRANSFORMER is not set. You should provide valid contract address'),
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

function validateInteger(value: string = '', defaultValue: number, errorMessage?: string): number {
  if (value) {
    if (/^\d+$/.test(value)) {
      return Number(value);
    }
    throw new Error(errorMessage || `Value should be valid integer number`);
  }
  return defaultValue;
}

