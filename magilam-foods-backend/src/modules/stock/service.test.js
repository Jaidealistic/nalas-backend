const stockService = require('./service');
const stockRepository = require('./repository');

jest.mock('./repository', () => ({
  findIngredientById: jest.fn(),
  getCurrentStock: jest.fn(),
  updateCurrentStock: jest.fn(),
  createTransaction: jest.fn()
}));

describe('StockService Transactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should record an adjustment transaction and append log to notes', async () => {
    // Setup initial state
    stockRepository.findIngredientById.mockResolvedValue({ id: 1, name: 'Potato' });
    stockRepository.getCurrentStock.mockResolvedValue({ ingredient_id: 1, available_quantity: '50' });
    stockRepository.createTransaction.mockResolvedValue({ id: 10, transaction_type: 'adjustment', quantity: 15, unit_price: null, notes: 'Stock take | Adjustment Log: Changed from 50 to 65 (Diff: +15).', ingredient_id: 1 });
    stockRepository.updateCurrentStock.mockResolvedValue(true);

    const transactionData = {
      ingredient_id: 1,
      transaction_type: 'adjustment',
      quantity: 65,  // the new exact quantity they recorded
      notes: 'Stock take'
    };

    const result = await stockService.recordTransaction(transactionData, 99);

    // After our fix, the actual transaction quantity passed down should be difference (15)
    expect(stockRepository.createTransaction).toHaveBeenCalledWith(expect.objectContaining({
      quantity: 15,
      transaction_type: 'adjustment',
      notes: 'Stock take | Adjustment Log: Changed from 50 to 65 (Diff: +15).'
    }));

    // newAvailableQty will be 65
    expect(stockRepository.updateCurrentStock).toHaveBeenCalledWith(1, 65);
    expect(result.type).toBe('adjustment');
  });

  test('should reduce quantity nicely during negative adjustment without crashing', async () => {
    stockRepository.findIngredientById.mockResolvedValue({ id: 1, name: 'Potato' });
    stockRepository.getCurrentStock.mockResolvedValue({ ingredient_id: 1, available_quantity: '50' });
    stockRepository.createTransaction.mockResolvedValue({});
    stockRepository.updateCurrentStock.mockResolvedValue(true);

    const transactionData = {
      ingredient_id: 1,
      transaction_type: 'adjustment',
      quantity: 40 // lower than current stock
    };

    await stockService.recordTransaction(transactionData, 99);

    expect(stockRepository.createTransaction).toHaveBeenCalledWith(expect.objectContaining({
      quantity: -10, // 40 - 50 = -10
      notes: 'Adjustment Log: Changed from 50 to 40 (Diff: -10).'
    }));

    expect(stockRepository.updateCurrentStock).toHaveBeenCalledWith(1, 40);
  });
});
