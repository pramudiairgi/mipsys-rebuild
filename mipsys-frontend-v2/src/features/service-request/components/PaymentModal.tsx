"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { srApi } from "../services/sr-api";

export function PaymentModal({ sr, isOpen, onClose, onSuccess }: any) {
  const [labor, setLabor] = useState(0);
  const [onsite, setOnsite] = useState(0);

  const partCost = Number(sr?.part_cost) || 0;
  const subtotal = labor + onsite + partCost;
  const ppn = Math.round(subtotal * 0.11);
  const total = subtotal + ppn;

  const formatIDR = (val: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  const handleSubmit = async () => {
    try {
      await srApi.prosesKasir(sr.id, {
        labor_cost: labor,
        onsite_cost: onsite
      });
      onSuccess();
      onClose();
    } catch (error) {
      alert("Gagal proses pembayaran");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-green-700">
            💵 Penyelesaian & Pembayaran
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Biaya Jasa (Rp)</Label>
              <Input type="number" value={labor} onChange={(e) => setLabor(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Biaya Onsite (Rp)</Label>
              <Input type="number" value={onsite} onChange={(e) => setOnsite(Number(e.target.value))} />
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-200">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Sparepart:</span>
              <span className="font-bold text-blue-600">{formatIDR(partCost)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">PPN (11%):</span>
              <span className="font-medium">{formatIDR(ppn)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between items-center">
              <span className="font-black text-lg">TOTAL BAYAR:</span>
              <span className="font-black text-xl text-green-700">{formatIDR(total)}</span>
            </div>
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white">Selesaikan & Bayar</Button>
        </div>
      </div>
    </div>
  );
}