const orderService = require('./service');

class OrderController {
    /**
     * Create a new draft order
     */
    async createOrder(req, res, next) {
        try {
            // Use authenticated user ID if not provided in body (for customer role)
            const orderData = {
                ...req.body,
                customer_id: req.user.role === 'customer' ? req.user.id : req.body.customer_id
            };

            const order = await orderService.createDraftOrder(orderData);

            res.status(201).json({
                success: true,
                data: order
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get specific order details
     */
    async getOrder(req, res, next) {
        try {
            const order = await orderService.getOrderDetails(req.params.id);

            // Access Control: Customers can only view their own orders
            if (req.user.role === 'customer' && order.customer_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    error: { code: 'FORBIDDEN', message: 'You do not have permission to view this order' }
                });
            }

            res.status(200).json({
                success: true,
                data: order
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * List orders with filtering
     */
    async listOrders(req, res, next) {
        try {
            const filters = { ...req.query };

            // Access Control: Customers can only list their own orders
            if (req.user.role === 'customer') {
                filters.customer_id = req.user.id;
            }

            const { data, cursor, hasMore } = await orderService.listOrders(filters);

            res.status(200).json({
                success: true,
                data,
                pagination: {
                    cursor,
                    hasMore
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
   * Generate quotation for an order
   */
    async generateQuotation(req, res, next) {
        try {
            const { id } = req.params;
            const order = await orderService.generateQuotation(id, req.user);

            res.status(200).json({
                success: true,
                message: 'Quotation generated successfully',
                data: order
            });
        } catch (error) {
            next(error);
        }
    }

    /**
   * Confirm an order
   */
    async confirmOrder(req, res, next) {
        try {
            const { id } = req.params;
            const order = await orderService.confirmOrder(id, req.user);

            res.status(200).json({
                success: true,
                message: 'Order confirmed successfully',
                data: order
            });
        } catch (error) {
            next(error);
        }
    }

    /**
   * Update order status
   */
    async updateStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status, notes } = req.body;

            const order = await orderService.updateOrderStatus(id, status, req.user, notes);

            res.status(200).json({
                success: true,
                message: `Order status updated to ${status}`,
                data: order
            });
        } catch (error) {
            next(error);
        }
    }

    /**
   * Cancel/Delete an order
   */
    async deleteOrder(req, res, next) {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            const order = await orderService.cancelOrder(id, req.user, reason || 'Cancelled by user/admin');

            res.status(200).json({
                success: true,
                message: 'Order cancelled successfully',
                data: order
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new OrderController();
