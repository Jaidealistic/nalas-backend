const request = require('supertest');
const app = require('../app');
const db = require('../config/database');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('../config/database');
jest.mock('jsonwebtoken');

describe('Stock Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockToken = 'mock-token';
    const mockAdmin = { id: 2, role: 'admin' };
    const mockIngredientId = '123e4567-e89b-12d3-a456-426614174000'; // valid uuid

    describe('GET /api/v1/stock/ingredients', () => {
        it('should return all ingredients', async () => {
            jwt.verify.mockReturnValue(mockAdmin);

            // 1. Mock findAllIngredients
            db.query.mockResolvedValueOnce({
                rows: [{ id: mockIngredientId, name: 'Rice', unit: 'kg' }]
            });
            // 2. Mock getCurrentStock (called for each ingredient)
            db.query.mockResolvedValueOnce({
                rows: [{ ingredient_id: mockIngredientId, available_quantity: 100 }]
            });

            const res = await request(app)
                .get('/api/v1/stock/ingredients')
                .set('Authorization', `Bearer ${mockToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.data).toHaveLength(1);
        });
    });

    describe('POST /api/v1/stock/ingredients', () => {
        it('should create an ingredient', async () => {
            jwt.verify.mockReturnValue(mockAdmin);

            // valid schema payload
            const newIngredient = {
                name: 'Tomato',
                unit: 'kg',
                current_price_per_unit: 50,
                reorder_level: 5
            };

            // 1. Mock insert ingredient
            db.query.mockResolvedValueOnce({
                rows: [{ id: mockIngredientId, ...newIngredient }]
            });
            // 2. Mock initialize stock
            db.query.mockResolvedValueOnce({
                rows: [{ ingredient_id: mockIngredientId, available_quantity: 0 }]
            });

            const res = await request(app)
                .post('/api/v1/stock/ingredients')
                .set('Authorization', `Bearer ${mockToken}`)
                .send(newIngredient);

            expect(res.statusCode).toEqual(201);
            expect(res.body.data.name).toEqual('Tomato');
        });
    });

    describe('POST /api/v1/stock/transactions', () => {
        it('should record a stock transaction', async () => {
            jwt.verify.mockReturnValue(mockAdmin);

            const transaction = {
                ingredient_id: mockIngredientId,
                transaction_type: 'purchase',
                quantity: 50,
                unit_price: 100
            };

            // 1. Mock find ingredient
            db.query.mockResolvedValueOnce({
                rows: [{ id: mockIngredientId, name: 'Rice', unit: 'kg' }]
            });
            // 2. Mock get current stock
            db.query.mockResolvedValueOnce({
                rows: [{ ingredient_id: mockIngredientId, available_quantity: 10, reserved_quantity: 0 }]
            });
            // 3. Mock create transaction
            db.query.mockResolvedValueOnce({ rows: [{ id: 'tx-1', ...transaction }] });
            // 4. Mock update current stock
            db.query.mockResolvedValueOnce({ rows: [] });


            const res = await request(app)
                .post('/api/v1/stock/transactions')
                .set('Authorization', `Bearer ${mockToken}`)
                .send(transaction);

            expect(res.statusCode).toEqual(201);
        });
    });
});
