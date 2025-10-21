import express from 'express';
import { resendWelcomeEmail } from '../utils/emailService.js';

const router = express.Router();

router.post('/resend-welcome', async (req, res) => {
  const { email, name, role } = req.body;

  if (!email || !name || !role) {
    return res.status(400).json({ message: 'Email, name, and role are required.' });
  }

  try {
    await resendWelcomeEmail(email, name, role);
    res.status(200).json({ success: true, message: 'Welcome email resent successfully.' });
  } catch (err) {
    console.error('Error resending welcome email:', err.message);
    res.status(500).json({ success: false, message: 'Failed to resend welcome email.', error: err.message });
  }
});

export default router;
