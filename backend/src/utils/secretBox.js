import crypto from 'crypto';
import { env } from '../config/env.js';

// Small AES-256-GCM helper so secrets kept in the database (e.g. the SMTP password saved from the
// admin Settings screen) are not stored, or backed up, as readable text.
// Key: SETTINGS_ENCRYPTION_KEY if set, otherwise derived from JWT_REFRESH_SECRET.
const key = () => crypto.createHash('sha256').update(process.env.SETTINGS_ENCRYPTION_KEY || env.refreshSecret).digest();
const PREFIX = 'enc:v1:';

export function encryptSecret(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return `${PREFIX}${iv.toString('base64')}:${cipher.getAuthTag().toString('base64')}:${encrypted.toString('base64')}`;
}

// Values saved before encryption existed (no prefix) are returned unchanged.
export function decryptSecret(value) {
  const text = String(value || '');
  if (!text.startsWith(PREFIX)) return text;
  try {
    const [iv, tag, data] = text.slice(PREFIX.length).split(':').map((part) => Buffer.from(part, 'base64'));
    const decipher = crypto.createDecipheriv('aes-256-gcm', key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  } catch {
    return ''; // wrong key (secrets were rotated) - treat as "not set" instead of crashing
  }
}
