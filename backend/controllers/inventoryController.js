import Inventory from '../models/Inventory.js';

export const getInventory = async (req, res) => {
  try {
    const { category, status, vendor, sortBy = 'updatedAt', sortOrder = 'desc' } = req.query;
    let filter = {};
    if (category && category !== 'All') filter.category = category;
    if (status && status !== 'All') filter.status = status;
    if (vendor) filter.vendor = vendor;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const inventory = await Inventory.find(filter)
      .populate('vendor', 'businessName ownerName contact')
      .sort(sortOptions);

    const transformedInventory = inventory.map(item => ({
      _id: item._id,
      name: item.itemName,
      itemName: item.itemName,
      category: item.category,
      stock: item.quantity,
      quantity: item.quantity,
      unit: item.unit,
      vendorName: item.vendorName,
      vendor: item.vendor,
      status: item.status,
      pricePerUnit: item.pricePerUnit,
      location: item.location,
      updatedAt: item.updatedAt,
      trend: item.quantity > item.minThreshold ? 'up' : 'down',
      minThreshold: item.minThreshold,
      maxCapacity: item.maxCapacity,
      expiryDate: item.expiryDate,
      batchNumber: item.batchNumber,
      lastRestocked: item.lastRestocked
    }));

    res.status(200).json(transformedInventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ message: 'Failed to fetch inventory', error: error.message });
  }
};

// Get inventory statistics
export const getInventoryStats = async (req, res) => {
  try {
    const totalItems = await Inventory.countDocuments();
    const lowStockItems = await Inventory.countDocuments({ status: 'Low Stock' });
    const outOfStockItems = await Inventory.countDocuments({ status: 'Out of Stock' });
    const inStockItems = await Inventory.countDocuments({ status: 'In Stock' });

    const categoryStats = await Inventory.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$quantity', '$pricePerUnit'] } }
        }
      }
    ]);

    res.status(200).json({
      totalItems,
      lowStockItems,
      outOfStockItems,
      inStockItems,
      categoryStats
    });
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    res.status(500).json({ message: 'Failed to fetch inventory statistics', error: error.message });
  }
};

// Add new inventory item
export const addInventoryItem = async (req, res) => {
  try {
    const {
      itemName,
      category,
      quantity,
      unit,
      vendor,
      vendorName,
      pricePerUnit,
      minThreshold,
      maxCapacity,
      expiryDate,
      batchNumber,
      location
    } = req.body;

    const newItem = new Inventory({
      itemName,
      category,
      quantity,
      unit,
      vendor,
      vendorName,
      pricePerUnit,
      minThreshold: minThreshold || 10,
      maxCapacity: maxCapacity || 1000,
      expiryDate,
      batchNumber,
      location: location || 'Main Warehouse'
    });

    await newItem.save();
    await newItem.populate('vendor', 'businessName ownerName contact');

    res.status(201).json({
      message: 'Inventory item added successfully',
      item: newItem
    });
  } catch (error) {
    console.error('Error adding inventory item:', error);
    res.status(500).json({ message: 'Failed to add inventory item', error: error.message });
  }
};

// Update inventory item
export const updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedItem = await Inventory.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('vendor', 'businessName ownerName contact');

    if (!updatedItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    res.status(200).json({
      message: 'Inventory item updated successfully',
      item: updatedItem
    });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ message: 'Failed to update inventory item', error: error.message });
  }
};

// Delete inventory item
export const deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedItem = await Inventory.findByIdAndDelete(id);

    if (!deletedItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    res.status(200).json({
      message: 'Inventory item deleted successfully',
      item: deletedItem
    });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ message: 'Failed to delete inventory item', error: error.message });
  }
};
