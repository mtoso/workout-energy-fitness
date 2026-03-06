import { argon2id } from '@noble/hashes/argon2.js';

const textEncoder = new TextEncoder();

const equalBytes = (left: Uint8Array, right: Uint8Array) => {
  if (left.length !== right.length) return false;

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left[index] ^ right[index];
  }

  return mismatch === 0;
};

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const fromBase64Url = (input: string) => {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

export const randomToken = (byteLength = 32) => {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
};

export const sha256Hex = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(value));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

const ARGON_CONFIG = {
  m: 19_456,
  t: 3,
  p: 1,
  dkLen: 32,
};

export const hashPassword = (password: string) => {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const hash = argon2id(textEncoder.encode(password), salt, ARGON_CONFIG);

  return `argon2id$v=1$m=${ARGON_CONFIG.m},t=${ARGON_CONFIG.t},p=${ARGON_CONFIG.p}$${toBase64Url(
    salt
  )}$${toBase64Url(hash)}`;
};

const parseArgon2Hash = (encoded: string) => {
  const segments = encoded.split('$');
  if (segments.length !== 5) return null;

  const [algorithm, versionSegment, paramsSegment, saltSegment, hashSegment] =
    segments;

  if (algorithm !== 'argon2id' || versionSegment !== 'v=1') return null;

  const params = Object.fromEntries(
    paramsSegment.split(',').map((entry) => {
      const [key, value] = entry.split('=');
      return [key, Number(value)];
    })
  );

  if (!params.m || !params.t || !params.p) return null;

  return {
    m: params.m,
    t: params.t,
    p: params.p,
    salt: fromBase64Url(saltSegment),
    expectedHash: fromBase64Url(hashSegment),
  };
};

export const verifyPassword = (password: string, encodedHash: string) => {
  const parsed = parseArgon2Hash(encodedHash);
  if (!parsed) return false;

  const computed = argon2id(textEncoder.encode(password), parsed.salt, {
    m: parsed.m,
    t: parsed.t,
    p: parsed.p,
    dkLen: parsed.expectedHash.length,
  });

  return equalBytes(computed, parsed.expectedHash);
};
