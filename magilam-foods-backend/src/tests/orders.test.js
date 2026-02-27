const request = require('supertest');
const app = require('../app');
const db = require('../config/database');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('../config/database');
jest.mock('jsonwebtoken');

describe('Order Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockToken = 'mock-token';
    const mockUser = { id: 1, role: 'customer' };
    const mockAdmin = { id: 2, role: 'admin' };
    const validItemId = '123e4567-e89b-12d3-a456-426614174000';

    describe('POST /api/v1/orders', () => {
        it('should create a draft order', async () => {
            jwt.verify.mockReturnValue(mockUser);

            const orderData = {
                event_date: '2026-03-01',
                event_time: '18:00',
                event_type: 'Wedding', // Capitalized as per schema enum
                guest_count: 100,
                venue_address: '123 Hall Street, City',
                order_items: [
                    { menu_item_id: validItemId, quantity: 100 }
                ]
            };

            // 1. Mock create order
            db.query.mockResolvedValueOnce({
                rows: [{ id: 'order-1', ...orderData, status: 'draft' }]
            });
            // 2. Mock create order items (loop for 1 item)
            db.query.mockResolvedValueOnce({ rows: [] });
            // 3. Mock update total
            db.query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .post('/api/v1/orders')
                .set('Authorization', `Bearer ${mockToken}`)
                .send(orderData);

            expect(res.statusCode).toEqual(201);
            expect(res.body.data.id).toEqual('order-1');
        });
    });

    describe('GET /api/v1/orders', () => {
        it('should list orders for admin', async () => {
            jwt.verify.mockReturnValue(mockAdmin);

            // 1. findAllOrders
            db.query.mockResolvedValueOnce({
                rows: [{ id: 'order-1', status: 'draft' }]
            });
            // 2. getOrderItems (for order-1)
            db.query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .get('/api/v1/orders')
                .set('Authorization', `Bearer ${mockToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.data).toHaveLength(1);
        });
    });
});
