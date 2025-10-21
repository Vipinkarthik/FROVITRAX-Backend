import mongoose from 'mongoose';

const ProcurementSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  profile: {
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    department: { type: String, default: 'Procurement' },
    company: { type: String, default: '' },
    address: { type: String, default: '' },
    emergencyContact: { type: String, default: '' }
  },
  notifications: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    orderUpdates: { type: Boolean, default: true },
    inventoryAlerts: { type: Boolean, default: true },
    paymentNotifications: { type: Boolean, default: true },
    lowStockAlerts: { type: Boolean, default: true },
    expiryAlerts: { type: Boolean, default: true },
    vendorUpdates: { type: Boolean, default: true },
    priceChangeAlerts: { type: Boolean, default: false },
    qualityAlerts: { type: Boolean, default: true }
  },
  security: {
    twoFactorAuth: { type: Boolean, default: false },
    sessionTimeout: { type: String, default: '30' },
    passwordExpiry: { type: String, default: '90' },
    loginAlerts: { type: Boolean, default: true },
    ipWhitelist: { type: [String], default: [] }
  },
  system: {
    supplierRatingThreshold: { type: Number, default: 4.0 },
    autoApproveLimit: { type: Number, default: 10000 },
    evaluationFrequency: { type: String, default: 'Monthly' },
    defaultRegion: { type: String, default: 'India' },
    notifyDelayedDeliveries: { type: Boolean, default: true },
    defaultOrderPriority: { type: String, default: 'Medium' },
    currency: { type: String, default: 'INR' },
    autoReorderEnabled: { type: Boolean, default: false },
    qualityCheckRequired: { type: Boolean, default: true },
    temperatureMonitoring: { type: Boolean, default: true }
  },
  preferences: {
    theme: { type: String, default: 'dark' },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    dashboardLayout: { type: String, default: 'grid' }
  }
}, {
  timestamps: true
});

export default mongoose.model('ProcurementSettings', ProcurementSettingsSchema);