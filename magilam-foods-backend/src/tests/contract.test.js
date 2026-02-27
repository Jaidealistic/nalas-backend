const path = require('path');
const request = require('supertest');
const app = require('../app');
const jestOpenAPI = require('jest-openapi').default;
const db = require('../config/database');
const bcrypt = require('bcryptjs');

// Mock dependencies
jest.mock('../config/database');
jest.mock('bcryptjs');

// Load OpenAPI spec
const openApiPath = path.join(__dirname, '../../openapi.yaml');
jestOpenAPI(openApiPath);

describe('Contract Verification', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/v1/auth/register', () => {
        it('should satisfy OpenAPI spec for 201 response', async () => {
            // Mock DB for successful registration
            db.query.mockResolvedValueOnce({ rows: [] }); // check existing user
            bcrypt.hash.mockResolvedValue('hashed_password');
            db.query.mockResolvedValueOnce({ // insert user
                rows: [{
                    id: 1,
                    email: 'test@example.com',
                    role: 'customer',
                    created_at: new Date()
                }]
            });
            db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // create profile

            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    phone: '1234567890',
                    fullName: 'Test User'
                });

            expect(res.status).toEqual(201);
            expect(res).toSatisfyApiSpec();
        });

        it('should satisfy OpenAPI spec for 422 response', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'test@example.com',
                    // password missing
                    phone: '1234567890',
                    fullName: 'Test User'
                });

            expect(res.status).toEqual(422);
            expect(res).toSatisfyApiSpec();
        });
    });
});
