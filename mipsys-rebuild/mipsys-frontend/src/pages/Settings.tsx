import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { User, ShieldCheck, Monitor, Camera } from "lucide-react"

export default function Settings() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col gap-1">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900">Pengaturan</h3>
        <p className="text-sm text-slate-500">
          Kelola akun MIP dan preferensi aplikasi Anda.
        </p>
      </div>

      <Separator className="bg-slate-200" />

      {/* LAYOUT TABS VERTIKAL */}
      <Tabs defaultValue="profile" className="flex flex-col md:flex-row gap-8">
        
        {/* NAVIGASI KIRI */}
        <TabsList className="flex md:flex-col h-auto w-full md:w-64 bg-transparent p-0 space-y-1">
          <TabsTrigger 
            value="profile" 
            className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 transition-all"
          >
            <User size={18} /> Profil
          </TabsTrigger>
          <TabsTrigger 
            value="security" 
            className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 transition-all"
          >
            <ShieldCheck size={18} /> Keamanan
          </TabsTrigger>
          <TabsTrigger 
            value="system" 
            className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 transition-all"
          >
            <Monitor size={18} /> Sistem
          </TabsTrigger>
        </TabsList>

        {/* AREA KONTEN KANAN */}
        <div className="flex-1">
          
          {/* CONTENT: PROFIL */}
          <TabsContent value="profile" className="mt-0">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Informasi Profil</CardTitle>
                <CardDescription>Update data personal dan foto profil Anda.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl border border-blue-200">
                      N
                    </div>
                    <button className="absolute bottom-0 right-0 p-1.5 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 transition-colors">
                      <Camera size={14} className="text-slate-600" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-sm font-semibold text-slate-900">Foto Profil</h5>
                    <p className="text-xs text-slate-500">JPG, GIF atau PNG. Maksimal 2MB.</p>
                  </div>
                </div>
                
                <Separator className="bg-slate-100" />

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input id="name" defaultValue="Nanda" className="bg-slate-50/50" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="title">Jabatan</Label>
                    <Input id="title" defaultValue="Full Stack Developer" className="bg-slate-50/50" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Alamat Email</Label>
                  <Input id="email" type="email" defaultValue="nanda@mitrainfoparama.co.id" className="bg-slate-50/50" />
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50/50 border-t border-slate-100 px-6 py-4 flex justify-end">
                <Button className="bg-blue-600 hover:bg-blue-700">Simpan Perubahan</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* CONTENT: KEAMANAN */}
          <TabsContent value="security" className="mt-0">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Keamanan Akun</CardTitle>
                <CardDescription>Ganti kata sandi secara berkala untuk menjaga keamanan data.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="current">Password Sekarang</Label>
                  <Input id="current" type="password" />
                </div>
                <Separator className="my-2" />
                <div className="grid gap-2">
                  <Label htmlFor="new">Password Baru</Label>
                  <Input id="new" type="password" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm">Konfirmasi Password Baru</Label>
                  <Input id="confirm" type="password" />
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50/50 border-t border-slate-100 px-6 py-4 flex justify-end">
                <Button className="bg-blue-600 hover:bg-blue-700">Update Password</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* CONTENT: SISTEM */}
          <TabsContent value="system" className="mt-0">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Preferensi Aplikasi</CardTitle>
                <CardDescription>Atur tampilan dan notifikasi sesuai keinginan Anda.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-0">
                <div className="flex items-center justify-between py-4">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold">Mode Gelap</Label>
                    <p className="text-xs text-slate-500 italic">Sesuaikan tampilan dengan kondisi cahaya.</p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between py-4">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold">Notifikasi Real-time</Label>
                    <p className="text-xs text-slate-500 italic">Terima update status perbaikan aset secara instan.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between py-4">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold">Laporan Mingguan</Label>
                    <p className="text-xs text-slate-500 italic">Kirim ringkasan aset ke email setiap hari Senin.</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  )
}