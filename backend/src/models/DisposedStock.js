import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'StockItem', required: true },
    itemName: String,
    quantityRemoved: { type: Number, min: 1, required: true },
    remainingQuantity: { type: Number, min: 0, required: true },
    reason: { type: String, enum: ['Damaged', 'Expired', 'Lost', 'Broken', 'Obsolete', 'Other'], required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    date: { type: Date, default: Date.now },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvalNotes: String,
    responsibleUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedByName: { type: String },
    notes: String,
    rejectionReason: String
  },
  { timestamps: true }
);

export default mongoose.model('DisposedStock', schema);
