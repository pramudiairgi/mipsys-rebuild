'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Plus,
  Search,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Pencil,
  RefreshCcw,
  Eye,
} from 'lucide-react';
import { useAuth } from '@/src/lib/auth-context';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Card, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { PageHeader } from '@/src/components/ui/page-header';
import { DataTable } from '@/src/components/ui/data-table';
import type { Column } from '@/src/components/ui/data-table';
import { PODetailModal } from '@/src/features/part-order/components/PODetailModal';
import { usePurchaseOrders } from '@/src/features/part-order/hooks/usePurchaseOrder';
import {
  PO_STATUS_LABEL,
  PO_STATUS_BADGE,
} from '@/src/features/part-order/types';
import type { PurchaseOrder, PoStatus } from '@/src/features/part-order/types';

const PENDING_STATUSES: PoStatus[] = ['DRAFT', 'REQUESTED', 'APPROVED', 'ORDERED'];

export default function PartOrderPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { data: orders, isLoading, refetch } = usePurchaseOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PoStatus | 'ALL'>('ALL');
  const [selectedPoId, setSelectedPoId] = useState<number | null>(null);

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter((o) =>
        o.poNumber.toLowerCase().includes(q) ||
        o.supplierName.toLowerCase().includes(q) ||
        o.items?.some((i) => i.partName?.toLowerCase().includes(q)),
      );
    }
    if (statusFilter !== 'ALL') {
      result = result.filter((o) => o.status === statusFilter);
    }
    return result;
  }, [orders, searchTerm, statusFilter]);

  const stats = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((o) => PENDING_STATUSES.includes(o.status)).length,
      completed: orders.filter((o) => o.status === 'RECEIVED').length,
    }),
    [orders],
  );

  const statusFilters = [
    { value: 'ALL' as const, label: 'Semua' },
    ...Object.entries(PO_STATUS_LABEL).map(([key, label]) => ({
      value: key as PoStatus,
      label,
    })),
  ];

  const columns: Column<PurchaseOrder>[] = [
    {
      header: 'No. PO',
      cell: (order) => (
        <span className="font-bold text-[var(--foreground)]">{order.poNumber}</span>
      ),
    },
    {
      header: 'Supplier',
      cell: (order) => (
        <span className="font-bold text-[var(--muted-foreground)]">{order.supplierName}</span>
      ),
    },
    {
      header: 'Item',
      cell: (order) => (
        <span className="text-sm text-[var(--muted-foreground)] font-medium max-w-[200px] truncate block">
          {order.items
            ? order.items
                .map((i) => `${i.partName || `#${i.sparePartId}`} (x${i.quantity})`)
                .join(', ')
            : '-'}
        </span>
      ),
    },
    {
      header: 'Model',
      cell: (order) => (
        <span className="text-sm text-[var(--muted-foreground)] font-medium max-w-[150px] truncate block">
          {order.items
            ? [...new Set(order.items.map((i) => i.modelName).filter(Boolean))].join(', ') || '-'
            : '-'}
        </span>
      ),
    },
    {
      header: 'Status',
      headerClassName: 'text-center',
      cell: (order) => (
        <div className="flex justify-center">
          <Badge
            className={`${PO_STATUS_BADGE[order.status]} border-none font-black text-[9px] px-3 uppercase tracking-tighter shadow-none`}
          >
            {PO_STATUS_LABEL[order.status]}
          </Badge>
        </div>
      ),
    },
    {
      header: 'Total Estimasi',
      headerClassName: 'text-right',
      cell: (order) => (
        <span className="font-bold text-[var(--primary)] tracking-tight block text-right">
          Rp {parseFloat(order.totalAmount || '0').toLocaleString('id-ID')}
        </span>
      ),
    },
    {
      header: 'Aksi',
      headerClassName: 'text-center',
      cell: (order) => (
        <div className="flex items-center justify-center gap-2">
          {isAdmin && order.status === 'DRAFT' && (
            <Link href={`/part-order/new?id=${order.id}`}>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] transition-all"
                aria-label="Edit pesanan"
              >
                <Pencil size={18} aria-hidden="true" />
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedPoId(order.id)}
            className="h-10 w-10 rounded-xl hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            aria-label="Lihat detail pesanan"
          >
            <Eye size={18} aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Part Order Management"
        subtitle="Sistem pengadaan suku cadang dan pemesanan ke supplier."
      >
        <div className="flex gap-2">
          <Button
            onClick={refetch}
            variant="outline"
            className="h-12 w-12 p-0 rounded-2xl"
            aria-label="Muat ulang data"
          >
            <RefreshCcw
              size={18}
              className={isLoading ? 'motion-safe:animate-spin' : ''}
              aria-hidden="true"
            />
          </Button>
          {isAdmin && (
            <Link href="/part-order/new">
              <Button className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] font-black px-6 py-6 rounded-2xl shadow-xl shadow-primary/20 transition-all flex gap-2 uppercase text-xs tracking-widest border-none">
                <Plus size={18} strokeWidth={3} /> Buat Order Baru
              </Button>
            </Link>
          )}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Total Order', value: String(stats.total), icon: <ShoppingBag size={16} className="text-[var(--primary)]" />, subtitle: 'Semua pesanan' },
          { title: 'Pending', value: String(stats.pending).padStart(2, '0'), icon: <Clock size={16} className="text-amber-500" />, subtitle: 'Menunggu Proses' },
          { title: 'Selesai', value: String(stats.completed).padStart(2, '0'), icon: <CheckCircle2 size={16} className="text-emerald-500" />, subtitle: 'Barang Diterima' },
        ].map(({ title, value, icon, subtitle }) => (
          <Card key={title} className="border-none rounded-[2rem] shadow-sm hover:shadow-md transition-all group overflow-hidden bg-[var(--card)]">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-[var(--muted)]/50 rounded-2xl group-hover:bg-[var(--primary)]/10 transition-colors text-[var(--foreground)]" aria-hidden="true">
                  {icon}
                </div>
                <ArrowUpRight size={14} className="text-[var(--muted-foreground)]" aria-hidden="true" />
              </div>
              <div className="mt-2 space-y-0.5">
                <p className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest">{title}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold text-[var(--foreground)]">{value}</h3>
                  <span className="text-[10px] font-bold text-[var(--muted-foreground)]">{subtitle}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-[var(--card)] p-3 rounded-[2rem] border border-border/15 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={18} aria-hidden="true" />
          <Input
            placeholder="Cari nama item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 border-none bg-[var(--muted)]/50 rounded-2xl font-bold focus-visible:ring-1 focus-visible:ring-primary text-[var(--foreground)]"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statusFilters.map(({ value, label }) => (
            <Button
              key={value}
              variant={statusFilter === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(value)}
              className="rounded-2xl text-xs font-black tracking-wider"
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredOrders}
        keyExtractor={(order) => order.id}
        isLoading={isLoading}
        headerTitle={<><ShoppingBag size={16} aria-hidden="true" /> Daftar Pesanan Suku Cadang</>}
        footer={
          <p className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest italic">
            Menampilkan {filteredOrders.length} dari {orders.length} pesanan
          </p>
        }
        onRowClick={(order) => setSelectedPoId(order.id)}
      />

      {selectedPoId && (
        <PODetailModal poId={selectedPoId} onClose={() => setSelectedPoId(null)} onRefresh={refetch} />
      )}
    </div>
  );
}
