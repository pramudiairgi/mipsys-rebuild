import { pgEnum } from 'drizzle-orm/pg-core';

export const serviceStatusEnum = pgEnum('service_status', [
  'WAITING_CHECK',
  'CHECK',
  'WAITING_APPROVE',
  'AWAITING_PARTS',
  'SERVICE',
  'DONE',
  'CANCEL',
  'CLOSED',
]);

export const poStatusEnum = pgEnum('po_status', [
  'DRAFT',
  'REQUESTED',
  'APPROVED',
  'ORDERED',
  'SHIPPED',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
  'CANCELLED',
]);

export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'TECHNICIAN']);
export const serviceTypeEnum = pgEnum('service_type', [
  'WARRANTY',
  'NON_WARRANTY',
]);
export const staffRoleEnum = pgEnum('staff_role', ['ADMIN', 'TECHNICIAN']);

export const movementTypeEnum = pgEnum('movement_type', [
  'PO_RECEIVE',
  'SERVICE_USE',
  'ADJUSTMENT',
  'SERVICE_RETURN',
]);

export const invoiceStatusEnum = pgEnum('invoice_status', [
  'PAID',
  'UNPAID',
  'OVERDUE',
  'VOID',
]);
export const paymentMethodEnum = pgEnum('payment_method', [
  'CASH',
  'TRANSFER',
  'QRIS',
]);
export const expenseTypeEnum = pgEnum('expense_type', ['PO', 'OPERATIONAL']);

export const expenseCategoryEnum = pgEnum('expense_category', [
  'UTILITY',
  'RENT',
  'SALARY',
  'TRANSPORT',
  'OTHER',
]);

export const orderPartStatusEnum = pgEnum('order_part_status', [
  'IN_STOCK',
  'OUT_OF_STOCK',
  'MANUAL_NEW',
  'CANCELLED',
  'PROPOSED',
]);
