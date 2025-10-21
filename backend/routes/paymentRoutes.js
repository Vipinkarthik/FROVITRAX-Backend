import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
  getPayments,
  getPaymentOrders,
  confirmDeliveryAndReleasePayment,
  triggerPayment,
  createPayment,
  updatePaymentStatus,
  getPaymentStats
} from '../controllers/paymentController.js';

const router = express.Router();

// GET /api/payments - Get all payments with filtering
router.get('/', verifyToken, getPayments);

// GET /api/payments/stats - Get payment statistics
router.get('/stats', verifyToken, getPaymentStats);

// GET /api/payments/orders - Get orders for payment dashboard
router.get('/orders', verifyToken, getPaymentOrders);

// POST /api/payments - Create new payment record
router.post('/', verifyToken, createPayment);

// POST /api/payments/process - Process payment (legacy)
router.post('/process', verifyToken, triggerPayment);

// PATCH /api/payments/orders/:id/confirm-delivery - Confirm delivery and release payment
router.patch('/orders/:id/confirm-delivery', verifyToken, confirmDeliveryAndReleasePayment);

// PATCH /api/payments/:id/status - Update payment status
router.patch('/:id/status', verifyToken, updatePaymentStatus);

export default router;
