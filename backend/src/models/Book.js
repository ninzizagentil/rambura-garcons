import mongoose from 'mongoose';
const schema = new mongoose.Schema({ title: { type: String, required: true }, author: String, category: { type: String, trim: true, maxlength: 100, required: true }, bookCode: { type: String, unique: true, required: true }, description: String, coverImage: { imageUrl: String, publicId: String }, totalCopies: { type: Number, min: 0, required: true }, borrowedCopies: { type: Number, min: 0, default: 0 }, archivePending: { type: Boolean, default: false }, active: { type: Boolean, default: true } }, { timestamps: true, toJSON: { virtuals: true } });
schema.virtual('availableCopies').get(function () { return this.totalCopies - this.borrowedCopies; });
schema.index({ title: 'text', author: 'text', category: 1 });
export default mongoose.model('Book', schema);
