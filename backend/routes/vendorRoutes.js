import express from 'express';
import { verifyToken, restrictTo } from '../middleware/authMiddleware.js';
import {
  getAllVendors,
  saveVendorDetails,
  getVendorProducts,
  addVendorProduct,
  updateVendorProduct,
  deleteVendorProduct,
  getVendorOrders,
  getLoggedInVendor
} from '../controllers/vendorController.js';

const router = express.Router();

// GET /api/vendor/me - Get logged-in vendor details
router.get('/me', verifyToken, restrictTo('vendor'), getLoggedInVendor);

// GET /api/vendor - Get all vendors (for procurement dashboard)
router.get('/', verifyToken, getAllVendors);

// POST /api/vendor/details - Save vendor details
router.post('/details', verifyToken, restrictTo('vendor'), saveVendorDetails);

// Vendor Products Routes
// GET /api/vendor/products - Get vendor's products
router.get('/products', verifyToken, restrictTo('vendor'), getVendorProducts);

// POST /api/vendor/products - Add new product
router.post('/products', verifyToken, restrictTo('vendor'), addVendorProduct);

// PUT /api/vendor/products/:id - Update product
router.put('/products/:id', verifyToken, restrictTo('vendor'), updateVendorProduct);

// DELETE /api/vendor/products/:id - Delete product
router.delete('/products/:id', verifyToken, restrictTo('vendor'), deleteVendorProduct);

// Vendor Orders Routes
// GET /api/vendor/orders - Get orders for vendor
router.get('/orders', verifyToken, restrictTo('vendor'), getVendorOrders);

export default router;