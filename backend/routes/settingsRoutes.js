import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
  getSettings,
  createSettings,
  updateSettings,
  deleteAccount,
  changePassword
} from '../controllers/settingsController.js';

const router = express.Router();

// GET /api/procurement/settings - Get procurement manager settings
router.get('/settings', verifyToken, getSettings);

// POST /api/procurement/settings - Create/Update procurement manager settings
router.post('/settings', verifyToken, createSettings);

// PUT /api/procurement/settings - Update procurement manager settings
router.put('/settings', verifyToken, updateSettings);

// DELETE /api/procurement/account - Delete user account and all data
router.delete('/account', verifyToken, deleteAccount);

// PUT /api/auth/change-password - Change user password
router.put('/auth/change-password', verifyToken, changePassword);

export default router;
