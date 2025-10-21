import ProcurementDetails from '../models/ProcurementDetails.js';

export const saveProcurementDetails = async (req, res) => {
  try {
    const {
      fullName,
      organization,
      designation,
      contact,
      location,
      procurementAreas,
      experience
    } = req.body;

    const saved = await ProcurementDetails.create({
      fullName,
      organization,
      designation,
      contact,
      location,
      procurementAreas,
      experience,
      user: req.user.id
    });

    res.status(201).json({ message: 'Procurement details saved', data: saved });
  } catch (err) {
    console.error('Save Error:', err); // Log exact error in server
    res.status(500).json({
      message: 'Failed to save procurement details',
      error: err.message
    });
  }
};
