import AuditLog from '../models/AuditLog.js';

export async function recordAudit(req, details) {
  return AuditLog.create({
    userId: req.user?._id,
    userName: req.user?.fullName || details.userName || 'Public user',
    method: req.method,
    endpoint: req.originalUrl,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    ...details,
  });
}
