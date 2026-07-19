import { describe, expect, it } from 'vitest';
import {
  decodeBase64,
  decodeHex,
  decodeJwt,
  decodeUnicode,
  decodeUrl,
  encodeBase64,
  encodeHex,
  encodeUnicode,
  encodeUrl,
} from './encoding';

describe('encoding utilities', () => {
  it('round-trips Unicode text through Base64', () => {
    const value = 'Hello, 世界 👋';
    expect(decodeBase64(encodeBase64(value))).toBe(value);
  });

  it('accepts unpadded Base64URL values', () => {
    expect(decodeBase64('eyJ2YWx1ZSI6IsK-In0')).toBe('{"value":"¾"}');
  });

  it('decodes JWT Base64URL segments', () => {
    const token = [
      'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0',
      'eyJ2YWx1ZSI6IsK-In0',
      'signature',
    ].join('.');

    expect(JSON.parse(decodeJwt(token))).toEqual({
      header: { alg: 'none', typ: 'JWT' },
      payload: { value: '¾' },
      signature: 'signature',
    });
  });

  it('round-trips URL, Hex, and Unicode escape formats', () => {
    expect(decodeUrl(encodeUrl('a value/世界'))).toBe('a value/世界');
    expect(decodeHex(encodeHex('Hello 世界'))).toBe('Hello 世界');
    expect(decodeUnicode(encodeUnicode('Hello 世界'))).toBe('Hello 世界');
  });

  it('rejects malformed Base64 and Hex values', () => {
    expect(() => decodeBase64('abcde')).toThrow('Invalid Base64 string');
    expect(() => decodeHex('xyz')).toThrow('Invalid hex string');
  });
});

