import mongoose from 'mongoose';
const schema = new mongoose.Schema({ key: { type: String, unique: true, required: true }, label: String, module: String }, { timestamps: true });
export default mongoose.model('Permission', schema);
