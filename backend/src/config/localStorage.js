import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// backend/uploads — everything served locally, no third-party storage.
export const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');

function extensionFor(mimetype) {
  const map = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
  return map[mimetype] || '';
}

function safeFolder(folder = 'rambura-garcons') {
  return String(folder).replace(/[^a-zA-Z0-9/_-]/g, '').replace(/^\/+|\/+$/g, '') || 'rambura-garcons';
}

/**
 * Saves an in-memory image buffer to disk under backend/uploads/<folder>/
 * and returns the same { imageUrl, publicId } shape the app already expects,
 * so no frontend or model code needs to change.
 */
export function saveBuffer(buffer, mimetype, folder = 'rambura-garcons') {
  const folderPath = safeFolder(folder);
  const dir = path.join(UPLOADS_ROOT, folderPath);
  fs.mkdirSync(dir, { recursive: true });

  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extensionFor(mimetype)}`;
  fs.writeFileSync(path.join(dir, filename), buffer);

  const publicId = `${folderPath}/${filename}`;
  // No server address inside: the page/proxy decides where /uploads is served from.
  return { imageUrl: `/uploads/${publicId}`, publicId };
}

/** Deletes a previously-uploaded file given its publicId ("folder/filename"). */
export async function deleteImage(publicId) {
  if (!publicId) return null;
  const filePath = path.join(UPLOADS_ROOT, publicId);
  if (!filePath.startsWith(UPLOADS_ROOT)) return null; // guard against path traversal
  try {
    await fs.promises.unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  return null;
}
