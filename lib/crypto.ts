import crypto from 'node:crypto';

const ALGO = 'aes-256-gcm';

function getSecret() {
  const raw = process.env.APP_ENCRYPTION_SECRET;
  if (!raw || raw.length < 16) {
    throw new Error('APP_ENCRYPTION_SECRET must be set and at least 16 chars.');
  }
  return crypto.createHash('sha256').update(raw).digest();
}

export function encrypt(text: string) {
  const key = getSecret();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decrypt(payload: string) {
  const raw = Buffer.from(payload, 'base64');
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const key = getSecret();
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

export function maskApiKey(apiKey: string) {
  if (apiKey.length <= 8) return '****';
  return `${apiKey.slice(0, 4)}****${apiKey.slice(-4)}`;
}
