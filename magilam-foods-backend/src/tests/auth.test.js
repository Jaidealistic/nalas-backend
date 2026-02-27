const request = require('supertest');
const app = require('../app');
const db = require('../config/database');
const bcrypt = require('bcryptjs');

// Mock dependencies
jest.mock('../config/database');
jest.mock('bcryptjs');

describe('Auth Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/v1/auth/register', () => {
        it('should create a new user', async () => {
            // Mock findUserByEmail to return null (user doesn't exist)
            db.query.mockResolvedValueOnce({ rows: [] });

            // Mock password hashing
            bcrypt.hash.mockResolvedValue('hashed_password');

            // Mock createUser (insert user)
            db.query.mockResolvedValueOnce({
                rows: [{
                    id: 1,
                    email: 'test@example.com',
                    role: 'customer',
                    created_at: new Date()
                }]
            });

            // Mock createProfile
            db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    phone: '1234567890',
                    fullName: 'Test User'
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body.data).toHaveProperty('token');
            expect(res.body.data.user).toHaveProperty('email', 'test@example.com');
        });

        it('should return 409 if user already exists', async () => {
            // Mock findUserByEmail to return existing user
            db.query.mockResolvedValueOnce({
                rows: [{ id: 1, email: 'test@example.com' }]
            });

            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    phone: '1234567890',
                    fullName: 'Test User'
                });

            expect(res.statusCode).toEqual(409);
        });
    });

    describe('POST /api/v1/auth/login', () => {
        it('should login successfully with correct credentials', async () => {
            // Mock findUserByEmail
            db.query.mockResolvedValueOnce({
                rows: [{
                    id: 1,
                    email: 'test@example.com',
                    password_hash: 'hashed_password',
                    role: 'customer',
                    is_active: true
                }]
            });

            // Mock bcrypt compare
            bcrypt.compare.mockResolvedValue(true);

            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.data).toHaveProperty('token');
        });

        it('should return 401 with incorrect password', async () => {
            // Mock findUserByEmail
            db.query.mockResolvedValueOnce({
                rows: [{
                    id: 1,
                    email: 'test@example.com',
                    password_hash: 'hashed_password',
                    role: 'customer',
                    is_active: true
                }]
            });

            // Mock bcrypt compare
            bcrypt.compare.mockResolvedValue(false);

            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });

            expect(res.statusCode).toEqual(401);
        });
    });

    describe('Validation Errors', () => {
        it('should return 422 for missing required fields', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'test@example.com',
                    // password missing
                    phone: '1234567890',
                    fullName: 'Test User'
                });

            expect(res.statusCode).toEqual(422);
            expect(res.body).toHaveProperty('error');
            expect(res.body.error).toHaveProperty('details');
        });

        it('should return 422 for invalid password length', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'short', // < 8 chars
                    phone: '1234567890',
                    fullName: 'Test User'
                });

            expect(res.statusCode).toEqual(422);
        });

        it('should return 422 for invalid email format', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'invalid-email',
                    password: 'password123',
                    phone: '1234567890',
                    fullName: 'Test User'
                });

            expect(res.statusCode).toEqual(422);
        });
    });
});
