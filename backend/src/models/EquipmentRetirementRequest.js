import mongoose from 'mongoose';

/**
 * EquipmentRetirementRequest
 *
 * Represents a pending retirement request raised by an Equipment Manager.
 * Management must approve or reject it before the equipment is retired.
 * The Equipment record is NOT changed until the request is approved.
 */
const schema = new mongoose.Schema(
  {
    equipmentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
    assetNumber:   { type: String, required: true, trim: true },
    equipmentName: { type: String, required: true, trim: true },
    reason:        { type: String, required: true, trim: true, maxlength: 500 },
    notes:         { type: String, trim: true, maxlength: 1000 },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },

    requestedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt:      Date,
    rejectionReason: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

schema.index({ equipmentId: 1, status: 1 });
schema.index({ requestedBy: 1, createdAt: -1 });

export default mongoose.model('EquipmentRetirementRequest', schema);
