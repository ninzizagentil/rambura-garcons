import mongoose from 'mongoose';
const schema = new mongoose.Schema({ title: { type: String, required: true }, slug: { type: String, unique: true, required: true }, date: { type: Date, required: true }, category: { type: String, default: 'Announcement' }, excerpt: String, content: String, image: { imageUrl: String, publicId: String }, author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, published: { type: Boolean, default: false }, publishedAt: Date, featured: Boolean, tags: [String], active: { type: Boolean, default: true } }, { timestamps: true });
schema.index({ published: 1, publishedAt: -1 });
export default mongoose.model('News', schema);
