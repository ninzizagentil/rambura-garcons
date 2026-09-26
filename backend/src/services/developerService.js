import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import SystemSetting from '../models/SystemSetting.js';
import User from '../models/User.js';
import { databaseStatus } from '../config/database.js';
import { backupDirectory, listBackups } from './backupService.js';

const okStatus = (value) => (value === 'connected' || value === 'healthy' || value === 'ok' ? 'healthy' : value === 'warning' ? 'warning' : 'failed');
const maintenanceFallback = { enabled: false };

export async function isMaintenanceMode() {
  try {
    if (mongoose.connection.readyState !== 1) {
      return Boolean(maintenanceFallback.enabled);
    }
    const setting = await SystemSetting.findOne({ key: 'maintenance' }).lean();
    const enabled = Boolean(setting?.value?.enabled ?? maintenanceFallback.enabled);
    maintenanceFallback.enabled = enabled;
    return enabled;
  } catch {
    return Boolean(maintenanceFallback.enabled);
  }
}

export async function setMaintenanceMode(enabled, actor = 'developer') {
  maintenanceFallback.enabled = Boolean(enabled);

  try {
    if (mongoose.connection.readyState !== 1) {
      return maintenanceFallback.enabled;
    }

    const state = { enabled: Boolean(enabled), updatedAt: new Date().toISOString(), updatedBy: actor };
    const doc = await SystemSetting.findOneAndUpdate(
      { key: 'maintenance' },
      { $set: { key: 'maintenance', value: state } },
      { upsert: true, new: true, runValidators: true }
    );
    maintenanceFallback.enabled = Boolean(doc?.value?.enabled ?? state.enabled);
    return maintenanceFallback.enabled;
  } catch {
    return maintenanceFallback.enabled;
  }
}

export async function getDeveloperOverview() {
  const defaultState = {
    system: { status: 'warning', label: 'Warning', detail: 'Not available' },
    database: { status: 'warning', label: 'Warning', detail: 'Not available' },
    authentication: { status: 'healthy', label: 'Healthy', detail: 'Session checks are active' },
    notifications: { status: 'warning', label: 'Warning', detail: 'Not available' },
    backups: { status: 'warning', label: 'Warning', detail: 'Not available' },
    activeUsers: 0,
    recentErrors: [],
    lastBackup: null,
    recentActivity: [],
  };

  try {
    const [activeUsers, recentErrors, recentAudit, notificationCount, backupNames] = await Promise.all([
      User.countDocuments({ status: 'active' }).catch(() => 0),
      AuditLog.find({ status: 'error' }).sort({ createdAt: -1 }).limit(5).lean().catch(() => []),
      AuditLog.find({}).sort({ createdAt: -1 }).limit(6).lean().catch(() => []),
      Notification.countDocuments({}).catch(() => 0),
      listBackups(backupDirectory()).catch(() => []),
    ]);

    const databaseStatusValue = databaseStatus();
    const lastBackup = backupNames[0] ? { name: backupNames[0], updatedAt: new Date(backupNames[0].replace(/rambura-garcons-/, '').replace(/-/g, ':')).toISOString() } : null;

    return {
      system: {
        status: 'healthy',
        label: 'Healthy',
        detail: 'Application services are responding',
      },
      database: {
        status: okStatus(databaseStatusValue),
        label: databaseStatusValue === 'connected' ? 'Healthy' : 'Failed',
        detail: databaseStatusValue === 'connected' ? 'Database connection is active' : 'Database connection is unavailable',
      },
      authentication: {
        status: 'healthy',
        label: 'Healthy',
        detail: 'Authentication is available',
      },
      notifications: {
        status: notificationCount > 0 ? 'healthy' : 'warning',
        label: notificationCount > 0 ? 'Healthy' : 'Warning',
        detail: notificationCount > 0 ? `${notificationCount} notification record(s) available` : 'No notification data available',
      },
      backups: {
        status: backupNames.length > 0 ? 'healthy' : 'warning',
        label: backupNames.length > 0 ? 'Healthy' : 'Warning',
        detail: backupNames.length > 0 ? `${backupNames.length} backup(s) available` : 'No backup available',
      },
      activeUsers,
      recentErrors: recentErrors.map((entry) => ({
        timestamp: entry.createdAt,
        action: entry.action,
        module: entry.module,
        user: entry.userName,
        message: entry.description,
      })),
      lastBackup,
      recentActivity: recentAudit.map((entry) => ({
        action: entry.action,
        module: entry.module,
        time: entry.createdAt,
        user: entry.userName,
        status: entry.status || 'info',
      })),
    };
  } catch {
    return defaultState;
  }
}

export async function getDeveloperDiagnostics() {
  const overview = await getDeveloperOverview();
  const maintenance = await isMaintenanceMode();
  return {
    overview,
    maintenance,
    checkTime: new Date().toISOString(),
  };
}
