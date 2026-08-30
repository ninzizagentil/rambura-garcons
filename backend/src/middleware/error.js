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
  if (error.code === 11000) {
    status = 409;
    errors = Object.keys(error.keyValue || {}).map((field) => ({ field, message: `${field} already exists` }));
    message = 'A record with this value already exists';
  }
  if (error.name === 'CastError') {
    status = 400;
    message = `Invalid ${error.path || 'record'} identifier`;
  }
  res.status(status).json({ success: false, message, errors, ...(env.nodeEnv !== 'production' ? { stack: error.stack } : {}) });
}
