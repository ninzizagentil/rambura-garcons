import mongoose from 'mongoose';
const schema = new mongoose.Schema({ title: { type: String, required: true }, slug: { type: String, unique: true, required: true }, description: String, summary: String, image: { imageUrl: String, publicId: String }, duration: String, qualification: String, department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' }, featured: Boolean, active: { type: Boolean, default: true } }, { timestamps: true });
export default mongoose.model('Program', schema);
