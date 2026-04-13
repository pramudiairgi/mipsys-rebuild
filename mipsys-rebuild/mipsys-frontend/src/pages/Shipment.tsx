import { useState } from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Truck, 
  PackageCheck, 
  Clock, 
  Search, 
  ArrowDownCircle, 
  Info 
} from "lucide-react"
import { Input } from "@/components/ui/input"

export default function Shipment() {
  const [inTransitParts] = useState([
    { partNo: "02213508", name: "BOARD ASSY", qty: 1, date: "20/10/2025", awb: "WAHANA EXPRESS", carrier: "Lain Lain", ageing: 173 },
    { partNo: "01767046", name: "PICK UP AS", qty: 1, date: "22/01/2026", awb: "011070009714625", carrier: "JNE", ageing: 79 },
    { partNo: "01857579", name: "CARRIAGE A", qty: 1, date: "28/01/2026", awb: "011070009714625", carrier: "JNE", ageing: 73 },
  ])

  return (
    <div className="space-y-4 font-sans">
      {/* 1. HEADER RINGKAS */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <Truck className="text-blue-600" size={20} /> Logistik & Part In-Transit
          </h3>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">EASC SEMARANG • MIP JKT SOURCE</p>
        </div>
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-2 py-0">
          <Clock size={10} className="mr-1" /> {inTransitParts.length} Tertunda
        </Badge>
      </div>

      {/* 2. STATS & SEARCH (Dibuat Sejajar agar Hemat Ruang) */}
      <div className="flex flex-col md:flex-row gap-3 items-center">
        {/* Kartu Statistik Biru yang sudah di-Kecilkan */}
        <Card className="border-none shadow-sm bg-blue-600 text-white w-full md:w-60 shrink-0">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-white/20 flex items-center justify-center shrink-0">
              <ArrowDownCircle size={18} />
            </div>
            <div>
              <p className="text-[9px] font-bold opacity-80 uppercase leading-none">In-Transit</p>
              <h4 className="text-lg font-black leading-none mt-1">{inTransitParts.length} Items</h4>
            </div>
          </CardContent>
        </Card>

        {/* Search Bar */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Cari Part No atau No. Resi..." className="pl-10 h-10 bg-white border-slate-200 text-sm" />
        </div>
      </div>

      {/* 3. TABEL PENERIMAAN (Row lebih rapat) */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold text-[10px] uppercase h-10">Part Info</TableHead>
              <TableHead className="font-bold text-[10px] uppercase h-10">Pengiriman (AWB)</TableHead>
              <TableHead className="font-bold text-[10px] uppercase h-10">Tgl Kirim</TableHead>
              <TableHead className="font-bold text-[10px] uppercase h-10 text-center">Ageing</TableHead>
              <TableHead className="w-20 text-center font-bold text-[10px] uppercase h-10">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inTransitParts.map((item) => (
              <TableRow key={item.partNo} className="hover:bg-slate-50/50 border-b last:border-0 transition-colors">
                <TableCell className="py-2">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-blue-600 font-mono">{item.partNo}</span>
                    <span className="text-[10px] font-medium text-slate-700 uppercase">{item.name}</span>
                  </div>
                </TableCell>
                <TableCell className="py-2">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-slate-600">{item.awb}</span>
                    <span className="text-[9px] text-slate-400 font-bold">{item.carrier}</span>
                  </div>
                </TableCell>
                <TableCell className="py-2 text-[10px] text-slate-500 font-medium">
                  {item.date}
                </TableCell>
                <TableCell className="py-2 text-center">
                  <span className={`text-[11px] font-black ${item.ageing > 30 ? 'text-red-600' : 'text-slate-600'}`}>
                    {item.ageing}d
                  </span>
                </TableCell>
                <TableCell className="py-2 text-center">
                  <Button size="sm" variant="outline" className="h-7 text-[9px] font-black border-blue-200 text-blue-600 hover:bg-blue-50 px-2 uppercase">
                    <PackageCheck size={12} className="mr-1" /> Terima
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 4. FOOTER INFO */}
      <div className="flex items-center gap-2 p-2 bg-blue-50/50 border border-blue-100 rounded text-[9px] text-blue-700">
        <Info size={12} className="shrink-0" />
        <p>Klik <b>"Terima"</b> untuk update stok EASC Semarang secara otomatis.</p>
      </div>
    </div>
  )
}