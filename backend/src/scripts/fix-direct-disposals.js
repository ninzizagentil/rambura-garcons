// One-off data fix. Before this release, stock disposed *directly* (expired /
// lost / damaged-record disposal) was saved with the schema default status
// "pending" even though the stock had already been deducted. Those rows showed
// up in the Approvals tab, where approving them would deduct the stock a second
// time. Genuine approval requests always have `requestedBy`; direct disposals
// never do, so they are safe to identify and mark as approved.
//
// Usage:  npm run fix:disposals            (dry run, prints what would change)
//         npm run fix:disposals -- --apply (writes the change)
import { connectDatabase } from '../config/database.js';
import DisposedStock from '../models/DisposedStock.js';

const apply = process.argv.includes('--apply');
await connectDatabase();

const filter = { status: 'pending', requestedBy: { $exists: false } };
const count = await DisposedStock.countDocuments(filter);
if (!apply) {
  console.log(`${count} direct disposal record(s) are stuck as "pending". Re-run with --apply to mark them approved.`);
} else {
  const result = await DisposedStock.updateMany(filter, { $set: { status: 'approved' } });
  console.log(`Marked ${result.modifiedCount} direct disposal record(s) as approved.`);
}
process.exit(0);
