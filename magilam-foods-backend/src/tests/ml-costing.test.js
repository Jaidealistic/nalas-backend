const request = require('supertest');
const app = require('../app');
const mlCostingService = require('../modules/ml-costing/service');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('../modules/ml-costing/service');
jest.mock('jsonwebtoken');

describe('ML Costing Module Endpoints', () => {
    const validUuid = '12345678-1234-1234-1234-123456789012';

    beforeEach(() => {
        jest.clearAllMocks();
        // Mock JWT verify to return an admin user for RBAC
        jwt.verify.mockReturnValue({ id: validUuid, role: 'admin' });
    });

    describe('Predictions', () => {
        it('POST /api/v1/ml-costing/predictions - should create a prediction', async () => {
            const mockPrediction = { id: validUuid, result: 'success' };
            mlCostingService.createPrediction.mockResolvedValue(mockPrediction);

            const res = await request(app)
                .post('/api/v1/ml-costing/predictions')
                .set('Authorization', 'Bearer valid-token')
                .send({
                    order_item_id: validUuid,
                    ingredient_cost: 100,
                    labor_cost: 50,
                    overhead_cost: 20,
                    predicted_total: 170
                });

            expect(res.status).toBe(201);
            expect(res.body.data).toEqual(mockPrediction);
        });

        it('GET /api/v1/ml-costing/predictions - should list predictions', async () => {
            const mockPredictions = [{ id: validUuid }];
            mlCostingService.getAllPredictions.mockResolvedValue(mockPredictions);

            const res = await request(app)
                .get('/api/v1/ml-costing/predictions')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual(mockPredictions);
        });

        it('GET /api/v1/ml-costing/predictions/:id - should get prediction details', async () => {
            const mockPrediction = { id: validUuid };
            mlCostingService.getPredictionById.mockResolvedValue(mockPrediction);

            const res = await request(app)
                .get(`/api/v1/ml-costing/predictions/${validUuid}`)
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual(mockPrediction);
        });
    });

    describe('Analytics', () => {
        it('GET /api/v1/ml-costing/analytics - should get analytics', async () => {
            const mockAnalytics = { usage: 100 };
            mlCostingService.getAnalytics.mockResolvedValue(mockAnalytics);

            const res = await request(app)
                .get('/api/v1/ml-costing/analytics')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual(mockAnalytics);
        });

        it('GET /api/v1/ml-costing/trends - should get trends', async () => {
            const mockTrends = { trend: 'up' };
            mlCostingService.getTrends.mockResolvedValue(mockTrends);

            const res = await request(app)
                .get('/api/v1/ml-costing/trends')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual(mockTrends);
        });

        it('GET /api/v1/ml-costing/items/:id/trend - should get order item trend', async () => {
            const mockItemTrend = { item_id: 'item-123', trend: 'flat' };
            mlCostingService.getOrderItemTrend.mockResolvedValue(mockItemTrend);

            const res = await request(app)
                .get('/api/v1/ml-costing/items/item-123/trend')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual(mockItemTrend);
        });
    });

    describe('Error Handling', () => {
        it('POST /api/v1/ml-costing/predictions - should return 422 if required fields are missing', async () => {
            const res = await request(app)
                .post('/api/v1/ml-costing/predictions')
                .set('Authorization', 'Bearer valid-token')
                .send({
                    // Missing required fields
                    input_data: {}
                });

            expect(res.status).toBe(422);
            expect(res.body.success).toBe(false);
            expect(res.body.error.code).toBe('UNPROCESSABLE_ENTITY');
        });

        it('GET /api/v1/ml-costing/predictions - should return 403 if user is not admin', async () => {
            // Override mock for this test
            jwt.verify.mockReturnValueOnce({ id: 'user-456', role: 'customer' });

            const res = await request(app)
                .get('/api/v1/ml-costing/predictions')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.error.code).toBe('FORBIDDEN');
        });
    });
});
