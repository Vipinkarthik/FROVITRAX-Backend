import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unit: { type: String, required: true },
  pricePerUnit: { type: Number, required: true },
  totalPrice: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true, required: true },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendorDetails',
    required: true
  },
  vendorName: { type: String, required: true },
  vendorCompanyName: { type: String, required: true },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'In Progress', 'In Transit', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  expectedDeliveryDate: { type: Date },
  actualDeliveryDate: { type: Date },
  deliveryAddress: { type: String, required: true },
  notes: { type: String },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Partial', 'Completed'],
    default: 'Pending'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

// Generate unique order ID
orderSchema.pre('save', function(next) {
  if (!this.orderId) {
    this.orderId = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();
  }
  next();
});

export default mongoose.model('Order', orderSchema);
