import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.connection.on('connected', () => {
  console.log(`[db] connected to MongoDB (${mongoose.connection.name})`);
});
mongoose.connection.on('error', (err) => {
  console.error('[db] MongoDB connection error:', err.message);
});
mongoose.connection.on('disconnected', () => {
  console.warn('[db] MongoDB disconnected');
});

// Some deployments (e.g. certain Atlas tiers/proxies, non-replica-set
// mongod instances) reject retryable writes outright. The driver honors
// retryWrites as set in the connection string's query params over the
// options object, so we rewrite the URI directly to guarantee it's off.
function withRetryWritesDisabled(uri) {
  const [base, query = ''] = uri.split('?');
  const params = new URLSearchParams(query);
  params.set('retryWrites', 'false');
  return `${base}?${params.toString()}`;
}

export async function connectDatabase() {
  const mongoUri = withRetryWritesDisabled(env.mongoUri);
  try {
    await mongoose.connect(mongoUri, {
      dbName: 'rambura_garcons',
      serverSelectionTimeoutMS: 8000,
      retryWrites: false,
    });
    return mongoose.connection;
  } catch (err) {
    console.error('\n[db] Could not connect to MongoDB.');
    console.error(`[db] Tried: ${mongoUri}`);
    console.error(`[db] Reason: ${err.message}`);
    console.error('[db] Fix: make sure MongoDB is running locally (open MongoDB Compass, or start the "MongoDB" service / `docker compose up -d`) and that MONGODB_URI in backend/.env points to it, e.g. mongodb://localhost:27017/rambura_garcons.');
    console.error('[db] The API will remain available and report database-dependent requests as 503.\n');
    return null;
  }
}

export function databaseStatus() {
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
}
