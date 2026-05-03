import { useEffect } from 'react';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Wrench,
  ArrowRightCircle,
  PackagePlus,
  Plus,
  Save,
  RefreshCcw,
} from 'lucide-react';

// Shadcn UI Components
import { Dialog, DialogContent, DialogTitle } from '@/src/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/src/components/ui/form';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';

// Internal Features (Logika Bisnis Anda)
import { srApi } from '../services/sr-api';
import { ServiceRequest } from '../types';
import {
  updateDiagnosisSchema,
  UpdateDiagnosisValues,
} from '../schemas/sr-schema';
import { PartItemRow } from './PartItemRow';

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
  const form = useForm<UpdateDiagnosisValues>({
    resolver: zodResolver(updateDiagnosisSchema) as any,
    defaultValues: {
      technicianCheckId: 0,
      remarksHistory: '',
      statusService: 'SERVICE',
      serviceFee: 0,
      parts: [],
      hardwareCheck: {
        phStatus: 'GOOD',
        mbStatus: 'GOOD',
        psStatus: 'GOOD',
        othersStatus: '',
      },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'parts',
  });

  // Watch untuk kalkulasi real-time (Lighthouse 100 Performance)
  const watchedParts = form.watch('parts');
  const subtotalParts = (watchedParts || []).reduce(
    (acc, p) => acc + (Number(p.quantity) || 0) * (Number(p.unitPrice) || 0),
    0,
  );

  useEffect(() => {
    if (isOpen && sr) {
      form.reset({
        technicianCheckId: sr.technicianCheckId || 0,
        remarksHistory: sr.remarksHistory || '',
        statusService: sr.statusService || 'SERVICE',
        serviceFee: Number(sr.serviceFee || 0),
        parts: sr.parts || [],
        hardwareCheck: (sr as any).hardwareCheck || {
          phStatus: 'GOOD',
          mbStatus: 'GOOD',
          psStatus: 'GOOD',
          othersStatus: '',
        },
      });
    }
  }, [isOpen, sr, form]);

  const onSubmit = async (data: UpdateDiagnosisValues) => {
    try {
      await srApi.updateTechnician(sr!.ticketNumber, data);
      onSuccess();
      onClose();
    } catch (error) {
      alert('Gagal memperbarui data');
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl outline-none">
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col h-full"
          >
            {/* 1. HEADER (Desain image_6ab49d_2.jpg) */}
            <div
              className={`p-8 text-white relative transition-colors duration-500 ${sr?.remarksHistory ? 'bg-[#1e293b]' : 'bg-[#020617]'}`}
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
                      {form.watch('statusService')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. BODY (Scrollable) */}
            <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                {/* Status Selector */}
                <FormField
                  control={form.control}
                  name="statusService"
                  render={({ field }) => (
                    <FormItem className="space-y-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                      <FormLabel className="text-[11px] font-black uppercase text-blue-600 tracking-widest ml-1">
                        Ubah Status Servis
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 border-none rounded-xl font-black text-blue-700 bg-white shadow-sm">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="WAITING CHECK">
                            🛠️ WAITING CHECK
                          </SelectItem>
                          <SelectItem value="SERVICE">⚙️ SERVICE</SelectItem>
                          <SelectItem value="PENDING APPROVAL">
                            ⏳ PENDING APPROVAL
                          </SelectItem>
                          <SelectItem value="DONE">✅ DONE</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {/* Technician Selector (Hardcoded for now as per image_6ab49d_2.jpg) */}
                <FormField
                  control={form.control}
                  name="technicianCheckId"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">
                        Teknisi Penanggung Jawab
                      </FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(Number(v))}
                        value={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 border-slate-200 rounded-xl font-bold">
                            <SelectValue placeholder="Pilih Teknisi" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="2">ADAM</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              {/* Analisa Teknis */}
              <FormField
                control={form.control}
                name="remarksHistory"
                render={({ field }) => (
                  <FormItem className="space-y-3 text-left">
                    <FormLabel className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">
                      Analisa Teknis (Diagnosa)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="min-h-30 border-slate-200 rounded-2xl p-5 bg-slate-50/50 font-medium"
                        placeholder="Isi diagnosa kerusakan..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Suku Cadang Section */}
              <div className="space-y-4 pt-4 border-t border-slate-100 text-left">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <PackagePlus size={18} className="text-blue-600" />
                    <Label className="text-sm font-black uppercase text-slate-900">
                      Suku Cadang
                    </Label>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      append({
                        sparePartId: null,
                        partName: '',
                        quantity: 1,
                        unitPrice: '0',
                        ipStatus: 'Non IP',
                        partCode: '',
                        modelName: '',
                        block: '',
                      })
                    }
                    className="rounded-xl border-blue-200 text-blue-600 font-bold hover:bg-blue-600 hover:text-white transition-all"
                  >
                    <Plus size={16} className="mr-1" strokeWidth={3} /> Tambah
                    Item
                  </Button>
                </div>

                <div className="space-y-3">
                  {fields.length === 0 ? (
                    <div className="py-10 border-2 border-dashed border-slate-100 rounded-[2rem] text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest bg-slate-50/30">
                      Belum ada penggantian suku cadang
                    </div>
                  ) : (
                    fields.map((field, index) => (
                      <PartItemRow
                        key={field.id}
                        index={index}
                        onRemove={() => remove(index)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* 3. FOOTER (WCAG AAA & Performance Subtotal) */}
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
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="h-14 px-8 font-bold text-slate-400 hover:bg-slate-200 rounded-2xl"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className={`h-14 px-12 text-white font-black rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 ${sr?.remarksHistory ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20' : 'bg-slate-900 hover:bg-blue-600'}`}
                >
                  {form.formState.isSubmitting ? (
                    <RefreshCcw className="animate-spin" />
                  ) : (
                    <Save size={20} />
                  )}
                  {sr?.remarksHistory ? 'SIMPAN PERUBAHAN' : 'SIMPAN DIAGNOSA'}
                </Button>
              </div>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
