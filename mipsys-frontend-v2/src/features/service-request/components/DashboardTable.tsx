'use client';

import { useEffect, useState } from 'react';
import { srApi } from '../services/sr-api';
import { ServiceRequest } from '../types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Search, Loader2, ExternalLink } from 'lucide-react';

// HELPER: Logika Status Badge (Visual Mapping)
const getStatusConfig = (statusService: string, statusSystem: string) => {
  // 1. Jika sistem sudah ditutup (CLOSED)
  if (statusSystem === 'CLOSED') {
    return {
      label: 'Selesai',
      variant: 'secondary' as const,
      className: 'opacity-60',
    };
  }

  // 2. Pemetaan status saat sistem masih OPEN
  switch (statusService) {
    case 'WAITING CHECK':
    case 'PENDING CHECK':
      return {
        label: 'Baru (Antre)',
        variant: 'default' as const,
        className: 'bg-slate-900 text-white',
      };

    case 'SERVICE':
    case 'IN SERVICE':
      return {
        label: 'Dikerjakan',
        variant: 'default' as const,
        className: 'bg-blue-600 text-white',
      };

    case 'WITH PART':
    case 'PENDING PART':
      return {
        label: 'Menunggu Part',
        variant: 'outline' as const,
        className: 'border-orange-500 text-orange-600 font-bold',
      };

    case 'DONE':
    case 'READY':
      return {
        label: 'Siap Ambil',
        variant: 'default' as const,
        className: 'bg-green-600 text-white animate-pulse',
      };

    default:
      return {
        label: statusService || 'Unknown',
        variant: 'outline' as const,
        className: 'text-slate-500',
      };
  }
};

export function DashboardTable() {
  const [data, setData] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchServiceRequests = async () => {
    try {
      setIsLoading(true);
      const result = await srApi.getAll(searchTerm, page, limit);
      // Validasi apakah result adalah array atau objek dengan properti data
      const dataArray = Array.isArray(result) ? result : result.data || [];
      setData(dataArray);
    } catch (error) {
      console.error('Gagal fetch data SR:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceRequests();
  }, [page, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchTerm(searchInput);
  };

  return (
    <div className="space-y-6">
      {/* SEKSI SEARCH */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
        <form
          onSubmit={handleSearch}
          className="flex items-center gap-2 w-full max-w-md"
        >
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari pelanggan, model, atau No SR..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 border-slate-200 focus:ring-slate-900"
            />
          </div>
          <Button type="submit" className="bg-slate-900 hover:bg-slate-800">
            Cari
          </Button>
        </form>
      </div>

      {/* SEKSI TABEL UTAMA */}
      <Card className="border shadow-md overflow-hidden rounded-xl bg-white">
        <CardHeader className="bg-slate-50/50 border-b py-4">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">
            Daftar Antrean Servis Mipsys
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="font-bold text-slate-800">
                  No. SR
                </TableHead>
                <TableHead className="font-bold text-slate-800">
                  Pelanggan
                </TableHead>
                <TableHead className="font-bold text-slate-800">
                  Model Mesin
                </TableHead>
                <TableHead className="font-bold text-blue-600">
                  Serial Number
                </TableHead>
                <TableHead className="font-bold text-slate-800">Mode</TableHead>
                <TableHead className="font-bold text-slate-800">
                  Status
                </TableHead>
                <TableHead className="font-bold text-slate-800">
                  Masuk
                </TableHead>
                <TableHead className="text-right font-bold text-slate-800">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-24">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-10 w-10 animate-spin text-slate-300" />
                      <p className="text-slate-400 text-sm animate-pulse">
                        Menghubungkan ke Database...
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-24 text-slate-400 italic"
                  >
                    Belum ada data permintaan servis yang terdaftar.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((sr) => {
                  // MEMPERBAIKI SCOPE: Definisikan config di dalam loop
                  const config = getStatusConfig(
                    sr.statusService,
                    sr.statusSystem,
                  );

                  return (
                    <TableRow
                      key={sr.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <TableCell className="font-bold text-slate-900">
                        {sr.ticketNumber}
                      </TableCell>
                      <TableCell className="font-medium">
                        {sr.customerName}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {sr.modelName}
                      </TableCell>
                      <TableCell>
                        <code className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 font-mono shadow-sm">
                          {sr.serialNumber || '-'}
                        </code>
                      </TableCell>
                      <TableCell className="text-xs font-semibold">
                        {sr.serviceType}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={config.variant}
                          className={config.className}
                        >
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs">
                        {new Date(sr.incomingDate).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/service-request/${sr.ticketNumber}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="group-hover:bg-slate-900 group-hover:text-white transition-all"
                          >
                            Detail <ExternalLink className="ml-2 h-3 w-3" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* SEKSI PAGINASI */}
      <div className="flex items-center justify-between px-2">
        <p className="text-[11px] text-slate-400 font-medium">
          Menampilkan{' '}
          <span className="text-slate-900 font-bold">{data.length}</span>{' '}
          catatan pada halaman ini
        </p>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="h-8 shadow-sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
          >
            Kembali
          </Button>
          <div className="h-8 w-8 flex items-center justify-center bg-slate-900 text-white rounded text-xs font-black">
            {page}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 shadow-sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={data.length < limit || isLoading}
          >
            Lanjut
          </Button>
        </div>
      </div>
    </div>
  );
}
