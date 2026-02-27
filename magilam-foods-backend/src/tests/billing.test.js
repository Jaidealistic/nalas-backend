const request = require('supertest');
const app = require('../app');
const billingService = require('../modules/billing/service');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('../modules/billing/service');
jest.mock('jsonwebtoken');

describe('Billing Module Endpoints', () => {
    const validUuid = '12345678-1234-1234-1234-123456789012';

    beforeEach(() => {
        jest.clearAllMocks();
        // Mock JWT verify to return an admin user for RBAC
        jwt.verify.mockReturnValue({ id: validUuid, role: 'admin' });
    });

    describe('Quotations', () => {
        it('POST /api/v1/billing/quotations - should create a quotation', async () => {
            const mockQuotation = { id: validUuid, amount: 1000 };
            billingService.createQuotation.mockResolvedValue(mockQuotation);

            const res = await request(app)
                .post('/api/v1/billing/quotations')
                .set('Authorization', 'Bearer valid-token')
                .send({
                    order_id: validUuid,
                    labor_cost_per_guest: 500,
                    overhead_percentage: 15,
                    tax_percentage: 18,
                    discount: 0
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toEqual(mockQuotation);
            expect(billingService.createQuotation).toHaveBeenCalled();
        });

        it('GET /api/v1/billing/quotations - should list quotations', async () => {
            const mockQuotations = [{ id: validUuid }];
            billingService.getAllQuotations.mockResolvedValue(mockQuotations);

            const res = await request(app)
                .get('/api/v1/billing/quotations')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual(mockQuotations);
        });

        it('GET /api/v1/billing/quotations/:id - should get quotation details', async () => {
            const mockQuotation = { id: validUuid };
            billingService.getQuotationById.mockResolvedValue(mockQuotation);

            const res = await request(app)
                .get(`/api/v1/billing/quotations/${validUuid}`)
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual(mockQuotation);
        });
    });

    describe('Invoices', () => {
        it('POST /api/v1/billing/invoices - should create an invoice', async () => {
            const mockInvoice = { id: validUuid, total: 500 };
            billingService.createInvoice.mockResolvedValue(mockInvoice);

            const res = await request(app)
                .post('/api/v1/billing/invoices')
                .set('Authorization', 'Bearer valid-token')
                .send({
                    order_id: validUuid,
                    due_date: new Date().toISOString()
                });

            expect(res.status).toBe(201);
            expect(res.body.data).toEqual(mockInvoice);
        });

        it('GET /api/v1/billing/invoices - should list invoices', async () => {
            const mockInvoices = [{ id: validUuid }];
            billingService.getAllInvoices.mockResolvedValue(mockInvoices);

            const res = await request(app)
                .get('/api/v1/billing/invoices')
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual(mockInvoices);
        });

        it('GET /api/v1/billing/invoices/:id - should get invoice details', async () => {
            const mockInvoice = { id: validUuid };
            billingService.getInvoiceById.mockResolvedValue(mockInvoice);

            const res = await request(app)
                .get(`/api/v1/billing/invoices/${validUuid}`)
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual(mockInvoice);
        });
    });

    describe('Payments', () => {
        it('POST /api/v1/billing/payments - should record a payment', async () => {
            const mockPayment = { id: validUuid, amount: 100 };
            billingService.recordPayment.mockResolvedValue(mockPayment);

            const res = await request(app)
                .post('/api/v1/billing/payments')
                .set('Authorization', 'Bearer valid-token')
                .send({
                    invoice_id: validUuid,
                    amount: 100,
                    payment_method: 'card',
                    transaction_id: 'tx-123',
                    notes: 'test note'
                });

            expect(res.status).toBe(201);
            expect(res.body.data).toEqual(mockPayment);
        });

        it('GET /api/v1/billing/invoices/:id/payments - should get payments for invoice', async () => {
            const mockPayments = [{ id: validUuid }];
            billingService.getPayments.mockResolvedValue(mockPayments);

            const res = await request(app)
                .get(`/api/v1/billing/invoices/${validUuid}/payments`)
                .set('Authorization', 'Bearer valid-token');

            expect(res.status).toBe(200);
            expect(res.body.data).toEqual(mockPayments);
        });
        describe('Error Handling', () => {
            it('POST /api/v1/billing/quotations - should return 422 if required fields are missing', async () => {
                const res = await request(app)
                    .post('/api/v1/billing/quotations')
                    .set('Authorization', 'Bearer valid-token')
                    .send({
                        // Missing order_id
                        items: []
                    });

                expect(res.status).toBe(422);
                expect(res.body.success).toBe(false);
                expect(res.body.error.code).toBe('UNPROCESSABLE_ENTITY');
            });

            it('GET /api/v1/billing/quotations - should return 401 if no token provided', async () => {
                const res = await request(app)
                    .get('/api/v1/billing/quotations');

                expect(res.status).toBe(401);
                expect(res.body.success).toBe(false);
                expect(res.body.error.code).toBe('UNAUTHORIZED');
            });
        });
    });
});
