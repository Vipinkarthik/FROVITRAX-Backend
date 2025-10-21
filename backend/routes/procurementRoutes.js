import express from 'express';
import { saveProcurementDetails } from '../controllers/procurementController.js';
import { verifyToken, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();
router.post(
  '/details',
  verifyToken,
  restrictTo('procurement'),
  saveProcurementDetails
);

export default router;
