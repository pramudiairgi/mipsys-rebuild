import { Test, TestingModule } from '@nestjs/testing';
import { OrderPartsService } from '../src/order-parts/order-parts.service';
import { orderParts, spareParts } from '../src/database/schema';

const mockDb = {
  insert: jest.fn().mockReturnValue({
    values: jest.fn().mockReturnValue({
      returning: jest.fn().mockResolvedValue([{ id: 1 }]),
    }),
  }),
  select: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue([]),
    }),
  }),
  query: {
    orderParts: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    spareParts: { findFirst: jest.fn().mockResolvedValue(null) },
  },
  update: jest.fn().mockReturnValue({
    set: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue([]),
    }),
  }),
  transaction: jest.fn((cb) => cb(mockDb)),
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
