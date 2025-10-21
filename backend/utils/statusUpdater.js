import Order from '../models/Order.js';
import { processPayment } from './paymentProcessor.js';

// Update order status with validation and side effects
export const updateOrderStatus = async (orderId, newStatus, updatedBy = null) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');

    const validStatuses = ['Pending', 'Confirmed', 'In Progress', 'In Transit', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }

    const oldStatus = order.status;
    order.status = newStatus;

    if (updatedBy) {
      order.updatedBy = updatedBy;
    }

    // Handle status-specific logic
    switch (newStatus) {
      case 'Delivered':
        order.actualDeliveryDate = new Date();
        // Auto-trigger payment processing if enabled
        try {
          await processPayment(orderId, updatedBy);
        } catch (paymentError) {
          console.warn('Payment processing failed:', paymentError.message);
        }
        break;

      case 'Cancelled':
        // Handle cancellation logic
        order.actualDeliveryDate = null;
        break;

      case 'In Transit':
        // Set expected delivery if not already set
        if (!order.expectedDeliveryDate) {
          const deliveryDate = new Date();
          deliveryDate.setDate(deliveryDate.getDate() + 3); // Default 3 days
          order.expectedDeliveryDate = deliveryDate;
        }
        break;
    }

    await order.save();

    console.log(`Order ${order.orderId} status updated from ${oldStatus} to ${newStatus}`);
    return order;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// Bulk update order statuses
export const bulkUpdateOrderStatus = async (orderIds, newStatus, updatedBy = null) => {
  try {
    const results = [];
    const errors = [];

    for (const orderId of orderIds) {
      try {
        const updatedOrder = await updateOrderStatus(orderId, newStatus, updatedBy);
        results.push(updatedOrder);
      } catch (error) {
        errors.push({ orderId, error: error.message });
      }
    }

    return { results, errors };
  } catch (error) {
    console.error('Error in bulk update:', error);
    throw error;
  }
};

// Get order status history (if you want to implement status tracking)
export const getOrderStatusHistory = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');

    // This would require a separate StatusHistory model to track changes
    // For now, return basic info
    return {
      orderId: order.orderId,
      currentStatus: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      actualDeliveryDate: order.actualDeliveryDate
    };
  } catch (error) {
    console.error('Error fetching order status history:', error);
    throw error;
  }
};

// Auto-update overdue orders
export const updateOverdueOrders = async () => {
  try {
    const currentDate = new Date();

    // Find orders that are overdue
    const overdueOrders = await Order.find({
      status: { $in: ['Pending', 'Confirmed', 'In Progress', 'In Transit'] },
      expectedDeliveryDate: { $lt: currentDate }
    });

    const results = [];

    for (const order of overdueOrders) {
      // You might want to notify or take specific actions for overdue orders
      console.log(`Order ${order.orderId} is overdue (expected: ${order.expectedDeliveryDate})`);
      results.push({
        orderId: order.orderId,
        status: order.status,
        expectedDeliveryDate: order.expectedDeliveryDate,
        daysOverdue: Math.floor((currentDate - order.expectedDeliveryDate) / (1000 * 60 * 60 * 24))
      });
    }

    return results;
  } catch (error) {
    console.error('Error updating overdue orders:', error);
    throw error;
  }
};
