import mongoose from 'mongoose';
const schema = new mongoose.Schema({ name: { type: String, required: true }, slug: { type: String, unique: true, required: true }, description: String, image: { imageUrl: String, publicId: String }, programs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Program' }], active: { type: Boolean, default: true } }, { timestamps: true });
export default mongoose.model('Department', schema);
