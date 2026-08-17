import { Test, TestingModule } from '@nestjs/testing';
import { OrderPartsService } from '../src/order-parts/order-parts.service';
import { orderParts } from '../src/database/schema';

interface ReturningChain {
  returning: jest.Mock<Promise<Array<Record<string, number>>>, []>;
}

interface InsertChain {
  values: jest.Mock<ReturningChain, []>;
}

interface WhereChain {
  where: jest.Mock<Promise<unknown[]>, [unknown]>;
}

interface SelectChain {
  from: jest.Mock<WhereChain, []>;
}

interface UpdateChain {
  set: jest.Mock<WhereChain, [unknown]>;
}

interface MockDb {
  insert: jest.Mock<InsertChain, [unknown]>;
  select: jest.Mock<SelectChain, []>;
  update: jest.Mock<UpdateChain, [unknown]>;
  query: {
    orderParts: {
      findMany: jest.Mock<Promise<unknown[]>, [unknown]>;
      findFirst: jest.Mock<Promise<unknown>, [unknown]>;
    };
    spareParts: {
      findFirst: jest.Mock<Promise<unknown>, [unknown]>;
    };
  };
  transaction: jest.Mock<Promise<unknown>, [(db: MockDb) => Promise<unknown>]>;
}

const mockDb: MockDb = {
  insert: jest.fn<InsertChain, [unknown]>().mockReturnValue({
    values: jest.fn<ReturningChain, []>().mockReturnValue({
      returning: jest
        .fn<Promise<Array<Record<string, number>>>, []>()
        .mockResolvedValue([{ id: 1 }]),
    }),
  }),
  select: jest.fn<SelectChain, []>().mockReturnValue({
    from: jest.fn<WhereChain, []>().mockReturnValue({
      where: jest.fn<Promise<unknown[]>, [unknown]>().mockResolvedValue([]),
    }),
  }),
  update: jest.fn<UpdateChain, [unknown]>().mockReturnValue({
    set: jest.fn<WhereChain, [unknown]>().mockReturnValue({
      where: jest.fn<Promise<unknown[]>, [unknown]>().mockResolvedValue([]),
    }),
  }),
  query: {
    orderParts: {
      findMany: jest.fn<Promise<unknown[]>, [unknown]>().mockResolvedValue([]),
      findFirst: jest.fn<Promise<unknown>, [unknown]>().mockResolvedValue(null),
    },
    spareParts: {
      findFirst: jest.fn<Promise<unknown>, [unknown]>().mockResolvedValue(null),
    },
  },
  transaction: jest
    .fn<(db: MockDb) => Promise<unknown>, [(db: MockDb) => Promise<unknown>]>()
    .mockImplementation((cb) => cb(mockDb)),
};

describe('OrderPartsService', () => {
  let service: OrderPartsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderPartsService,
        { provide: 'DB_CONNECTION', useValue: mockDb },
      ],
    }).compile();

    service = module.get<OrderPartsService>(OrderPartsService);
    jest.clearAllMocks();
  });

  describe('addPart', () => {
    it('should add a part to a service request with priceAtAction', async () => {
      mockDb.query.spareParts.findFirst.mockResolvedValue({
        id: 1,
        partName: 'Test Part',
        price: '100000.00',
      });

      const result = await service.addPart({
        serviceRequestId: 1,
        sparePartId: 1,
        quantity: 2,
      });

      expect(result.success).toBe(true);
      expect(mockDb.insert).toHaveBeenCalledWith(orderParts);
    });

    it('should reject if spare part not found', async () => {
      mockDb.query.spareParts.findFirst.mockResolvedValue(null);

      await expect(
        service.addPart({
          serviceRequestId: 1,
          sparePartId: 999,
          quantity: 1,
        })
      ).rejects.toThrow('tidak ditemukan');
    });
  });

  describe('getByServiceRequest', () => {
    it('should return all parts for a service request', async () => {
      mockDb.query.orderParts.findMany.mockResolvedValue([
        { id: 1, sparePartId: 1, quantity: 2, priceAtAction: '100000.00' },
      ]);

      const result = await service.getByServiceRequest(1);
      expect(result).toHaveLength(1);
    });
  });

  describe('removePart', () => {
    it('should delete an order part', async () => {
      await service.removePart(1);
      expect(mockDb.update).toHaveBeenCalled();
    });
  });
});
