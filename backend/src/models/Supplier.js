import mongoose from 'mongoose';
const schema = new mongoose.Schema({ name: { type: String, required: true }, contactPerson: String, phone: String, email: String, address: String, status: { type: String, enum: ['active', 'inactive'], default: 'active' }, notes: String }, { timestamps: true });
export default mongoose.model('Supplier', schema);
