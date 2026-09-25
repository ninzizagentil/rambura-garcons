/**
 * auditService.js
 *
 * Records detailed accountability history in AuditLog.
 *
 * NOTE: The previous version of this service also fired a notification to
 * every admin and management user on *every* audited action.  This created
 * notification noise (a new alert for every stock-in, every page visit, every
 * library update, etc.) and conflated the audit trail with the operational
 * notification system.
 *
 * Notification responsibility has been moved to `notificationService.js`.
 * Notifications are now created only when a meaningful workflow event
 * succeeds (disposal request submitted/approved/rejected, retirement
 * request submitted/approved/rejected, etc.).  The Audit Log remains the
 * source of truth for full accountability history.
 */

import AuditLog from '../models/AuditLog.js';

export async function recordAudit(req, details) {
  const log = await AuditLog.create({
    userId:    req.user?._id,
    userName:  req.user?.fullName || details.userName || 'Public user',
    method:    req.method,
    endpoint:  req.originalUrl,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    ...details,
  });
  return log;
}
