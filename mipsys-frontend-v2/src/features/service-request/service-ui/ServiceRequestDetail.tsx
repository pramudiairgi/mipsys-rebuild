'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import {
  ArrowLeft,
  Printer,
  Stethoscope,
  User,
  Smartphone,
  MapPin,
  Printer as PrinterIcon,
  AlertCircle,
  Loader2,
  Wrench,
  Receipt,
  RefreshCcw,
  Settings2,
} from 'lucide-react';
import Link from 'next/link';
import { srApi } from '../services/sr-api';
import { DiagnosisModal } from './DiagnosisModal';
import { ServicePrintTemplate } from './ServicePrintTemplate'; // Pastikan file ini sudah dibuat
import { ServiceRequest } from '../types';

interface ServiceRequestDetailProps {
  id: string;
}

export default function ServiceRequestDetail({
  id,
}: ServiceRequestDetailProps) {
  const [data, setData] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDiagnosisOpen, setIsDiagnosisOpen] = useState(false);

  // --- LOGIKA PRINT ---
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Service_Report_${data?.ticketNumber}`,
  });

  // --- LOGIKA FETCHING ---
  const fetchTicketDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await srApi.getOne(id);
      setData(response || null);
    } catch (error: any) {
      console.error('Gagal menarik data:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchTicketDetail();
  }, [id, fetchTicketDetail]);

  // --- HELPER & KONDISI ---
  const isChecked = !!data?.remarksHistory;
  const showDiagnosisButton = data?.statusSystem !== 'CLOSED';

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'WAITING CHECK':
        return 'bg-blue-600 hover:bg-blue-600';
      case 'PENDING PART':
        return 'bg-amber-500 hover:bg-amber-500';
      case 'SERVICE':
        return 'bg-indigo-600 hover:bg-indigo-600';
      case 'DONE':
        return 'bg-green-600 hover:bg-green-600';
      case 'CANCEL':
        return 'bg-red-600 hover:bg-red-600';
      default:
        return 'bg-slate-500 hover:bg-slate-500';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 space-y-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-sm font-bold text-slate-400 animate-pulse uppercase tracking-widest">
          Sinkronisasi Data Mipsys...
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans animate-in fade-in duration-500">
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm gap-4">
        <div className="space-y-1 text-left">
          <Link
            href="/service-request"
            className="text-[10px] font-black text-slate-400 flex items-center gap-1 hover:text-blue-600 transition-all uppercase tracking-widest"
          >
            <ArrowLeft size={12} strokeWidth={3} /> Kembali ke List
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">
              {data.ticketNumber}
            </h1>
            <Badge
              className={`${getStatusColor(data.statusService)} text-white border-none px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/10`}
            >
              {data.statusService}
            </Badge>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">
            Penerimaan:{' '}
            {new Date(data.incomingDate).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {showDiagnosisButton && (
            <Button
              onClick={() => setIsDiagnosisOpen(true)}
              className={`
                flex-1 md:flex-none h-12 px-6 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl
                ${
                  isChecked
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                    : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20'
                }
              `}
            >
              {isChecked ? (
                <>
                  <RefreshCcw size={18} className="mr-2" /> Update Progres
                </>
              ) : (
                <>
                  <Stethoscope size={18} className="mr-2" /> Isi Diagnosa
                </>
              )}
            </Button>
          )}

          <Button
            onClick={handlePrint}
            variant="outline"
            size="icon"
            className="shrink-0 h-12 w-12 rounded-xl border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <Printer size={20} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* --- KOLOM INFO (KIRI) --- */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm bg-white overflow-hidden rounded-2xl">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-left">
                Data Pelanggan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5 text-left">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Nama
                </p>
                <p className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase">
                  <User size={14} className="text-blue-500" />{' '}
                  {data.customerName}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Telepon
                </p>
                <p className="font-bold text-slate-700 flex items-center gap-2 text-sm font-mono">
                  <Smartphone size={14} className="text-blue-500" />{' '}
                  {data.customerPhone || '-'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Alamat
                </p>
                <p className="text-xs font-bold text-slate-500 leading-relaxed flex items-start gap-2">
                  <MapPin size={14} className="text-blue-500 mt-0.5 shrink-0" />{' '}
                  {data.customerAddress}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="bg-[#020617] text-white p-6 rounded-2xl shadow-2xl relative overflow-hidden text-left border border-white/5">
            <div className="relative z-10">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-2">
                Tipe Unit
              </p>
              <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">
                {data.serviceType}
              </h2>
              <div className="mt-4 inline-flex items-center px-2 py-1 bg-white/10 rounded text-[9px] font-bold uppercase tracking-widest border border-white/10">
                Mode: Carry-In Service
              </div>
            </div>
            <PrinterIcon className="absolute -right-6 -bottom-6 w-28 h-28 opacity-10 rotate-12" />
          </div>
        </div>

        {/* --- KOLOM KONTEN (KANAN) --- */}
        <div className="md:col-span-2 space-y-6 text-left">
          <Card className="border-slate-200 shadow-sm bg-white overflow-hidden rounded-2xl">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-6 space-y-5 border-r border-slate-100">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Identitas Perangkat
                  </h3>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Model
                      </p>
                      <p className="text-2xl font-black text-slate-900 tracking-tighter uppercase">
                        {data.modelName}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Serial Number
                      </p>
                      <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-mono text-sm font-black border border-blue-100 uppercase tracking-wider">
                        {data.serialNumber}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-red-50/20 relative overflow-hidden group">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle size={14} className="text-red-500" />
                    <label className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                      Keluhan Pelanggan
                    </label>
                  </div>
                  <p className="text-lg font-black text-red-700 leading-tight italic relative z-10">
                    "{data.problemDescription}"
                  </p>
                  <AlertCircle className="absolute -right-2 -bottom-2 w-16 h-16 text-red-500/5 rotate-12" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* HASIL DIAGNOSA */}
          <Card className="border-slate-200 shadow-xl shadow-slate-200/50 bg-white overflow-hidden rounded-[2rem]">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-8 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings2 size={16} className="text-slate-400" />
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  Laporan Pemeriksaan Teknisi
                </CardTitle>
              </div>
              {isChecked && (
                <Badge className="bg-emerald-100 text-emerald-700 border-none text-[9px] font-black uppercase tracking-tighter rounded-full px-3">
                  Verification Complete
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-8">
              {!isChecked ? (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/30">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-300 border border-slate-100">
                    <Wrench size={28} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                      Queueing Phase
                    </p>
                    <p className="text-xs text-slate-400 font-medium max-w-50 leading-relaxed">
                      Unit sedang menunggu antrean pengerjaan teknisi.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
                  <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 relative overflow-hidden shadow-inner">
                    <div className="absolute right-6 top-6 text-slate-200/50">
                      <Wrench size={60} strokeWidth={3} />
                    </div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-4">
                      Final Technical Analysis
                    </label>
                    <p className="text-base text-slate-700 leading-relaxed font-bold relative z-10 max-w-2xl">
                      {data.remarksHistory}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 rounded-[1.5rem] border border-slate-100 bg-white shadow-sm flex items-center gap-5 group hover:border-blue-200 transition-colors">
                      <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 transition-transform group-hover:scale-110">
                        <Receipt size={24} strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Total Billing Estimation
                        </p>
                        <p className="text-3xl font-black text-[#020617] tracking-tighter">
                          <span className="text-sm text-blue-600 mr-1 font-bold">
                            IDR
                          </span>
                          {(
                            Number(data.partFee || 0) +
                            Number(data.serviceFee || 0)
                          ).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>

                    <div className="p-6 rounded-[1.5rem] border border-amber-100 bg-amber-50/30 flex items-center gap-5">
                      <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                      <div>
                        <p className="text-[9px] font-black text-amber-600/60 uppercase tracking-widest mb-1">
                          Current Maintenance Status
                        </p>
                        <p className="text-xl font-black text-amber-700 uppercase tracking-widest italic">
                          {data.statusService}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* --- MODAL DIAGNOSA --- */}
      <DiagnosisModal
        sr={data}
        isOpen={isDiagnosisOpen}
        onClose={() => setIsDiagnosisOpen(false)}
        onSuccess={() => {
          setIsDiagnosisOpen(false);
          fetchTicketDetail();
        }}
      />

      {/* --- TEMPLATE PRINT (HIDDEN) --- */}
      <div className="hidden">
        {data && <ServicePrintTemplate ref={printRef} data={data} />}
      </div>
    </div>
  );
}
