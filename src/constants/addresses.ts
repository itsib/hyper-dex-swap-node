import { ChainId } from '../types';

export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
export const ETH_NATIVE_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
export const MATIC_NATIVE_ADDRESS = '0x0000000000000000000000000000000000001010';

export const NATIVE_ADDRESS: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: ETH_NATIVE_ADDRESS,
  [ChainId.ROPSTEN]: ETH_NATIVE_ADDRESS,
  [ChainId.RINKEBY]: ETH_NATIVE_ADDRESS,
  [ChainId.KOVAN]: ETH_NATIVE_ADDRESS,
  [ChainId.BSC]: ETH_NATIVE_ADDRESS,
  [ChainId.MATIC]: MATIC_NATIVE_ADDRESS,
  [ChainId.MATIC_MUMBAI]: MATIC_NATIVE_ADDRESS,
  [ChainId.AVALANCHE]: ETH_NATIVE_ADDRESS,
  [ChainId.FANTOM]: ETH_NATIVE_ADDRESS,
  [ChainId.CELO]: ETH_NATIVE_ADDRESS,
  [ChainId.OPTIMISM]: ETH_NATIVE_ADDRESS,
};