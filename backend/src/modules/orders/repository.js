const db = require('../../config/database');

/**
 * Repository for handling Order-related database operations.
 */
class OrderRepository {
    /**
     * Creates a new order.
     * @param {Object} orderData - The order data.
     * @param {Object} [client] - Optional DB client for transaction.
     */
    async createOrder(orderData, client = db) {
        const {
            customer_id, event_date, event_time, guest_count, venue_address, status, total_amount
        } = orderData;

        const query = `
      INSERT INTO orders (
        customer_id, event_date, event_time, guest_count, venue_address, status, total_amount
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

        const values = [customer_id, event_date, event_time, guest_count, venue_address, status || 'draft', total_amount || 0];
        const { rows } = await client.query(query, values);
        return rows[0];
    }

    /**
     * Inserts multiple items for an order.
     * @param {string} orderId - The ID of the order.
     * @param {Array} items - List of items to insert.
     * @param {Object} [client] - Optional DB client for transaction.
     */
    async insertOrderItems(orderId, items, client = db) {
        if (!items || items.length === 0) return [];

        // Constructing a bulk insert query
        // SQL: INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price, customizations) VALUES ...
        const values = [];
        const placeholders = items.map((item, index) => {
            const offset = index * 6;
            values.push(
                orderId,
                item.menu_item_id,
                item.quantity,
                item.unit_price,
                item.total_price || (item.quantity * item.unit_price),
                JSON.stringify(item.customizations || {})
            );
            return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`;
        }).join(', ');

        const query = `
      INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price, customizations)
      VALUES ${placeholders}
      RETURNING *;
    `;

        const { rows } = await client.query(query, values);
        return rows;
    }

    /**
     * Finds an order by its ID.
     */
    async findOrderById(id, client = db) {
        const query = 'SELECT * FROM orders WHERE id = $1;';
        const { rows } = await client.query(query, [id]);
        return rows[0];
    }

    /**
   * Updates an order status with optimistic locking.
   */
    async updateOrderStatusWithVersion(id, status, currentVersion, client = db) {
        const query = `
      UPDATE orders 
      SET status = $1, version = version + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND version = $3
      RETURNING *;
    `;
        const { rows } = await client.query(query, [status, id, currentVersion]);
        return rows[0];
    }

    /**
     * Updates the status of an order.
     */
    async updateOrderStatus(id, status, client = db) {
        const query = `
      UPDATE orders 
      SET status = $1, version = version + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 
      RETURNING *;
    `;
        const { rows } = await client.query(query, [status, id]);
        return rows[0];
    }

    /**
     * Updates the total amount of an order.
     */
    async updateOrderTotals(id, totalAmount, client = db) {
        const query = `
      UPDATE orders 
      SET total_amount = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 
      RETURNING *;
    `;
        const { rows } = await client.query(query, [totalAmount, id]);
        return rows[0];
    }

    /**
     * Gets all items for a specific order.
     */
    async getOrderItems(orderId, client = db) {
        const query = `
      SELECT oi.*, mi.name as item_name 
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      WHERE oi.order_id = $1;
    `;
        const { rows } = await client.query(query, [orderId]);
        return rows;
    }

    /**
     * Logs a status change in the history table.
     */
    async logStatusChange(orderId, oldStatus, newStatus, changedBy, notes, client = db) {
        const query = `
      INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
        const { rows } = await client.query(query, [orderId, oldStatus, newStatus, changedBy, notes]);
        return rows[0];
    }

    /**
   * Lists orders with advanced filtering, sorting, and cursor-based pagination.
   */
    async listOrders(filters = {}) {
        const {
            status,
            customer_id,
            startDate,
            endDate,
            limit = 20,
            cursor = null,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = filters;

        let query = 'SELECT * FROM orders WHERE 1=1';
        const values = [];
        let paramIndex = 1;

        // 1. Basic Filters
        if (status) {
            query += ` AND status = $${paramIndex++}`;
            values.push(status);
        }

        if (customer_id) {
            query += ` AND customer_id = $${paramIndex++}`;
            values.push(customer_id);
        }

        if (startDate) {
            query += ` AND event_date >= $${paramIndex++}`;
            values.push(startDate);
        }

        if (endDate) {
            query += ` AND event_date <= $${paramIndex++}`;
            values.push(endDate);
        }

        // 2. Cursor Pagination Logic
        if (cursor) {
            const [cursorValue, cursorId] = Buffer.from(cursor, 'base64').toString('ascii').split('|');
            const operator = sortOrder.toUpperCase() === 'DESC' ? '<' : '>';

            query += ` AND (${sortBy} ${operator} $${paramIndex} OR (${sortBy} = $${paramIndex++} AND id ${operator} $${paramIndex++}))`;
            values.push(cursorValue, cursorId);
        }

        // 3. Sorting (Dynamic but sanitized)
        const allowedSortFields = ['created_at', 'event_date', 'total_amount'];
        const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
        const finalSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        query += ` ORDER BY ${finalSortBy} ${finalSortOrder}, id ${finalSortOrder}`;

        // 4. Limit (Fetch one extra to check for next page)
        query += ` LIMIT $${paramIndex++}`;
        values.push(limit + 1);

        const { rows } = await db.query(query, values);
        return rows;
    }

    /**
     * Finds an order item by its ID.
     * @param {string} id - The ID of the order item.
     * @param {Object} [client] - Optional DB client for transaction.
     */
    async findOrderItemById(id, client = db) {
        const query = 'SELECT * FROM order_items WHERE id = $1;';
        const { rows } = await client.query(query, [id]);
        return rows[0];
    }

    /**
   * Updates an order item price.
   */
    async updateOrderItemPrice(id, unitPrice, totalPrice, client = db) {
        const query = `
      UPDATE order_items 
      SET unit_price = $1, total_price = $2
      WHERE id = $3 
      RETURNING *;
    `;
        const { rows } = await client.query(query, [unitPrice, totalPrice, id]);
        return rows[0];
    }

    async findQuotationByOrderId(orderId, client = db) {
        const query = 'SELECT * FROM quotations WHERE order_id = $1;';
        const { rows } = await client.query(query, [orderId]);
        return rows[0];
    }

    /**
     * Creates a quotation record (Demo/Fallback purposes).
     */
    async createQuotation(data, client = db) {
        const { order_id, subtotal, labor_cost, overhead_cost, tax_amount, grand_total } = data;
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 7); // Valid for 7 days

        const query = `
            INSERT INTO quotations (order_id, quotation_number, subtotal, labor_cost, overhead_cost, tax_amount, grand_total, valid_until)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (order_id) DO UPDATE SET
                subtotal = EXCLUDED.subtotal,
                labor_cost = EXCLUDED.labor_cost,
                overhead_cost = EXCLUDED.overhead_cost,
                tax_amount = EXCLUDED.tax_amount,
                grand_total = EXCLUDED.grand_total,
                valid_until = EXCLUDED.valid_until,
                created_at = CURRENT_TIMESTAMP
            RETURNING *;
        `;
        const quotationNumber = `QUO-${Date.now()}`;
        const { rows } = await client.query(query, [
            order_id, quotationNumber, subtotal, labor_cost, overhead_cost, tax_amount, grand_total, valid_until
        ]);
        return rows[0];
    }

    /**
     * Calculates total ingredient requirements for an entire order based on recipes.
     */
    async getOrderIngredientRequirements(orderId, client = db) {
        const query = `
      SELECT 
        r.ingredient_id,
        SUM(oi.quantity * r.quantity_per_base_unit) as total_required
      FROM order_items oi
      JOIN recipes r ON oi.menu_item_id = r.menu_item_id
      WHERE oi.order_id = $1
      GROUP BY r.ingredient_id;
    `;
        const { rows } = await client.query(query, [orderId]);
        return rows;
    }

    /**
   * Updates an invoice status for a given order.
   */
    async updateInvoiceStatusByOrderId(orderId, status, client = db) {
        const query = `
      UPDATE invoices 
      SET payment_status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $2
      RETURNING *;
    `;
        const { rows } = await client.query(query, [status, orderId]);
        return rows;
    }

    /**
     * Utility to get a transaction client.
         */
    async getTransaction() {
        return await db.getClient();
    }
}

module.exports = new OrderRepository();
