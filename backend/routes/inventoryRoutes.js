import express from 'express';
import {
  getInventory,
  getInventoryStats,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem
} from '../controllers/inventoryController.js';
import VendorProduct from '../models/VendorProduct.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/inventory - Get all inventory items with filtering
router.get('/', verifyToken, getInventory);

// GET /api/inventory/stats - Get inventory statistics
router.get('/stats', verifyToken, getInventoryStats);

// GET /api/inventory/vendor-products - Get all available vendor products (for procurement)
router.get('/vendor-products', verifyToken, async (req, res) => {
  try {
    const { category, vendor, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    let filter = { isAvailable: true, status: 'Active' };
    if (category && category !== 'All') filter.category = category;
    if (vendor) filter.vendor = vendor;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const vendorProducts = await VendorProduct.find(filter)
      .populate('vendor', 'businessName ownerName contact operationalArea')
      .sort(sortOptions);

    res.status(200).json(vendorProducts);
  } catch (error) {
    console.error('Error fetching vendor products:', error);
    res.status(500).json({ message: 'Failed to fetch vendor products', error: error.message });
  }
});

// POST /api/inventory - Add new inventory item
router.post('/', verifyToken, addInventoryItem);

// PUT /api/inventory/:id - Update inventory item
router.put('/:id', verifyToken, updateInventoryItem);

// DELETE /api/inventory/:id - Delete inventory item
router.delete('/:id', verifyToken, deleteInventoryItem);

export default router;
