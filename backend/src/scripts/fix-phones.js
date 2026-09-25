// One-off data fix for phone numbers saved BEFORE the 10–12 digit rule existed.
//
//   npm run fix:phones             -> dry run: only lists what would change
//   npm run fix:phones -- --apply  -> writes the automatic fixes
//
// Automatic fix: "+250 788 123 456" -> "+250788123456" (spaces, dots, dashes and
// brackets removed). Numbers that still do not have 10–12 digits after cleaning
// (or contain letters) are only LISTED — correct them by hand in the app.
import { connectDatabase } from '../config/database.js';
import Supplier from '../models/Supplier.js';
import Admission from '../models/Admission.js';
import WebsiteSetting from '../models/WebsiteSetting.js';
import { collectPhoneFixes } from '../utils/validators.js';

const apply = process.argv.includes('--apply');
await connectDatabase();

const targets = [
  { label: 'Supplier', model: Supplier, fields: ['phone'], describe: (d) => d.name },
  { label: 'Application', model: Admission, fields: ['phone', 'guardianPhone', 'emergencyContactPhone'], describe: (d) => d.fullName },
  { label: 'Website contact', model: WebsiteSetting, fields: ['phone', 'contactSettings.phone'], describe: () => 'Contact page' },
];

let fixedTotal = 0;
let manualTotal = 0;
for (const { label, model, fields, describe } of targets) {
  const docs = await model.find({}).lean();
  const { fixes, manual } = collectPhoneFixes(docs, fields, describe);
  for (const row of fixes) {
    console.log(`${apply ? 'FIXED ' : 'WOULD FIX'} [${label}] ${row.who} · ${row.field}: "${row.from}" -> "${row.to}"`);
    if (apply) await model.updateOne({ _id: row.id }, { $set: { [row.field]: row.to } });
  }
  for (const row of manual) console.log(`FIX BY HAND [${label}] ${row.who} · ${row.field}: "${row.from}"`);
  fixedTotal += fixes.length;
  manualTotal += manual.length;
}

console.log(`\n${apply ? 'Fixed' : 'Can be fixed automatically'}: ${fixedTotal}. Need a manual fix: ${manualTotal}.`);
if (!apply && fixedTotal) console.log('Run again with --apply to save the automatic fixes.');
process.exit(0);
