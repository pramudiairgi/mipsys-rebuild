"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { srApi } from "../services/sr-api";

export function DiagnosisModal({ sr, isOpen, onClose, onSuccess }: any) {
  const [techName, setTechName] = useState("");
  const [remarks, setRemarks] = useState("");
  const [parts, setParts] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTechName("");
      setRemarks("");
      setParts([]);
    }
  }, [isOpen]);

  const addPart = () => {
    setParts([...parts, { part_no: "", part_name: "", quantity: 1, unit_price: 0 }]);
  };

  const removePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const updatePart = (index: number, field: string, value: any) => {
    const newParts = [...parts];
    newParts[index][field] = value;
    setParts(newParts);
  };

  const handleSubmit = async () => {
    try {
      await srApi.updateTechnician(sr.id, {
        technician_name: techName,
        tech_remarks: remarks,
        parts: parts
      });
      onSuccess();
      onClose();
    } catch (error) {
      alert("Gagal simpan diagnosa");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-bold">Diagnosa Teknisi: {sr?.sr_number}</h2>
          
          <div className="space-y-2">
            <Label>Nama Teknisi</Label>
            <Input value={techName} onChange={(e) => setTechName(e.target.value)} placeholder="Contoh: Adam" />
          </div>

          <div className="space-y-2">
            <Label>Catatan Diagnosa / Perbaikan</Label>
            <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Tulis rincian kerusakan..." />
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-4">
              <Label className="text-blue-600 font-bold">Rincian Sparepart</Label>
              <Button size="sm" variant="outline" onClick={addPart}><Plus className="h-4 w-4 mr-1"/> Tambah Part</Button>
            </div>

            {parts.map((p, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 mb-3 items-end bg-slate-50 p-2 rounded">
                <div className="col-span-3">
                  <Label className="text-[10px]">No. Part</Label>
                  <Input size={1} className="h-8 text-xs" value={p.part_no} onChange={(e) => updatePart(i, 'part_no', e.target.value)} placeholder="B12-..." />
                </div>
                <div className="col-span-4">
                  <Label className="text-[10px]">Nama Barang</Label>
                  <Input className="h-8 text-xs" value={p.part_name} onChange={(e) => updatePart(i, 'part_name', e.target.value)} />
                </div>
                <div className="col-span-1">
                  <Label className="text-[10px]">Qty</Label>
                  <Input className="h-8 text-xs" type="number" value={p.quantity} onChange={(e) => updatePart(i, 'quantity', Number(e.target.value))} />
                </div>
                <div className="col-span-3">
                  <Label className="text-[10px]">Harga Satuan</Label>
                  <Input className="h-8 text-xs" type="number" value={p.unit_price} onChange={(e) => updatePart(i, 'unit_price', Number(e.target.value))} />
                </div>
                <div className="col-span-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => removePart(i)}><Trash2 className="h-4 w-4"/></Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-2 bg-slate-50 rounded-b-lg">
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button onClick={handleSubmit} className="bg-slate-900 text-white">Simpan Diagnosa</Button>
        </div>
      </div>
    </div>
  );
}