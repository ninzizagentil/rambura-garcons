import mongoose from 'mongoose';

// A stock manager asks management to archive a stock item whose quantity is 0.
// The item is only archived (active: false) after management approves.
const schema = new mongoose.Schema(
  {
    itemId:          { type: mongoose.Schema.Types.ObjectId, ref: 'StockItem', required: true },
    itemName:        { type: String, required: true, trim: true },
    itemCode:        { type: String, trim: true },
    reason:          { type: String, required: true, trim: true, maxlength: 500 },
    notes:           { type: String, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    requestedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt:      Date,
    approvalNotes:   { type: String, trim: true, maxlength: 1000 },
    rejectionReason: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

schema.index({ itemId: 1, status: 1 });
schema.index({ requestedBy: 1, createdAt: -1 });

export default mongoose.model('StockArchiveRequest', schema);
