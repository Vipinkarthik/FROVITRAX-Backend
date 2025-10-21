// Change user password

export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Old and new password required' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to change password', error: err.message });
  }
};
import ProcurementSettings from '../models/ProcurementSettings.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import bcrypt from 'bcryptjs';

// Get user-specific settings
export const getSettings = async (req, res) => {
  try {
    console.log('Getting settings for user:', req.user?.id);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }

    let settings = await ProcurementSettings.findOne({ userId });
    if (!settings) {
      console.log('Creating default settings for new user:', userId);
      // Create default settings for new user
      settings = new ProcurementSettings({
        userId,
        profile: {
          name: req.user.name || '',
          email: req.user.email || '',
          department: 'Procurement'
        },
        notifications: {
          emailNotifications: true,
          smsNotifications: false,
          orderUpdates: true,
          inventoryAlerts: true,
          paymentNotifications: true,
          lowStockAlerts: true,
          expiryAlerts: true,
          vendorUpdates: true,
          priceChangeAlerts: false,
          qualityAlerts: true
        },
        security: {
          twoFactorAuth: false,
          sessionTimeout: '30',
          passwordExpiry: '90',
          loginAlerts: true
        },
        system: {
          supplierRatingThreshold: 4.0,
          autoApproveLimit: 10000,
          evaluationFrequency: 'Monthly',
          defaultRegion: 'India',
          notifyDelayedDeliveries: true,
          defaultOrderPriority: 'Medium',
          currency: 'INR',
          autoReorderEnabled: false,
          qualityCheckRequired: true,
          temperatureMonitoring: true
        },
        preferences: {
          theme: 'dark',
          language: 'en',
          timezone: 'Asia/Kolkata',
          dateFormat: 'DD/MM/YYYY',
          dashboardLayout: 'grid'
        }
      });
      await settings.save();
      console.log('Default settings created successfully');
    }

    console.log('Settings retrieved successfully for user:', userId);
    res.json(settings);
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ message: 'Failed to fetch settings', error: err.message });
  }
};

// Create or update settings
export const createSettings = async (req, res) => {
  try {
    console.log('Creating/updating settings for user:', req.user?.id);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }

    let settings = await ProcurementSettings.findOne({ userId });
    if (settings) {
      console.log('Updating existing settings');
      // Update existing settings
      Object.assign(settings, req.body);
    } else {
      console.log('Creating new settings');
      // Create new settings
      settings = new ProcurementSettings({
        userId,
        ...req.body
      });
    }

    await settings.save();
    console.log('Settings saved successfully for user:', userId);
    res.json({ message: 'Settings saved successfully', settings });
  } catch (err) {
    console.error('Error saving settings:', err);
    res.status(500).json({ message: 'Failed to save settings', error: err.message });
  }
};

// Update existing settings
export const updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    let settings = await ProcurementSettings.findOne({ userId });
    if (!settings) {
      return res.status(404).json({ message: 'Settings not found' });
    }

    Object.assign(settings, req.body);
    await settings.save();

    res.json({ message: 'Settings updated successfully', settings });
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ message: 'Failed to update settings', error: err.message });
  }
};

// Delete user account and all associated data
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { confirmPassword } = req.body;

    if (!confirmPassword) {
      return res.status(400).json({ message: 'Password confirmation required' });
    }

    // Get user to verify password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(confirmPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    console.log(`Starting account deletion for user: ${userId}`);

    // Delete all associated data
    await Promise.all([
      // Delete user settings
      ProcurementSettings.deleteOne({ userId }),

      // Delete user's orders (or mark as deleted)
      Order.deleteMany({ createdBy: userId }),

      // Delete user's payments (or mark as deleted)
      Payment.deleteMany({ createdBy: userId }),

      // Finally delete the user account
      User.findByIdAndDelete(userId)
    ]);

    console.log(`Account deletion completed for user: ${userId}`);

    res.json({
      message: 'Account deleted successfully. All associated data has been removed.',
      deleted: true
    });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ message: 'Failed to delete account', error: err.message });
  }
};
