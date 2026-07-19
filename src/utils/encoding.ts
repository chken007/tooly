const BASE64_PATTERN = /^[A-Za-z0-9+/]*={0,2}$/;

function bytesToBinary(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return binary;
}

function normalizeBase64(value: string): string {
  const normalized = value
    .trim()
    .replace(/\s+/g, '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  if (!BASE64_PATTERN.test(normalized) || normalized.length % 4 === 1) {
    throw new Error('Invalid Base64 string');
  }

  return normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
}

export function encodeBase64(value: string): string {
  try {
    return btoa(bytesToBinary(new TextEncoder().encode(value)));
  } catch {
    throw new Error('Failed to encode as Base64');
  }
}

export function decodeBase64(value: string): string {
  try {
    const binary = atob(normalizeBase64(value));
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    throw new Error('Invalid Base64 string');
  }
}

export function encodeUrl(value: string): string {
  try {
    return encodeURIComponent(value);
  } catch {
    throw new Error('Failed to encode as URL');
  }
}

export function decodeUrl(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new Error('Invalid URL encoded string');
  }
}

export function decodeJwt(token: string): string {
  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    return JSON.stringify({
      header: JSON.parse(decodeBase64(parts[0])),
      payload: JSON.parse(decodeBase64(parts[1])),
      signature: parts[2],
    });
  } catch {
    throw new Error('Invalid JWT token');
  }
}

export function encodeHex(value: string): string {
  return Array.from(new TextEncoder().encode(value), byte =>
    byte.toString(16).padStart(2, '0'),
  ).join(' ');
}

export function decodeHex(value: string): string {
  const normalized = value.replace(/\s+/g, '');
  if (normalized.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(normalized)) {
    throw new Error('Invalid hex string');
  }

  const bytes = normalized.match(/.{2}/g)?.map(pair => Number.parseInt(pair, 16)) ?? [];
  return new TextDecoder().decode(Uint8Array.from(bytes));
}

export function encodeUnicode(value: string): string {
  return value
    .split('')
    .map(character => {
      const code = character.charCodeAt(0);
      return code > 127 ? `\\u${code.toString(16).padStart(4, '0')}` : character;
    })
    .join('');
}

export function decodeUnicode(value: string): string {
  return value.replace(/\\u([0-9a-fA-F]{4})/g, (_match, code: string) =>
    String.fromCharCode(Number.parseInt(code, 16)),
  );
}

