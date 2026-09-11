'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCcw,
  Globe,
  Package,
  AlertTriangle,
  CheckCircle2,
  PackagePlus,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { PageHeader } from '@/src/components/ui/page-header';
import { SearchBar } from '@/src/components/ui/search-bar';
import { DataTable } from '@/src/components/ui/data-table';
import { useAuth } from '@/src/lib/auth-context';
import type { Column } from '@/src/components/ui/data-table';
import { partsApi } from '@/src/features/inventory/services/parts-api';
import { SparePart } from '@/src/features/inventory/types';
import { AddStockModal } from '@/src/features/inventory/inventory-ui/AddStockModal';
import { toast } from 'react-hot-toast';

export default function InventoryPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const [parts, setParts] = useState<SparePart[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const limitPerPage = 10;
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
  const [isRestockOpen, setIsRestockOpen] = useState<boolean>(false);

  const fetchParts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await partsApi.getAllParts({
        search,
        page: currentPage,
        limit: limitPerPage,
      });

      let rawData: SparePart[] = [];
      if (response && response.data) {
        rawData = Array.isArray(response.data) ? response.data : [];
      } else if (Array.isArray(response)) {
        rawData = response;
      }

      if (response && response.meta && response.meta.totalPages) {
        setParts(rawData);
        setTotalPages(response.meta.totalPages);
      } else if (rawData.length > limitPerPage) {
        setTotalPages(Math.ceil(rawData.length / limitPerPage));
        const start = (currentPage - 1) * limitPerPage;
        setParts(rawData.slice(start, start + limitPerPage));
      } else {
        setParts(rawData);
        setTotalPages(
          rawData.length === limitPerPage ? currentPage + 1 : currentPage,
        );
      }
    } catch (error) {
      console.error('Gagal memuat suku cadang:', error);
      toast.error('Gagal memuat data suku cadang');
    } finally {
      setLoading(false);
    }
  }, [search, currentPage]);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleRestockClick = (part: SparePart) => {
    setSelectedPart(part);
    setIsRestockOpen(true);
  };

  const handleStockAction = async (
    id: number,
    qty: number,
    type: 'ADD' | 'SUBTRACT' | 'RESET',
  ) => {
    if (type === 'ADD') await partsApi.addStock(id, qty);
    else if (type === 'SUBTRACT') await partsApi.reduceStock(id, qty);
    else if (type === 'RESET') await partsApi.reduceStock(id, qty);
  };

  const columns: Column<SparePart>[] = [
    {
      header: 'Part Code',
      cell: (part) => (
        <span className="font-mono text-xs font-black text-[var(--foreground)] select-all">
          {part.partCode || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Nama Barang',
      cell: (part) => (
        <span className="text-xs font-black text-[var(--foreground)]">
          {part.partName}
        </span>
      ),
    },
    {
      header: 'Model Mesin',
      cell: (part) => (
        <span className="text-xs font-bold text-[var(--muted-foreground)]">
          {part.modelName || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Stok',
      headerClassName: 'text-center',
      cell: (part) => {
        const isLowStock = part.stock <= 3;
        return (
          <div className="flex justify-center">
            <span
              className={`px-3 py-1.5 rounded-md text-xs font-black border inline-block min-w-18 text-center ${
                isLowStock
                  ? 'bg-[var(--destructive)]/10 text-[var(--destructive)] border-destructive/30'
                  : 'bg-[var(--muted)] text-[var(--foreground)] border-border'
              }`}
            >
              {part.stock} Unit
            </span>
          </div>
        );
      },
    },
    {
      header: 'Harga',
      cell: (part) => (
        <span className="text-xs font-black text-[var(--foreground)]">
          IDR {Number(part.price || 0).toLocaleString('id-ID')}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (part) => {
        const isLowStock = part.stock <= 3;
        return isLowStock ? (
          <span className="flex items-center gap-1.5 text-xs font-black text-[var(--destructive)] bg-[var(--destructive)]/10 border border-destructive/30 px-3 py-1 rounded-md w-fit">
            <AlertTriangle size={14} className="shrink-0" />
            RESTOCK
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-black text-[var(--accent)] bg-[var(--accent)]/10 border border-accent/30 px-3 py-1 rounded-md w-fit">
            <CheckCircle2 size={14} className="shrink-0" />
            AMAN
          </span>
        );
      },
    },
    {
      header: 'Aksi',
      headerClassName: 'text-center',
      cell: (part) => (
        <div className="flex justify-center">
          {isAdmin && (
            <Button
              onClick={() => handleRestockClick(part)}
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs font-black uppercase rounded-lg"
            >
              <PackagePlus size={14} aria-hidden="true" /> + Stok
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 planner-bg">
      <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-4 motion-safe:duration-500">
        <PageHeader
          title="Inventory & Parts"
          subtitle="Manajemen stok suku cadang terpusat Mipsys Enterprise."
        >
          <Button
            onClick={() => {
              setCurrentPage(1);
              fetchParts();
            }}
            variant="outline"
            className="h-12 px-6 rounded-2xl gap-2 text-xs font-black uppercase tracking-wider border-[var(--primary)]/50 text-[var(--foreground)] hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]"
          >
            <RefreshCcw
              size={16}
              className={loading ? 'motion-safe:animate-spin' : ''}
              aria-hidden="true"
            />
            Perbarui Data
          </Button>
        </PageHeader>
      </div>

      <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-4 motion-safe:duration-500 motion-safe:delay-100 motion-safe:fill-mode-both">
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          placeholder="Cari part code, nama barang, atau model mesin..."
        />
      </div>

      <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-4 motion-safe:duration-500 motion-safe:delay-200 motion-safe:fill-mode-both">
        <DataTable
          columns={columns}
          data={parts}
          keyExtractor={(part) => part.id}
          isLoading={loading}
          footer={
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 w-full">
              <p className="text-xs font-black text-[var(--muted-foreground)] uppercase tracking-wider">
                Halaman <span className="text-[var(--foreground)]">{currentPage}</span>{' '}
                dari <span className="text-[var(--muted-foreground)]">{totalPages}</span>
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1 || loading}
                  className="rounded-2xl gap-1 text-xs font-black uppercase"
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages || loading}
                  className="rounded-2xl gap-1 text-xs font-black uppercase"
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          }
        />
      </div>

      <AddStockModal
        part={selectedPart}
        isOpen={isRestockOpen}
        onClose={() => setIsRestockOpen(false)}
        onSuccess={fetchParts}
        onStockAction={handleStockAction}
      />

      <footer className="pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest text-center md:text-left">
        <div className="flex items-center gap-2">
          <Globe size={12} className="text-[var(--primary)]" aria-hidden="true" />
          Central Java, Indonesia
        </div>
        <p className="text-[var(--muted-foreground)]">
          &copy; 2026 PT Mitrainfoparama &mdash; V2.1.0-AAA
        </p>
      </footer>
    </div>
  );
}
