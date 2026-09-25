import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 180 },
  slug: { type: String, required: true, unique: true, trim: true },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  startDate: { type: Date, required: true },
  endDate: Date,
  location: { type: String, required: true, trim: true, maxlength: 180 },
  image: { imageUrl: String, publicId: String },
  published: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

schema.index({ published: 1, startDate: 1 });
export default mongoose.model('Event', schema);
