import mongoose from 'mongoose';

const vendorProductSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Grains', 'Vegetables', 'Dairy', 'Meat', 'Spices', 'Fruits'], 
    required: true 
  },
  description: { type: String },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true },
  pricePerUnit: { type: Number, required: true, min: 0 },
  minOrderQuantity: { type: Number, default: 1 },
  maxOrderQuantity: { type: Number },
  vendor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'VendorDetails', 
    required: true 
  },
  vendorName: { type: String, required: true },
  vendorCompanyName: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
  harvestDate: { type: Date },
  expiryDate: { type: Date },
  qualityCertifications: [{ type: String }],
  images: [{ type: String }],
  location: { type: String },
  deliveryOptions: [{ 
    type: String, 
    enum: ['Pickup', 'Local Delivery', 'Shipping'] 
  }],
  status: { 
    type: String, 
    enum: ['Active', 'Out of Stock', 'Discontinued'], 
    default: 'Active' 
  }
}, {
  timestamps: true
});

// Update status based on quantity
vendorProductSchema.pre('save', function(next) {
  if (this.quantity <= 0) {
    this.status = 'Out of Stock';
    this.isAvailable = false;
  } else {
    this.status = 'Active';
    this.isAvailable = true;
  }
  next();
});

// Index for better search performance
vendorProductSchema.index({ vendor: 1, category: 1, productName: 1 });
vendorProductSchema.index({ isAvailable: 1, status: 1 });

export default mongoose.model('VendorProduct', vendorProductSchema);
