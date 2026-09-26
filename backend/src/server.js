import app from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { startBackupScheduler } from './services/backupService.js';
import Role from './models/Role.js';
import Permission from './models/Permission.js';
import { DEFAULT_ROLE_PERMISSIONS } from './config/defaultPermissions.js';

async function removeObsoletePermissions() {
	const obsoletePermissions = await Permission.find({ key: { $in: ['audit.management', 'library.books.delete'] } }, { _id: 1 });
	if (!obsoletePermissions.length) return;
	await Role.updateMany(
		{ permissions: { $in: obsoletePermissions.map((permission) => permission._id) } },
		{ $pull: { permissions: { $in: obsoletePermissions.map((permission) => permission._id) } } }
	);
	await Permission.deleteMany({ _id: { $in: obsoletePermissions.map((permission) => permission._id) } });
}

// Adds permissions that are NEW in the code to a role. Permissions that already exist are left alone,
// so changes made on the admin "Roles & Permissions" screen survive a server restart.
async function addNewDefaultPermissions(roleName, keys) {
	const created = [];
	for (const key of keys) {
		const result = await Permission.updateOne(
			{ key },
			{ $setOnInsert: { key, label: key, module: key.split('.')[0] } },
			{ upsert: true }
		);
		if (result.upsertedCount) created.push(key);
	}
	if (!created.length) return;
	const permissions = await Permission.find({ key: { $in: created } }, { _id: 1 });
	await Role.updateOne({ name: roleName }, { $addToSet: { permissions: { $each: permissions.map((permission) => permission._id) } } });
}

async function syncManagementPermissions() {
	await addNewDefaultPermissions('management', DEFAULT_ROLE_PERMISSIONS.management);
}

async function syncLibrarianPermissions() {
	await addNewDefaultPermissions('librarian', DEFAULT_ROLE_PERMISSIONS.librarian);
}

const database = await connectDatabase();
if (database) {
	try {
		await removeObsoletePermissions();
		await syncManagementPermissions();
		await syncLibrarianPermissions();
	} catch (error) {
		console.error('[db] Could not sync default role permissions:', error.message);
	}
} else {
	console.warn('[db] Skipping management permission sync because MongoDB is unavailable.');
}
startBackupScheduler().catch((error) => console.error("[backup] scheduler could not start:", error.message));
app.listen(env.port, () => console.log(`Rambura Garçons API listening on port ${env.port}`));
