/**
 * Kalkulasi Invoice — sistematis, presisi, testable
 * Subtotal = sum(qty * unitPrice)
 * PPN      = Math.round(subtotal * ppnRate / 100)
 * Grand    = subtotal + ppn
 * Hindari subtotal*1.11 floating error.
 */

export interface InvoiceCalcItem {
  qty: number;
  unitPrice: number;
}

export interface InvoiceCalcResult {
  subtotal: number;
  ppn: number;
  grandTotal: number;
  ppnRate: number;
}

export function calcInvoice(
  items: InvoiceCalcItem[],
  ppnRate: number = 11,
): InvoiceCalcResult {
  const subtotal = items.reduce((sum, item) => {
    const qty = Number(item.qty) || 0;
    const price = Number(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  const ppn = Math.round((subtotal * ppnRate) / 100);
  const grandTotal = subtotal + ppn;

  return { subtotal, ppn, grandTotal, ppnRate };
}

export function formatIDR(amount: number | string): string {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(n)) return 'Rp 0';
  return `Rp ${Math.round(n).toLocaleString('id-ID')}`;
}

export function formatIDRPlain(amount: number | string): string {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(n)) return '0';
  return Math.round(n).toLocaleString('id-ID');
}
