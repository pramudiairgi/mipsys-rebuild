"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Stethoscope, Receipt, Printer, Loader2 } from "lucide-react";

// Sesuaikan path import sesuai struktur folder kamu
import { srApi } from "../../../src/features/service-request/services/sr-api";
import { ServiceRequest } from "../../../src/features/service-request/types";
import { DiagnosisModal } from "../../../src/features/service-request/components/DiagnosisModal";
import { PaymentModal } from "../../../src/features/service-request/components/PaymentModal";

export default function ServiceRequestDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  // State Data
  const [sr, setSr] = useState<ServiceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // State UI/Modal
  const [isDiagOpen, setIsDiagOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  
  // State untuk Fix Hydration Error
  const [hasMounted, setHasMounted] = useState(false);

  // 1. Set mounted ke true setelah komponen masuk ke browser
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // 2. Fungsi Fetch Data
  const fetchDetail = async () => {
    try {
      setIsLoading(true);
      const data = await srApi.getOne(id as string);
      setSr(data);
    } catch (error) {
      console.error("Gagal load detail:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Jalankan fetch saat ID berubah atau setelah mounted
  useEffect(() => {
    if (hasMounted) {
      fetchDetail();
    }
  }, [id, hasMounted]);

  // --- PEMBATAS RENDER (Mencegah Hydration Error) ---
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

  // --- TAMPILAN PRO UI (GABUNGAN) ---
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50/30 min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 bg-white p-4 rounded-xl shadow-sm">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="-ml-2 text-muted-foreground hover:text-primary">
            <ChevronLeft className="mr-1 h-4 w-4" /> Kembali ke Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">{sr.sr_number}</h1>
            <Badge className={`${sr.status === "0" ? "bg-blue-500" : sr.status === "1" ? "bg-amber-500" : "bg-green-600"} uppercase text-[10px] px-3 text-white`}>
              {sr.status === "0" ? "Baru" : sr.status === "1" ? "Proses" : "Selesai"}
            </Badge>
          </div>
          <p className="text-slate-500 font-medium">
            Input pada: {new Date(sr.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        
        <div className="flex gap-2">
          {sr.status === "0" && (
            <Button onClick={() => setIsDiagOpen(true)} className="bg-slate-900 h-12 px-6 shadow-lg shadow-slate-200 text-white">
              <Stethoscope className="mr-2 h-5 w-5" /> Isi Diagnosa
            </Button>
          )}
          {sr.status === "1" && (
            <Button onClick={() => setIsPayOpen(true)} className="bg-green-600 hover:bg-green-700 h-12 px-6 shadow-lg shadow-green-100 text-white">
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
                <label className="text-[10px] uppercase font-bold text-slate-400">Nama Customer</label>
                <p className="font-bold text-slate-800 text-lg leading-tight">{sr.customer_name}</p>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Kontak</label>
                <p className="font-medium text-slate-700">{sr.phone_number || "-"}</p>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Alamat</label>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {sr.address_1} <br/> {sr.address_3}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-900 text-white p-5 rounded-xl shadow-lg space-y-1">
             <label className="text-[10px] uppercase font-bold opacity-60">Status Garansi</label>
             <p className="text-xl font-black">{sr.warranty_status || "NON-WARRANTY"}</p>
             <p className="text-[11px] opacity-80 italic">Mode: {sr.service_mode || "Carry-In"}</p>
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
                  <label className="text-[10px] uppercase font-bold text-slate-400">Model Mesin</label>
                  <p className="text-xl font-black text-slate-800">{sr.machine_model}</p>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400">Serial Number</label>
                  <p className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit">{sr.serial_number}</p>
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                <label className="text-[10px] uppercase font-bold text-red-400">Keluhan Kerusakan</label>
                <p className="text-red-700 font-bold leading-tight mt-1">{sr.problem_desc}</p>
              </div>
            </div>
          </div>

          {/* LAPORAN TEKNISI */}
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
              Laporan Hasil Diagnosa
            </h3>
            {sr.technician_name ? (
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                   <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 uppercase">
                      {sr.technician_name.charAt(0)}
                   </div>
                   <div>
                      <p className="font-bold text-slate-800">{sr.technician_name}</p>
                      <p className="text-sm text-slate-500">Teknisi Penanggung Jawab</p>
                   </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg italic text-slate-700 border-l-4 border-slate-300">
                  "{sr.tech_remarks || "Tidak ada catatan tambahan."}"
                </div>

                {/* TABEL BIAYA */}
                <div className="pt-4 space-y-2">
                  <div className="flex justify-between text-sm py-2 border-b">
                    <span className="text-slate-500">Estimasi Biaya Sparepart</span>
                    <span className="font-bold">Rp {(sr.part_cost || 0).toLocaleString()}</span>
                  </div>
                  {sr.status === "2" && (
                    <>
                      <div className="flex justify-between text-sm py-2 border-b">
                        <span className="text-slate-500">Biaya Jasa (Labor)</span>
                        <span className="font-bold">Rp {(sr.labor_cost || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm py-2 border-b text-blue-600">
                        <span className="font-medium">PPN (11%)</span>
                        <span className="font-bold">Rp {(sr.tax_amount || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xl py-4 text-green-700">
                        <span className="font-black">TOTAL AKHIR</span>
                        <span className="font-black underline underline-offset-4">Rp {(sr.total_amount || 0).toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed rounded-xl text-slate-400">
                Menunggu diagnosa dari teknisi...
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