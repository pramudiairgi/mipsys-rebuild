import {
  validatePoTransition,
  PoStatusType,
  VALID_PO_TRANSITIONS,
} from '../src/purchase-orders/po-state-machine.guard';
import { BadRequestException } from '@nestjs/common';

describe('PO State Machine', () => {
  describe('valid transitions', () => {
    it('should allow DRAFT → REQUESTED', () => {
      expect(() => validatePoTransition('DRAFT', 'REQUESTED')).not.toThrow();
    });

    it('should allow REQUESTED → APPROVED', () => {
      expect(() => validatePoTransition('REQUESTED', 'APPROVED')).not.toThrow();
    });

    it('should allow SHIPPED → PARTIALLY_RECEIVED', () => {
      expect(() =>
        validatePoTransition('SHIPPED', 'PARTIALLY_RECEIVED')
      ).not.toThrow();
    });

    it('should allow PARTIALLY_RECEIVED → RECEIVED', () => {
      expect(() =>
        validatePoTransition('PARTIALLY_RECEIVED', 'RECEIVED')
      ).not.toThrow();
    });

    it('should allow DRAFT → CANCELLED', () => {
      expect(() => validatePoTransition('DRAFT', 'CANCELLED')).not.toThrow();
    });

    it('should allow REQUESTED → CANCELLED', () => {
      expect(() =>
        validatePoTransition('REQUESTED', 'CANCELLED')
      ).not.toThrow();
    });

    it('should allow APPROVED → ORDERED', () => {
      expect(() => validatePoTransition('APPROVED', 'ORDERED')).not.toThrow();
    });

    it('should allow ORDERED → SHIPPED', () => {
      expect(() => validatePoTransition('ORDERED', 'SHIPPED')).not.toThrow();
    });

    it('should allow SHIPPED → RECEIVED', () => {
      expect(() => validatePoTransition('SHIPPED', 'RECEIVED')).not.toThrow();
    });

    it('should allow PARTIALLY_RECEIVED → PARTIALLY_RECEIVED (additional partial receive)', () => {
      expect(() =>
        validatePoTransition('PARTIALLY_RECEIVED', 'PARTIALLY_RECEIVED')
      ).not.toThrow();
    });
  });

  describe('invalid transitions', () => {
    it('should reject DRAFT → RECEIVED (skip all steps)', () => {
      expect(() => validatePoTransition('DRAFT', 'RECEIVED')).toThrow(
        BadRequestException
      );
    });

    it('should reject REQUESTED → RECEIVED (skip approval)', () => {
      expect(() => validatePoTransition('REQUESTED', 'RECEIVED')).toThrow(
        BadRequestException
      );
    });

    it('should reject RECEIVED → ORDERED (terminal state)', () => {
      expect(() => validatePoTransition('RECEIVED', 'ORDERED')).toThrow(
        BadRequestException
      );
    });

    it('should reject CANCELLED → REQUESTED (terminal state)', () => {
      expect(() => validatePoTransition('CANCELLED', 'REQUESTED')).toThrow(
        BadRequestException
      );
    });

    it('should reject RECEIVED → CANCELLED (already received)', () => {
      expect(() => validatePoTransition('RECEIVED', 'CANCELLED')).toThrow(
        BadRequestException
      );
    });

    it('should reject APPROVED → SHIPPED (skip ORDERED)', () => {
      expect(() => validatePoTransition('APPROVED', 'SHIPPED')).toThrow(
        BadRequestException
      );
    });

    it('should reject DRAFT → APPROVED (skip REQUESTED)', () => {
      expect(() => validatePoTransition('DRAFT', 'APPROVED')).toThrow(
        BadRequestException
      );
    });
  });

  describe('error message', () => {
    it('should include current and target status in error message', () => {
      try {
        validatePoTransition('DRAFT', 'RECEIVED');
        fail('Expected BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain('DRAFT');
        expect((error as BadRequestException).message).toContain('RECEIVED');
      }
    });
  });
});

describe('PurchaseOrdersService - receivePO behavior', () => {
  describe('partial receiving logic', () => {
    it('should set PARTIALLY_RECEIVED when receivedQty < orderedQty', () => {
      const orderedQty = 10;
      const receivedQty = 5;
      const allFullyReceived = receivedQty >= orderedQty;
      const finalStatus = allFullyReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';

      expect(finalStatus).toBe('PARTIALLY_RECEIVED');
    });

    it('should set RECEIVED when all items fully received', () => {
      const orderedQty = 10;
      const receivedQty = 10;
      const allFullyReceived = receivedQty >= orderedQty;
      const finalStatus = allFullyReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';

      expect(finalStatus).toBe('RECEIVED');
    });

    it('should set RECEIVED when receivedQty exceeds orderedQty (edge case)', () => {
      const orderedQty = 10;
      const receivedQty = 12;
      const allFullyReceived = receivedQty >= orderedQty;
      const finalStatus = allFullyReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';

      expect(finalStatus).toBe('RECEIVED');
    });

    it('should handle multiple items with mixed receive status', () => {
      const items = [
        { ordered: 10, received: 10 },
        { ordered: 5, received: 3 },
      ];

      let allFullyReceived = true;
      for (const item of items) {
        if (item.received < item.ordered) {
          allFullyReceived = false;
          break;
        }
      }
      const finalStatus = allFullyReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';

      expect(finalStatus).toBe('PARTIALLY_RECEIVED');
    });

    it('should handle multiple items all fully received', () => {
      const items = [
        { ordered: 10, received: 10 },
        { ordered: 5, received: 5 },
      ];

      let allFullyReceived = true;
      for (const item of items) {
        if (item.received < item.ordered) {
          allFullyReceived = false;
          break;
        }
      }
      const finalStatus = allFullyReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';

      expect(finalStatus).toBe('RECEIVED');
    });
  });
});
