import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  borrower: { type: String, required: true },
  borrowerType: String,
  studentClassYear: { type: String, trim: true },
  borrowDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  returnDate: Date,
  status: { type: String, enum: ['borrowed', 'overdue', 'returned'], default: 'borrowed' },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  returnedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String,
}, { timestamps: true });
schema.path('dueDate').validate(function (value) { return !this.borrowDate || value >= this.borrowDate; }, 'Due date cannot be before borrow date');
schema.index({ bookId: 1, status: 1 }); schema.index({ dueDate: 1, status: 1 });
export default mongoose.model('Loan', schema);
