import { apiClient } from '@/src/lib/api-client';

export interface DashboardParams {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
}

export const srApi = {
  getAll: (search = '', page = 1, limit = 10, status = 'ALL') =>
    apiClient
      .get('/service-request/dashboard', {
        params: { search, page, limit, status },
      })
      .then((r) => r.data),

  getDetail: (ticketNumber: string) =>
    apiClient.get(`/service-request/${ticketNumber}`).then((r) => r.data),

  updateEntry: (ticketNumber: string, data: Record<string, unknown>) =>
    apiClient
      .patch(`/service-request/${ticketNumber}`, data)
      .then((r) => r.data),

  getDashboardStats: () =>
    apiClient.get('/service-request/stats').then((r) => r.data),

  getActivities: () =>
    apiClient.get('/service-request/activities').then((r) => r.data),

  create: (data: Record<string, unknown>) =>
    apiClient.post('/service-request/entry', data).then((r) => r.data),

  prosesKasir: (ticketNumber: string, paymentData: Record<string, unknown>) =>
    apiClient
      .patch(`/service-request/${ticketNumber}/payment`, paymentData)
      .then((r) => r.data),

  searchSpareParts: (query: string) =>
    apiClient
      .get(`/inventory/parts/search`, { params: { q: query } })
      .then((r) => r.data),

  getLogs: (ticketNumber: string) =>
    apiClient.get(`/service-request/${ticketNumber}/logs`).then((r) => r.data),

  createLog: (ticketNumber: string, data: Record<string, unknown>) =>
    apiClient
      .post(`/service-request/${ticketNumber}/logs`, data)
      .then((r) => r.data),

  diagnose: (
    ticketNumber: string,
    data: {
      newStatus: string;
      problemDescription?: string;
      parts?: { sparePartId: number; quantity: number }[];
      performedBy?: number;
    },
  ) =>
    apiClient
      .post(`/service-request/${ticketNumber}/diagnose`, data)
      .then((r) => r.data),

  approveQuote: (
    ticketNumber: string,
    data: {
      performedBy?: number;
    },
  ) =>
    apiClient
      .post(`/service-request/${ticketNumber}/approve-quote`, data)
      .then((r) => r.data),

  saveQuote: (
    ticketNumber: string,
    data: {
      serviceFee: number;
      performedBy?: number;
    },
  ) =>
    apiClient
      .post(`/service-request/${ticketNumber}/save-quote`, data)
      .then((r) => r.data),

  closeTicket: (ticketNumber: string, data: { performedBy?: number }) =>
    apiClient
      .post(`/service-request/${ticketNumber}/close`, data)
      .then((r) => r.data),

  cancelQuote: (
    ticketNumber: string,
    data: {
      performedBy?: number;
    },
  ) =>
    apiClient
      .post(`/service-request/${ticketNumber}/cancel-quote`, data)
      .then((r) => r.data),

  retryAwaitingParts: (
    ticketNumber: string,
    data: {
      performedBy?: number;
    },
  ) =>
    apiClient
      .post(`/service-request/${ticketNumber}/retry-awaiting-parts`, data)
      .then((r) => r.data),

  createInvoice: async (ticketNumber: string) => {
    const invoice = await apiClient
      .post(`/finance/invoices/from-sr/${ticketNumber}`)
      .then((r) => r.data);
    return invoice;
  },

  payInvoice: async (invoiceId: number, amount: number) => {
    await apiClient.post(`/finance/invoices/${invoiceId}/pay`, {
      amount,
      paymentMethod: 'CASH',
      paidAt: new Date().toISOString(),
    });
  },
};
