'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  Stethoscope,
  Receipt,
  Printer,
  Loader2,
} from 'lucide-react';

// Sesuaikan path import sesuai struktur folder kamu
import { srApi } from '../../../src/features/service-request/services/sr-api';
import { ServiceRequest } from '../../../src/features/service-request/types';
import { DiagnosisModal } from '../../../src/features/service-request/components/DiagnosisModal';
import { PaymentModal } from '../../../src/features/service-request/components/PaymentModal';

export default function ServiceRequestDetailPage() {
  const { id } = useParams(); // URL Param (bisa berupa SR-XXXX)
  const router = useRouter();

  // State Data
  const [sr, setSr] = useState<ServiceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // State UI/Modal
  const [isDiagOpen, setIsDiagOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);

  // State untuk Fix Hydration Error
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const fetchDetail = async () => {
    try {
      setIsLoading(true);
      const data = await srApi.getOne(id as string);
      setSr(data);
    } catch (error) {
      console.error('Gagal load detail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasMounted) {
      fetchDetail();
    }
  }, [id, hasMounted]);

  if (!hasMounted) {
    return (
      <div className="p-20 text-center flex flex-col items-center gap-2">
        <Loader2 className="animate-spin h-10 w-10 text-slate-300" />
        <p className="text-slate-500">Menyiapkan halaman...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-20 text-center flex flex-col items-center gap-2">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
        <p className="font-medium">Memuat data unit...</p>
      </div>
    );
  }

  if (!sr) {
    return (
      <div className="p-20 text-center space-y-4">
        <p className="text-xl font-semibold">Data tidak ditemukan.</p>
        <Button onClick={() => router.push('/')}>Kembali ke Dashboard</Button>
      </div>
    );
  }

  // --- KALKULASI BIAYA (Menggunakan Number() karena Drizzle mengirim string) ---
  const partFee = Number(sr.partFee) || 0;
  const serviceFee = Number(sr.serviceFee) || 0;
  const taxAmount = (partFee + serviceFee) * 0.11; // PPN 11%
  const totalAmount = partFee + serviceFee + taxAmount;

  // --- LOGIKA STATUS ---
  const isNew = sr.statusService === 'WAITING CHECK';
  const isClosed = sr.statusSystem === 'CLOSED';
  const isProcess = !isNew && !isClosed;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50/30 min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 bg-white p-4 rounded-xl shadow-sm">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="-ml-2 text-muted-foreground hover:text-primary"
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Kembali ke Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              {sr.ticketNumber}
            </h1>
            <Badge
              className={`${isNew ? 'bg-blue-500' : isProcess ? 'bg-amber-500' : 'bg-green-600'} uppercase text-[10px] px-3 text-white`}
            >
              {sr.statusService || 'UNKNOWN'}
            </Badge>
          </div>
          <p className="text-slate-500 font-medium">
            Input pada:{' '}
            {sr.createdAt
              ? new Date(sr.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : '-'}
          </p>
        </div>

        <div className="flex gap-2">
          {/* Tombol Diagnosa muncul jika statusnya WAITING CHECK */}
          {isNew && (
            <Button
              onClick={() => setIsDiagOpen(true)}
              className="bg-slate-900 h-12 px-6 shadow-lg shadow-slate-200 text-white"
            >
              <Stethoscope className="mr-2 h-5 w-5" /> Isi Diagnosa
            </Button>
          )}
          {/* Tombol Kasir muncul jika tiket belum ditutup (CLOSED) tapi sudah diperiksa */}
          {isProcess && (
            <Button
              onClick={() => setIsPayOpen(true)}
              className="bg-green-600 hover:bg-green-700 h-12 px-6 shadow-lg shadow-green-100 text-white"
            >
              <Receipt className="mr-2 h-5 w-5" /> Proses Kasir
            </Button>
          )}
          <Button variant="outline" className="h-12 px-4 border-slate-300">
            <Printer className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KOLOM 1: PELANGGAN */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              Informasi Pelanggan
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">
                  Nama Customer
                </label>
                <p className="font-bold text-slate-800 text-lg leading-tight">
                  {sr.customerName}
                </p>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">
                  Kontak
                </label>
                <p className="font-medium text-slate-700">
                  {sr.customerPhone || '-'}
                </p>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">
                  Alamat
                </label>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {sr.customerAddress || 'Tidak ada data alamat'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-900 text-white p-5 rounded-xl shadow-lg space-y-1">
            <label className="text-[10px] uppercase font-bold opacity-60">
              Status Garansi
            </label>
            <p className="text-xl font-black">{sr.serviceType}</p>
            <p className="text-[11px] opacity-80 italic">Mode: Carry-In</p>
          </div>
        </div>

        {/* KOLOM 2: PERANGKAT & DIAGNOSA */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
              Rincian Perangkat & Keluhan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">
                    Model Mesin
                  </label>
                  <p className="text-xl font-black text-slate-800">
                    {sr.modelName}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">
                    Serial Number
                  </label>
                  <p className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit">
                    {sr.serialNumber}
                  </p>
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                <label className="text-[10px] uppercase font-bold text-red-400">
                  Keluhan / Problem
                </label>
                <p className="text-red-700 font-bold leading-tight mt-1">
                  {sr.problemDescription || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* LAPORAN HASIL DIAGNOSA */}
          <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Stethoscope className="h-4 w-4" /> Laporan Hasil Diagnosa
            </h3>

            {/* LOGIKA: Cek apakah sudah ada tindakan teknisi (problemDescription berubah atau status bukan WAITING) */}
            {!isNew || sr.technicianFixId ? (
              <div className="space-y-6">
                {/* 1. INFO TEKNISI */}
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center font-bold text-white shadow-md">
                    {sr.technicianFixId ? 'T' : '?'}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">
                      Teknisi Penanggung Jawab
                    </p>
                    <p className="font-bold text-slate-800">
                      {/* Jika Mas sudah join table staff, ganti dengan sr.technicianName */}
                      ID Teknisi: {sr.technicianFixId || 'Belum diassign'}
                    </p>
                  </div>
                </div>

                {/* 2. HASIL ANALISA (CATATAN) */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                    Hasil Analisa & Tindakan
                  </label>
                  <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                    <p className="text-slate-700 leading-relaxed italic">
                      "{sr.problemDescription || 'Tidak ada catatan teknisi'}"
                    </p>
                  </div>
                </div>

                {/* 3. RINCIAN BIAYA & SPAREPART */}
                <div className="pt-4 border-t border-dashed space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">
                      Biaya Suku Cadang (Sparepart)
                    </span>
                    <span className="font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-full">
                      Rp {partFee.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* HANYA MUNCUL JIKA SUDAH DI KASIR (CLOSED) */}
                  {isClosed && (
                    <div className="space-y-3 pt-3 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium">
                          Biaya Jasa Servis
                        </span>
                        <span className="font-bold text-slate-900">
                          Rp {serviceFee.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-blue-600">
                        <span className="font-medium">Pajak PPN (11%)</span>
                        <span className="font-bold">
                          Rp {taxAmount.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex justify-between text-xl pt-4 border-t-2 border-slate-900 items-baseline">
                        <span className="font-black text-slate-900 uppercase">
                          Total Akhir
                        </span>
                        <div className="text-right">
                          <span className="text-2xl font-black text-green-600">
                            Rp {totalAmount.toLocaleString('id-ID')}
                          </span>
                          <p className="text-[10px] text-slate-400 font-bold uppercase italic">
                            Lunas / Terbayar
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Tampilan saat Masih Baru (Waiting) */
              <div className="text-center py-16 border-2 border-dashed rounded-2xl bg-slate-50/50 flex flex-col items-center gap-3">
                <div className="p-3 bg-white rounded-full shadow-sm">
                  <Loader2 className="h-6 w-6 text-slate-300 animate-spin" />
                </div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                  Menunggu pemeriksaan teknisi...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RENDER MODAL */}
      <DiagnosisModal
        sr={sr}
        isOpen={isDiagOpen}
        onClose={() => setIsDiagOpen(false)}
        onSuccess={fetchDetail}
      />
      <PaymentModal
        sr={sr}
        isOpen={isPayOpen}
        onClose={() => setIsPayOpen(false)}
        onSuccess={fetchDetail}
      />
    </div>
  );
}
