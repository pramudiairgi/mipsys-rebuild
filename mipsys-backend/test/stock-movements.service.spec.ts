import { Test, TestingModule } from '@nestjs/testing';
import { StockMovementsService } from '../src/stock-movements/stock-movements.service';
import { stockMovements, spareParts } from '../src/database/schema';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { BadRequestException } from '@nestjs/common';

let mockStockRows: any[] = [];

const mockDb = {
  insert: jest.fn().mockReturnValue({
    values: jest.fn().mockReturnValue({
      returning: jest.fn().mockResolvedValue([{ id: 1 }]),
    }),
  }),
  select: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        limit: jest
          .fn()
          .mockImplementation(() => Promise.resolve(mockStockRows)),
      }),
      orderBy: jest.fn().mockResolvedValue([]),
    }),
  }),
  update: jest.fn().mockReturnValue({
    set: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue([]),
    }),
  }),
  transaction: jest.fn((cb) => cb(mockDb)),
  query: {
    stockMovements: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
};

describe('StockMovementsService', () => {
  let service: StockMovementsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockMovementsService,
        { provide: 'DB_CONNECTION', useValue: mockDb },
      ],
    }).compile();

    service = module.get<StockMovementsService>(StockMovementsService);
    jest.clearAllMocks();
    mockStockRows = [];
  });

  describe('createMovement', () => {
    it('should create a PO_RECEIVE movement', async () => {
      const result = await service.createMovement({
        sparePartId: 1,
        quantity: 10,
        movementType: 'PO_RECEIVE',
        referenceType: 'PO_TICKET',
        referenceId: 'PO-20260515-0001',
        performedBy: 1,
      });

      expect(result.success).toBe(true);
      expect(mockDb.insert).toHaveBeenCalledWith(stockMovements);
    });

    it('should create a SERVICE_USE movement', async () => {
      const result = await service.createMovement({
        sparePartId: 1,
        quantity: -3,
        movementType: 'SERVICE_USE',
        referenceType: 'SR_TICKET',
        referenceId: 'SR-20260515-0001',
        performedBy: 1,
      });

      expect(result.success).toBe(true);
    });

    it('should reject ADJUSTMENT without notes', async () => {
      await expect(
        service.createMovement({
          sparePartId: 1,
          quantity: 5,
          movementType: 'ADJUSTMENT',
          performedBy: 1,
        })
      ).rejects.toThrow('ADJUSTMENT wajib menyertakan catatan');
    });
  });

  describe('updateStock', () => {
    it('should increase stock for positive quantity', async () => {
      mockStockRows = [{ id: 1, stock: 10 }];

      await service.updateStock(mockDb as any, 1, 5, 'ADJUSTMENT');

      expect(mockDb.update).toHaveBeenCalledWith(spareParts);
    });

    it('should decrease stock for negative quantity', async () => {
      mockStockRows = [{ id: 1, stock: 10 }];

      await service.updateStock(mockDb as any, 1, -3, 'SERVICE_USE');

      expect(mockDb.update).toHaveBeenCalledWith(spareParts);
    });

    it('should throw when stock becomes negative for SERVICE_USE', async () => {
      mockStockRows = [{ id: 1, stock: 2 }];

      await expect(
        service.updateStock(mockDb as any, 1, -5, 'SERVICE_USE')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when part not found', async () => {
      mockStockRows = [];

      await expect(
        service.updateStock(mockDb as any, 999, 5, 'ADJUSTMENT')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMovementsByPart', () => {
    it('should return movements for a given part', async () => {
      mockDb.query.stockMovements.findMany.mockResolvedValue([
        {
          id: 1,
          quantity: 10,
          movementType: 'PO_RECEIVE',
          referenceId: 'PO-001',
        },
      ]);

      const result = await service.getMovementsByPart(1);
      expect(result).toHaveLength(1);
      expect(result[0].movementType).toBe('PO_RECEIVE');
    });
  });
});
