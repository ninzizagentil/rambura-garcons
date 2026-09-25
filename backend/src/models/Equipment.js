import mongoose from 'mongoose';

const maintenanceSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ['inspection', 'repair', 'service', 'upgrade'], required: true },
  description: { type: String, required: true, trim: true, maxlength: 1000 },
  cost: { type: Number, min: 0, default: 0 },
  performedBy: { type: String, trim: true, maxlength: 160 },
  nextDueDate: Date,
  notes: { type: String, trim: true, maxlength: 1000 },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { _id: true });

const assignmentSchema = new mongoose.Schema({
  userName: { type: String, trim: true, maxlength: 160 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedAt: { type: Date, default: Date.now },
  returnedAt: Date,
  notes: { type: String, trim: true, maxlength: 500 },
}, { _id: true });

const schema = new mongoose.Schema({
  assetNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  type: { type: String, enum: ['laptop', 'desktop', 'printer', 'projector', 'network', 'electrical_material', 'other'], required: true },
  brand: { type: String, trim: true, maxlength: 100 },
  model: { type: String, trim: true, maxlength: 100 },
  serialNumber: { type: String, trim: true, maxlength: 120 },
  location: { type: String, required: true, trim: true, maxlength: 160 },
  condition: { type: String, enum: ['new', 'good', 'fair', 'damaged', 'under_repair', 'retired'], default: 'good' },
  status: { type: String, enum: ['available', 'assigned', 'under_maintenance', 'retired'], default: 'available' },
  purchaseDate: Date,
  purchaseCost: { type: Number, min: 0, default: 0 },
  warrantyExpiry: Date,
  currentAssignee: { userName: String, userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, assignedAt: Date },
  assignmentHistory: [assignmentSchema],
  maintenanceRecords: [maintenanceSchema],
  notes: { type: String, trim: true, maxlength: 2000 },
  active: { type: Boolean, default: true },
}, { timestamps: true, toJSON: { virtuals: true } });

schema.index({ assetNumber: 1, serialNumber: 1, type: 1, location: 1, condition: 1, status: 1 });
export default mongoose.model('Equipment', schema);
