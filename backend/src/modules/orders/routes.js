const express = require('express');
const router = express.Router();
const orderController = require('./controller');
const { createOrder, updateStatus, cancelOrder } = require('./validators');
const { validate } = require('../../middlewares/validate.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/rbac.middleware');

// All order routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/orders
 * @desc    Create a new draft order
 * @access  Customer, Admin, Super Admin
 */
router.post(
    '/',
    validate(createOrder),
    orderController.createOrder
);

/**
 * @route   GET /api/v1/orders
 * @desc    List orders with filters (status, customer_id, date range)
 * @access  All (Logic in controller handles filtering for Customers)
 */
router.get(
    '/',
    orderController.listOrders
);

/**
 * @route   POST /api/v1/orders/:id/confirm
 * @desc    Confirm a quoted order (Reserve stock & Invoice)
 * @access  Customer (own), Admin, Super Admin
 */
router.post(
    '/:id/confirm',
    orderController.confirmOrder
);

/**
 * @route   POST /api/v1/orders/:id/quotation
 * @desc    Generate a quotation for a draft order (Trigger ML & Billing)
 * @access  Customer (own), Admin, Super Admin
 */
router.post(
    '/:id/quotation',
    orderController.generateQuotation
);

/**
 * @route   GET /api/v1/orders/:id
 * @desc    Get detailed order information
 * @access  All (Logic in controller ensures customers only see their own)
 */
router.get(
    '/:id',
    orderController.getOrder
);

/**
 * @route   DELETE /api/v1/orders/:id
 * @desc    Cancel or delete an order
 * @access  Customer (own, draft/quoted), Admin (any, not completed)
 */
router.delete(
    '/:id',
    validate(cancelOrder),
    orderController.deleteOrder
);

/**
 * @route   PATCH /api/v1/orders/:id/status
 * @desc    Update order status
 * @access  Admin, Super Admin
 */
router.patch(
    '/:id/status',
    requireRole('admin', 'super_admin'),
    validate(updateStatus),
    orderController.updateStatus
);

module.exports = router;
