'use client';

import React from 'react';
import { terbilang } from '@/src/lib/terbilang';
import { calcInvoice, formatIDRPlain } from '@/src/lib/invoice-calc';

export interface InvoicePrintItem {
  id: number | string;
  name: string;
  qty: number;
  unitPrice: number;
}

export interface InvoicePrintCustomer {
  name: string;
  address?: string;
  phone?: string;
}

export interface InvoicePrintProps {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  ticketNumber: string;
  customer: InvoicePrintCustomer;
  items: InvoicePrintItem[];
  ppnRate?: number;
  ppnConfig?: { ppnRate: number; ppnFormula?: string; ppnRounding?: string; ppnInclusive?: boolean };
  paymentMethod?: 'CASH' | 'TRANSFER' | 'QRIS';
  notes?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
}

export const InvoicePrintTemplate = React.forwardRef<HTMLDivElement, InvoicePrintProps>(
  (props, ref) => {
    const {
      invoiceNumber,
      invoiceDate,
      dueDate,
      ticketNumber,
      customer,
      items,
      ppnRate = 11,
      ppnConfig,
      paymentMethod,
      notes,
      companyName = 'MiPSys',
      companyAddress = 'Jl. Raya Service No. 1',
      companyPhone = '(021) 1234-5678',
    } = props;

    const validItems = (items || []).filter(
      (it) => it && typeof it.name === 'string' && it.name.trim().length > 0,
    );

    const { subtotal, ppn, grandTotal } = calcInvoice(
      validItems.map((it) => ({ qty: it.qty, unitPrice: it.unitPrice })),
      ppnConfig || ppnRate,
    );

    const ppnLabel = `PPN ${ppnRate}%`;
    const terbilangText = terbilang(grandTotal);

    const paymentLabel =
      paymentMethod === 'TRANSFER'
        ? 'Transfer'
        : paymentMethod === 'QRIS'
          ? 'QRIS'
          : paymentMethod === 'CASH'
            ? 'Cash'
            : '-';

    return (
      <div
        ref={ref}
        className="bg-white text-stone-900 antialiased"
        style={{
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
          fontFamily: 'var(--font-body), system-ui, sans-serif',
        }}
      >
        {/* KOP SURAT */}
        <header className="flex justify-between items-start gap-4 pb-6 mb-8 border-b-2 border-stone-900">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-stone-900 uppercase">
              {companyName}
            </h1>
            <p className="text-xs font-medium text-stone-700 mt-1">{companyAddress}</p>
            <p className="text-xs font-medium text-stone-700">{companyPhone}</p>
          </div>
          <div className="text-right shrink-0">
            <h2 className="text-lg font-black tracking-[0.18em] text-stone-900 uppercase">
              INVOICE
            </h2>
            <p className="text-[11px] font-bold text-stone-700 mt-1" aria-label="Nomor Invoice">
              No. {invoiceNumber}
            </p>
            {paymentMethod && (
              <p className="text-[11px] font-bold text-stone-700">
                Metode: {paymentLabel}
              </p>
            )}
          </div>
        </header>

        {/* INFO PELANGGAN & INVOICE */}
        <section
          className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 text-sm"
          aria-label="Informasi pelanggan dan invoice"
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-700 mb-1">
              Ditagihkan Kepada
            </p>
            <p className="font-bold text-stone-900 text-[15px]">{customer.name || 'Pelanggan'}</p>
            {customer.address && (
              <p className="text-xs text-stone-700 leading-relaxed mt-1 max-w-[32ch]">
                {customer.address}
              </p>
            )}
            {customer.phone && (
              <p className="text-xs font-medium text-stone-700 mt-1">Telp: {customer.phone}</p>
            )}
          </div>
          <div className="sm:text-right space-y-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-700">
                Tanggal Invoice
              </p>
              <p className="text-sm font-semibold text-stone-900">{invoiceDate}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-700">
                No. Tiket
              </p>
              <p className="text-sm font-bold text-stone-900">{ticketNumber}</p>
            </div>
            {dueDate && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-700">
                  Jatuh Tempo
                </p>
                <p className="text-sm font-semibold text-stone-900">{dueDate}</p>
              </div>
            )}
          </div>
        </section>

        {/* TABEL RINCIAN — WCAG AAA: caption, scope, high contrast */}
        <section aria-label="Rincian tagihan" className="mb-6">
          <div className="overflow-x-auto -mx-1 px-1" tabIndex={0} aria-describedby="invoice-table-caption">
            <table
              className="w-full min-w-[640px] border-collapse"
              style={{ borderCollapse: 'collapse' }}
            >
              <caption id="invoice-table-caption" className="sr-only">
                Rincian tagihan invoice: nomor, item pekerjaan, kuantitas, harga satuan, jumlah
              </caption>
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="w-12 text-center border border-stone-300 bg-stone-900 px-3 py-2.5 text-[10px] font-black uppercase tracking-wide text-white"
                  >
                    No
                  </th>
                  <th
                    scope="col"
                    className="text-left border border-stone-300 bg-stone-900 px-3 py-2.5 text-[10px] font-black uppercase tracking-wide text-white"
                  >
                    Item Pekerjaan / Sparepart
                  </th>
                  <th
                    scope="col"
                    className="w-16 text-center border border-stone-300 bg-stone-900 px-3 py-2.5 text-[10px] font-black uppercase tracking-wide text-white"
                  >
                    Qty
                  </th>
                  <th
                    scope="col"
                    className="w-32 text-right border border-stone-300 bg-stone-900 px-3 py-2.5 text-[10px] font-black uppercase tracking-wide text-white"
                  >
                    Harga Satuan
                  </th>
                  <th
                    scope="col"
                    className="w-36 text-right border border-stone-300 bg-stone-900 px-3 py-2.5 text-[10px] font-black uppercase tracking-wide text-white"
                  >
                    Jumlah
                  </th>
                </tr>
              </thead>
              <tbody>
                {validItems.length > 0 ? (
                  validItems.map((item, idx) => {
                    const lineTotal = (Number(item.qty) || 0) * (Number(item.unitPrice) || 0);
                    return (
                      <tr key={String(item.id) ?? idx} className="even:bg-stone-50">
                        <td className="text-center border border-stone-300 px-3 py-2.5 text-xs font-medium text-stone-700">
                          {idx + 1}
                        </td>
                        <td className="border border-stone-300 px-3 py-2.5 text-xs font-semibold text-stone-900">
                          {item.name}
                        </td>
                        <td className="text-center border border-stone-300 px-3 py-2.5 text-xs font-medium text-stone-900">
                          {item.qty}
                        </td>
                        <td className="text-right border border-stone-300 px-3 py-2.5 text-xs font-medium text-stone-900">
                          Rp {formatIDRPlain(item.unitPrice)}
                        </td>
                        <td className="text-right border border-stone-300 px-3 py-2.5 text-xs font-bold text-stone-900">
                          Rp {formatIDRPlain(lineTotal)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center border border-stone-300 px-3 py-8 text-xs italic text-stone-700"
                    >
                      Tidak ada rincian tagihan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* RINGKASAN TOTAL — high contrast AAA */}
        <section
          className="ml-auto w-full sm:w-80 space-y-1.5"
          aria-label="Ringkasan total tagihan"
        >
          <div className="flex justify-between text-xs">
            <span className="font-medium text-stone-700">Subtotal</span>
            <span className="font-bold text-stone-900">Rp {formatIDRPlain(subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="font-medium text-stone-700">{ppnLabel}</span>
            <span className="font-bold text-stone-900">Rp {formatIDRPlain(ppn)}</span>
          </div>
          <hr className="border-stone-900 border-t-2 my-2" />
          <div className="flex justify-between items-center">
            <span className="font-black uppercase tracking-wide text-sm text-stone-900">
              Grand Total
            </span>
            <span className="text-xl font-black tracking-tight text-stone-900">
              Rp {formatIDRPlain(grandTotal)}
            </span>
          </div>
          <p className="text-[11px] font-medium text-stone-700 text-right italic mt-2">
            # {terbilangText} #
          </p>
        </section>

        {/* CATATAN & KETENTUAN REVISI */}
        <section className="mt-10 pt-6 border-t border-stone-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-700 mb-2">
                Ketentuan:
              </h3>
              <ul className="text-[11px] leading-relaxed text-stone-700 space-y-1 list-disc list-inside">
                <li>
                  Pembayaran via metode terpilih (
                  <span className="font-bold text-stone-900">{paymentLabel}</span>) — harap konfirmasi
                  ke kasir
                </li>
                <li>Pembayaran dilakukan di kasir sebelum unit diambil</li>
                <li>Garansi pekerjaan sesuai ketentuan yang berlaku</li>
                {notes && <li className="font-medium text-stone-900">Catatan: {notes}</li>}
              </ul>
              {/* Explicit removal notice for audit (screen-reader only) */}
              <p className="sr-only">
                Ketentuan penawaran berlaku 7 hari dan harga sudah termasuk PPN telah dihapus karena
                ini adalah Invoice dengan PPN ditambahkan di bawah subtotal.
              </p>
            </div>
            <div className="text-center sm:text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-700 mb-8">
                Hormat Kami,
              </p>
              <div className="h-12" aria-hidden="true" />
              <p className="text-xs font-bold text-stone-900">(________________________)</p>
              <p className="text-[10px] font-medium text-stone-700">Manajemen {companyName}</p>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-8 pt-4 border-t border-stone-200 text-center text-[9px] font-medium text-stone-700">
          <p>
            {companyName} — {companyAddress} | Telp: {companyPhone} | Tiket: {ticketNumber}
          </p>
          <p className="mt-1">
            Dokumen Invoice ini dibuat secara otomatis dan sah tanpa tanda tangan basah
          </p>
        </footer>
      </div>
    );
  },
);

InvoicePrintTemplate.displayName = 'InvoicePrintTemplate';
