import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const here = path.dirname(fileURLToPath(import.meta.url));
// Always backend/backups (not "wherever the server was started from").
const DEFAULT_DIR = path.resolve(here, '../../backups');
const FILE_PATTERN = /^rambura-garcons-.+\.json$/;

// Short-lived login/reset tokens are useless after a restore, so they are left out.
// (Password hashes are kept - without them nobody could sign in after a restore - so treat the
// backup files like passwords: never share or upload them.)
const STRIP_FIELDS = {
  users: ['refreshTokens', 'refreshTokenHash', 'passwordResetTokenHash', 'passwordResetExpires'],
};

export const backupDirectory = () => process.env.BACKUP_DIR || DEFAULT_DIR;

async function listBackups(directory) {
  try {
    const names = (await fsp.readdir(directory)).filter((name) => FILE_PATTERN.test(name));
    return names.sort().reverse(); // names contain a timestamp, so newest first
  } catch {
    return [];
  }
}

/** Deletes the oldest backups so only the newest `keep` remain. */
export async function pruneBackups(directory = backupDirectory(), keep = Number(process.env.BACKUP_KEEP || 7)) {
  const names = await listBackups(directory);
  const old = names.slice(Math.max(1, keep));
  await Promise.all(old.map((name) => fsp.rm(path.join(directory, name), { force: true })));
  return old.length;
}

/**
 * Saves EVERY collection to one JSON file. The file is written piece by piece (not built as one
 * giant string) so big collections with base64 images cannot exhaust memory, and it is renamed into
 * place only when complete, so a crash never leaves a half-written backup.
 */
export async function backupDatabase(directory = backupDirectory()) {
  if (mongoose.connection.readyState !== 1) throw new Error('Database is not connected');
  await fsp.mkdir(directory, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(directory, `rambura-garcons-${stamp}.json`);
  const tempPath = `${filePath}.tmp`;
  const stream = fs.createWriteStream(tempPath, { mode: 0o600 });
  const write = (chunk) => new Promise((resolve, reject) => stream.write(chunk, (error) => (error ? reject(error) : resolve())));

  try {
    await write(`{"createdAt":${JSON.stringify(new Date().toISOString())},"database":${JSON.stringify(mongoose.connection.name)},"collections":{`);
    const collections = (await mongoose.connection.db.listCollections().toArray())
      .map((entry) => entry.name)
      .filter((name) => !name.startsWith('system.'))
      .sort();
    for (const [index, name] of collections.entries()) {
      await write(`${index ? ',' : ''}${JSON.stringify(name)}:[`);
      const strip = STRIP_FIELDS[name] || [];
      let first = true;
      for await (const doc of mongoose.connection.db.collection(name).find({}).batchSize(50)) {
        for (const field of strip) delete doc[field];
        await write(`${first ? '' : ','}${JSON.stringify(doc)}`);
        first = false;
      }
      await write(']');
    }
    await write('}}');
    await new Promise((resolve, reject) => { stream.end((error) => (error ? reject(error) : resolve())); });
    await fsp.rename(tempPath, filePath);
  } catch (error) {
    stream.destroy();
    await fsp.rm(tempPath, { force: true });
    throw error;
  }

  const removed = await pruneBackups(directory).catch(() => 0);
  if (removed) console.log(`[backup] removed ${removed} old backup file(s)`);
  return filePath;
}

export async function startBackupScheduler() {
  const intervalMs = Number(process.env.BACKUP_INTERVAL_HOURS || 24) * 60 * 60 * 1000;
  const run = () => backupDatabase().then((file) => console.log('[backup] saved', path.basename(file))).catch((error) => console.error('[backup] failed:', error.message));

  // Do NOT back up on every start (in development the server restarts on every file save).
  // Only run right away when the newest backup is older than the interval.
  const directory = backupDirectory();
  const [newest] = await listBackups(directory);
  let ageMs = Infinity;
  if (newest) {
    try { ageMs = Date.now() - (await fsp.stat(path.join(directory, newest))).mtimeMs; } catch { /* treat as old */ }
  }
  if (ageMs >= intervalMs) run();
  const timer = setInterval(run, intervalMs);
  timer.unref?.();
  return timer;
}
