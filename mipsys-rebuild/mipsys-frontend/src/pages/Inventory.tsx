import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, MoreVertical } from "lucide-react"

const epsonParts = [
  { id: "PN-2182", nama: "Print Head L3110/L3210", kategori: "Sparepart", stok: 4, satuan: "Pcs", status: "Tersedia" },
  { id: "PN-1741", nama: "Mainboard L121", kategori: "Electronics", stok: 1, satuan: "Unit", status: "Stok Menipis" },
  { id: "INK-003-BK", nama: "Tinta 003 Black 65ml", kategori: "Consumable", stok: 24, satuan: "Botol", status: "Tersedia" },
  { id: "PN-PAD", nama: "Waste Ink Pad L1110", kategori: "Maintenance", stok: 0, satuan: "Pcs", status: "Habis" },
]

export default function Inventory() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800">Gudang Sparepart Epson</h3>
        <Button className="bg-blue-600 h-9 text-xs gap-2"><Plus size={16}/> Tambah Part</Button>
      </div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/><Input className="pl-10 h-9" placeholder="Cari Part Number..."/></div>
      <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold text-xs uppercase">Part Number</TableHead>
              <TableHead className="font-bold text-xs uppercase">Nama Barang</TableHead>
              <TableHead className="font-bold text-xs uppercase">Stok</TableHead>
              <TableHead className="font-bold text-xs uppercase">Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {epsonParts.map((item) => (
              <TableRow key={item.id} className="text-sm">
                <TableCell className="font-mono text-xs font-bold text-blue-600">{item.id}</TableCell>
                <TableCell className="font-medium">{item.nama}</TableCell>
                <TableCell>{item.stok} <span className="text-[10px] text-slate-400">{item.satuan}</span></TableCell>
                <TableCell>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.status === "Tersedia" ? "bg-green-50 text-green-600" : item.status === "Habis" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>
                    {item.status}
                  </span>
                </TableCell>
                <TableCell><MoreVertical size={14} className="text-slate-400"/></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}