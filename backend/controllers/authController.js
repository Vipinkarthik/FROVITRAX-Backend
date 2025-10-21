import User from '../models/User.js';
import ProcurementDetails from '../models/ProcurementDetails.js';
import VendorDetails from '../models/VendorDetails.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendWelcomeEmail } from '../utils/emailService.js';

export const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    await sendWelcomeEmail(email, name , role);

    res.status(201).json({ token, role: user.role, userId: user._id });
  } catch (err) {
    console.error('Signup Error:', err);
    res.status(500).json({ message: 'Signup failed', error: err.message });
  }
};

export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Incorrect password' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({ token, role: user.role, userId: user._id });
  } catch (err) {
    console.error('Signin Error:', err);
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

// Get user details with role-specific information
export const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let userDetails = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    // Get role-specific details
    if (user.role === 'procurement') {
      const procurementDetails = await ProcurementDetails.findOne({ user: userId });
      if (procurementDetails) {
        userDetails = {
          ...userDetails,
          fullName: procurementDetails.fullName,
          organization: procurementDetails.organization,
          designation: procurementDetails.designation,
          contact: procurementDetails.contact,
          location: procurementDetails.location,
          procurementAreas: procurementDetails.procurementAreas,
          experience: procurementDetails.experience
        };
      }
    } else if (user.role === 'vendor') {
      const vendorDetails = await VendorDetails.findOne({ user: userId });
      if (vendorDetails) {
        userDetails = {
          ...userDetails,
          businessName: vendorDetails.businessName,
          ownerName: vendorDetails.ownerName,
          businessType: vendorDetails.businessType,
          contact: vendorDetails.contact,
          address: vendorDetails.address,
          supplyCategories: vendorDetails.supplyCategories,
          operationalArea: vendorDetails.operationalArea,
          licenseNumber: vendorDetails.licenseNumber,
          years: vendorDetails.years,
          avgCapacity: vendorDetails.avgCapacity
        };
      }
    }

    res.status(200).json({ user: userDetails });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Failed to fetch user details', error: error.message });
  }
};
