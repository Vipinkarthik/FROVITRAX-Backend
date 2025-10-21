import mongoose from 'mongoose';

const VendorDetailsSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  ownerName: { type: String, required: true },
  businessType: { type: String, required: true },
  contact: {
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  address: { type: String, required: true },
  supplyCategories: { type: [String], required: true },
  operationalArea: { type: String, required: true },
  licenseNumber: { type: String, required: true },
  years: { type: Number, required: true },
  avgCapacity: { type: Number, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

export default mongoose.model('VendorDetails', VendorDetailsSchema);
