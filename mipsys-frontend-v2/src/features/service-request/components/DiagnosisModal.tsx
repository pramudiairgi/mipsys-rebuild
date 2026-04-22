'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  Wrench,
  PackagePlus,
  Calculator,
  UserCheck,
} from 'lucide-react';
import { srApi } from '../services/sr-api';
import { ServiceRequest } from '../types';

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
  const [status, setStatus] = useState<string>('SERVICE');
  const [remarks, setRemarks] = useState('');
  const [parts, setParts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // MOCK DATA: Dalam produksi, ini diambil dari API /staff?role=TECHNICIAN
  const technicianList = [
    { id: 2, name: 'ADAM' },
    { id: 3, name: 'ARRA' }, // Contoh tambahan sesuai DB Mas Irgi
  ];

  useEffect(() => {
    if (isOpen) {
      setTechId('');
      setStatus('SERVICE');
      setRemarks('');
      setParts([]);
    }
  }, [isOpen]);

  // --- LOGIKA SPAREPART ---
  const addPart = () => {
    setParts([...parts, { partName: '', quantity: 1, unitPrice: 0 }]);
  };

  const removePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const updatePart = (index: number, field: string, value: any) => {
    const newParts = [...parts];
    newParts[index][field] = value;
    setParts(newParts);
  };

  // Kalkulasi Subtotal Sparepart
  const subtotalParts = parts.reduce(
    (acc, p) => acc + Number(p.quantity) * Number(p.unitPrice),
    0,
  );

  // --- SUBMIT KE BACKEND ---
  const handleSubmit = async () => {
    if (!sr || !techId) return alert('Pilih Teknisi dan isi Diagnosa!');

    setIsLoading(true);
    try {
      // Kita kirim data mentah, biar sr-api.ts yang melakukan mapping final
      await srApi.updateTechnician(sr.id, {
        techId: Number(techId),
        remarks,
        status,
        parts,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      const msg = error.response?.data?.message;
      alert('Error: ' + (Array.isArray(msg) ? msg[0] : 'Gagal menyimpan data'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Overlay dengan efek blur agar fokus */}
      <DialogContent
        aria-describedby={undefined}
        className="w-[95vw] sm:max-w-4xl bg-white rounded-3xl overflow-hidden p-0 border-none shadow-2xl transition-all"
      >
        {/* HEADER: Kesan Dark & Professional */}
        <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
          <div className="absolute right-[-20px] top-[-20px] opacity-10">
            <Wrench size={120} />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-blue-500 rounded-2xl shadow-lg shadow-blue-500/20">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black tracking-tight">
                Update Diagnosa
              </DialogTitle>
              <p className="text-slate-400 text-xs font-mono mt-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                TICKET: {sr?.ticketNumber}
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
          {/* SEKSI 1: INPUT UTAMA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500 tracking-widest">
                Teknisi Penanggung Jawab
              </Label>
              <Select onValueChange={setTechId} value={techId}>
                <SelectTrigger className="h-12 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 transition-all">
                  <SelectValue placeholder="Pilih Nama Teknisi" />
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

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500 tracking-widest">
                Status Unit Saat Ini
              </Label>
              <Select onValueChange={setStatus} defaultValue={status}>
                <SelectTrigger className="h-12 border-slate-200 rounded-xl font-bold text-blue-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SERVICE">SERVICE (Dikerjakan)</SelectItem>
                  <SelectItem value="PENDING PART">
                    PENDING PART (Tunggu Part)
                  </SelectItem>
                  <SelectItem value="DONE">DONE (Selesai/Ready)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* SEKSI 2: CATATAN */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500 tracking-widest">
              Analisa Kerusakan & Tindakan
            </Label>
            <Textarea
              className="min-h-[120px] border-slate-200 rounded-xl focus:ring-slate-900 text-sm p-4 bg-slate-50/50"
              placeholder="Jelaskan secara teknis apa yang rusak dan apa yang sudah diganti..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          {/* SEKSI 3: SPAREPART DENGAN CARD STYLE */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <PackagePlus className="h-4 w-4 text-blue-600" />
                <Label className="text-sm font-black uppercase text-slate-800">
                  Estimasi Sparepart
                </Label>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={addPart}
                className="rounded-full border-blue-200 text-blue-600 hover:bg-blue-50 font-bold px-4"
              >
                <Plus className="h-4 w-4 mr-1" /> Tambah Item
              </Button>
            </div>

            <div className="space-y-3">
              {parts.length === 0 ? (
                <div className="py-10 border-2 border-dashed border-slate-100 rounded-2xl text-center text-slate-400 text-xs italic">
                  Belum ada penambahan suku cadang.
                </div>
              ) : (
                parts.map((p, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-12 gap-3 items-end bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="col-span-6 space-y-1">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase">
                        Nama Barang
                      </Label>
                      <Input
                        className="h-10 bg-slate-50/50 border-none font-medium"
                        value={p.partName}
                        onChange={(e) =>
                          updatePart(i, 'partName', e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase">
                        Qty
                      </Label>
                      <Input
                        type="number"
                        className="h-10 bg-slate-50/50 border-none text-center font-bold"
                        value={p.quantity}
                        onChange={(e) =>
                          updatePart(i, 'quantity', e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-3 space-y-1">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase">
                        Harga Satuan
                      </Label>
                      <Input
                        type="number"
                        className="h-10 bg-slate-50/50 border-none font-bold"
                        value={p.unitPrice}
                        onChange={(e) =>
                          updatePart(i, 'unitPrice', e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-1 pb-1 flex justify-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-10 w-10 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                        onClick={() => removePart(i)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* FOOTER: HIGHLIGHT TOTAL */}
        <div className="p-8 bg-slate-50 border-t flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Total Suku Cadang
            </p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              <span className="text-blue-600 mr-1">Rp</span>
              {subtotalParts.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex-1 md:flex-none h-14 px-8 font-bold text-slate-500 hover:bg-slate-100 rounded-2xl"
            >
              Batal
            </Button>
            <Button
              disabled={isLoading}
              onClick={handleSubmit}
              className="flex-1 md:flex-none h-14 px-12 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              {isLoading ? 'PROSES...' : 'SIMPAN DIAGNOSA'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
