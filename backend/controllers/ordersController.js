import Order from '../models/Order.js';
import VendorDetails from '../models/VendorDetails.js';
import { updateOrderStatus } from '../utils/statusUpdater.js';

// Get all orders with filtering and sorting (role-based)
export const getOrders = async (req, res) => {
  try {
    const { status, vendor, priority, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const userId = req.user.id;
    const userRole = req.user.role;

    console.log(`Fetching orders for user: ${userId}, role: ${userRole}`);

    let filter = {};
    if (status && status !== 'All') filter.status = status;
    if (vendor) filter.vendor = vendor;
    if (priority) filter.priority = priority;

    // Role-based filtering
    if (userRole === 'procurement') {
      // Procurement managers only see orders they created
      filter.createdBy = userId;
      console.log('Procurement filter:', filter);
    } else if (userRole === 'vendor') {
      // Vendors only see orders placed with them
      const vendorDetails = await VendorDetails.findOne({ user: userId });
      console.log('Vendor details found:', vendorDetails ? 'Yes' : 'No');

      if (vendorDetails) {
        filter.vendor = vendorDetails._id;
        console.log('Vendor filter:', filter);
      } else {
        console.log('No vendor details found for user:', userId);
        // If vendor details not found, return empty array instead of error
        return res.status(200).json([]);
      }
    } else {
      // For users without a clear role, try to determine based on data
      console.log('Unknown role, attempting to determine user type');

      // Check if user has vendor details
      const vendorDetails = await VendorDetails.findOne({ user: userId });
      if (vendorDetails) {
        console.log('User has vendor details, treating as vendor');
        filter.vendor = vendorDetails._id;
      } else {
        console.log('No vendor details, treating as procurement manager');
        filter.createdBy = userId;
      }
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    console.log('Final filter for orders query:', filter);

    const orders = await Order.find(filter)
      .populate('vendor', 'businessName ownerName contact address')
      .populate('createdBy', 'name email')
      .sort(sortOptions);

    console.log(`Found ${orders.length} orders for user ${userId}`);

    // If no orders found, return empty array (not an error)
    if (orders.length === 0) {
      console.log('No orders found, returning empty array');
      return res.status(200).json([]);
    }

    // Transform data for frontend compatibility
    const transformedOrders = orders.map(order => ({
      _id: order._id,
      orderId: order.orderId,
      vendor: order.vendor,
      vendorName: order.vendorName,
      vendorCompanyName: order.vendorCompanyName,
      items: order.items,
      itemsDescription: order.items.map(item => `${item.itemName} (${item.quantity} ${item.unit})`).join(', '),
      quantity: order.items.reduce((total, item) => total + item.quantity, 0),
      totalAmount: order.totalAmount,
      status: order.status,
      priority: order.priority,
      expectedDeliveryDate: order.expectedDeliveryDate,
      actualDeliveryDate: order.actualDeliveryDate,
      deliveryAddress: order.deliveryAddress,
      notes: order.notes,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      date: order.createdAt,
      createdBy: order.createdBy
    }));

    res.status(200).json(transformedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id,
      userRole: req.user?.role
    });
    res.status(500).json({
      message: 'Failed to fetch orders',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get single order by ID
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('vendor', 'businessName ownerName contact address')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Failed to fetch order', error: error.message });
  }
};

// Create new order
export const createOrder = async (req, res) => {
  try {
    const {
      vendor,
      vendorName,
      vendorCompanyName,
      items,
      totalAmount,
      priority,
      expectedDeliveryDate,
      deliveryAddress,
      notes,
      createdBy
    } = req.body;

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    // Calculate total amount if not provided
    let calculatedTotal = totalAmount;
    if (!calculatedTotal) {
      calculatedTotal = items.reduce((total, item) => total + item.totalPrice, 0);
    }

    // Generate unique order ID
    const orderId = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();

    const newOrder = new Order({
      orderId,
      vendor,
      vendorName,
      vendorCompanyName,
      items,
      totalAmount: calculatedTotal,
      priority: priority || 'Medium',
      expectedDeliveryDate,
      deliveryAddress,
      notes,
      createdBy
    });

    await newOrder.save();
    await newOrder.populate('vendor', 'businessName ownerName contact address');

    res.status(201).json({
      message: 'Order created successfully',
      order: newOrder
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
};

// Update order status
export const updateOrderStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, updatedBy, notes } = req.body;

    const updatedOrder = await updateOrderStatus(id, status);

    if (updatedBy) {
      updatedOrder.updatedBy = updatedBy;
    }

    if (notes) {
      updatedOrder.notes = notes;
    }

    if (status === 'Delivered') {
      updatedOrder.actualDeliveryDate = new Date();
    }

    await updatedOrder.save();
    await updatedOrder.populate('vendor', 'businessName ownerName contact address');

    res.status(200).json({
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Failed to update order status', error: error.message });
  }
};

// Update order details
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('vendor', 'businessName ownerName contact address');

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({
      message: 'Order updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Failed to update order', error: error.message });
  }
};

// Delete order
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({
      message: 'Order deleted successfully',
      order: deletedOrder
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Failed to delete order', error: error.message });
  }
};

// Get order statistics (role-based)
export const getOrderStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let filter = {};

    // Role-based filtering
    if (userRole === 'procurement') {
      filter.createdBy = userId;
    } else if (userRole === 'vendor') {
      const vendorDetails = await VendorDetails.findOne({ user: userId });
      if (vendorDetails) {
        filter.vendor = vendorDetails._id;
      } else {
        return res.status(200).json({
          totalOrders: 0,
          pendingOrders: 0,
          inProgressOrders: 0,
          deliveredOrders: 0,
          cancelledOrders: 0,
          statusStats: [],
          priorityStats: []
        });
      }
    }

    const totalOrders = await Order.countDocuments(filter);
    const pendingOrders = await Order.countDocuments({ ...filter, status: 'Pending' });
    const inProgressOrders = await Order.countDocuments({ ...filter, status: 'In Progress' });
    const deliveredOrders = await Order.countDocuments({ ...filter, status: 'Delivered' });
    const cancelledOrders = await Order.countDocuments({ ...filter, status: 'Cancelled' });

    const statusStats = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$totalAmount' }
        }
      }
    ]);

    const priorityStats = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      totalOrders,
      pendingOrders,
      inProgressOrders,
      deliveredOrders,
      cancelledOrders,
      statusStats,
      priorityStats
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ message: 'Failed to fetch order statistics', error: error.message });
  }
};
