export interface Invoice {
  id: number;
  invoiceNumber: string;
  ticketNumber: string;
  clientName: string;
  serviceFee: string;
  partFee: string;
  ppn: string;
  ppnRate: string;
  total: string;
  status: 'PAID' | 'UNPAID' | 'OVERDUE' | 'VOID';
  paymentMethod?: 'CASH' | 'TRANSFER' | 'QRIS';
  invoiceDate: string;
  paidDate?: string;
  notes?: string;
  voidedAt?: string;
  createdAt: string;
  payments?: PaymentHistory[];
}

export interface PaymentHistory {
  id: number;
  invoiceId: number;
  amount: number;
  paymentMethod: 'CASH' | 'TRANSFER' | 'QRIS';
  paidAt: string;
  referenceNumber?: string;
  notes?: string;
}

export interface FinanceStats {
  totalRevenue: number;
  outstanding: number;
  paidCount: number;
  unpaidCount: number;
  overdueCount: number;
  voidCount: number;
  totalInvoices: number;
}

export interface Expense {
  id: number;
  expenseNumber: string;
  expenseType: 'PO' | 'OPERATIONAL';
  poId?: number;
  description: string;
  amount: number;
  expenseDate: string;
  category: 'UTILITY' | 'RENT' | 'SALARY' | 'TRANSPORT' | 'OTHER';
  createdBy?: number;
  createdAt: string;
}

export interface ProfitLoss {
  period: { startDate: string; endDate: string };
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  revenueCount: number;
  expenseCount: number;
}

export interface PpnReport {
  period: string;
  totalInvoices: number;
  totalDpp: number;
  totalPpn: number;
  ppnRate: string;
}

export interface DashboardData {
  monthly: Array<{
    label: string;
    revenue: number;
    expense: number;
    profit: number;
  }>;
}
