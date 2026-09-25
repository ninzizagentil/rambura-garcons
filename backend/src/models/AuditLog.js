import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: String,
  action: { type: String, required: true },
  module: { type: String, required: true },
  resourceType: String,
  resourceId: mongoose.Schema.Types.ObjectId,
  description: String,
  method: String,
  endpoint: String,
  ipAddress: String,
  userAgent: String,
  status: { type: String, enum: ['success', 'warning', 'error'], default: 'success' },
}, { timestamps: true });

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ module: 1, createdAt: -1 });
export default mongoose.model('AuditLog', auditLogSchema);
