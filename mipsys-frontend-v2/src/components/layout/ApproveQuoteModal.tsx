'use client';

import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  X,
  Loader2,
  Package,
  AlertTriangle,
  FileText,
  Printer,
  Save,
} from 'lucide-react';
import {
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogPortal,
  DialogOverlay,
} from '@/src/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { QuotePrintTemplate } from '@/src/components/layout/QuotePrintTemplate';
import { useAuth } from '@/src/lib/auth-context';
import { srApi } from '@/src/features/service-request/api/sr-api';
import { orderPartsApi } from '@/src/features/service-request/api/order-parts-api';
import { OrderPart } from '@/src/features/service-request/api/order-parts-api';

interface ApproveQuoteModalProps {
  ticketNumber: string;
  serviceRequestId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialServiceFee?: string;
  initialPartFee?: string;
}

interface ProposedPart extends OrderPart {
  lineTotal: number;
}

export function ApproveQuoteModal({
  ticketNumber,
  serviceRequestId,
  isOpen,
  onClose,
  onSuccess,
  initialServiceFee,
  initialPartFee,
}: ApproveQuoteModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parts, setParts] = useState<ProposedPart[]>([]);
  const [isLoadingParts, setIsLoadingParts] = useState(false);
  const [serviceFee, setServiceFee] = useState<string>('0');
  const [savedServiceFee, setSavedServiceFee] = useState<number>(0);
  const [savedPartFee, setSavedPartFee] = useState<number>(0);
  const printRef = useRef<HTMLDivElement>(null);

  const hasSavedQuote =
    parseFloat(initialServiceFee || '0') > 0 ||
    parseFloat(initialPartFee || '0') > 0;

  useEffect(() => {
    if (isOpen && serviceRequestId) {
      if (hasSavedQuote) {
        setServiceFee(initialServiceFee ?? '0');
        setSavedServiceFee(parseFloat(initialServiceFee || '0'));
        setSavedPartFee(parseFloat(initialPartFee || '0'));
        setStep('preview');
      } else {
        setServiceFee('0');
        setStep('form');
      }
      fetchProposedParts();
    }
  }, [isOpen, serviceRequestId, initialServiceFee, initialPartFee, hasSavedQuote]);

  async function fetchProposedParts() {
    if (!serviceRequestId) return;
    setIsLoadingParts(true);
    try {
      const data = await orderPartsApi.getBySR(serviceRequestId);
      const proposed = (Array.isArray(data) ? data : []).filter(
        (p: OrderPart) => p.status === 'PROPOSED'
      );
      setParts(
        proposed.map((p) => ({
          ...p,
          lineTotal: Number(p.priceAtAction ?? 0) * p.quantity,
        }))
      );
    } catch {
      setParts([]);
    } finally {
      setIsLoadingParts(false);
    }
  }

  const totalPartCost = parts.reduce((sum, p) => sum + Number(p.priceAtAction ?? 0) * p.quantity, 0);
  const serviceFeeNum = parseInt(serviceFee) || 0;
  const grandTotal = totalPartCost + serviceFeeNum;
  const PPN_RATE = 0.11;
  const ppn = Math.round(grandTotal * PPN_RATE);
  const totalAfterPpn = grandTotal + ppn;

  async function handleSave() {
    if (!ticketNumber) return;
    if (serviceFee === '' || serviceFee === '0') {
      toast.error('Biaya jasa wajib diisi');
      return;
    }
    if (parts.length === 0) {
      toast.error('Tidak ada part yang diusulkan');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await srApi.saveQuote(ticketNumber, {
        serviceFee: parseInt(serviceFee) || 0,
        performedBy: user?.staffId,
      });

      setSavedServiceFee(result.serviceFee);
      setSavedPartFee(result.partFee);
      setStep('preview');
      toast.success('Penawaran berhasil disimpan');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menyimpan penawaran';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Penawaran-${ticketNumber}`,
    pageStyle: '@page { size: A4; margin: 15mm; }',
  });

  function handleClose() {
    if (step === 'preview') {
      onSuccess();
    }
    onClose();
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-60 grid w-full max-w-3xl translate-x-[-50%] translate-y-[-50%] gap-4 border border-border/20 bg-[var(--popover)] shadow-lg duration-200 sm:rounded-[2rem] p-0 overflow-hidden">
            <DialogDescription className="sr-only">
              {step === 'form'
                ? 'Form pembuatan penawaran biaya service'
                : 'Pratinjau penawaran biaya service'}
            </DialogDescription>

            <div className="flex flex-col h-full text-left max-h-[90vh]">
              {step === 'form' ? (
                <>
                  <FormHeader ticketNumber={ticketNumber} onClose={handleClose} />

                  <div className="p-8 space-y-6 overflow-y-auto">
                    <FeeInputs
                      serviceFee={serviceFee}
                      onServiceFeeChange={setServiceFee}
                    />

                    <PartsList parts={parts} isLoading={isLoadingParts} />

                    <SummaryRow totalPartCost={totalPartCost} serviceFee={serviceFeeNum} />
                  </div>

                  <FormFooter
                    isSubmitting={isSubmitting}
                    onClose={handleClose}
                    onSave={handleSave}
                  />
                </>
              ) : (
                <>
                  <PreviewHeader ticketNumber={ticketNumber} onClose={handleClose} />

                  <div className="flex-1 overflow-y-auto">
                    <div className="bg-white p-8">
                      <div className="mx-auto max-w-[210mm] shadow-sm border border-stone-200 bg-white text-stone-900 p-10">
                        <QuotePrintTemplate
                          ref={printRef}
                          ticketNumber={ticketNumber}
                          parts={parts}
                          serviceFee={savedServiceFee}
                          partFee={savedPartFee}
                        />
                      </div>
                    </div>
                  </div>

                  <PreviewFooter onPrint={handlePrint} onClose={handleClose} />
                </>
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </>
  );
}

// --- Form Components ---

function FormHeader({
  ticketNumber,
  onClose,
}: {
  ticketNumber: string;
  onClose: () => void;
}) {
  return (
    <div className="p-8 bg-[var(--accent)] text-[var(--accent-foreground)]">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-background/20 rounded-2xl backdrop-blur-md">
            <FileText size={24} aria-hidden="true" />
          </div>
          <div>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">
              Buat Penawaran
            </DialogTitle>
            <p className="text-xs font-bold opacity-80 uppercase tracking-widest">
              Tiket: {ticketNumber}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 hover:bg-background/10 rounded-xl transition-all outline-none"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function FeeInputs({
  serviceFee,
  onServiceFeeChange,
}: {
  serviceFee: string;
  onServiceFeeChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <label className="text-[10px] font-black uppercase text-[var(--muted-foreground)] ml-1 flex items-center gap-2">
        Biaya Tambahan
      </label>

      <div className="max-w-xs">
        <div className="space-y-2">
          <label className="text-xs font-bold text-[var(--muted-foreground)] ml-1">
            Biaya Jasa (Service Fee) *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] font-bold text-sm">Rp</span>
            <Input
              type="text"
              inputMode="numeric"
              value={serviceFee}
              onChange={(e) => onServiceFeeChange(e.target.value)}
              className="pl-10 h-11 border-2 border-border/30 rounded-xl font-bold"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PartsList({
  parts,
  isLoading,
}: {
  parts: ProposedPart[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] py-4">
        <Loader2 className="motion-safe:animate-spin" size={14} aria-hidden="true" /> Memuat part…
      </div>
    );
  }

  if (parts.length === 0) return null;

  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black uppercase text-[var(--muted-foreground)] ml-1 flex items-center gap-2">
        <Package size={14} aria-hidden="true" /> Part Diusulkan
      </label>

      <div className="space-y-2">
        {parts.map((part) => (
          <div
            key={part.id}
            className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30"
          >
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[var(--foreground)] text-sm truncate">{part.partName}</p>
              <p className="text-[10px] text-[var(--muted-foreground)]">
                {part.partCode ?? 'Manual'} x {part.quantity}
              </p>
            </div>
            <p className="font-black text-amber-400 text-sm">
              Rp {part.lineTotal.toLocaleString('id-ID')}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--primary)]/10 border border-primary/20">
        <AlertTriangle size={14} className="text-[var(--primary)] shrink-0" aria-hidden="true" />
        <p className="text-[10px] text-[var(--primary)] font-bold">
          Setelah disimpan, penawaran bisa dicetak untuk diberikan ke pelanggan.
        </p>
      </div>
    </div>
  );
}

function SummaryRow({
  totalPartCost,
  serviceFee,
}: {
  totalPartCost: number;
  serviceFee: number;
}) {
  const subtotal = totalPartCost + serviceFee;
  const ppn = Math.round(subtotal * 0.11);
  const grandTotal = subtotal + ppn;

  return (
    <div className="space-y-3 p-4 rounded-xl bg-[var(--muted)]/50 border border-border/30">
      <div className="flex justify-between items-center text-sm">
        <span className="font-bold text-[var(--muted-foreground)]">Biaya Part</span>
        <span className="font-black text-[var(--foreground)]">Rp {totalPartCost.toLocaleString('id-ID')}</span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className="font-bold text-[var(--muted-foreground)]">Biaya Jasa</span>
        <span className="font-black text-[var(--foreground)]">Rp {serviceFee.toLocaleString('id-ID')}</span>
      </div>
      <hr className="border-border/30" />
      <div className="flex justify-between items-center text-sm">
        <span className="font-bold text-[var(--muted-foreground)]">PPN 11%</span>
        <span className="font-black text-[var(--foreground)]">Rp {ppn.toLocaleString('id-ID')}</span>
      </div>
      <hr className="border-border/30" />
      <div className="flex justify-between items-center">
        <span className="text-sm font-black text-[var(--foreground)]/70">Grand Total</span>
        <span className="text-xl font-black text-[var(--accent)]">Rp {grandTotal.toLocaleString('id-ID')}</span>
      </div>
    </div>
  );
}

function FormFooter({
  isSubmitting,
  onClose,
  onSave,
}: {
  isSubmitting: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="p-8 bg-[var(--muted)]/50 border-t flex gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        className="flex-1 h-14 rounded-2xl text-xs font-black uppercase"
      >
        Batal
      </Button>
      <Button
        type="button"
        onClick={onSave}
        disabled={isSubmitting}
        className="flex-1 h-14 rounded-2xl text-xs font-black uppercase gap-2 bg-[var(--accent)] hover:bg-[var(--accent)]/90"
      >
        {isSubmitting ? (
          <Loader2 className="motion-safe:animate-spin" size={18} aria-hidden="true" />
        ) : (
          <Save size={18} aria-hidden="true" />
        )}
        Simpan Penawaran
      </Button>
    </div>
  );
}

// --- Preview Components ---

function PreviewHeader({
  ticketNumber,
  onClose,
}: {
  ticketNumber: string;
  onClose: () => void;
}) {
  return (
    <div className="p-8 bg-[var(--accent)] text-[var(--accent-foreground)] no-print">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-background/20 rounded-2xl backdrop-blur-md">
            <FileText size={24} aria-hidden="true" />
          </div>
          <div>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">
              Penawaran Tersimpan
            </DialogTitle>
            <p className="text-xs font-bold opacity-80 uppercase tracking-widest">
              Tiket: {ticketNumber}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 hover:bg-background/10 rounded-xl transition-all outline-none no-print"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function PreviewFooter({
  onPrint,
  onClose,
}: {
  onPrint: () => void;
  onClose: () => void;
}) {
  return (
    <div className="p-8 bg-[var(--muted)]/50 border-t flex gap-3 no-print">
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        className="flex-1 h-14 rounded-2xl text-xs font-black uppercase"
      >
        Tutup
      </Button>
      <Button
        type="button"
        onClick={onPrint}
        className="flex-1 h-14 rounded-2xl text-xs font-black uppercase gap-2 bg-[var(--accent)] hover:bg-[var(--accent)]/90"
      >
        <Printer size={18} aria-hidden="true" />
        Cetak
      </Button>
    </div>
  );
}
