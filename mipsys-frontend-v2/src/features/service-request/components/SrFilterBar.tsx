'use client';

import React from 'react';
import { Search, Plus } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { useAuth } from '@/src/lib/auth-context';

const statusFilters = [
  { value: 'ALL', label: 'Semua' },
  { value: 'WAITING_CHECK', label: 'Pending' },
  { value: 'SERVICE', label: 'In Service' },
  { value: 'AWAITING_PARTS', label: 'Menunggu Part' },
  { value: 'DONE', label: 'Ready' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'CANCEL', label: 'Cancelled' },
];

interface SrFilterBarProps {
  searchInput: string;
  onSearchInputChange: (v: string) => void;
  onSearch: (e: React.FormEvent) => void;
  activeFilter: string;
  onFilterChange: (v: string) => void;
}

export const SrFilterBar = React.memo(function SrFilterBar({
  searchInput,
  onSearchInputChange,
  onSearch,
  activeFilter,
  onFilterChange,
}: SrFilterBarProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  return (
    <div className="space-y-4">
      <form onSubmit={onSearch} className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" aria-hidden="true" />
          <Input
            placeholder="Cari No. SR, pelanggan, model, atau serial..."
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            className="w-full h-12 pl-11 rounded-2xl"
          />
        </div>
        {isAdmin && (
          <Link href="/service-request/new">
            <Button
              type="button"
              className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 h-12 px-6 rounded-2xl text-xs font-black tracking-widest text-[var(--primary-foreground)] flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] border-0"
            >
              <Plus size={18} strokeWidth={3} aria-hidden="true" />
              BUAT SR BARU
            </Button>
          </Link>
        )}
      </form>

      <div className="flex flex-wrap gap-2">
        {statusFilters.map(({ value, label }) => (
          <Button
            key={value}
            variant={activeFilter === value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange(value)}
            className={`rounded-full text-xs font-black tracking-wider ${
              activeFilter === value ? 'bg-[var(--primary)] hover:bg-[var(--primary)]/80 text-[var(--primary-foreground)] border-0' : ''
            }`}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
});
