import { apiClient } from '@/src/lib/api-client';
import {
  Invoice,
  FinanceStats,
  Expense,
  ProfitLoss,
  PpnReport,
  DashboardData,
} from '../types';

export const financeApi = {
  // --- Invoices ---
  getAll: async (search = '', status = '') => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (status) params.status = status;
    const response = await apiClient.get('/finance/invoices', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Invoice & { payments?: any[] }> => {
    const response = await apiClient.get(`/finance/invoices/${id}`);
    return response.data;
  },

  createInvoice: async (data: {
    ticketNumber: string;
    clientName: string;
    serviceFee: number;
    partFee: number;
    paymentMethod?: string;
    notes?: string;
  }) => {
    const response = await apiClient.post('/finance/invoices', data);
    return response.data;
  },

  recordPayment: async (
    id: number,
    data: {
      amount: number;
      paymentMethod: string;
      referenceNumber?: string;
      notes?: string;
    },
  ) => {
    const response = await apiClient.post(`/finance/invoices/${id}/pay`, data);
    return response.data;
  },

  voidInvoice: async (id: number) => {
    const response = await apiClient.patch(`/finance/invoices/${id}/void`);
    return response.data;
  },

  getStats: async (): Promise<FinanceStats> => {
    const response = await apiClient.get('/finance/stats');
    return response.data;
  },

  generateFromSR: async (ticketNumber: string) => {
    const response = await apiClient.post(
      `/finance/invoices/from-sr/${ticketNumber}`,
    );
    return response.data;
  },

  // --- Expenses ---
  getExpenses: async (params?: {
    type?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await apiClient.get('/finance/expenses', { params });
    return response.data;
  },

  createExpense: async (data: {
    description: string;
    amount: number;
    expenseDate: string;
    category?: string;
  }) => {
    const response = await apiClient.post('/finance/expenses', data);
    return response.data;
  },

  updateExpense: async (
    id: number,
    data: Partial<{
      description: string;
      amount: number;
      expenseDate: string;
      category: string;
    }>,
  ) => {
    const response = await apiClient.patch(`/finance/expenses/${id}`, data);
    return response.data;
  },

  deleteExpense: async (id: number) => {
    const response = await apiClient.delete(`/finance/expenses/${id}`);
    return response.data;
  },

  syncPoExpenses: async (poId?: number) => {
    const response = await apiClient.post('/finance/expenses/sync-po', null, {
      params: { poId },
    });
    return response.data;
  },

  // --- Reports ---
  getProfitLoss: async (
    startDate: string,
    endDate: string,
  ): Promise<ProfitLoss> => {
    const response = await apiClient.get('/finance/reports/profit-loss', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  getPpnReport: async (year: number, month: number): Promise<PpnReport> => {
    const response = await apiClient.get('/finance/reports/tax/ppn', {
      params: { year, month },
    });
    return response.data;
  },

  getDashboard: async (): Promise<DashboardData> => {
    const response = await apiClient.get('/finance/dashboard');
    return response.data;
  },

  // --- Settings ---
  getSettings: async (): Promise<Record<string, string>> => {
    const response = await apiClient.get('/finance/settings');
    return response.data;
  },

  updatePpnRate: async (ppnRate: number) => {
    const response = await apiClient.patch('/finance/settings/ppn-rate', {
      ppnRate,
    });
    return response.data;
  },

  updateInvoicePrefix: async (invoicePrefix: string) => {
    const response = await apiClient.patch('/finance/settings/invoice-prefix', {
      invoicePrefix,
    });
    return response.data;
  },

  // --- Export ---
  exportInvoiceXlsx: async (id: number) => {
    const response = await apiClient.get(
      `/finance/invoices/${id}/export/xlsx`,
      { responseType: 'blob' },
    );
    return response.data;
  },

  exportInvoicePdf: async (id: number) => {
    const response = await apiClient.get(`/finance/invoices/${id}/export/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
