import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatusController,
  updateOrder,
  deleteOrder,
  getOrderStats
} from '../controllers/ordersController.js';

const router = express.Router();

// GET /api/orders - Get all orders with filtering
router.get('/', verifyToken, getOrders);

// GET /api/orders/stats - Get order statistics
router.get('/stats', verifyToken, getOrderStats);

// GET /api/orders/:id - Get single order by ID
router.get('/:id', verifyToken, getOrderById);

// POST /api/orders - Create new order
router.post('/', verifyToken, createOrder);

// PUT /api/orders/:id - Update order details
router.put('/:id', verifyToken, updateOrder);

// PATCH /api/orders/:id/status - Update order status
router.patch('/:id/status', verifyToken, updateOrderStatusController);

// DELETE /api/orders/:id - Delete order
router.delete('/:id', verifyToken, deleteOrder);

export default router;
