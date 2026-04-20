'use client';

import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { srApi } from '../services/sr-api';
// GUNAKAN SATU SUMBER KEBENARAN (SCHEMA LUAR)
import { serviceRequestSchema, type SRFormValues } from '../schemas/sr-schema';

export function CreateSRForm() {
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
      onsite_cost: 0,
      other_cost: 0,
      customerType: 'PERSONAL',
    },
  });

  // Pantau biaya secara real-time untuk User Experience (UX)
  const onsite = form.watch('onsite_cost');
  const other = form.watch('other_cost');

  // Kalkulasi total dengan pengaman jika nilai bukan angka
  const totalEstimasi = (Number(onsite) || 0) + (Number(other) || 0);

  async function onSubmit(data: SRFormValues) {
    setIsLoading(true);
    try {
      const result = await srApi.create(data);
      alert(
        `Sukses! Tiket ${result.ticketNumber} untuk ${data.customerName} berhasil dibuat.`,
      );
      form.reset();
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || 'Gagal menyambung ke server';
      alert(
        'Gagal: ' + (Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg),
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="p-8 bg-white border rounded-2xl shadow-xl max-w-4xl mx-auto my-10">
      <div className="mb-10 border-b pb-6">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          Buat Service Request Baru
        </h2>
        <p className="text-slate-500 mt-2">
          Pastikan semua data pelanggan dan mesin terisi dengan akurat.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
          {/* SEKSI 1: IDENTITAS PELANGGAN */}
          <section className="space-y-6 p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
            <header className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold">
                01
              </div>
              <h3 className="font-bold text-slate-800 uppercase tracking-wide">
                Informasi Pelanggan
              </h3>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">
                      Nama Lengkap / Perusahaan *
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="bg-white border-slate-200"
                        placeholder="Contoh: PT. Maju Jaya"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">
                      Nomor WhatsApp/Telepon *
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="bg-white border-slate-200"
                        placeholder="0812..."
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
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">
                    Alamat Lengkap Unit *
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      className="bg-white border-slate-200 min-h-[100px]"
                      placeholder="Sertukan Kota, Kecamatan, dan Kode Pos..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* SEKSI 2: KONDISI PERANGKAT */}
          <section className="space-y-6 p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
            <header className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 text-white rounded-lg flex items-center justify-center font-bold">
                02
              </div>
              <h3 className="font-bold text-slate-800 uppercase tracking-wide">
                Detail Perangkat & Kerusakan
              </h3>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="modelName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Model Mesin *</FormLabel>
                    <FormControl>
                      <Input
                        className="bg-white border-slate-200"
                        placeholder="Epson L3110"
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
                    <FormLabel className="font-bold">Serial Number *</FormLabel>
                    <FormControl>
                      <Input
                        className="bg-white border-slate-200"
                        placeholder="X1Y2Z3..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="serviceType"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="font-bold">
                      Status Garansi *
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white border-slate-200 h-12">
                          <SelectValue placeholder="Pilih Tipe Servis" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="WARRANTY">
                          WARRANTY (Unit Garansi Resmi)
                        </SelectItem>
                        <SelectItem value="NON_WARRANTY">
                          NON-WARRANTY (Servis Berbayar)
                        </SelectItem>
                      </SelectContent>
                    </Select>
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
                  <FormLabel className="font-bold">
                    Deskripsi Masalah / Keluhan *
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      className="bg-white border-slate-200 min-h-[120px]"
                      placeholder="Jelaskan secara mendetail gejala kerusakan..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* SEKSI 3: FINANSIAL (BOTTOM BAR) */}
          <div className="sticky bottom-4 p-6 bg-blue-900 rounded-2xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 transition-all border-t border-blue-800">
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="onsite_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-blue-200 text-xs font-bold uppercase">
                      Biaya Onsite
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        className="w-32 bg-blue-800 border-blue-700 text-white h-12"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="other_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-blue-200 text-xs font-bold uppercase">
                      Biaya Lain
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        className="w-32 bg-blue-800 border-blue-700 text-white h-12"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="text-center md:text-right">
              <p className="text-blue-300 text-xs font-black uppercase tracking-widest">
                Total Estimasi Awal
              </p>
              <h4 className="text-4xl font-black text-white">
                Rp {totalEstimasi.toLocaleString('id-ID')}
              </h4>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full md:w-auto h-14 px-10 bg-white text-blue-900 hover:bg-blue-50 font-black text-lg transition-transform active:scale-95 shadow-lg"
            >
              {isLoading ? 'MEMPROSES...' : 'SIMPAN TIKET'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
