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

export async function connectDatabase() {
  try {
    await mongoose.connect(env.mongoUri, {
      dbName: 'rambura_garcons',
      serverSelectionTimeoutMS: 8000,
    });
    return mongoose.connection;
  } catch (err) {
    console.error('\n[db] Could not connect to MongoDB.');
    console.error(`[db] Tried: ${env.mongoUri}`);
    console.error(`[db] Reason: ${err.message}`);
    console.error('[db] Fix: start MongoDB locally (mongod / "MongoDB" service / Docker) or set MONGODB_URI in backend/.env to an Atlas connection string.');
    console.error('[db] The API will remain available and report database-dependent requests as 503.\n');
    return null;
  }
}

export function databaseStatus() {
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
}
