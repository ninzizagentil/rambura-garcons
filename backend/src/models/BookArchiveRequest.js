import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  bookTitle: { type: String, required: true, trim: true },
  bookCode: { type: String, required: true, trim: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  approvalNotes: { type: String, trim: true, maxlength: 1000 },
  rejectionReason: { type: String, trim: true, maxlength: 500 },
}, { timestamps: true });

schema.index({ bookId: 1, status: 1 });
schema.index({ requestedBy: 1, createdAt: -1 });

export default mongoose.model('BookArchiveRequest', schema);