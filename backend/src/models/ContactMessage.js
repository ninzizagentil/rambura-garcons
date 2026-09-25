import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  status: { type: String, enum: ['new', 'read'], default: 'new' },
}, { timestamps: true });

schema.index({ status: 1, createdAt: -1 });
schema.index({ createdAt: -1 });

export default mongoose.model('ContactMessage', schema);
