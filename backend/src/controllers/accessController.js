import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import { fail, ok } from '../utils/api.js';

export async function getRoles(_req, res) { return ok(res, await Role.find().populate('permissions')); }
export async function getPermissions(_req, res) { return ok(res, await Permission.find().sort('module key')); }
export async function updateRole(req, res) {
  const role = await Role.findOneAndUpdate({ name: req.params.name }, { permissions: req.body.permissions || [] }, { new: true, runValidators: true }).populate('permissions');
  return role ? ok(res, role, 'Role permissions updated') : fail(res, 'Role not found', 404);
}
