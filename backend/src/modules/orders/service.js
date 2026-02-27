const orderRepository = require('./repository');
const AppError = require('../../shared/errors/AppError');
const db = require('../../config/database');
const axios = require('axios');

class OrderService {
    /**
     * Create a draft order with items
     * @param {Object} orderData 
     */
    async createDraftOrder(orderData) {
        const {
            customer_id,
            event_date,
            event_time,
            guest_count,
            venue_address,
            items
        } = orderData;

        // 1. Business Validation: Event Date Rules
        const eventDateObj = new Date(event_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const minDate = new Date(today);
        minDate.setDate(today.getDate() + 7);

        const maxDate = new Date(today);
        maxDate.setFullYear(today.getFullYear() + 1);

        if (eventDateObj < minDate) {
            throw AppError.badRequest('Event date must be at least 7 days from today to allow for preparation.');
        }

        if (eventDateObj > maxDate) {
            throw AppError.badRequest('Orders cannot be scheduled more than 1 year in advance.');
        }

        let order;
        let orderItems = [];
        const client = await db.getClient();

        try {
            await client.query('BEGIN');

            // 2. Validate menu items existence and calculate subtotal
            // Note: We'd normally have a menuRepository for this, but for now we'll do the check here
            // to maintain the requested clean architecture as much as possible with existing files.
            let calculatedTotal = 0;

            for (const item of items) {
                const menuResult = await client.query(
                    'SELECT id, name, is_active, unit_price FROM menu_items WHERE id = $1',
                    [item.menu_item_id]
                );

                const menuItem = menuResult.rows[0];

                if (!menuItem) {
                    throw AppError.notFound(`Menu item with ID ${item.menu_item_id} not found.`);
                }

                if (!menuItem.is_active) {
                    throw AppError.badRequest(`Menu item "${menuItem.name}" is currently unavailable.`);
                }

                // Use the database price, not user-provided price
                item.unit_price = parseFloat(menuItem.unit_price);
                calculatedTotal += (item.unit_price * item.quantity);
            }

            // 3. Insert into orders table (status = 'draft')
            order = await orderRepository.createOrder({
                customer_id,
                event_date,
                event_time,
                guest_count,
                venue_address,
                status: 'draft',
                total_amount: calculatedTotal
            }, client);

            // 4. Insert order items
            orderItems = await orderRepository.insertOrderItems(order.id, items, client);

            await client.query('COMMIT');

            // 5. Return full order with items
            return {
                ...order,
                items: orderItems
            };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get order details by ID
     */
    async getOrderDetails(orderId) {
        const order = await orderRepository.findOrderById(orderId);
        if (!order) {
            throw AppError.notFound('Order');
        }

        const items = await orderRepository.getOrderItems(orderId);

        return {
            ...order,
            items
        };
    }

    /**
   * Updates an order status (State Machine + History + Optimistic Locking)
   */
    async updateOrderStatus(orderId, newStatus, user, notes = '') {
        const allowedTransitions = {
            'draft': ['quoted', 'cancelled'],
            'quoted': ['confirmed', 'cancelled'],
            'confirmed': ['preparing', 'cancelled'],
            'preparing': ['completed'],
            'completed': [],
            'cancelled': []
        };

        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            const order = await orderRepository.findOrderById(orderId, client);
            if (!order) {
                throw AppError.notFound('Order');
            }

            // 1. Validate Transition
            const currentStatus = order.status;
            if (!allowedTransitions[currentStatus] || !allowedTransitions[currentStatus].includes(newStatus)) {
                throw AppError.badRequest(`Invalid status transition from ${currentStatus} to ${newStatus}`);
            }

            // 2. Update with Optimistic Locking
            const updatedOrder = await orderRepository.updateOrderStatusWithVersion(
                orderId,
                newStatus,
                order.version,
                client
            );

            if (!updatedOrder) {
                throw AppError.conflict('The order was updated by another user. Please refresh and try again.');
            }

            // 3. Log History
            await orderRepository.logStatusChange(
                orderId,
                currentStatus,
                newStatus,
                user.id,
                notes,
                client
            );

            // 4. Trigger Side Effects
            if (newStatus === 'cancelled') {
                // If cancelled from quoted or confirmed, compensation might be needed
                await this._releaseStock(orderId);
                await orderRepository.updateInvoiceStatusByOrderId(orderId, 'cancelled');
            }

            if (newStatus === 'completed') {
                await orderRepository.updateInvoiceStatusByOrderId(orderId, 'paid');
            }

            // Always notify on status change
            this._sendNotificationStub(order.customer_id, `Order ${orderId} status changed to ${newStatus}`);

            await client.query('COMMIT');
            return updatedOrder;

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
   * List orders with advanced metadata (pagination/cursor)
   * @param {Object} filters 
   */
    async listOrders(filters) {
        const limit = parseInt(filters.limit) || 20;
        const sortBy = filters.sortBy || 'created_at';

        const rows = await orderRepository.listOrders({ ...filters, limit });

        const hasMore = rows.length > limit;
        const data = hasMore ? rows.slice(0, limit) : rows;

        let nextCursor = null;
        if (hasMore) {
            const lastItem = data[data.length - 1];
            const sortValue = lastItem[sortBy] instanceof Date ? lastItem[sortBy].toISOString() : lastItem[sortBy];
            nextCursor = Buffer.from(`${sortValue}|${lastItem.id}`).toString('base64');
        }

        return {
            data,
            cursor: nextCursor,
            hasMore
        };
    }

    /**
     * Generate a quotation for a draft order
     * @param {string} orderId 
     * @param {Object} user 
     */
    async generateQuotation(orderId, user) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            // 1. Verify order existence and ownership
            const order = await orderRepository.findOrderById(orderId, client);
            if (!order || (user.role === 'customer' && order.customer_id !== user.id)) {
                throw new AppError('Order not found or access denied', 404, 'ORDER_006');
            }

            // 2. Ensure status is 'draft'
            if (order.status !== 'draft') {
                throw new AppError('Quotation can only be generated for draft orders', 400, 'ORDER_007');
            }

            const items = await orderRepository.getOrderItems(orderId, client);
            let subtotal = 0;

            // 3. Process each item (ML API + Fallback)
            for (const item of items) {
                let predictedPrice;
                try {
                    // ML API Call with timeout and retry
                    predictedPrice = await this._callMLServiceWithRetry({
                        menu_item_id: item.menu_item_id,
                        quantity: item.quantity,
                        event_date: order.event_date
                    });
                } catch (error) {
                    // Fallback: Current unit_price * 1.3 (as per requirement)
                    predictedPrice = item.unit_price * 1.3;
                }

                const itemTotal = predictedPrice * item.quantity;
                subtotal += itemTotal;

                // Update item price in DB
                await orderRepository.updateOrderItemPrice(item.id, predictedPrice, itemTotal, client);
            }

            // 4. Calculate Taxes and Costs
            const laborCost = subtotal * 0.15;
            const overheadCost = subtotal * 0.10;
            const taxAmount = (subtotal + laborCost + overheadCost) * 0.05;
            const grandTotal = subtotal + laborCost + overheadCost + taxAmount;

            // 5. Update Order Total and Status
            await orderRepository.updateOrderTotals(orderId, grandTotal, client);
            await orderRepository.updateOrderStatus(orderId, 'quoted', client);
            await orderRepository.logStatusChange(orderId, 'draft', 'quoted', user.id, 'Quotation generated automatically', client);

            // 6. Call Billing API
            try {
                await this._createBillingQuotation({
                    order_id: orderId,
                    subtotal,
                    labor_cost: laborCost,
                    overhead_cost: overheadCost,
                    tax_amount: taxAmount,
                    grand_total: grandTotal
                }, client);
            } catch (error) {
                throw new AppError('Failed to create billing quotation', 500, 'ORDER_008');
            }

            await client.query('COMMIT');

            return await this.getOrderDetails(orderId);

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
   * Confirm an order (transition from quoted to confirmed)
   * @param {string} orderId 
   * @param {Object} user 
   */
    async confirmOrder(orderId, user) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            // 1. Fetch order and check status (Idempotency check included)
            const order = await orderRepository.findOrderById(orderId, client);
            if (!order || (user.role === 'customer' && order.customer_id !== user.id)) {
                throw new AppError('Order not found', 404, 'ORDER_006');
            }

            if (order.status === 'confirmed') {
                await client.query('COMMIT'); // Success for idempotency
                return await this.getOrderDetails(orderId);
            }

            if (order.status !== 'quoted') {
                throw new AppError('Only quoted orders can be confirmed', 400, 'ORDER_009');
            }

            // 2. Check quotation expiry
            const quotation = await orderRepository.findQuotationByOrderId(orderId, client);
            if (quotation && new Date(quotation.valid_until) < new Date()) {
                throw new AppError('Quotation has expired', 400, 'ORDER_011');
            }

            // 3. Calculate ingredient requirements
            const requirements = await orderRepository.getOrderIngredientRequirements(orderId, client);

            // 4. Call Stock Reserve API
            try {
                await this._reserveStock(orderId, requirements);
            } catch (error) {
                throw new AppError('Failed to reserve stock for the order items', 400, 'ORDER_010');
            }

            // 5. Call Billing Invoice API
            try {
                await this._createBillingInvoice({
                    order_id: orderId,
                    total_amount: order.total_amount,
                    customer_id: order.customer_id
                });
            } catch (error) {
                // COMPENSATION: Release stock if invoice fails
                await this._releaseStock(orderId);
                throw new AppError('Failed to generate invoice', 500, 'ORDER_012');
            }

            // 6. Update Order Status
            await orderRepository.updateOrderStatus(orderId, 'confirmed', client);
            await orderRepository.logStatusChange(orderId, 'quoted', 'confirmed', user.id, 'Order confirmed by user', client);

            // 7. Send Confirmation Notification
            this._sendNotificationStub(order.customer_id, `Your order ${orderId} has been confirmed!`);

            await client.query('COMMIT');
            return await this.getOrderDetails(orderId);

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
   * Cancel an order (Permissions based on current status and user role)
   * @param {string} orderId 
   * @param {Object} user 
   * @param {string} reason 
   */
    async cancelOrder(orderId, user, reason) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            const order = await orderRepository.findOrderById(orderId, client);
            if (!order) {
                throw AppError.notFound('Order');
            }

            // 1. Ownership & Access check
            const isAdmin = ['admin', 'super_admin'].includes(user.role);
            if (!isAdmin && order.customer_id !== user.id) {
                throw AppError.forbidden('Access denied');
            }

            // 2. State-based Cancellation Rules
            if (order.status === 'completed') {
                throw AppError.badRequest('Completed orders cannot be cancelled');
            }

            if (order.status === 'cancelled') {
                await client.query('COMMIT'); // Success for idempotency
                return order;
            }

            // Customer can only cancel Draft or Quoted
            if (!isAdmin && !['draft', 'quoted'].includes(order.status)) {
                throw AppError.badRequest(`Customers cannot cancel orders in ${order.status} state. Please contact support.`);
            }

            // 3. Status Transition
            const oldStatus = order.status;
            await orderRepository.updateOrderStatus(orderId, 'cancelled', client);
            await orderRepository.logStatusChange(orderId, oldStatus, 'cancelled', user.id, reason, client);

            // 4. Side Effects for Confirmed/Preparing Orders
            if (['confirmed', 'preparing'].includes(oldStatus)) {
                // Release Stock
                await this._releaseStock(orderId);

                // Update Invoice status (Mark as 'cancelled')
                await orderRepository.updateInvoiceStatusByOrderId(orderId, 'cancelled', client);
            }

            // 5. Send Notification Stub
            this._sendNotificationStub(order.customer_id, `Order ${orderId} has been cancelled: ${reason}`);

            await client.query('COMMIT');
            return await this.getOrderDetails(orderId);

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Helper: Send Notification Stub
     */
    _sendNotificationStub(userId, message) {
        // In a real system, this would call an email/SMS service
        console.log(`[NOTIFICATION] To User ${userId}: ${message}`);
    }

    /**
     * Helper: Reserve Stock
       */
    async _reserveStock(orderId, requirements) {
        const url = process.env.STOCK_SERVICE_URL || 'http://stock-service/reserve';
        try {
            await axios.post(url, { order_id: orderId, items: requirements }, { timeout: 2000 });
        } catch (err) {
            if (process.env.NODE_ENV !== 'production') {
                console.log('[DEMO MODE] Stock Service unavailable, skipping reservation.');
                return;
            }
            throw err;
        }
    }

    /**
     * Helper: Release Stock (Compensating Transaction)
     */
    async _releaseStock(orderId) {
        const url = process.env.STOCK_SERVICE_URL || 'http://stock-service/release';
        try {
            await axios.post(url, { order_id: orderId }, { timeout: 2000 });
        } catch (err) {
            if (process.env.NODE_ENV !== 'production') {
                console.log('[DEMO MODE] Stock Service unavailable, skipping release.');
                return;
            }
            // Log failure but don't block
            console.error(`CRITICAL: Failed to release stock for order ${orderId} during compensation`, err);
        }
    }

    /**
     * Helper: Create Billing Invoice
     */
    async _createBillingInvoice(data) {
        const url = process.env.BILLING_SERVICE_URL || 'http://billing-service/invoices';
        try {
            await axios.post(url, data, { timeout: 2000 });
        } catch (err) {
            if (process.env.NODE_ENV !== 'production') {
                console.log('[DEMO MODE] Billing Service unavailable, skipping invoice sync.');
                return;
            }
            throw err;
        }
    }

    /**
     * Helper: Call ML Service with Retry logic
       */
    async _callMLServiceWithRetry(data, retries = 3) {
        const url = process.env.ML_SERVICE_URL || 'http://ml-service/predict';
        for (let i = 0; i < retries; i++) {
            try {
                const response = await axios.post(url, data, { timeout: 5000 });
                return response.data.predicted_unit_price;
            } catch (err) {
                if (i === retries - 1) throw err;
            }
        }
    }

    /**
     * Helper: Create Billing Quotation
     */
    async _createBillingQuotation(data, client = db) {
        const url = process.env.BILLING_SERVICE_URL || 'http://billing-service/quotations';
        try {
            await axios.post(url, data, { timeout: 2000 });
        } catch (err) {
            if (process.env.NODE_ENV !== 'production') {
                console.log('[DEMO MODE] Billing Service unavailable, recording local quotation.');
                await orderRepository.createQuotation(data, client);
                return;
            }
            throw err;
        }
    }
}

module.exports = new OrderService();
