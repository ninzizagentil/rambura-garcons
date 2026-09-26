import dotenv from 'dotenv';

dotenv.config({ quiet: true }); // quiet: hide dotenv's "injected env" banner

const nodeEnv = process.env.NODE_ENV || 'development';
const mongoUriKey = nodeEnv === 'production' ? 'MONGODB_URI_PRODUCTION' : 'MONGODB_URI';
const required = [mongoUriKey];
if (nodeEnv === 'production') required.push('JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET');
const missing = required.filter((key) => !process.env[key]);
if (missing.length) throw new Error(`Missing environment variables: ${missing.join(', ')}`);

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv,
  mongoUri: process.env[mongoUriKey],
  accessSecret: process.env.JWT_ACCESS_SECRET || 'development-access-secret',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'development-refresh-secret',
  accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
  refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  // Number of reverse proxies in front of the API (nginx = 1). 0/unset = do not trust X-Forwarded-For.
  trustProxy: Number(process.env.TRUST_PROXY || 0),
  sessionIdleMinutes: Number(process.env.SESSION_IDLE_MINUTES || 30),
  passwordResetMinutes: Number(process.env.PASSWORD_RESET_MINUTES || 30),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  // Used to build absolute /uploads URLs for locally-stored images.
  serverUrl: process.env.SERVER_URL || `http://localhost:${Number(process.env.PORT || 5000)}`,
};
