import mongoose from 'mongoose';
const schema = new mongoose.Schema({ fullName: { type: String, required: true }, email: { type: String, required: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }, phone: { type: String, required: true }, program: String, programLabel: String, message: String, status: { type: String, enum: ['new', 'reviewed', 'accepted', 'declined'], default: 'new' }, submittedAt: { type: Date, default: Date.now }, reviewedAt: Date, reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }, { timestamps: true });
schema.index({ status: 1, submittedAt: -1 });
export default mongoose.model('Admission', schema);
