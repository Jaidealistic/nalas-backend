const { validateStockData } = require('./validate-data.js');
const db = require('../config/database');
const logger = require('../shared/utils/logger');

jest.mock('../config/database', () => ({
  connect: jest.fn(),
  query: jest.fn(),
}));

jest.mock('../shared/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('Cross-module Data Validation', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    db.connect.mockResolvedValue(mockClient);
  });

  test('should validate stock without discrepancies', async () => {
    mockClient.query.mockResolvedValueOnce(); // BEGIN
    mockClient.query.mockResolvedValueOnce({ rows: [] }); // query for discrepancies returns empty
    mockClient.query.mockResolvedValueOnce(); // COMMIT

    await validateStockData();

    expect(db.connect).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith('All stock quantities match transaction history.');
  });

  test('should warn on stock discrepancies', async () => {
    const mockRows = [{ id: 1, name: 'Tomato', available_quantity: 10, expected_quantity: 15 }];
    mockClient.query.mockResolvedValueOnce(); // BEGIN
    mockClient.query.mockResolvedValueOnce({ rows: mockRows }); // discrepancy found
    mockClient.query.mockResolvedValue(); // COMMIT

    await validateStockData();

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Found 1 stock discrepancies:'));
  });

  test('should rollback on DB error', async () => {
    const error = new Error('DB Error');
    mockClient.query.mockResolvedValueOnce(); // BEGIN
    mockClient.query.mockRejectedValueOnce(error); // Error on SELECT
    mockClient.query.mockResolvedValueOnce(); // ROLLBACK

    await expect(validateStockData()).rejects.toThrow('DB Error');
  });
});

