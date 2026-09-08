'use client';

import React, { useState, useEffect } from 'react';
import {
  ClipboardText,
  Package,
  Wallet,
  TrendUp,
  ActivityIcon as Activity,
  ClockClockwise,
  Users,
  CheckCircle,
  Timer,
  WarningCircle,
  GlobeHemisphereWest,
} from '@phosphor-icons/react';
import Link from 'next/link';
import { useAuth } from '@/src/lib/auth-context';
import { srApi } from '@/src/features/service-request/api/sr-api';
import { apiClient } from '@/src/lib/api-client';
import { toast } from 'react-hot-toast';
import { LoadingSkeleton } from '@/src/components/ui/loading-skeleton';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/src/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/src/components/ui/table';
import { Button } from '@/src/components/ui/button';

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [activities, setActivities] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inService: 0,
    awaitingParts: 0,
    ready: 0,
    closed: 0,
    cancelled: 0,
    customers: 0,
    technicians: 0,
  });
  const [financeStats, setFinanceStats] = useState({
    paidCount: 0,
    totalInvoices: 0,
    totalRevenue: 0,
  });

  const fetchData = async () => {
    try {
      const basePromises = [
        srApi.getActivities(),
        srApi.getDashboardStats(),
      ] as const;
      const adminPromises = isAdmin
        ? [
            apiClient.get('/finance/stats').then((r) => r.data),
            apiClient.get('/customers/count').then((r) => r.data),
            apiClient.get('/staff/count', { params: { role: 'TECHNICIAN' } }).then((r) => r.data),
          ]
        : [];
      const results = await Promise.all([...basePromises, ...adminPromises]);
      const [logsData, statsData, financeData, customerCount, techCount] = [
        results[0],
        results[1],
        ...(isAdmin ? [results[2], results[3], results[4]] : [null, null, null]),
      ] as any;
      setActivities(logsData);
      if (isAdmin) {
        setStats({ ...statsData, customers: customerCount.count, technicians: techCount.count });
        setFinanceStats(financeData);
      } else {
        setStats(statsData);
      }
    } catch (error: any) {
      toast.error('Gagal memuat data dashboard');
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const billingRate =
    financeStats.totalInvoices > 0
      ? Math.round((financeStats.paidCount / financeStats.totalInvoices) * 100)
      : 0;

  const partsProgress =
    stats.total > 0 ? Math.round((stats.awaitingParts / stats.total) * 100) : 0;

  const getIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DONE':
        return (
          <CheckCircle
            size={14}
            className="text-accent-foreground"
            aria-label="Status: Selesai"
          />
        );
      case 'SERVICE':
        return (
          <Timer
            size={14}
            className="text-primary-foreground"
            aria-label="Status: Dalam Servis"
          />
        );
      default:
        return (
          <WarningCircle
            size={14}
            className="text-chart-4"
            aria-label="Status: Pending"
          />
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <section className="space-y-1.5 text-left">
        <h2 className="text-3xl font-bold text-foreground tracking-tight">
          Selamat Datang,{' '}
          <span className="text-primary">{user?.username ?? 'User'}.</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          Sistem optimal. {stats.pending} tugas prioritas terdeteksi.
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
        <Card className="hover:border-primary/40 transition-all">
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <ClipboardText size={20} />
            </div>
            <span className="micro-label bg-primary/15 text-primary px-3 py-1 rounded-full">
              Servis
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-display font-bold text-foreground tracking-tighter">
              {stats.total}
            </p>
            <p className="text-xs text-muted-foreground">Total Antrean</p>
          </CardContent>
          <CardFooter className="justify-between micro-label">
            <span className="text-chart-4">Pending: {stats.pending}</span>
            <span className="text-primary">Proses: {stats.inService}</span>
            <span className="text-accent">Selesai: {stats.ready}</span>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl w-fit">
              <Package size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-display font-bold text-foreground tracking-tighter">
              {stats.awaitingParts}
            </p>
            <p className="text-xs text-muted-foreground">Part Urgent</p>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2">
            <div className="w-full bg-muted/50 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-600 h-full rounded-full transition-all"
                style={{ width: `${partsProgress}%` }}
              />
            </div>
            <p className="micro-label text-muted-foreground">
              {partsProgress}% dari total antrean
            </p>
          </CardFooter>
        </Card>

        {isAdmin && (
          <Card>
            <CardHeader className="pb-2">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl w-fit">
                <Wallet size={20} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-display font-bold text-foreground tracking-tighter">
                {billingRate}%
              </p>
              <p className="text-xs text-muted-foreground">Penagihan Selesai</p>
            </CardContent>
            <CardFooter>
              <p className="micro-label text-accent flex items-center gap-1 bg-primary/10 w-fit px-2 py-0.5 rounded">
                <TrendUp size={12} />{' '}
                {financeStats.paidCount}/{financeStats.totalInvoices} faktur
              </p>
            </CardFooter>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <Activity size={20} className="text-primary" />
            <div className="h-2 w-2 bg-accent rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,1)]" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display font-bold text-foreground tracking-tighter">
              99.9%
            </p>
            <p className="micro-label text-primary/40">Uptime</p>
          </CardContent>
          <CardFooter>
            <p className="micro-label text-accent border border-accent/30 w-fit px-2 py-0.5 rounded bg-accent/5">
              DB: Terhubung
            </p>
          </CardFooter>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2">
              <ClockClockwise size={16} /> Aktivitas Terkini
            </CardTitle>
                            <Link href="/service-request">
                              <Button variant="outline" size="sm">
                                Log Lengkap
                              </Button>
                            </Link>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto">
            {loadingLogs ? (
              <div className="space-y-4 py-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <LoadingSkeleton variant="text" className="w-12 h-4" />
                    <LoadingSkeleton variant="avatar" className="w-8 h-8" />
                    <LoadingSkeleton variant="text" className="flex-1" />
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pengguna</TableHead>
                    <TableHead>Tugas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((log: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-[10px] font-bold">
                        {log.time}
                      </TableCell>
                      <TableCell>{getIcon(log.status)}</TableCell>
                      <TableCell className="font-bold text-xs uppercase tracking-tight">
                        {log.user}
                      </TableCell>
                      <TableCell className="text-muted-foreground italic text-xs">
                        {log.task}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-muted/50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Users size={20} className="text-primary" />
              </div>
              <CardTitle>Database Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 p-3 rounded-xl text-center">
                  <p className="text-2xl font-display font-bold text-foreground tracking-tighter">
                    {stats.customers}
                  </p>
                  <p className="micro-label text-muted-foreground mt-1">
                    Pelanggan
                  </p>
                </div>
                <div className="bg-muted/30 p-3 rounded-xl text-center">
                  <p className="text-2xl font-display font-bold text-foreground tracking-tighter">
                    {stats.technicians}
                  </p>
                  <p className="micro-label text-muted-foreground mt-1">
                    Teknisi
                  </p>
                </div>
              </div>
                              <Link href="/master-data">
                                <Button variant="outline" className="w-full">
                                  Kelola Database
                                </Button>
                              </Link>
            </CardContent>
          </Card>
        )}
      </section>

      <footer className="pt-8 border-t border-border/20 flex flex-col md:flex-row justify-between items-center gap-4 micro-label text-muted-foreground text-center md:text-left">
        <div className="flex items-center gap-2">
          <GlobeHemisphereWest size={12} className="text-primary" /> Semarang,
          Indonesia
        </div>
        <p>&copy; 2026 PT Mitrainfoparama &mdash; V2.1.0-AAA</p>
      </footer>
    </div>
  );
}
