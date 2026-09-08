'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  TrendingUp,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Ban,
  Eye,
} from 'lucide-react';
import { PageHeader } from '@/src/components/ui/page-header';
import { SearchBar } from '@/src/components/ui/search-bar';
import { DataTable } from '@/src/components/ui/data-table';
import type { Column } from '@/src/components/ui/data-table';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { PaymentForm } from './components/PaymentForm';
import { useInvoices, useFinanceStats } from './hooks/useFinance';
import { financeApi } from './api/finance-api';
import { Invoice, PaymentHistory } from './types';
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/src/lib/auth-context';

const statusStyles: Record<string, string> = {
  PAID: 'bg-[var(--accent)]/15 text-[var(--accent)] border-accent/30',
  UNPAID: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  OVERDUE: 'bg-[var(--destructive)]/10 text-[var(--destructive)] border-destructive/30',
  VOID: 'bg-[var(--muted)] text-[var(--muted-foreground)] border-border',
};

export default function FinancePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const searchParams = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const { data: invoices, isLoading, refetch } = useInvoices(search);
  const { stats, refetch: refetchStats } = useFinanceStats();
  const [selectedInvoice, setSelectedInvoice] = useState<
    (Invoice & { payments?: PaymentHistory[] }) | null
  >(null);
  const [showPayInvoiceId, setShowPayInvoiceId] = useState<number | null>(null);
  const [payInvoiceTotal, setPayInvoiceTotal] = useState(0);
  const [showVoidConfirm, setShowVoidConfirm] = useState(false);
  const [voidTarget, setVoidTarget] = useState<Invoice | null>(null);
  const [isVoiding, setIsVoiding] = useState(false);

  const filtered = invoices.filter(
    (inv) =>
      inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      inv.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      inv.ticketNumber?.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleView(invoice: Invoice) {
    try {
      const detail = await financeApi.getById(invoice.id);
      setSelectedInvoice(detail);
    } catch {
      toast.error('Gagal memuat detail invoice');
    }
  }

  function handlePay(invoice: Invoice) {
    setShowPayInvoiceId(invoice.id);
    setPayInvoiceTotal(parseFloat(invoice.total || '0'));
  }

  async function handleVoid() {
    if (!voidTarget) return;
    setIsVoiding(true);
    try {
      await financeApi.voidInvoice(voidTarget.id);
      toast.success('Invoice berhasil di-void');
      refetch();
      refetchStats();
    } catch {
      toast.error('Gagal void invoice');
    } finally {
      setIsVoiding(false);
      setShowVoidConfirm(false);
      setVoidTarget(null);
    }
  }

  const columns: Column<Invoice>[] = [
    {
      header: 'No. Invoice',
      cell: (inv) => (
        <span className="font-mono text-xs font-black text-[var(--foreground)]">
          {inv.invoiceNumber}
        </span>
      ),
    },
    {
      header: 'Klien',
      cell: (inv) => (
        <span className="text-xs font-black text-[var(--foreground)]">
          {inv.clientName}
        </span>
      ),
    },
    {
      header: 'Tiket',
      cell: (inv) => (
        <span className="text-xs font-bold text-[var(--muted-foreground)]">
          {inv.ticketNumber}
        </span>
      ),
    },
    {
      header: 'Total',
      headerClassName: 'text-right',
      cell: (inv) => (
        <span className="text-xs font-black text-[var(--foreground)] block text-right">
          Rp {parseFloat(inv.total || '0').toLocaleString('id-ID')}
        </span>
      ),
    },
    {
      header: 'Status',
      headerClassName: 'text-center',
      cell: (inv) => (
        <div className="flex justify-center">
          <span
            className={`px-2.5 py-1 rounded-md text-[10px] font-black border-2 uppercase ${statusStyles[inv.status] || ''}`}
          >
            {inv.status}
          </span>
        </div>
      ),
    },
    {
      header: 'Aksi',
      headerClassName: 'text-center',
      cell: (inv) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleView(inv)}
            className="h-8 w-8 rounded-lg text-[var(--primary)] hover:bg-[var(--primary)]/10"
            aria-label="Lihat detail invoice"
          >
            <Eye size={16} aria-hidden="true" />
          </Button>
          {isAdmin && inv.status === 'UNPAID' && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handlePay(inv)}
                className="h-8 w-8 rounded-lg text-[var(--accent)] hover:bg-[var(--accent)]/10"
                aria-label="Catat pembayaran"
              >
                <CheckCircle size={16} aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setVoidTarget(inv);
                  setShowVoidConfirm(true);
                }}
                className="h-8 w-8 rounded-lg text-[var(--destructive)] hover:bg-[var(--destructive)]/10"
                aria-label="Void invoice"
              >
                <Ban size={16} aria-hidden="true" />
              </Button>
            </>
          )}
          {inv.status === 'PAID' && (
            <Button
              variant="ghost"
              size="icon"
              disabled
              className="h-8 w-8 rounded-lg text-[var(--muted-foreground)]/30 cursor-not-allowed"
              aria-label="Sudah dibayar"
            >
              <CheckCircle size={16} aria-hidden="true" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Finance & Billing"
        subtitle="Monitor pendapatan dan status penagihan secara real-time."
      />

      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="border-none rounded-[2rem] shadow-sm">
          <CardContent className="p-4">
            <div className="p-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl w-fit mb-2">
              <TrendingUp size={16} />
            </div>
            <p className="micro-label text-[var(--muted-foreground)]">
              Total Pendapatan
            </p>
            <h3 className="text-2xl font-black text-[var(--foreground)] tracking-tighter">
              Rp {stats.totalRevenue.toLocaleString('id-ID')}
            </h3>
          </CardContent>
        </Card>
        <Card className="border-none rounded-[2rem] shadow-sm">
          <CardContent className="p-4">
            <div className="p-2 bg-[var(--accent)]/10 text-[var(--accent)] rounded-xl w-fit mb-2">
              <CreditCard size={16} />
            </div>
            <p className="micro-label text-[var(--muted-foreground)]">
              Menunggu Pembayaran
            </p>
            <h3 className="text-2xl font-black text-[var(--foreground)] tracking-tighter">
              Rp {stats.outstanding.toLocaleString('id-ID')}
            </h3>
          </CardContent>
        </Card>
        <Card className="border-none rounded-[2rem] shadow-sm">
          <CardContent className="p-4">
            <div className="p-2 bg-[var(--destructive)]/10 text-[var(--destructive)] rounded-xl w-fit mb-2">
              <AlertCircle size={16} />
            </div>
            <p className="micro-label text-[var(--muted-foreground)]">Tagihan Overdue</p>
            <h3 className="text-2xl font-black text-[var(--foreground)] tracking-tighter">
              {stats.overdueCount}
            </h3>
          </CardContent>
        </Card>
      </section>

      <div className="flex flex-col md:flex-row gap-4">
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            router.replace(v ? `/finance?search=${encodeURIComponent(v)}` : '/finance');
          }}
          placeholder="Cari No. Invoice atau Nama Klien..."
        />
        <Button
          onClick={() => refetch()}
          variant="outline"
          className="h-12 px-6 rounded-2xl gap-2 text-xs font-black uppercase tracking-wider shrink-0"
        >
          Perbarui
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(inv) => inv.id}
        isLoading={isLoading}
      />

      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {showPayInvoiceId && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
          onClick={() => setShowPayInvoiceId(null)}
        >
          <div
            className="bg-[var(--card)] rounded-[2.5rem] p-6 max-w-md w-full mx-4 shadow-2xl border border-border/30 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-black text-lg text-[var(--foreground)] mb-4">
              Catat Pembayaran
            </h3>
            <PaymentForm
              invoiceId={showPayInvoiceId}
              invoiceTotal={payInvoiceTotal}
              onSuccess={() => {
                setShowPayInvoiceId(null);
                refetch();
                refetchStats();
              }}
              onCancel={() => setShowPayInvoiceId(null)}
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showVoidConfirm}
        onOpenChange={(open) => {
          setShowVoidConfirm(open);
          if (!open) setVoidTarget(null);
        }}
        title="Void Invoice?"
        description="Invoice yang di-void tidak bisa dikembalikan. Lanjutkan?"
        confirmLabel="Ya, Void"
        variant="destructive"
        loading={isVoiding}
        onConfirm={handleVoid}
      />
    </div>
  );
}
