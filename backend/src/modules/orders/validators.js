const Joi = require('joi');

/**
 * Common field definitions to maintain consistency
 */
const orderStatus = ['draft', 'quoted', 'confirmed', 'preparing', 'completed', 'cancelled'];

const itemSchema = Joi.object({
    menu_item_id: Joi.string().uuid().required(),
    quantity: Joi.number().integer().min(1).required(),
    unit_price: Joi.number().precision(2).positive().optional(), // Now optional, backend will fetch it
    customizations: Joi.object().optional().default({})
});

/**
 * Validation Schemas for Order Module
 */
const schemas = {
    /**
     * Schema for creating a new order
     * Requirements:
     * - Event date must be at least 7 days from today
     * - Guest count between 10 and 10,000
     * - Max 50 items in the order
     */
    createOrder: Joi.object({
        customer_id: Joi.string().uuid().required(),
        event_date: Joi.date()
            .iso()
            .min('now')
            .greater(Date.now() + 6 * 24 * 60 * 60 * 1000) // At least 7 days from now (approx check)
            .required()
            .messages({
                'date.greater': 'Event date must be at least 7 days in the future to allow for preparation.'
            }),
        event_time: Joi.string()
            .regex(/^([01]\d|2[0-3]):?([0-5]\d)$/)
            .required()
            .messages({
                'string.pattern.base': 'Event time must be in HH:mm format'
            }),
        guest_count: Joi.number().integer().min(10).max(10000).required(),
        venue_address: Joi.string().min(10).max(500).required(),
        items: Joi.array().items(itemSchema).min(1).max(50).required()
            .messages({
                'array.max': 'An order cannot contain more than 50 different items.'
            })
    }),

    /**
     * Schema for requesting a quotation
     */
    quotationRequest: Joi.object({
        order_id: Joi.string().uuid().required(),
        notes: Joi.string().max(500).optional()
    }),

    /**
     * Schema for confirming an order
     */
    confirmOrder: Joi.object({
        order_id: Joi.string().uuid().required(),
        advance_amount: Joi.number().precision(2).min(0).optional(),
        payment_method: Joi.string().valid('cash', 'card', 'upi', 'bank_transfer').required()
    }),

    /**
     * Schema for updating order status
     */
    updateStatus: Joi.object({
        status: Joi.string().valid(...orderStatus).required(),
        notes: Joi.string().max(500).optional(),
        changed_by: Joi.string().uuid().required()
    }),

    /**
     * Schema for order cancellation
     */
    cancelOrder: Joi.object({
        reason: Joi.string().min(5).max(300).required(),
        cancelled_by: Joi.string().uuid().optional()
    })
};

module.exports = schemas;
