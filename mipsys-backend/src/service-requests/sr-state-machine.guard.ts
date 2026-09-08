import { BadRequestException } from '@nestjs/common';

export type SrStatusType =
  | 'WAITING_CHECK'
  | 'CHECK'
  | 'WAITING_APPROVE'
  | 'AWAITING_PARTS'
  | 'SERVICE'
  | 'DONE'
  | 'CANCEL'
  | 'CLOSED';

export const VALID_SR_TRANSITIONS: Record<SrStatusType, SrStatusType[]> = {
  WAITING_CHECK: ['CHECK', 'WAITING_APPROVE', 'CANCEL'],
  CHECK: ['WAITING_APPROVE', 'CANCEL'],
  WAITING_APPROVE: ['WAITING_APPROVE', 'SERVICE', 'AWAITING_PARTS', 'CANCEL'],
  AWAITING_PARTS: ['SERVICE', 'CANCEL'],
  SERVICE: ['DONE', 'CANCEL'],
  DONE: ['CLOSED'],
  CANCEL: ['CLOSED'],
  CLOSED: [],
};

export function validateSrTransition(
  currentStatus: SrStatusType,
  newStatus: SrStatusType
) {
  const allowed = VALID_SR_TRANSITIONS[currentStatus] ?? [];
  if (!allowed.includes(newStatus)) {
    throw new BadRequestException(
      `Transisi status dari ${currentStatus} ke ${newStatus} tidak diizinkan.`
    );
  }
}
