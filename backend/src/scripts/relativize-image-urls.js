// One-off data fix. Older versions saved uploaded image links WITH the server address, for example
//   http://localhost:5000/uploads/gallery/photo.jpg
// Those links break as soon as the site moves to a real domain. This script rewrites them to the
// address-free form   /uploads/gallery/photo.jpg   in every collection.
//
// Usage:  npm run fix:image-urls            (dry run: only counts what would change)
//         npm run fix:image-urls -- --apply (writes the change)
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';

const apply = process.argv.includes('--apply');
const ABSOLUTE_UPLOAD = /^https?:\/\/[^/\s]+(\/uploads\/.+)$/i;

// Returns [newValue, changed]. Long strings (base64 files) are skipped on purpose.
function rewrite(value) {
  if (typeof value === 'string') {
    if (value.length > 600) return [value, false];
    const match = value.match(ABSOLUTE_UPLOAD);
    return match ? [match[1], true] : [value, false];
  }
  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((item) => {
      const [result, itemChanged] = rewrite(item);
      changed ||= itemChanged;
      return result;
    });
    return [changed ? next : value, changed];
  }
  if (value && typeof value === 'object' && !(value instanceof Date) && !value._bsontype) {
    let changed = false;
    const next = {};
    for (const [key, child] of Object.entries(value)) {
      const [result, childChanged] = rewrite(child);
      next[key] = result;
      changed ||= childChanged;
    }
    return [changed ? next : value, changed];
  }
  return [value, false];
}

await connectDatabase();
const db = mongoose.connection.db;
let documents = 0;
for (const { name } of await db.listCollections().toArray()) {
  if (name.startsWith('system.')) continue;
  const collection = db.collection(name);
  let collectionChanges = 0;
  for await (const doc of collection.find({}).batchSize(20)) {
    const updates = {};
    for (const [key, value] of Object.entries(doc)) {
      if (key === '_id') continue;
      const [next, changed] = rewrite(value);
      if (changed) updates[key] = next;
    }
    if (Object.keys(updates).length) {
      collectionChanges += 1;
      if (apply) await collection.updateOne({ _id: doc._id }, { $set: updates });
    }
  }
  if (collectionChanges) console.log(`${apply ? 'FIXED ' : 'WOULD FIX'} ${collectionChanges} document(s) in "${name}"`);
  documents += collectionChanges;
}
console.log(`\n${apply ? 'Fixed' : 'Can be fixed'}: ${documents} document(s).`);
if (!apply && documents) console.log('Run again with --apply to save the change.');
process.exit(0);
