import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    location: { type: String, required: true, trim: true, maxlength: 160 },
    status: { type: String, enum: ['planned', 'in-progress', 'completed', 'pending-approval'], default: 'planned' },
    scheduledDate: { type: Date, required: true },
    startedAt: Date,
    completedAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items: [
      {
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'StockItem' },
        systemQuantity: Number,
        physicalQuantity: Number,
        variance: Number,
        variancePercentage: Number,
        adjustmentNeeded: Boolean,
        notes: String
      }
    ],
    totalItems: Number,
    totalVariances: Number,
    approvalNotes: String,
    documentUrl: String // URL to uploaded reconciliation document
  },
  { timestamps: true }
);

export default mongoose.model('StockReconciliation', schema);
