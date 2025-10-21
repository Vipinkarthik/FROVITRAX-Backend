import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  category: {
    type: String,
    enum: ['Grains', 'Vegetables', 'Dairy', 'Meat', 'Spices', 'Fruits'],
    required: true
  },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendorDetails',
    required: true
  },
  vendorName: { type: String, required: true },
  status: {
    type: String,
    enum: ['In Stock', 'Low Stock', 'Out of Stock', 'Awaiting Delivery', 'Quality Check'],
    default: 'In Stock'
  },
  minThreshold: { type: Number, default: 10 },
  maxCapacity: { type: Number, default: 1000 },
  pricePerUnit: { type: Number, required: true },
  expiryDate: { type: Date },
  batchNumber: { type: String },
  location: { type: String, default: 'Main Warehouse' },
  lastRestocked: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Update status based on quantity
inventorySchema.pre('save', function(next) {
  if (this.quantity <= 0) {
    this.status = 'Out of Stock';
  } else if (this.quantity <= this.minThreshold) {
    this.status = 'Low Stock';
  } else {
    this.status = 'In Stock';
  }
  next();
});

export default mongoose.model('Inventory', inventorySchema);
