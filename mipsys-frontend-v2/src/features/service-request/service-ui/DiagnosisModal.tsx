'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import {
  Plus,
  Trash2,
  Wrench,
  RefreshCcw,
  Save,
  PackagePlus,
  ArrowRightCircle,
} from 'lucide-react';
import { srApi } from '../services/sr-api';
import { ServiceRequest, UpdateDiagnosisPayload } from '../types';

interface DiagnosisModalProps {
  sr: ServiceRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DiagnosisModal({
  sr,
  isOpen,
  onClose,
  onSuccess,
}: DiagnosisModalProps) {
  // --- STATE MANAGEMENT ---
  const [techId, setTechId] = useState<string>('');
  const [status, setStatus] =
    useState<ServiceRequest['statusService']>('SERVICE');
  const [remarks, setRemarks] = useState('');
  const [parts, setParts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const technicianList = [{ id: 2, name: 'ADAM' }];

  useEffect(() => {
    if (isOpen && sr) {
      setTechId(sr.technicianFixId?.toString() || '');
      setStatus(sr.statusService || 'SERVICE');
      setRemarks(sr.remarksHistory || '');
      const historyParts = sr.parts || (sr as any).orderParts || [];
      setParts(historyParts);
    }
  }, [isOpen, sr]);

  const addPart = () => {
    setParts([...parts, { partName: '', quantity: 1, unitPrice: 0 }]);
  };

  const updatePart = (index: number, field: string, value: any) => {
    const newParts = [...parts];
    // @ts-ignore
    newParts[index][field] = value;
    setParts(newParts);
  };

  const removePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const subtotalParts = parts.reduce(
    (acc, p) => acc + Number(p.quantity) * Number(p.unitPrice),
    0,
  );

  const handleSubmit = async () => {
    if (!sr || !techId) return alert('Mohon pilih Teknisi terlebih dahulu!');
    const validParts = parts.filter((p) => p.partName.trim() !== '');

    setIsLoading(true);
    try {
      // Mengirimkan data sesuai Interface UpdateDiagnosisPayload
      await srApi.updateTechnician(sr.ticketNumber, {
        ticketNumber: sr.ticketNumber,
        technicianFixId: Number(techId),
        remarksHistory: remarks,
        statusService: status,
        serviceFee: Number(sr.serviceFee),
        parts: parts.filter((p) => p.partName.trim() !== ''),
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      const serverError = error.response?.data?.message;
      alert(
        'Gagal: ' +
          (Array.isArray(serverError) ? serverError[0] : 'Error Sistem'),
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl outline-none">
        {/* HEADER */}
        <div
          className={`p-8 text-white relative overflow-hidden transition-colors duration-500 ${sr?.remarksHistory ? 'bg-[#1e293b]' : 'bg-[#020617]'}`}
        >
          <div className="flex items-center gap-5 relative z-10">
            <div
              className={`p-4 rounded-2xl shadow-lg ${sr?.remarksHistory ? 'bg-amber-500' : 'bg-blue-600'}`}
            >
              <Wrench className="h-7 w-7" />
            </div>
            <div className="text-left">
              <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                {sr?.remarksHistory
                  ? 'Update Progres & Status'
                  : 'Diagnosa Kerusakan'}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  {sr?.statusService}
                </span>
                <ArrowRightCircle size={14} className="text-blue-400" />
                <span className="text-blue-400 text-[10px] font-black uppercase tracking-widest">
                  {status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
          {/* BARIS 1: STATUS & TEKNISI */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="space-y-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 shadow-inner">
              <Label className="text-[11px] font-black uppercase text-blue-600 tracking-widest ml-1">
                Ubah Status Servis:
              </Label>
              <Select onValueChange={(v) => setStatus(v as any)} value={status}>
                <SelectTrigger className="h-12 border-none rounded-xl font-black text-blue-700 bg-white shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WAITING CHECK">
                    🛠️ WAITING CHECK
                  </SelectItem>
                  <SelectItem value="SERVICE">
                    ⚙️ SERVICE (Dikerjakan)
                  </SelectItem>
                  <SelectItem value="PENDING PART">
                    ⏳ PENDING PART (Tunggu Part)
                  </SelectItem>
                  <SelectItem value="DONE">✅ DONE (Selesai)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">
                Teknisi Penanggung Jawab
              </Label>
              <Select onValueChange={setTechId} value={techId}>
                <SelectTrigger className="h-12 border-slate-200 rounded-xl font-bold">
                  <SelectValue placeholder="Pilih Teknisi" />
                </SelectTrigger>
                <SelectContent>
                  {technicianList.map((t) => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* BARIS 2: ANALISA */}
          <div className="space-y-3 text-left">
            <Label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">
              Analisa Teknis (Diagnosa)
            </Label>
            <Textarea
              className="min-h-30 border-slate-200 rounded-2xl p-5 bg-slate-50/50 font-medium"
              placeholder="Isi diagnosa kerusakan..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          {/* BARIS 3: SPAREPART */}
          <div className="space-y-4 pt-4 border-t border-slate-100 text-left">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <PackagePlus size={18} className="text-blue-600" />
                <Label className="text-sm font-black uppercase text-slate-900">
                  Suku Cadang
                </Label>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={addPart}
                className="rounded-xl border-blue-200 text-blue-600 font-bold hover:bg-blue-600 hover:text-white transition-all"
              >
                <Plus size={16} className="mr-1" strokeWidth={3} /> Tambah Item
              </Button>
            </div>

            <div className="space-y-3">
              {parts.length === 0 ? (
                <div className="py-10 border-2 border-dashed border-slate-100 rounded-[2rem] text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest bg-slate-50/30">
                  Belum ada penggantian suku cadang
                </div>
              ) : (
                parts.map((p, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-12 gap-4 items-end bg-white p-5 rounded-3xl border border-slate-100 shadow-sm animate-in slide-in-from-right-4"
                  >
                    <div className="col-span-6 space-y-1">
                      <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Nama Barang
                      </Label>
                      <Input
                        className="h-11 bg-slate-50 border-none rounded-xl font-bold"
                        value={p.partName}
                        onChange={(e) =>
                          updatePart(i, 'partName', e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-[9px] font-black text-slate-400 uppercase text-center block">
                        Qty
                      </Label>
                      <Input
                        className="h-11 bg-slate-50 border-none rounded-xl text-center font-black"
                        type="number"
                        value={p.quantity}
                        onChange={(e) =>
                          updatePart(i, 'quantity', Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="col-span-3 space-y-1">
                      <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Harga Satuan
                      </Label>
                      <Input
                        className="h-11 bg-slate-50 border-none rounded-xl font-black text-blue-600"
                        type="number"
                        value={p.unitPrice}
                        onChange={(e) =>
                          updatePart(i, 'unitPrice', Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="col-span-1 pb-0.5 flex justify-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-11 w-11 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                        onClick={() => removePart(i)}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-8 bg-slate-50 border-t flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="bg-white px-8 py-4 rounded-[1.5rem] border border-slate-200 shadow-inner flex items-baseline gap-3">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Total Part:
            </p>
            <p className="text-3xl font-black text-[#020617] tracking-tighter">
              <span className="text-blue-600 text-sm mr-1 italic">IDR</span>
              {subtotalParts.toLocaleString('id-ID')}
            </p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <Button
              variant="ghost"
              onClick={onClose}
              className="h-14 px-8 font-bold text-slate-400 hover:bg-slate-200 rounded-2xl transition-all"
            >
              Batal
            </Button>
            <Button
              disabled={isLoading}
              onClick={handleSubmit}
              className={`h-14 px-12 text-white font-black rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 ${sr?.remarksHistory ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20' : 'bg-slate-900 hover:bg-blue-600'}`}
            >
              {isLoading ? (
                <RefreshCcw className="animate-spin" />
              ) : (
                <Save size={20} />
              )}
              {sr?.remarksHistory ? 'SIMPAN PERUBAHAN' : 'SIMPAN DIAGNOSA'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
