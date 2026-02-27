const request = require('supertest');
const app = require('../app');
const db = require('../config/database');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('../config/database');
jest.mock('jsonwebtoken');

describe('Menu Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Helper to generate mock token
    const mockToken = 'mock-token';
    const mockUser = { id: 1, role: 'customer' };
    const mockAdmin = { id: 2, role: 'admin' };

    describe('GET /api/v1/menu/categories', () => {
        it('should return all categories', async () => {
            jwt.verify.mockReturnValue(mockUser);

            const mockCategories = [
                { id: 1, name: 'Starters', description: 'Appetizers' },
                { id: 2, name: 'Main Course', description: 'Main dishes' }
            ];

            db.query.mockResolvedValueOnce({ rows: mockCategories });

            const res = await request(app)
                .get('/api/v1/menu/categories')
                .set('Authorization', `Bearer ${mockToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.data).toHaveLength(2);
            expect(res.body.data[0].name).toEqual('Starters');
        });
    });

    describe('POST /api/v1/menu/categories', () => {
        it('should create a category (admin)', async () => {
            jwt.verify.mockReturnValue(mockAdmin);

            const newCategory = { name: 'Desserts', description: 'Sweet treats' };

            // Mock insert (only 1 call in repo/service)
            db.query.mockResolvedValueOnce({
                rows: [{ id: 3, ...newCategory }]
            });

            const res = await request(app)
                .post('/api/v1/menu/categories')
                .set('Authorization', `Bearer ${mockToken}`)
                .send(newCategory);

            expect(res.statusCode).toEqual(201);
            expect(res.body.data.name).toEqual('Desserts');
        });

        it('should forbid non-admin users', async () => {
            jwt.verify.mockReturnValue(mockUser);

            const res = await request(app)
                .post('/api/v1/menu/categories')
                .set('Authorization', `Bearer ${mockToken}`)
                .send({ name: 'Hacker', description: 'Attempt' });

            expect(res.statusCode).toEqual(403);
        });
    });

    describe('GET /api/v1/menu/items', () => {
        it('should return menu items', async () => {
            jwt.verify.mockReturnValue(mockUser);

            db.query.mockResolvedValueOnce({ rows: [] }); // mock fetch

            const res = await request(app)
                .get('/api/v1/menu/items')
                .set('Authorization', `Bearer ${mockToken}`);

            expect(res.statusCode).toEqual(200);
        });
    });
});
