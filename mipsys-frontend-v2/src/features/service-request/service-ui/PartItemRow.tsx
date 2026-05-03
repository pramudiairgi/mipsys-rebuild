import { useFormContext } from 'react-hook-form';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Button } from '@/src/components/ui/button';
import { Trash2 } from 'lucide-react';

export function PartItemRow({
  index,
  onRemove,
}: {
  index: number;
  onRemove: () => void;
}) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();
  const sparePartId = watch(`parts.${index}.sparePartId`);

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4 animate-in slide-in-from-right-4">
      <div className="grid grid-cols-12 gap-4 items-end">
        <div className="col-span-6 space-y-1">
          <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Nama Barang
          </Label>
          <Input
            {...register(`parts.${index}.partName`)}
            className="h-11 bg-slate-50 border-none rounded-xl font-bold"
          />
        </div>
        <div className="col-span-2 space-y-1">
          <Label className="text-[9px] font-black text-slate-400 uppercase text-center block">
            Qty
          </Label>
          <Input
            type="number"
            {...register(`parts.${index}.quantity`)}
            className="h-11 bg-slate-50 border-none rounded-xl text-center font-black"
          />
        </div>
        <div className="col-span-3 space-y-1">
          <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Harga Satuan
          </Label>
          <Input
            type="number"
            {...register(`parts.${index}.unitPrice`)}
            className="h-11 bg-slate-50 border-none rounded-xl font-black text-blue-600"
          />
        </div>
        <div className="col-span-1 pb-0.5 flex justify-center">
          <Button
            type="button"
            variant="ghost"
            className="h-11 w-11 text-red-400 hover:text-red-600"
            onClick={onRemove}
          >
            <Trash2 size={18} />
          </Button>
        </div>
      </div>

      {/* AUTO-REGISTRATION FORM: Muncul jika ID Null */}
      {!sparePartId && (
        <div className="grid grid-cols-2 gap-4 p-4 bg-amber-50/50 rounded-2xl border border-dashed border-amber-200 animate-in fade-in zoom-in-95">
          <div className="space-y-1">
            <Label className="text-[9px] font-black text-amber-600 uppercase">
              Part Code *
            </Label>
            <Input
              {...register(`parts.${index}.partCode`)}
              placeholder="Contoh: MB-L321-NEW"
              className="h-9 bg-white border-amber-100"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[9px] font-black text-amber-600 uppercase">
              Model Name *
            </Label>
            <Input
              {...register(`parts.${index}.modelName`)}
              placeholder="Contoh: L321"
              className="h-9 bg-white border-amber-100"
            />
          </div>
        </div>
      )}
    </div>
  );
}
