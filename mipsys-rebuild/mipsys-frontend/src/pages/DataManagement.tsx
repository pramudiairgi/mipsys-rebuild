import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Printer, Users, BadgeDollarSign, Plus, Building2 } from "lucide-react"

export default function DataManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight text-slate-800">Master Data Sistem</h3>
        <p className="text-sm text-slate-500">Kelola data referensi untuk operasional service Epson.</p>
      </div>

      <Tabs defaultValue="models" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1 rounded-lg h-11">
          <TabsTrigger value="models" className="gap-2 text-xs font-bold uppercase tracking-wider">
            <Printer size={16} /> Model
          </TabsTrigger>
          <TabsTrigger value="tech" className="gap-2 text-xs font-bold uppercase tracking-wider">
            <Users size={16} /> Teknisi
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-2 text-xs font-bold uppercase tracking-wider">
            <BadgeDollarSign size={16} /> Jasa
          </TabsTrigger>
          <TabsTrigger value="sites" className="gap-2 text-xs font-bold uppercase tracking-wider">
            <Building2 size={16} /> Pelanggan
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: MODEL EPSON */}
        <TabsContent value="models" className="mt-4">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between p-4">
              <CardTitle className="text-sm font-bold">Daftar Model Epson</CardTitle>
              <Button size="sm" className="bg-blue-600 h-8 gap-1 text-xs"><Plus size={14}/> Tambah Model</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="text-[11px] font-bold">NAMA MODEL</TableHead>
                    <TableHead className="text-[11px] font-bold">KATEGORI</TableHead>
                    <TableHead className="text-[11px] font-bold text-right">GARANSI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow><TableCell className="font-medium">Epson EcoTank L3210</TableCell><TableCell>Inkjet Printer</TableCell><TableCell className="text-right">2 Tahun</TableCell></TableRow>
                  <TableRow><TableCell className="font-medium">Epson L121</TableCell><TableCell>Inkjet Printer</TableCell><TableCell className="text-right">1 Tahun</TableCell></TableRow>
                  <TableRow><TableCell className="font-medium">Epson EB-X400</TableCell><TableCell>Projector</TableCell><TableCell className="text-right">3 Tahun</TableCell></TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: TEKNISI */}
        <TabsContent value="tech" className="mt-4">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between p-4">
              <CardTitle className="text-sm font-bold">Tim Teknisi MIP</CardTitle>
              <Button size="sm" className="bg-blue-600 h-8 gap-1 text-xs"><Plus size={14}/> Tambah Teknisi</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="text-[11px] font-bold">NAMA TEKNISI</TableHead>
                    <TableHead className="text-[11px] font-bold">SPESIALISASI</TableHead>
                    <TableHead className="text-[11px] font-bold text-right">STATUS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow><TableCell className="font-medium">Nanda</TableCell><TableCell>Full Stack & Inkjet Specialist</TableCell><TableCell className="text-right"><span className="text-green-600 text-[10px] font-bold px-2 py-0.5 bg-green-50 rounded">AKTIF</span></TableCell></TableRow>
                  <TableRow><TableCell className="font-medium">Ahmad S.</TableCell><TableCell>Projector & Scanner</TableCell><TableCell className="text-right"><span className="text-green-600 text-[10px] font-bold px-2 py-0.5 bg-green-50 rounded">AKTIF</span></TableCell></TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tambahkan Content untuk Jasa dan Pelanggan dengan pola yang sama */}
      </Tabs>
    </div>
  )
}