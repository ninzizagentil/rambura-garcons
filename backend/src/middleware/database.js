import { databaseStatus } from '../config/database.js';

export function requireDatabase(_req, res, next) {
  if (databaseStatus() === 'connected') return next();
  return res.status(503).json({
    success: false,
    message: 'Database unavailable. Start MongoDB or configure MONGODB_URI, then try again.',
    errors: [],
  });
}