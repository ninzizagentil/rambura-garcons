import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { fail, ok } from '../utils/api.js';
import { recordAudit } from '../services/auditService.js';

export async function getRoles(_req, res) { return ok(res, await Role.find().populate('permissions')); }
export async function getPermissions(_req, res) { return ok(res, await Permission.find().sort('module key')); }
export async function updateRole(req, res) {
  const existingRole = await Role.findOne({ name: req.params.name }).populate('permissions', 'key');
  const permissions = req.params.name === 'admin'
    ? (await Permission.find({}, '_id')).map((permission) => permission._id)
    : (req.body.permissions || []);
  const role = await Role.findOneAndUpdate({ name: req.params.name }, { permissions }, { new: true, runValidators: true }).populate('permissions');
  if (role && existingRole) {
    const previousKeys = new Set(existingRole.permissions.map((permission) => permission.key));
    const currentKeys = new Set(role.permissions.map((permission) => permission.key));
    const added = role.permissions.filter((permission) => !previousKeys.has(permission.key)).map((permission) => permission.key);
    const removed = existingRole.permissions.filter((permission) => !currentKeys.has(permission.key)).map((permission) => permission.key);
    const users = await User.find({ role: role.name, status: 'active' }).select('_id fullName');
    const changes = [
      ...(added.length ? [`Added: ${added.join(', ')}`] : []),
      ...(removed.length ? [`Removed: ${removed.join(', ')}`] : []),
    ];
    if (users.length && changes.length) {
      await Notification.insertMany(users.map((user) => ({
        userId: user._id,
        title: 'Permissions updated',
        message: `${user.fullName || 'Your'} access permissions were updated. ${changes.join('. ')}.`,
        type: added.length ? 'success' : 'warning',
        module: 'Access control',
        link: '/notifications',
      })));
    }
    if (changes.length) {
      // Also raises the standard admin/management cross-panel notification
      // (see auditService.notifyOnAction) so oversight isn't limited to the
      // role's own members.
      await recordAudit(req, { action: 'Role permissions updated', module: 'Access control', resourceType: 'Role', resourceId: role._id, description: `${role.name}: ${changes.join('. ')}.` });
    }
  }
  return role ? ok(res, role, 'Role permissions updated') : fail(res, 'Role not found', 404);
}
