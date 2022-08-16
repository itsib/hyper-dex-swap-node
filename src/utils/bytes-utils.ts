/**
 * Transform an integer into its hexadecimal value
 * @param integer
 * @return {string|string}
 */
export const intToHex = (integer: number): string => {
  if (integer < 0) {
    throw new Error('Invalid integer as argument, must be unsigned!');
  }
  const hex = integer.toString(16);
  return hex.length % 2 ? `0${hex}` : hex;
}

export const encodeLength = (len: number, offset: number): Buffer => {
  if (len < 56) {
    return Buffer.from([len + offset]);
  } else {
    const hexLength = intToHex(len);
    const lLength = hexLength.length / 2;
    const firstByte = intToHex(offset + 55 + lLength);
    return Buffer.from(firstByte + hexLength, 'hex');
  }
}

/**
 * RLP Encoding based on: https://github.com/ethereum/wiki/wiki/%5BEnglish%5D-RLP
 * This function takes in a data, convert it to buffer if not, and a length for recursion
 * @param input - will be converted to buffer
 * @returns returns buffer of encoded data
 **/
export function encode(input: Uint8Array | Uint8Array[]): Buffer {
  if (Array.isArray(input)) {
    const output = [];
    for (let i = 0; i < input.length; i++) {
      output.push(encode(input[i]));
    }
    const buf = Buffer.concat(output);
    return Buffer.concat([encodeLength(buf.length, 192), buf]);
  } else {
    const inputBuf = Buffer.from(input);
    return inputBuf.length === 1 && inputBuf[0] < 128
      ? inputBuf
      : Buffer.concat([encodeLength(inputBuf.length, 128), inputBuf]);
  }
}
