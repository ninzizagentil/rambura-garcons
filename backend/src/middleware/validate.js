import { fail } from '../utils/api.js';

export function validateBody(rules) {
  return (req, res, next) => {
    const errors = [];
    for (const [field, rule] of Object.entries(rules)) {
      const value = req.body?.[field];
      if (rule.required && (value === undefined || value === null || String(value).trim() === '')) errors.push({ field, message: `${field} is required` });
      if (value !== undefined && value !== null && value !== '') {
        if (rule.email && !/^\S+@\S+\.\S+$/.test(String(value))) errors.push({ field, message: `${field} must be a valid email address` });
        if (rule.minLength && String(value).length < rule.minLength) errors.push({ field, message: `${field} must be at least ${rule.minLength} characters` });
        if (rule.maxLength && String(value).length > rule.maxLength) errors.push({ field, message: `${field} must be no more than ${rule.maxLength} characters` });
        if (rule.pattern && !rule.pattern.test(String(value))) errors.push({ field, message: rule.message || `${field} has an invalid format` });
      }
    }
    return errors.length ? fail(res, 'Validation failed', 422, errors) : next();
  };
}

export function validatePassword(value) {
  return typeof value === 'string' && value.length >= 8;
}

export function isAllowedImageBuffer(buffer, mime) {
  if (!Buffer.isBuffer(buffer)) return false;
  const signatures = {
    'image/jpeg': buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])),
    'image/png': buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    'image/gif': buffer.subarray(0, 6).toString() === 'GIF87a' || buffer.subarray(0, 6).toString() === 'GIF89a',
    'image/webp': buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP',
  };
  return Boolean(signatures[mime]);
}
