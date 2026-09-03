import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    code: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    category: { type: String, enum: ['Foods', 'Electronic Devices'], required: true },
    unit: { type: String, enum: ['kg', 'litres', 'bags', 'cartons', 'boxes', 'pieces', 'units', 'sets'], required: true },
    quantity: { type: Number, min: 0, default: 0 },
    minLevel: { type: Number, min: 0, default: 0 },
    unitPrice: { type: Number, min: 0, default: 0 },
    description: String,
    location: { type: String, enum: ['Main Store', 'Kitchen Store', 'ICT Lab Store', 'Admin Store'] },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    batchNumber: String,
    expiryDate: Date,
    serialNumber: String,
    requiresBatch: { type: Boolean, default: false },
    requiresSerial: { type: Boolean, default: false },
    abcClassification: { type: String, enum: ['A', 'B', 'C'], default: 'C' },
    active: { type: Boolean, default: true }
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

schema.virtual('stockValue').get(function () {
  return this.quantity * this.unitPrice;
});

schema.pre('save', function (next) {
  this.requiresBatch = this.category === 'Foods';
  this.requiresSerial = this.category === 'Electronic Devices';
  next();
});

schema.index({
  code: 1,
  name: 1,
  category: 1,
  location: 1,
  supplierId: 1,
  expiryDate: 1,
  abcClassification: 1
});

export default mongoose.model('StockItem', schema);
