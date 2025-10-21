import Payment from '../models/Payment.js';
import Order from '../models/Order.js';
import VendorDetails from '../models/VendorDetails.js';
import { processPayment, releasePayment, lockPayment } from '../utils/paymentProcessor.js';

export const getPayments = async (req, res) => {
  try {
    const { status, vendor, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let filter = {};
    if (status && status !== 'All') filter.status = status;
    if (vendor) filter.vendor = vendor;

    if (userRole === 'procurement') {
      const userOrders = await Order.find({ createdBy: userId }).select('_id');
      const orderIds = userOrders.map(order => order._id);
      filter.order = { $in: orderIds };
    } else if (userRole === 'vendor') {
      const vendorDetails = await VendorDetails.findOne({ user: userId });
      if (vendorDetails) {
        filter.vendor = vendorDetails._id;

        // Ensure there's a Payment record for each order belonging to this vendor.
        // If an order exists without a Payment, create a locked (or released if delivered) payment record
        const vendorOrders = await Order.find({ vendor: vendorDetails._id });
        const now = new Date();
        const defaultDue = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        // helper to generate paymentId when model pre-save isn't firing for some reason
        const generatePaymentId = () => 'PAY-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();

        for (const ord of vendorOrders) {
          const existing = await Payment.findOne({ order: ord._id });
          if (!existing) {
            const initStatus = ord.status === 'Delivered' ? 'Released' : 'Locked';
            const p = new Payment({
              order: ord._id,
              vendor: vendorDetails._id,
              vendorName: vendorDetails.ownerName || vendorDetails.businessName,
              amount: ord.totalAmount || 0,
              paymentId: generatePaymentId(),
              status: initStatus,
              dueDate: defaultDue,
              deliveryConfirmed: ord.status === 'Delivered',
              deliveryConfirmedAt: ord.actualDeliveryDate || (ord.status === 'Delivered' ? now : undefined)
            });
            try {
              await p.save();
            } catch (e) {
              // ignore duplicate or validation errors but log
              console.error('Failed to create initial payment for order', ord._id, e.message);
            }
          }
        }

      } else {
        return res.status(200).json([]);
      }
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const payments = await Payment.find(filter)
      .populate('vendor', 'businessName ownerName contact')
      .populate('order', 'orderId status items totalAmount')
      .populate('approvedBy', 'name email')
      .populate('processedBy', 'name email')
      .sort(sortOptions);

    res.status(200).json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Failed to fetch payments', error: error.message });
  }
};

export const getPaymentOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let filter = {};

    if (userRole === 'procurement') {
      filter.createdBy = userId;
    } else if (userRole === 'vendor') {
      const vendorDetails = await VendorDetails.findOne({ user: userId });
      if (vendorDetails) {
        filter.vendor = vendorDetails._id;
      } else {
        return res.status(200).json({ orders: [] });
      }
    }

    const orders = await Order.find(filter)
      .populate('vendor', 'businessName ownerName contact')
      .sort({ createdAt: -1 });

    
    const paymentOrders = orders.map(order => ({
      _id: order._id,
      orderId: order.orderId,
      vendorName: order.vendor ? order.vendor.ownerName : order.vendorName,
      vendorCompanyName: order.vendor ? order.vendor.businessName : order.vendorCompanyName,
      amount: order.totalAmount,
      status: order.status,
      delivered: order.status === 'Delivered',
      createdAt: order.createdAt,
      actualDeliveryDate: order.actualDeliveryDate
    }));

    res.status(200).json({ orders: paymentOrders });
  } catch (error) {
    console.error('Error fetching payment orders:', error);
    res.status(500).json({ message: 'Failed to fetch payment orders', error: error.message });
  }
};

export const confirmDeliveryAndReleasePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmedBy } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = 'Delivered';
    order.actualDeliveryDate = new Date();
    order.updatedBy = confirmedBy;
    await order.save();

    const paymentResult = await releasePayment(id, confirmedBy);

    res.status(200).json({
      message: 'Delivery confirmed and payment released successfully',
      order,
      payment: paymentResult
    });
  } catch (error) {
    console.error('Error confirming delivery:', error);
    res.status(500).json({ message: 'Failed to confirm delivery', error: error.message });
  }
};

export const triggerPayment = async (req, res) => {
  try {
    const { orderId, processedBy } = req.body;
    const result = await processPayment(orderId, processedBy);
    res.status(200).json({ message: 'Payment processed', result });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ message: 'Failed to process payment', error: error.message });
  }
};

export const createPayment = async (req, res) => {
  try {
    const {
      order,
      vendor,
      vendorName,
      amount,
      paymentMethod,
      dueDate,
      notes,
      approvedBy
    } = req.body;

    const newPayment = new Payment({
      order,
      vendor,
      vendorName,
      amount,
      paymentId: 'PAY-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      paymentMethod: paymentMethod || 'Bank Transfer',
      dueDate,
      notes,
      approvedBy
    });

    await newPayment.save();
    await newPayment.populate('vendor', 'businessName ownerName contact');
    await newPayment.populate('order', 'orderId status');

    res.status(201).json({
      message: 'Payment record created successfully',
      payment: newPayment
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ message: 'Failed to create payment', error: error.message });
  }
};

// Update payment status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, transactionId, notes, processedBy } = req.body;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    payment.status = status;
    if (transactionId) payment.transactionId = transactionId;
    if (notes) payment.notes = notes;
    if (processedBy) payment.processedBy = processedBy;

    if (status === 'Released') {
      payment.releaseDate = new Date();
    }

    await payment.save();
    await payment.populate('vendor', 'businessName ownerName contact');
    await payment.populate('order', 'orderId status');

    res.status(200).json({
      message: 'Payment status updated successfully',
      payment
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Failed to update payment status', error: error.message });
  }
};

// Get payment statistics (role-based)
export const getPaymentStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let filter = {};

    // Role-based filtering - need to get payments related to user's orders
    if (userRole === 'procurement') {
      // Get orders created by this procurement manager
      const userOrders = await Order.find({ createdBy: userId }).select('_id');
      const orderIds = userOrders.map(order => order._id);
      filter.order = { $in: orderIds };
    } else if (userRole === 'vendor') {
      const vendorDetails = await VendorDetails.findOne({ user: userId });
      if (vendorDetails) {
        filter.vendor = vendorDetails._id;
      } else {
        return res.status(200).json({
          totalPayments: 0,
          pendingPayments: 0,
          lockedPayments: 0,
          releasedPayments: 0,
          totalAmount: 0,
          releasedAmount: 0,
          statusStats: []
        });
      }
    }

    const totalPayments = await Payment.countDocuments(filter);
    const pendingPayments = await Payment.countDocuments({ ...filter, status: 'Pending' });
    const lockedPayments = await Payment.countDocuments({ ...filter, status: 'Locked' });
    const releasedPayments = await Payment.countDocuments({ ...filter, status: 'Released' });

    const totalAmount = await Payment.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const releasedAmount = await Payment.aggregate([
      { $match: { ...filter, status: 'Released' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const statusStats = await Payment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    res.status(200).json({
      totalPayments,
      pendingPayments,
      lockedPayments,
      releasedPayments,
      totalAmount: totalAmount[0]?.total || 0,
      releasedAmount: releasedAmount[0]?.total || 0,
      statusStats
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({ message: 'Failed to fetch payment statistics', error: error.message });
  }
};
