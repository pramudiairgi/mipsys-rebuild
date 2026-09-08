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

export interface PpnConfig {
  ppnRate: number;
  ppnFormula?: string;
  ppnRounding?: string;
  ppnInclusive?: boolean;
}

export function calcInvoice(
  items: InvoiceCalcItem[],
  ppnRateOrConfig: number | PpnConfig = 11,
): InvoiceCalcResult {
  const subtotal = items.reduce((sum, item) => {
    const qty = Number(item.qty) || 0;
    const price = Number(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  const cfg: PpnConfig = typeof ppnRateOrConfig === 'number' ? { ppnRate: ppnRateOrConfig } : ppnRateOrConfig;
  const rate = Number(cfg.ppnRate ?? 11);
  const formula = cfg.ppnFormula || 'EXCLUSIVE';
  const rounding = cfg.ppnRounding || 'HALF_UP';
  const inclusive = cfg.ppnInclusive ?? formula === 'INCLUSIVE';

  let ppn: number;
  let grandTotal: number;
  if (inclusive) {
    grandTotal = subtotal;
    ppn = grandTotal * rate / (100 + rate);
    if (rounding !== 'NONE') ppn = Number(ppn.toFixed(2));
    grandTotal = Number(grandTotal.toFixed(2));
  } else {
    ppn = (subtotal * rate) / 100;
    grandTotal = subtotal + ppn;
    if (rounding !== 'NONE') {
      ppn = Number(ppn.toFixed(2));
      grandTotal = Number(grandTotal.toFixed(2));
    }
    ppn = Math.round(ppn);
    grandTotal = Math.round(grandTotal);
    if (rounding === 'NONE') {
      ppn = (subtotal * rate) / 100;
      grandTotal = subtotal + ppn;
    }
  }
  if (rounding === 'HALF_UP' && !inclusive) {
    ppn = Math.round((subtotal * rate) / 100);
    grandTotal = subtotal + ppn;
  }

  return { subtotal, ppn, grandTotal, ppnRate: rate };
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
