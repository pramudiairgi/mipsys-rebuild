import {
  validateSrTransition,
  SrStatusType,
} from '../src/service-requests/sr-state-machine.guard';
import { BadRequestException } from '@nestjs/common';

describe('SR State Machine', () => {
  describe('valid transitions', () => {
    it('should allow WAITING_CHECK -> CHECK', () => {
      expect(() =>
        validateSrTransition('WAITING_CHECK', 'CHECK')
      ).not.toThrow();
    });

    it('should allow CHECK -> WAITING_APPROVE', () => {
      expect(() =>
        validateSrTransition('CHECK', 'WAITING_APPROVE')
      ).not.toThrow();
    });

    it('should allow WAITING_APPROVE -> SERVICE', () => {
      expect(() =>
        validateSrTransition('WAITING_APPROVE', 'SERVICE')
      ).not.toThrow();
    });

    it('should allow SERVICE -> DONE', () => {
      expect(() => validateSrTransition('SERVICE', 'DONE')).not.toThrow();
    });

    it('should allow any -> CANCEL', () => {
      ['WAITING_CHECK', 'CHECK', 'WAITING_APPROVE', 'SERVICE'].forEach(
        (status) => {
          expect(() =>
            validateSrTransition(status as SrStatusType, 'CANCEL')
          ).not.toThrow();
        }
      );
    });
  });

  describe('invalid transitions', () => {
    it('should reject WAITING_CHECK -> SERVICE (skip check)', () => {
      expect(() => validateSrTransition('WAITING_CHECK', 'SERVICE')).toThrow(
        BadRequestException
      );
    });

    it('should reject CHECK -> DONE (skip approval + service)', () => {
      expect(() => validateSrTransition('CHECK', 'DONE')).toThrow(
        BadRequestException
      );
    });

    it('should reject DONE -> any (terminal)', () => {
      ['WAITING_CHECK', 'CHECK', 'SERVICE'].forEach((status) => {
        expect(() =>
          validateSrTransition('DONE', status as SrStatusType)
        ).toThrow(BadRequestException);
      });
    });

    it('should reject CANCEL -> any (terminal)', () => {
      expect(() => validateSrTransition('CANCEL', 'WAITING_CHECK')).toThrow(
        BadRequestException
      );
    });
  });
});
