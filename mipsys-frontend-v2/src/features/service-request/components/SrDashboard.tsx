'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, ExternalLink, ArrowLeft, ArrowRight } from 'lucide-react';
import { srApi } from '../api/sr-api';
import { SrFilterBar } from './SrFilterBar';
import { SrExportButton } from './SrExportButton';
import { EmptyState } from '@/src/components/ui/empty-state';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { DataTable } from '@/src/components/ui/data-table';
import { PageHeader } from '@/src/components/ui/page-header';

interface ServiceRequest {
  id: number;
  ticketNumber: string;
  statusService: string;
  statusSystem: string;
  incomingDate: string;
  customerName: string;
  customerPhone?: string;
  modelName?: string;
  serialNumber?: string;
  serviceType?: string;
}

interface StatusConfig {
  label: string;
  variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'ghost';
  className: string;
}

const statusConfig: Record<string, StatusConfig> = {
  WAITING_CHECK:   { label: 'Pending',          variant: 'outline', className: 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30' },
  CHECK:           { label: 'Check',            variant: 'outline', className: 'bg-violet-500/10 text-violet-400 border-violet-500/30' },
  WAITING_APPROVE: { label: 'Menunggu Approve', variant: 'outline', className: 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30' },
  SERVICE:         { label: 'In Service',       variant: 'outline', className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
  AWAITING_PARTS:  { label: 'Menunggu Part',    variant: 'outline', className: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  DONE:            { label: 'Ready',            variant: 'outline', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  CLOSED:          { label: 'Closed',           variant: 'outline', className: 'bg-slate-500/10 text-slate-400 border-slate-500/30' },
  CANCEL:          { label: 'Cancelled',        variant: 'outline', className: 'bg-[var(--destructive)]/10 text-[var(--destructive)] border-[var(--destructive)]/30' },
  CANCELLED:       { label: 'Cancelled',        variant: 'outline', className: 'bg-[var(--destructive)]/10 text-[var(--destructive)] border-[var(--destructive)]/30' },
};

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

const columns = [
  {
    header: 'No. SR',
    cell: (sr: ServiceRequest) => (
      <span className="font-bold text-[var(--foreground)] font-mono text-sm">{sr.ticketNumber}</span>
    ),
  },
  {
    header: 'Pelanggan',
    cell: (sr: ServiceRequest) => (
      <span className="font-medium text-[var(--foreground)]/80">{sr.customerName}</span>
    ),
  },
  {
    header: 'Model',
    cell: (sr: ServiceRequest) => (
      <span className="text-[var(--muted-foreground)]">{sr.modelName}</span>
    ),
  },
  {
    header: 'Serial',
    cell: (sr: ServiceRequest) => (
      <Badge variant="outline" className="font-mono text-[9px] font-black bg-[var(--primary)]/10 text-[var(--primary)] border-none">
        {sr.serialNumber || '-'}
      </Badge>
    ),
  },
  {
    header: 'Status',
    headerClassName: 'text-center',
    cell: (sr: ServiceRequest) => {
      const cfg = statusConfig[sr.statusService];
      if (!cfg) {
        return (
          <div className="flex justify-center">
            <Badge variant="secondary">{sr.statusService}</Badge>
          </div>
        );
      }
      return (
        <div className="flex justify-center">
          <Badge variant={cfg.variant} className={cfg.className}>{cfg.label}</Badge>
        </div>
      );
    },
  },
  {
    header: 'Tanggal',
    cell: (sr: ServiceRequest) => (
      <span className="text-xs text-[var(--muted-foreground)] font-mono">{formatDate(sr.incomingDate)}</span>
    ),
  },
  {
    header: 'Aksi',
    headerClassName: 'text-right',
    cell: (sr: ServiceRequest) => (
      <div className="flex justify-end">
        <Link href={`/service-request/${sr.ticketNumber}`}>
          <Button variant="outline" size="sm" className="gap-2">
            Detail <ExternalLink size={12} aria-hidden="true" />
          </Button>
        </Link>
      </div>
    ),
  },
];

export function SrDashboard() {
  const [data, setData] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const result = await srApi.getAll(searchTerm, page, limit, activeFilter);
      setData(Array.isArray(result) ? result : result.data || []);
    } catch (error) {
      console.error('Gagal fetch data SR:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, searchTerm, activeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchTerm(searchInput);
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setPage(1);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Service Request"
        subtitle="Daftar seluruh tiket permintaan servis di sistem MiPSys."
      >
        <SrExportButton search={searchTerm} status={activeFilter} />
      </PageHeader>

      <SrFilterBar
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onSearch={handleSearch}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
      />

      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(sr) => sr.id}
        isLoading={isLoading}
        loadingContent={
          <div className="flex justify-center py-32">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 motion-safe:animate-spin text-[var(--primary)]/40" aria-hidden="true" />
              <p className="micro-label text-[var(--muted-foreground)] animate-pulse">Memuat data…</p>
            </div>
          </div>
        }
        emptyContent={
          <div className="py-24">
            <EmptyState
              title="Belum ada tiket servis"
              description="Tambahkan permintaan service pertama Anda untuk memulai."
              actionLabel="Buat Permintaan Baru"
              onAction={() => {}}
            />
          </div>
        }
        footer={
          <div className="flex items-center justify-between px-2 w-full">
            <p className="micro-label text-[var(--muted-foreground)]">
              Menampilkan <span className="text-[var(--foreground)]">{data.length}</span> catatan
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
                className="gap-2"
              >
                <ArrowLeft size={14} aria-hidden="true" /> Kembali
              </Button>
              <div className="h-9 w-9 flex items-center justify-center bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl text-xs font-black shadow-lg">
                {page}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={data.length < limit || isLoading}
                className="gap-2"
              >
                Lanjut <ArrowRight size={14} aria-hidden="true" />
              </Button>
            </div>
          </div>
        }
      />
    </div>
  );
}
