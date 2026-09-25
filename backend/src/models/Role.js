import mongoose from 'mongoose';
const schema = new mongoose.Schema({ name: { type: String, enum: ['admin', 'librarian', 'stock_manager', 'equipment_manager', 'management'], unique: true, required: true }, label: String, permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }] }, { timestamps: true });
export default mongoose.model('Role', schema);
