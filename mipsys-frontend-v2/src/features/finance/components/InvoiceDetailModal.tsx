'use client';
import React from 'react';
import { X } from 'lucide-react';
import { Invoice, PaymentHistory } from '../types';
import { ExportButton } from '../reports/ExportButton';

interface Props {
  invoice: Invoice & { payments?: PaymentHistory[] };
  onClose: () => void;
}

export function InvoiceDetailModal({ invoice, onClose }: Props) {
  const totalPaid = (invoice.payments || []).reduce((s, p) => s + p.amount, 0);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[var(--card)] rounded-2xl p-6 max-w-lg w-full mx-4 shadow-xl border border-border/30 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black text-lg text-[var(--foreground)]">
            {invoice.invoiceNumber}
          </h3>
          <div className="flex items-center gap-2">
            <ExportButton invoiceId={invoice.id} />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50 transition-all"
              aria-label="Tutup detail"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="space-y-2 text-sm text-[var(--foreground)]/80">
          <p>
            <span className="font-bold text-[var(--foreground)]">Tiket:</span>{' '}
            {invoice.ticketNumber}
          </p>
          <p>
            <span className="font-bold text-[var(--foreground)]">Klien:</span>{' '}
            {invoice.clientName}
          </p>
          <p>
            <span className="font-bold text-[var(--foreground)]">Status:</span>{' '}
            <span
              className={`font-bold ${invoice.status === 'PAID' ? 'text-[var(--accent)]' : invoice.status === 'VOID' ? 'text-[var(--destructive)]' : 'text-[var(--muted-foreground)]'}`}
            >
              {invoice.status}
            </span>
          </p>
          <p>
            <span className="font-bold text-[var(--foreground)]">Total:</span>{' '}
            Rp {parseFloat(invoice.total || '0').toLocaleString('id-ID')}
          </p>
          <p>
            <span className="font-bold text-[var(--foreground)]">PPN:</span> Rp{' '}
            {parseFloat(invoice.ppn || '0').toLocaleString('id-ID')} (
            {invoice.ppnRate || 11}%)
          </p>
          <p>
            <span className="font-bold text-[var(--foreground)]">
              Service Fee:
            </span>{' '}
            Rp {parseFloat(invoice.serviceFee || '0').toLocaleString('id-ID')}
          </p>
          <p>
            <span className="font-bold text-[var(--foreground)]">
              Part Fee:
            </span>{' '}
            Rp {parseFloat(invoice.partFee || '0').toLocaleString('id-ID')}
          </p>
          <p>
            <span className="font-bold text-[var(--foreground)]">Tanggal:</span>{' '}
            {invoice.invoiceDate}
          </p>
          {invoice.paidDate && (
            <p>
              <span className="font-bold text-[var(--foreground)]">Lunas:</span>{' '}
              {invoice.paidDate}
            </p>
          )}
        </div>
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="mt-4 border-t border-border pt-4">
            <h4 className="font-bold text-sm mb-2 text-[var(--foreground)]">
              Riwayat Pembayaran
            </h4>
            <div className="space-y-1">
              {invoice.payments.map((p) => (
                <div
                  key={p.id}
                  className="flex justify-between text-xs bg-[var(--muted)]/30 p-2 rounded-lg"
                >
                  <span>
                    {p.paymentMethod}{' '}
                    {p.referenceNumber && `(${p.referenceNumber})`}
                  </span>
                  <span className="font-bold">
                    Rp {p.amount.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
