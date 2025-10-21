import Order from '../models/Order.js';
import Payment from '../models/Payment.js';

// Main payment processing function
export const processPayment = async (orderId, processedBy = null) => {
  try {
    const order = await Order.findById(orderId).populate('vendor');
    if (!order) throw new Error('Order not found');

    let existingPayment = await Payment.findOne({ order: orderId });

    if (order.status !== 'Delivered') {
      if (existingPayment) {
        existingPayment.status = 'Locked';
        await existingPayment.save();
      }
      return { success: false, message: 'Order not delivered. Payment locked.' };
    }

    if (existingPayment) {
      existingPayment.status = 'Released';
      existingPayment.releaseDate = new Date();
      existingPayment.deliveryConfirmed = true;
      existingPayment.deliveryConfirmedAt = new Date();
      if (processedBy) existingPayment.processedBy = processedBy;
      await existingPayment.save();
      return { success: true, payment: existingPayment };
    } else {
      const payment = new Payment({
        order: order._id,
        vendor: order.vendor._id,
        vendorName: order.vendorName || order.vendor.ownerName,
        amount: order.totalAmount,
        paymentId: 'PAY-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
        status: 'Released',
        releaseDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        deliveryConfirmed: true,
        deliveryConfirmedAt: new Date(),
        processedBy: processedBy
      });

      await payment.save();
      return { success: true, payment };
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};

// Release payment for delivered orders
export const releasePayment = async (orderId, approvedBy = null) => {
  try {
    const order = await Order.findById(orderId).populate('vendor');
    if (!order) throw new Error('Order not found');

    // Find or create payment record
    let payment = await Payment.findOne({ order: orderId });

    if (!payment) {
      payment = new Payment({
        order: order._id,
        vendor: order.vendor._id,
        vendorName: order.vendorName || order.vendor.ownerName,
        amount: order.totalAmount,
        paymentId: 'PAY-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'Locked'
      });
    }

    // Release the payment
    payment.status = 'Released';
    payment.releaseDate = new Date();
    payment.deliveryConfirmed = true;
    payment.deliveryConfirmedAt = new Date();
    if (approvedBy) payment.approvedBy = approvedBy;

    await payment.save();

    console.log(`Payment released for order ${order.orderId}: $${payment.amount}`);
    return payment;
  } catch (error) {
    console.error('Error releasing payment:', error);
    throw error;
  }
};

// Lock payment (prevent release)
export const lockPayment = async (orderId, reason = null) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');

    let payment = await Payment.findOne({ order: orderId });

    if (!payment) {
      // Create locked payment record
      payment = new Payment({
        order: order._id,
        vendor: order.vendor,
        vendorName: order.vendorName,
        amount: order.totalAmount,
        paymentId: 'PAY-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
        status: 'Locked',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        notes: reason
      });
    } else {
      payment.status = 'Locked';
      if (reason) payment.notes = reason;
    }

    await payment.save();

    console.log(`Payment locked for order ${order.orderId}: ${reason || 'No reason provided'}`);
    return payment;
  } catch (error) {
    console.error('Error locking payment:', error);
    throw error;
  }
};

// Auto-process payments for delivered orders
export const autoProcessPayments = async () => {
  try {
    const deliveredOrders = await Order.find({
      status: 'Delivered',
      actualDeliveryDate: { $exists: true }
    }).populate('vendor');

    const results = [];

    for (const order of deliveredOrders) {
      try {
        // Check if payment already processed
        const existingPayment = await Payment.findOne({
          order: order._id,
          status: 'Released'
        });

        if (!existingPayment) {
          const result = await processPayment(order._id);
          results.push({
            orderId: order.orderId,
            success: result.success,
            amount: order.totalAmount
          });
        }
      } catch (error) {
        results.push({
          orderId: order.orderId,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error in auto-processing payments:', error);
    throw error;
  }
};

// Get payment status for an order
export const getPaymentStatus = async (orderId) => {
  try {
    const payment = await Payment.findOne({ order: orderId })
      .populate('vendor', 'businessName ownerName')
      .populate('order', 'orderId status totalAmount');

    if (!payment) {
      return { status: 'No Payment Record', exists: false };
    }

    return {
      exists: true,
      paymentId: payment.paymentId,
      status: payment.status,
      amount: payment.amount,
      releaseDate: payment.releaseDate,
      dueDate: payment.dueDate,
      deliveryConfirmed: payment.deliveryConfirmed
    };
  } catch (error) {
    console.error('Error getting payment status:', error);
    throw error;
  }
};

// Calculate payment statistics
export const calculatePaymentStats = async () => {
  try {
    const stats = await Payment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const totalPayments = await Payment.countDocuments();
    const totalAmount = await Payment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    return {
      totalPayments,
      totalAmount: totalAmount[0]?.total || 0,
      statusBreakdown: stats
    };
  } catch (error) {
    console.error('Error calculating payment stats:', error);
    throw error;
  }
};
