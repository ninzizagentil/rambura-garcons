import mongoose from 'mongoose';
const schema = new mongoose.Schema({ name: { type: String, required: true }, position: String, role: String, department: String, biography: String, bio: String, qualifications: [String], photo: { imageUrl: String, publicId: String }, email: String, phone: String, active: { type: Boolean, default: true } }, { timestamps: true });
export default mongoose.model('Staff', schema);
