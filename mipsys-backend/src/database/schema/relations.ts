import { relations } from 'drizzle-orm';
import {
  serviceRequests,
  customers,
  products,
  staff,
} from './service-request.schema';
import { orderParts, spareParts } from './spare-part.schema';
import { categoryModels } from './category-model.schema';
import { purchaseOrders } from './purchase-order.schema';
import { poItems } from './po-items.schema';
import { stockMovements } from './stock-movement.schema';
import { paymentHistories } from './payment-history.schema';
import { expenses } from './expense.schema';
import { invoices } from './invoice.schema';

export const serviceRequestsRelations = relations(
  serviceRequests,
  ({ one, many }) => ({
    customer: one(customers, {
      fields: [serviceRequests.customerId],
      references: [customers.id],
    }),
    product: one(products, {
      fields: [serviceRequests.productId],
      references: [products.id],
    }),
    admin: one(staff, {
      fields: [serviceRequests.adminId],
      references: [staff.id],
      relationName: 'admin',
    }),
    technicianCheck: one(staff, {
      fields: [serviceRequests.technicianCheckId],
      references: [staff.id],
      relationName: 'technician',
    }),
    orderParts: many(orderParts),
  })
);

export const orderPartsRelations = relations(orderParts, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [orderParts.serviceRequestId],
    references: [serviceRequests.id],
  }),
  sparePart: one(spareParts, {
    fields: [orderParts.sparePartId],
    references: [spareParts.id],
  }),
}));

export const purchaseOrdersRelations = relations(
  purchaseOrders,
  ({ one, many }) => ({
    items: many(poItems),
    expenses: many(expenses),
    requestedByStaff: one(staff, {
      fields: [purchaseOrders.requestedBy],
      references: [staff.id],
      relationName: 'requestedBy',
    }),
    approvedByStaff: one(staff, {
      fields: [purchaseOrders.approvedBy],
      references: [staff.id],
      relationName: 'approvedBy',
    }),
  })
);

export const poItemsRelations = relations(poItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [poItems.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  sparePart: one(spareParts, {
    fields: [poItems.sparePartId],
    references: [spareParts.id],
  }),
}));

export const sparePartsRelations = relations(spareParts, ({ one, many }) => ({
  orderParts: many(orderParts),
  purchaseOrders: many(purchaseOrders),
  poItems: many(poItems),
  stockMovements: many(stockMovements),
  categoryModel: one(categoryModels, {
    fields: [spareParts.categoryModelId],
    references: [categoryModels.id],
  }),
}));

export const productsRelations = relations(products, ({ one }) => ({
  categoryModel: one(categoryModels, {
    fields: [products.categoryModelId],
    references: [categoryModels.id],
  }),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  sparePart: one(spareParts, {
    fields: [stockMovements.sparePartId],
    references: [spareParts.id],
  }),
  performedByStaff: one(staff, {
    fields: [stockMovements.performedBy],
    references: [staff.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  payments: many(paymentHistories),
  serviceRequest: one(serviceRequests, {
    fields: [invoices.serviceRequestId],
    references: [serviceRequests.id],
  }),
}));

export const paymentHistoriesRelations = relations(
  paymentHistories,
  ({ one }) => ({
    invoice: one(invoices, {
      fields: [paymentHistories.invoiceId],
      references: [invoices.id],
    }),
  })
);

export const expensesRelations = relations(expenses, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [expenses.poId],
    references: [purchaseOrders.id],
  }),
  createdByStaff: one(staff, {
    fields: [expenses.createdBy],
    references: [staff.id],
  }),
}));
