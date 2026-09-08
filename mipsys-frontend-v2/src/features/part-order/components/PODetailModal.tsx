'use client';

import { useState, useEffect } from 'react';
import { poApi } from '../api/po-api';
import { PO_STATUS_LABEL, PO_STATUS_BADGE } from '../types';
import type { PurchaseOrder, PoStatus } from '../types';
import { POReceivingModal } from './POReceivingModal';
import { useAuth } from '@/src/lib/auth-context';
import { toast } from 'react-hot-toast';
import { Loader2, X } from 'lucide-react';
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog';

interface PODetailModalProps {
  poId: number;
  onClose: () => void;
  onRefresh: () => void;
}

export function PODetailModal({ poId, onClose, onRefresh }: PODetailModalProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isTechnician = user?.role === 'TECHNICIAN';
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReceiving, setShowReceiving] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  async function loadPO() {
    try {
      setIsLoading(true);
      const result = await poApi.getById(poId);
      setPo(result);
    } catch {
      toast.error('Gagal memuat detail PO');
      onClose();
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadPO(); }, [poId]);

  async function handleStatusChange(newStatus: PoStatus) {
    setStatusLoading(true);
    try {
      await poApi.updateStatus(poId, newStatus, user?.staffId);
      toast.success(`Status PO → ${PO_STATUS_LABEL[newStatus]}`);
      await loadPO();
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal update status');
    } finally {
      setStatusLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
        <div className="bg-[var(--card)] rounded-xl p-8 shadow-2xl">
          <Loader2 className="motion-safe:animate-spin mx-auto text-[var(--primary)]" size={24} />
        </div>
      </div>
    );
  }

  if (!po) return null;

  const totalReceived = po.items?.reduce((sum, i) => sum + (i.receivedQty || 0), 0) ?? 0;
  const totalOrdered = po.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  const statusActions: Record<string, { label: string; handler: () => void; roles: string[] } | null> = {
    DRAFT: { label: 'Minta Approval', handler: () => handleStatusChange('REQUESTED'), roles: ['ADMIN', 'TECHNICIAN'] },
    REQUESTED: { label: 'Setujui', handler: () => handleStatusChange('APPROVED'), roles: ['ADMIN'] },
    APPROVED: { label: 'Pesan ke Pusat', handler: () => handleStatusChange('ORDERED'), roles: ['ADMIN'] },
    ORDERED: { label: 'Tandai Dikirim', handler: () => handleStatusChange('SHIPPED'), roles: ['ADMIN'] },
  };

  const rawAction = statusActions[po.status];
  const primaryAction =
    rawAction && rawAction.roles.includes(user?.role ?? '') ? rawAction : null;
  const canReceive = isAdmin && (po.status === 'SHIPPED' || po.status === 'PARTIALLY_RECEIVED');
  const canCancel = isAdmin && !['RECEIVED', 'CANCELLED'].includes(po.status);

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200" role="dialog" aria-modal="true">
        <div className="bg-[var(--card)] rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto border border-border/30 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200">
          <div className="p-6 border-b border-border flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold text-[var(--foreground)]">{po.poNumber}</h2>
              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-tight ${PO_STATUS_BADGE[po.status]}`}>
                {PO_STATUS_LABEL[po.status]}
              </span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50 transition-all" aria-label="Tutup detail">
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-[var(--muted-foreground)]">Supplier:</span> <span className="font-semibold text-[var(--foreground)]">{po.supplierName}</span></div>
              <div><span className="text-[var(--muted-foreground)]">Total:</span> <span className="font-semibold text-[var(--foreground)]">Rp {parseFloat(po.totalAmount || '0').toLocaleString('id-ID')}</span></div>
              <div><span className="text-[var(--muted-foreground)]">Tanggal:</span> <span className="font-semibold text-[var(--foreground)]">{po.createdAt ? new Date(po.createdAt).toLocaleDateString('id-ID') : '-'}</span></div>
              <div><span className="text-[var(--muted-foreground)]">Diterima:</span> <span className="font-semibold text-[var(--foreground)]">{totalReceived}/{totalOrdered}</span></div>
            </div>

            {po.notes && (
              <div className="p-3 bg-[var(--muted)]/30 rounded-lg text-sm text-[var(--foreground)]/80">{po.notes}</div>
            )}

            <div>
              <h3 className="font-bold text-[var(--foreground)] mb-2">Items</h3>
              <table className="w-full text-sm">
                <thead className="bg-[var(--muted)]/50">
                  <tr>
                    <th className="text-left py-2 px-3 font-bold text-[var(--muted-foreground)]">Nama Part</th>
                    <th className="text-right py-2 px-3 font-bold text-[var(--muted-foreground)]">Qty</th>
                    <th className="text-right py-2 px-3 font-bold text-[var(--muted-foreground)]">Harga</th>
                    <th className="text-right py-2 px-3 font-bold text-[var(--muted-foreground)]">Diterima</th>
                    <th className="text-right py-2 px-3 font-bold text-[var(--muted-foreground)]">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {po.items?.map((item) => {
                    const subtotal = item.quantity * parseFloat(item.unitPrice || '0');
                    return (
                      <tr key={item.id} className="border-b border-border/50">
                        <td className="py-2 px-3 font-medium text-[var(--foreground)]">{item.partName || `Part #${item.sparePartId}`}</td>
                        <td className="py-2 px-3 text-right text-[var(--foreground)]/80">{item.quantity}</td>
                        <td className="py-2 px-3 text-right text-[var(--foreground)]/80">Rp {parseFloat(item.unitPrice || '0').toLocaleString('id-ID')}</td>
                        <td className="py-2 px-3 text-right text-[var(--foreground)]/80">{item.receivedQty || 0}</td>
                        <td className="py-2 px-3 text-right font-semibold text-[var(--foreground)]">Rp {subtotal.toLocaleString('id-ID')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
              {primaryAction && (
                <button
                  onClick={primaryAction.handler}
                  disabled={statusLoading}
                  className="px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] text-sm font-bold rounded-xl transition-all disabled:opacity-50 motion-safe:active:scale-95"
                >
                  {primaryAction.label}
                </button>
              )}
              {canReceive && (
                <button
                  onClick={() => setShowReceiving(true)}
                  disabled={statusLoading}
                  className="px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-[var(--accent-foreground)] text-sm font-bold rounded-xl transition-all disabled:opacity-50 motion-safe:active:scale-95"
                >
                  Terima Barang
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={statusLoading}
                  className="px-5 py-2.5 bg-[var(--destructive)]/10 hover:bg-[var(--destructive)]/20 text-[var(--destructive)] text-sm font-bold rounded-xl transition-all disabled:opacity-50 motion-safe:active:scale-95"
                >
                  Batalkan
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showReceiving && po.items && (
        <POReceivingModal
          poId={po.id}
          items={po.items}
          onClose={() => setShowReceiving(false)}
          onSuccess={() => { loadPO(); onRefresh(); }}
        />
      )}

      <ConfirmDialog
        open={showCancelConfirm}
        onOpenChange={(open) => setShowCancelConfirm(open)}
        title="Batalkan PO?"
        description="PO yang dibatalkan tidak bisa dilanjutkan. Lanjutkan?"
        confirmLabel="Ya, Batalkan"
        variant="destructive"
        loading={statusLoading}
        onConfirm={() => handleStatusChange('CANCELLED')}
      />
    </>
  );
}
