import mongoose from 'mongoose';

const ProcurementDetailsSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  organization: { type: String, required: true },
  designation: { type: String, required: true },
  contact: { type: String, required: true },
  location: { type: String, required: true },
  procurementAreas: { type: [String], required: true },
  experience: { type: Number, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

export default mongoose.model('ProcurementDetails', ProcurementDetailsSchema);
