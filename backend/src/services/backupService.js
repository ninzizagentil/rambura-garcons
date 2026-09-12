import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';

const COLLECTIONS = ['users', 'books', 'loans', 'stockitems', 'stocktransactions', 'suppliers', 'admissions', 'notifications', 'auditlogs', 'contactmessages', 'programs', 'departments', 'staff', 'news', 'galleries', 'websitesettings'];

export async function backupDatabase(directory = process.env.BACKUP_DIR || path.resolve(process.cwd(), 'backups')) {
  if (mongoose.connection.readyState !== 1) throw new Error('Database is not connected');
  await fs.mkdir(directory, { recursive: true });
  const snapshot = { createdAt: new Date().toISOString(), database: mongoose.connection.name, collections: {} };
  for (const name of COLLECTIONS) {
    try { snapshot.collections[name] = await mongoose.connection.db.collection(name).find({}).toArray(); } catch { snapshot.collections[name] = []; }
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(directory, `rambura-garcons-${stamp}.json`);
  await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2), 'utf8');
  return filePath;
}

export function startBackupScheduler() {
  const interval = Number(process.env.BACKUP_INTERVAL_HOURS || 24) * 60 * 60 * 1000;
  const run = () => backupDatabase().then((filePath) => console.log(`[backup] created ${filePath}`)).catch((error) => console.error('[backup] failed:', error.message));
  run();
  return setInterval(run, interval);
}
