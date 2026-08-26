import mongoose from 'mongoose';
const schema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, title: { type: String, required: true }, message: { type: String, required: true }, type: { type: String, enum: ['info', 'success', 'warning', 'danger'], default: 'info' }, module: String, read: { type: Boolean, default: false }, link: String }, { timestamps: true });
schema.index({ userId: 1, read: 1, createdAt: -1 });
export default mongoose.model('Notification', schema);
