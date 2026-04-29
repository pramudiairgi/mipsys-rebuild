'use client';

import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Users,
  Package,
  Wallet,
  ShieldCheck,
  TrendingUp,
  Activity,
  History,
  CheckCircle2,
  AlertCircle,
  Clock,
  Globe,
  RefreshCcw,
} from 'lucide-react';
import { srApi } from '@/src/features/service-request/services/sr-api';

export default function DashboardPage() {
  const [activities, setActivities] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    proses: 0,
    selesai: 0,
    customers: 0,
    technicians: 0,
  });

  const fetchData = async () => {
    try {
      const [logsData, statsData] = await Promise.all([
        srApi.getActivities(),
        srApi.getDashboardStats(),
      ]);
      setActivities(logsData);
      setStats(statsData);
    } catch (error) {
      console.error('Sync Error:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DONE':
        return <CheckCircle2 size={14} className="text-emerald-700" />;
      case 'SERVICE':
        return <Clock size={14} className="text-blue-700" />;
      default:
        return <AlertCircle size={14} className="text-amber-700" />;
    }
  };

  return (
    /* Container dikurangi paddingnya agar tidak terlalu banyak whitespace terbuang */
    <div className="px-6 md:px-10 py-8 max-w-360 mx-auto space-y-8 animate-in fade-in duration-500">
      {/* --- HEADER: COMPACT & PROFESSIONAL --- */}
      <section className="space-y-1.5 text-left">
        <div className="flex items-center gap-2 w-fit px-2.5 py-0.5 bg-blue-100 text-blue-900 rounded text-[9px] font-black uppercase tracking-widest border border-blue-200">
          <ShieldCheck size={10} /> Keamanan Terverifikasi
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight">
          Selamat Datang, <span className="text-blue-700">Mas Nanda.</span>
        </h2>
        <p className="text-xs md:text-sm text-slate-600 font-bold italic tracking-tight">
          "Sistem optimal. {stats.pending} tugas prioritas terdeteksi."
        </p>
      </section>

      {/* --- STATS GRID: TIGHTER CARDS --- */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
        {/* Service Card - Rounding dikurangi ke 2xl agar lebih formal */}
        <article className="bg-white border-2 border-slate-100 rounded-2xl p-6 shadow-sm hover:border-blue-400 transition-all group flex flex-col justify-between min-h-40">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-blue-50 text-blue-800 rounded-xl group-hover:scale-105 transition-transform">
              <ClipboardList size={20} />
            </div>
            <span className="text-[9px] font-black bg-blue-700 text-white px-3 py-1 rounded-full uppercase tracking-widest">
              Servis
            </span>
          </div>
          <div className="mt-4">
            <p className="text-4xl font-black text-slate-950 tracking-tighter">
              {stats.total}
            </p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Total Antrean
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between text-[10px] font-black uppercase">
            <span className="text-amber-700">Pending: {stats.pending}</span>
            <span className="text-blue-700">Proses: {stats.proses}</span>
            <span className="text-emerald-700">Selesai: {stats.selesai}</span>
          </div>
        </article>

        {/* Inventory Card */}
        <article className="bg-white border-2 border-slate-100 rounded-2xl p-6 shadow-sm min-h-40 flex flex-col justify-between">
          <div className="p-2.5 bg-amber-50 text-amber-800 rounded-xl w-fit">
            <Package size={20} />
          </div>
          <div>
            <p className="text-4xl font-black text-slate-950 tracking-tighter">
              05
            </p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Part Urgent
            </p>
          </div>
          <div className="mt-4 space-y-2">
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-600 h-full w-[60%]" />
            </div>
            <p className="text-[9px] text-slate-700 font-black uppercase">
              3 Approval Manajer
            </p>
          </div>
        </article>

        {/* Finance Card */}
        <article className="bg-white border-2 border-slate-100 rounded-2xl p-6 shadow-sm min-h-40 flex flex-col justify-between">
          <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl w-fit">
            <Wallet size={20} />
          </div>
          <div>
            <p className="text-4xl font-black text-slate-950 tracking-tighter">
              82%
            </p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Penagihan Selesai
            </p>
          </div>
          <p className="mt-4 text-[10px] font-black text-emerald-800 flex items-center gap-1 uppercase tracking-tight bg-emerald-50 w-fit px-2 py-0.5 rounded">
            <TrendingUp size={12} /> +5.2%
          </p>
        </article>

        {/* System Health Card */}
        <article className="bg-[#020617] text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden border border-blue-900/30">
          <div className="flex items-center justify-between">
            <Activity size={20} className="text-blue-400" />
            <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,1)]" />
          </div>
          <div>
            <p className="text-3xl font-black italic tracking-tighter">99.9%</p>
            <p className="text-[10px] text-blue-200 font-black uppercase tracking-widest">
              Uptime
            </p>
          </div>
          <p className="mt-4 text-[9px] text-emerald-400 font-black uppercase tracking-widest border border-emerald-400/30 w-fit px-2 py-0.5 rounded bg-emerald-400/5">
            DB: Terhubung
          </p>
        </article>
      </section>

      {/* --- LOWER SECTION: BALANCED SPACING --- */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        {/* AKTIVITAS TERKINI */}
        <div className="lg:col-span-2 bg-white border-2 border-slate-100 rounded-2xl p-7 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <History size={20} className="text-slate-800" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-950">
                Aktivitas Terkini
              </h3>
            </div>
            <button className="text-[10px] font-black text-blue-800 hover:text-blue-600 underline uppercase tracking-widest">
              Log Lengkap
            </button>
          </div>

          <div className="space-y-5">
            {loadingLogs ? (
              <div className="py-10 flex flex-col items-center gap-3 text-slate-800">
                <RefreshCcw className="w-6 h-6 animate-spin text-slate-300" />
              </div>
            ) : (
              activities.map((log: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-5 group animate-in slide-in-from-left-4 duration-500"
                >
                  <span className="text-slate-900 font-mono w-12 text-[10px] font-black border-r border-slate-100">
                    {log.time}
                  </span>
                  <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors border border-transparent">
                    {getIcon(log.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-black text-slate-950 mr-2 uppercase tracking-tight text-[11px]">
                      {log.user}
                    </span>
                    <span className="text-slate-600 italic truncate block md:inline font-bold text-[11px]">
                      "{log.task}"
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* DATABASE OVERVIEW */}
        <div className="bg-slate-50 border-2 border-slate-200 border-dashed rounded-2xl p-7 flex flex-col justify-center items-center text-center">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md border border-slate-200 mb-5">
            <Users size={24} className="text-blue-800" />
          </div>
          <h3 className="text-sm font-black text-slate-950 uppercase tracking-tighter mb-1">
            Database Overview
          </h3>
          <p className="text-[9px] text-slate-600 font-black mb-6 uppercase tracking-widest">
            Data Terpusat
          </p>

          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <p className="text-2xl font-black text-slate-950 tracking-tighter">
                {stats.customers}
              </p>
              <p className="text-[9px] font-black text-slate-500 uppercase mt-1">
                Pelanggan
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <p className="text-2xl font-black text-slate-950 tracking-tighter">
                {stats.technicians}
              </p>
              <p className="text-[9px] font-black text-slate-500 uppercase mt-1">
                Teknisi
              </p>
            </div>
          </div>

          <button className="mt-8 w-full py-3.5 bg-slate-950 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-800 transition-all shadow-lg active:scale-95">
            Kelola Database
          </button>
        </div>
      </section>

      {/* --- FOOTER: MINIMALIST --- */}
      <footer className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] text-center md:text-left">
        <div className="flex items-center gap-2">
          <Globe size={12} className="text-blue-800" /> Semarang, Indonesia
        </div>
        <p className="text-slate-400">© 2026 PT Mitrainfoparama — V2.1.0-AAA</p>
      </footer>
    </div>
  );
}
