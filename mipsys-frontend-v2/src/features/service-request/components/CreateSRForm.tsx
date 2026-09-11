'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/lib/auth-context';
import {
  Printer,
  User,
  Smartphone,
  MapPin,
  AlertCircle,
  Loader2,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

// --- IMPORT DARI STRUKTUR FEATURE (Anti-Defect) ---
import { serviceRequestSchema, type SRFormValues } from '../schemas/sr-schema';
import { srApi } from '../api/sr-api';

// Shadcn UI (Sesuaikan path jika berbeda)
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/src/components/ui/form';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';

export function CreateSRForm() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SRFormValues>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      customerName: '',
      phone: '',
      address: '',
      modelName: '',
      serialNumber: '',
      problemDescription: '',
      serviceType: 'NON_WARRANTY',
      customerType: 'PERSONAL',
    },
  });

  // --- HANDLER SUBMIT (Simple Toast & DoD Standard) ---
  const onSubmit = async (data: SRFormValues) => {
    setIsLoading(true);
    try {
      const result = await srApi.create({ ...data, adminId: user?.staffId });

      // Menggunakan Simple Toast (String Only) sesuai permintaan sebelumnya
      toast.success(
        `Sukses! Tiket ${result.ticketNumber} untuk ${data.customerName} berhasil dibuat.`,
      );

      form.reset();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMsg =
        err.response?.data?.message || 'Gagal menyambung ke server';
      toast.error(
        `Gagal: ${Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-300">
      <header className="mb-10 text-left px-4">
        <button
          type="button"
          onClick={() => router.push('/service-request')}
          className="mb-6 flex items-center gap-2 text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Kembali
        </button>
        <h1 className="text-5xl font-display font-bold text-[var(--foreground)] tracking-tight flex items-center gap-3">
          <div className="p-2 bg-[var(--primary)] rounded-xl" aria-hidden="true">
            <Printer className="text-[var(--primary-foreground)] w-8 h-8" />
          </div>
          Service Requests Entry
        </h1>
        <p className="text-[var(--muted-foreground)] mt-2 font-medium">
          Pendaftaran Unit Epson Masuk •{' '}
          <span className="text-[var(--primary)] font-bold">MIP SEMARANG</span>
        </p>
      </header>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 px-4 pb-28"
        >
          <section className="bg-[var(--card)] border border-border/20 rounded-3xl shadow-sm overflow-hidden text-left transition-all hover:border-primary/30">
            <div
              className="bg-[var(--muted)]/50 px-6 py-4 border-b border-border/20 flex items-center justify-between"
              aria-hidden="true"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-black text-[var(--primary-foreground)]">
                  01
                </span>
                <h2 className="font-bold text-[var(--foreground)] uppercase tracking-wider text-xs">
                  Informasi Pelanggan
                </h2>
              </div>
              <User size={18} className="text-[var(--muted-foreground)]" />
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="micro-label text-[var(--muted-foreground)]">
                        Nama Lengkap / Instansi
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-12 bg-[var(--card)] border-border/30 rounded-xl"
                          placeholder="Bpk. Nanda / Kantor Pajak"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs font-bold" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="micro-label text-[var(--muted-foreground)]">
                        WhatsApp / Telepon
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Smartphone
                            size={16}
                            className="absolute left-4 top-4 text-[var(--muted-foreground)]"
                            aria-hidden="true"
                          />
                          <Input
                            className="h-12 pl-10 bg-[var(--card)] border-border/30 rounded-xl"
                            placeholder="0812..."
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs font-bold" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="micro-label text-[var(--muted-foreground)]">
                      Alamat Lengkap
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin
                          size={16}
                          className="absolute left-4 top-4 text-[var(--muted-foreground)]"
                          aria-hidden="true"
                        />
                        <Textarea
                          className="min-h-24 pl-10 bg-[var(--card)] border-border/30 rounded-xl"
                          placeholder="Jl. Gajahmada No. XX, Semarang..."
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs font-bold" />
                  </FormItem>
                )}
              />
            </div>
          </section>

          <section className="bg-[var(--card)] border border-border/20 rounded-3xl shadow-sm overflow-hidden text-left transition-all hover:border-primary/30">
            <div
              className="bg-[var(--muted)]/50 px-6 py-4 border-b border-border/20 flex items-center justify-between"
              aria-hidden="true"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-black text-[var(--primary-foreground)]">
                  02
                </span>
                <h2 className="font-bold text-[var(--foreground)] uppercase tracking-wider text-xs">
                  Detail Unit & Masalah
                </h2>
              </div>
              <AlertCircle size={18} className="text-[var(--muted-foreground)]" />
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="modelName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="micro-label text-[var(--muted-foreground)]">
                        Model Mesin
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-12 bg-[var(--card)] border-border/30 rounded-xl uppercase font-bold"
                          placeholder="L3110"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="micro-label text-[var(--muted-foreground)]">
                        Serial Number (S/N)
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-12 bg-[var(--card)] border-border/30 rounded-xl uppercase font-mono"
                          placeholder="X7YZ..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="problemDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="micro-label text-[var(--muted-foreground)]">
                      Keluhan Pelanggan
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-32 bg-[var(--card)] border-border/30 rounded-xl italic"
                        placeholder="Contoh: Hasil print garis, mati total..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          {isAdmin ? (
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full md:w-auto h-14 px-12 font-black text-lg rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2
                  className="w-5 h-5 motion-safe:animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <>
                  SIMPAN TIKET
                <ChevronRight size={20} aria-hidden="true" />
              </>
            )}
            </Button>
          ) : (
            <p className="text-sm font-bold text-muted-foreground text-center py-4 border border-dashed rounded-xl">
              Hanya admin dapat membuat tiket
            </p>
          )}
        </form>
      </Form>
    </div>
  );
}
