import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, maxlength: 120 },
  username: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 50 },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'librarian', 'stock_manager', 'management'], required: true },
  permissions: { type: [String], default: [] },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  profileImage: { imageUrl: String, publicId: String },
  lastActivity: Date,
  lastLogin: Date,
  refreshTokenHash: { type: String, select: false },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
