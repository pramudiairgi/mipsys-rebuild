'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { srApi } from '../services/sr-api';

export function PaymentModal({ sr, isOpen, onClose, onSuccess }: any) {
  // 1. PISAHKAN STATE UNTUK UI KASIR
  const [laborFee, setLaborFee] = useState(0);
  const [onsiteFee, setOnsiteFee] = useState(0);

  const partFee = Number(sr?.partFee) || 0;

  // 2. KALKULASI GABUNGAN
  const totalServiceFee = laborFee + onsiteFee;
  const subtotal = totalServiceFee + partFee;
  const ppn = Math.round(subtotal * 0.11);
  const total = subtotal + ppn;

  const formatIDR = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  const handleSubmit = async () => {
    try {
      // 3. GABUNGKAN KEMBALI SAAT DIKIRIM KE BACKEND (Agar DTO tidak marah)
      await srApi.prosesKasir(sr.ticketNumber, {
        serviceFee: totalServiceFee, // labor + onsite disatukan di sini
        partFee: partFee,
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error bayar:', error);
      alert('Gagal memproses pembayaran. Pastikan koneksi aman.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="p-6 space-y-6">
          <h2 className="text-xl font-black flex items-center gap-2 text-green-700">
            💵 Penyelesaian & Pembayaran
          </h2>

          {/* DUA KOTAK INPUT TERPISAH */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-600 font-bold">Biaya Jasa</Label>
              <Input
                type="number"
                min="0"
                className="text-lg font-medium h-12"
                placeholder="Rp 0..."
                value={laborFee === 0 ? '' : laborFee}
                onChange={(e) => setLaborFee(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-600 font-bold">Biaya Onsite</Label>
              <Input
                type="number"
                min="0"
                className="text-lg font-medium h-12"
                placeholder="Rp 0..."
                value={onsiteFee === 0 ? '' : onsiteFee}
                onChange={(e) => setOnsiteFee(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="p-5 bg-slate-50 rounded-xl space-y-3 border border-slate-200 shadow-inner">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">
                Total Sparepart:
              </span>
              <span className="font-bold text-slate-700">
                {formatIDR(partFee)}
              </span>
            </div>
            {/* TAMPILKAN RINCIAN JIKA DIISI */}
            {laborFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Biaya Jasa:</span>
                <span className="font-bold text-slate-700">
                  {formatIDR(laborFee)}
                </span>
              </div>
            )}
            {onsiteFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">
                  Biaya Kunjungan:
                </span>
                <span className="font-bold text-slate-700">
                  {formatIDR(onsiteFee)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">PPN (11%):</span>
              <span className="font-bold text-blue-600">{formatIDR(ppn)}</span>
            </div>
            <div className="border-t pt-3 mt-2 flex justify-between items-center">
              <span className="font-black text-sm text-slate-500">
                TOTAL BAYAR
              </span>
              <span className="font-black text-2xl text-green-700">
                {formatIDR(total)}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-300"
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-md shadow-green-200 px-6"
          >
            Selesaikan & Tutup Tiket
          </Button>
        </div>
      </div>
    </div>
  );
}
