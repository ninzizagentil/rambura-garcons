import mongoose from 'mongoose';
import { env } from '../config/env.js';

export function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}`, errors: [] });
}

export function errorHandler(error, req, res, _next) {
  let status = error.statusCode || 500;
  let message = error.message || 'Something went wrong';
  let errors = [];
  if (error.name === 'MongoServerSelectionError' || error.name === 'MongoNetworkError') {
    status = 503;
    message = 'Database unavailable. Start MongoDB or configure MONGODB_URI, then try again.';
  }
  if (error instanceof mongoose.Error.ValidationError) {
    status = 422;
    errors = Object.values(error.errors).map((item) => ({ field: item.path, message: item.message }));
    message = 'Validation failed';
  }
  if (error.name === 'MulterError') {
    status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message = error.code === 'LIMIT_FILE_SIZE' ? 'The file is too large. Maximum size is 5 MB.' : error.message;
  }
  if (error.type === 'entity.too.large') { status = 413; message = 'The request is too large.'; }
  if (error.type === 'entity.parse.failed') { status = 400; message = 'The request body is not valid JSON.'; }
  if (error.code === 11000) {
    status = 409;
    errors = Object.keys(error.keyValue || {}).map((field) => ({ field, message: `${field} already exists` }));
    message = 'A record with this value already exists';
  }
  if (error.name === 'CastError') {
    status = 400;
    message = `Invalid ${error.path || 'record'} identifier`;
  }
  if (status >= 500 && env.nodeEnv === 'production' && !error.statusCode) {
    console.error('[error]', req.method, req.originalUrl, error);
    message = 'Something went wrong. Please try again.';
  }
  res.status(status).json({ success: false, message, errors, ...(env.nodeEnv !== 'production' ? { stack: error.stack } : {}) });
}
