import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, unique: true, required: true },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendorDetails',
    required: true
  },
  vendorName: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['Pending', 'Locked', 'Released', 'Failed', 'Refunded'],
    default: 'Locked'
  },
  paymentMethod: {
    type: String,
    enum: ['Bank Transfer', 'Check', 'Digital Wallet', 'Cash'],
    default: 'Bank Transfer'
  },
  transactionId: { type: String },
  releaseDate: { type: Date },
  dueDate: { type: Date, required: true },
  notes: { type: String },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deliveryConfirmed: { type: Boolean, default: false },
  deliveryConfirmedAt: { type: Date },
  autoReleaseEnabled: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Generate unique payment ID
paymentSchema.pre('save', function(next) {
  if (!this.paymentId) {
    this.paymentId = 'PAY-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();
  }
  next();
});

export default mongoose.model('Payment', paymentSchema);
