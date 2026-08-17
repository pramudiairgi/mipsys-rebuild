import { Test, TestingModule } from '@nestjs/testing';
import { StockMovementsService } from '../src/stock-movements/stock-movements.service';
import { stockMovements, spareParts } from '../src/database/schema';
import { BadRequestException } from '@nestjs/common';

type StockRow = { id: number; stock: number };

let mockStockRows: StockRow[] = [];

interface InsertChain {
  values: jest.Mock<Promise<unknown[]>, [unknown]>;
}

interface LimitResult {
  limit: jest.Mock<Promise<StockRow[]>, []>;
}

interface FromResult {
  where: jest.Mock<LimitResult, [unknown]>;
  orderBy: jest.Mock<Promise<unknown[]>, [unknown]>;
}

interface SelectChain {
  from: jest.Mock<FromResult, []>;
}

interface SetChain {
  set: jest.Mock<
    { where: jest.Mock<Promise<unknown[]>, [unknown]> },
    [unknown]
  >;
}

interface MockDb {
  insert: jest.Mock<InsertChain, [unknown]>;
  select: jest.Mock<SelectChain, []>;
  update: jest.Mock<SetChain, [unknown]>;
  query: {
    stockMovements: {
      findMany: jest.Mock<Promise<unknown[]>, [unknown]>;
    };
  };
  transaction: jest.Mock<Promise<unknown>, [(db: MockDb) => Promise<unknown>]>;
}

const mockDb: MockDb = {
  insert: jest.fn<InsertChain, [unknown]>().mockReturnValue({
    values: jest.fn<Promise<unknown[]>, [unknown]>().mockResolvedValue([]),
  }),
  select: jest.fn<SelectChain, []>().mockReturnValue({
    from: jest.fn<FromResult, []>().mockReturnValue({
      where: jest.fn<LimitResult, [unknown]>().mockReturnValue({
        limit: jest
          .fn<Promise<StockRow[]>, []>()
          .mockImplementation(() => Promise.resolve(mockStockRows)),
      }),
      orderBy: jest.fn<Promise<unknown[]>, [unknown]>().mockResolvedValue([]),
    }),
  }),
  update: jest.fn<SetChain, [unknown]>().mockReturnValue({
    set: jest
      .fn<{ where: jest.Mock<Promise<unknown[]>, [unknown]> }, [unknown]>()
      .mockReturnValue({
        where: jest.fn<Promise<unknown[]>, [unknown]>().mockResolvedValue([]),
      }),
  }),
  query: {
    stockMovements: {
      findMany: jest.fn<Promise<unknown[]>, [unknown]>().mockResolvedValue([]),
    },
  },
  transaction: jest
    .fn<(db: MockDb) => Promise<unknown>, [(db: MockDb) => Promise<unknown>]>()
    .mockImplementation((cb) => cb(mockDb)),
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

      await service.updateStock(
        mockDb as unknown as Parameters<typeof service.updateStock>[0],
        1,
        5,
        'ADJUSTMENT'
      );

      expect(mockDb.update).toHaveBeenCalledWith(spareParts);
    });

    it('should decrease stock for negative quantity', async () => {
      mockStockRows = [{ id: 1, stock: 10 }];

      await service.updateStock(
        mockDb as unknown as Parameters<typeof service.updateStock>[0],
        1,
        -3,
        'SERVICE_USE'
      );

      expect(mockDb.update).toHaveBeenCalledWith(spareParts);
    });

    it('should throw when stock becomes negative for SERVICE_USE', async () => {
      mockStockRows = [{ id: 1, stock: 2 }];

      await expect(
        service.updateStock(
          mockDb as unknown as Parameters<typeof service.updateStock>[0],
          1,
          -5,
          'SERVICE_USE'
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when part not found', async () => {
      mockStockRows = [];

      await expect(
        service.updateStock(
          mockDb as unknown as Parameters<typeof service.updateStock>[0],
          999,
          5,
          'ADJUSTMENT'
        )
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
