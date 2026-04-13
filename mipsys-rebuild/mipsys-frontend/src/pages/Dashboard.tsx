import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { ClipboardList, Wrench, CheckCircle2, Package } from "lucide-react"

const dataService = [
  { name: "Sen", total: 12 }, { name: "Sel", total: 18 }, { name: "Rab", total: 15 },
  { name: "Kam", total: 22 }, { name: "Jum", total: 10 }, { name: "Sab", total: 14 },
  { name: "Min", total: 5 },
]

const recentRepairs = [
  { id: "SR-EPS-001", model: "L3210", tech: "Ahmad", time: "1j lalu", status: "Proses" },
  { id: "SR-EPS-002", model: "L121", tech: "Nanda", time: "3j lalu", status: "Selesai" },
  { id: "SR-EPS-003", model: "EB-X400", tech: "Budi", time: "5j lalu", status: "Proses" },
]

export default function Dashboard() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Tiket Baru", val: "14", icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "On Progress", val: "08", icon: Wrench, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Selesai", val: "124", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
          { label: "Pending Part", val: "05", icon: Package, color: "text-red-600", bg: "bg-red-50" },
        ].map((item, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`h-8 w-8 rounded-md ${item.bg} flex items-center justify-center ${item.color} shrink-0`}>
                <item.icon size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.label}</p>
                <h4 className="text-base font-bold text-slate-800 leading-tight">{item.val}</h4>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-none shadow-sm">
            <CardHeader className="p-3 pb-0"><CardTitle className="text-[10px] font-bold uppercase text-slate-400">Tren Service Masuk</CardTitle></CardHeader>
            <CardContent className="p-3">
              <div className="h-44 w-full">
                <ResponsiveContainer><BarChart data={dataService}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" tick={{fontSize: 10}} /><Tooltip /><Bar dataKey="total" fill="#2563eb" radius={[3, 3, 0, 0]} barSize={20} /></BarChart></ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardHeader className="p-3 pb-0"><CardTitle className="text-[10px] font-bold uppercase text-slate-400">Efisiensi Perbaikan</CardTitle></CardHeader>
            <CardContent className="p-3">
              <div className="h-44 w-full">
                <ResponsiveContainer><AreaChart data={dataService}><XAxis dataKey="name" tick={{fontSize: 10}} /><Tooltip /><Area type="monotone" dataKey="total" stroke="#8b5cf6" fill="#8b5cf620" strokeWidth={2} /></AreaChart></ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-3 border-none shadow-sm">
          <CardHeader className="p-3"><CardTitle className="text-xs font-bold uppercase text-slate-400">Aktivitas Teknisi</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {recentRepairs.map((item) => (
                <div key={item.id} className="p-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-slate-800 truncate">{item.model} ({item.id})</p>
                    <p className="text-[9px] text-slate-400">{item.tech} • {item.time}</p>
                  </div>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${item.status === "Selesai" ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}>{item.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}