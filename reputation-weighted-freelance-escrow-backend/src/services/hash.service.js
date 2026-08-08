import crypto from 'crypto';

/**
 * Deterministically stringifies a JSON object by recursively sorting object keys.
 */
export const canonicalizeJson = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalizeJson).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj).sort();
  const sortedPairs = sortedKeys.map(
    (key) => JSON.stringify(key) + ':' + canonicalizeJson(obj[key])
  );
  return '{' + sortedPairs.join(',') + '}';
};

/**
 * Generates SHA-256 hash from string or buffer
 */
export const generateSha256 = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Hashes JSON object canonically
 */
export const hashCanonicalJson = (obj) => {
  const canonicalString = canonicalizeJson(obj);
  return generateSha256(canonicalString);
};
