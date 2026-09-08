'use client';

import { useState } from 'react';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { srApi } from '../api/sr-api';
import { toast } from 'react-hot-toast';

interface SrExportButtonProps {
  search: string;
  status: string;
}

export function SrExportButton({ search, status }: SrExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    try {
      setLoading(true);
      const blob: Blob = await srApi.exportXlsx(search, status);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().slice(0, 10);
      a.download = `summary-report-${date}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Excel berhasil diunduh');
    } catch {
      toast.error('Gagal export Excel');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={loading}
      className="h-10 rounded-2xl gap-2 text-xs font-black tracking-widest border-[var(--border)]"
      title="Export Excel"
      aria-label="Export Excel"
    >
      {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <FileSpreadsheet size={16} aria-hidden="true" />}
      EXPORT EXCEL
    </Button>
  );
}
