import express from 'express';
import { signup, signin, getUserDetails } from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.get('/user/:userId', verifyToken, getUserDetails);

export default router;
