import mongoose from 'mongoose';
const schema = new mongoose.Schema({ name: String, type: String, generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, filters: mongoose.Schema.Types.Mixed, fileUrl: String }, { timestamps: true });
export default mongoose.model('Report', schema);
