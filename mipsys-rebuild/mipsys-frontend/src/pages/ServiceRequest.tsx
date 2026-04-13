import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Printer, Wrench, MoreHorizontal, User, HardDrive, Clipboard, Calendar } from "lucide-react"

export default function ServiceRequest() {
  const [open, setOpen] = useState(false)
  
  // 1. STATE FORM LENGKAP
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], // Default tanggal hari ini (YYYY-MM-DD)
    serviceMode: "easc",
    warrantyType: "warranty",
    customer: "",
    phone: "",
    model: "",
    sn: "",
    complaint: ""
  })

  // 2. DATA LIST SR (MOCKUP)
  const [data, setData] = useState([
    { id: "SR-EPS-2604001", date: "2026-04-11", customer: "Toko Berkah", model: "L3210", sn: "X7Y8001234", status: "Proses" },
    { id: "SR-EPS-2604002", date: "2026-04-10", customer: "PT Maju Jaya", model: "L121", sn: "A1B2005678", status: "Selesai" },
  ])

  // 3. FUNGSI SIMPAN SR
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Format tanggal ke tampilan yang lebih manis (misal: 11 Apr 2026)
    const formattedDate = new Date(formData.date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })

    const newEntry = {
      id: `SR-EPS-260400${data.length + 1}`,
      date: formattedDate,
      customer: formData.customer,
      model: formData.model,
      sn: formData.sn,
      status: "Proses"
    }

    setData([newEntry, ...data])
    setOpen(false) // Tutup modal
    
    // Reset form kecuali tanggal
    setFormData({
      ...formData,
      customer: "",
      phone: "",
      model: "",
      sn: "",
      complaint: ""
    })
  }

  return (
    <div className="space-y-6 font-sans">
      {/* HEADER HALAMAN */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <Printer className="text-blue-600" size={24} /> Service Request
          </h3>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">EASC SEMARANG • PT Mitrainfoparama</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-md gap-2 h-9 text-xs font-bold">
              <Plus size={16} /> SR BARU
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-5 bg-slate-900 text-white">
              <DialogTitle>Entry Service Request</DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">Input data kedatangan unit printer pelanggan.</DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSave} className="p-6 bg-white space-y-6">
              {/* SECTION 1: MODE & TANGGAL */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase text-slate-400">Service Mode</Label>
                  <RadioGroup 
                    value={formData.serviceMode} 
                    onValueChange={(val) => setFormData({...formData, serviceMode: val})} 
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="onsite" id="onsite" />
                      <Label htmlFor="onsite" className="text-xs cursor-pointer">Onsite</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="easc" id="easc" />
                      <Label htmlFor="easc" className="text-xs font-bold text-blue-600 cursor-pointer">EASC</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                    <Calendar size={10}/> Tanggal Masuk
                  </Label>
                  <Input 
                    type="date" 
                    className="h-9 text-sm" 
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>
              </div>

              {/* SECTION 2: MAINTENANCE TYPE */}
              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase text-slate-400">Tipe Maintenance</Label>
                <RadioGroup 
                  value={formData.warrantyType} 
                  onValueChange={(val) => setFormData({...formData, warrantyType: val})} 
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="warranty" id="w1" />
                    <Label htmlFor="w1" className="text-xs text-purple-600 font-bold cursor-pointer">Warranty</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="non" id="w2" />
                    <Label htmlFor="w2" className="text-xs text-red-600 font-bold cursor-pointer">Non-Warranty</Label>
                  </div>
                </RadioGroup>
              </div>

              <hr className="border-slate-100" />

              {/* SECTION 3: PELANGGAN & UNIT */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1 font-semibold text-slate-700">
                    <User size={12}/> Nama Pelanggan
                  </Label>
                  <Input 
                    placeholder="Instansi / Perorangan" 
                    className="text-sm h-9" 
                    value={formData.customer}
                    onChange={(e) => setFormData({...formData, customer: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1 font-semibold text-slate-700">
                    <HardDrive size={12}/> Model Printer
                  </Label>
                  <Select onValueChange={(val) => setFormData({...formData, model: val})}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Pilih Model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L3210">EcoTank L3210</SelectItem>
                      <SelectItem value="L121">L121</SelectItem>
                      <SelectItem value="LX310">LX-310 (Dot Matrix)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Nomor Telepon</Label>
                  <Input 
                    placeholder="08xx..." 
                    className="text-sm h-9" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700">Serial Number (S/N)</Label>
                  <Input 
                    placeholder="S/N Unit Epson" 
                    className="font-mono text-sm h-9 uppercase" 
                    value={formData.sn}
                    onChange={(e) => setFormData({...formData, sn: e.target.value})}
                    required
                  />
                </div>
              </div>

              {/* SECTION 4: KELUHAN */}
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1 font-bold text-blue-600">
                  <Clipboard size={12}/> Deskripsi Kerusakan
                </Label>
                <Textarea 
                  placeholder="Ceritakan kendala teknis unit..." 
                  className="text-sm min-h-20" 
                  value={formData.complaint}
                  onChange={(e) => setFormData({...formData, complaint: e.target.value})}
                />
              </div>

              <DialogFooter className="pt-4 border-t flex flex-row justify-between items-center">
                <span className="text-[10px] text-slate-400 italic">T-RECS Service Module v1.0</span>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Batal</Button>
                  <Button type="submit" size="sm" className="bg-blue-600 px-6 font-bold shadow-blue-500/20 shadow-lg">Simpan SR</Button>
                </div>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input placeholder="Cari S/N atau Pelanggan..." className="pl-10 bg-white h-9 text-sm shadow-sm" />
      </div>

      {/* TABEL LIST SR */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow>
              <TableHead className="font-bold text-[10px] uppercase py-4">ID Tiket</TableHead>
              <TableHead className="font-bold text-[10px] uppercase py-4">Tgl Masuk</TableHead>
              <TableHead className="font-bold text-[10px] uppercase py-4">Pelanggan</TableHead>
              <TableHead className="font-bold text-[10px] uppercase py-4">Model & S/N</TableHead>
              <TableHead className="font-bold text-[10px] uppercase py-4">Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
                <TableCell className="font-mono text-[10px] font-bold text-blue-600">{item.id}</TableCell>
                <TableCell className="text-[10px] font-medium text-slate-500 whitespace-nowrap">
                  <div className="flex items-center gap-1.5"><Calendar size={10}/> {item.date}</div>
                </TableCell>
                <TableCell className="text-xs font-semibold text-slate-700">{item.customer}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-800 uppercase">{item.model}</span>
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-tighter">{item.sn}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                    item.status === 'Selesai' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>
                    <Wrench size={10} className="mr-1" /> {item.status}
                  </span>
                </TableCell>
                <TableCell><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal size={14} /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}