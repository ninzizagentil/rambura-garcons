import mongoose from 'mongoose';
const schema = new mongoose.Schema({ title: String, caption: String, description: String, image: { imageUrl: String, publicId: String }, category: String, active: { type: Boolean, default: true } }, { timestamps: true });
export default mongoose.model('Gallery', schema);
