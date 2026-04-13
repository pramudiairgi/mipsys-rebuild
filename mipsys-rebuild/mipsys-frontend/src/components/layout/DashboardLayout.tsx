import { PropsWithChildren } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { 
  LayoutDashboard, 
  ClipboardList, // Ikon untuk Service Request
  Boxes, 
  Truck, 
  Database,
  Bell, 
  LogOut, 
  User,
  Settings,
  ChevronDown
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function DashboardLayout({ children }: PropsWithChildren) {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path: string) => location.pathname === path

  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar dari sistem?")) {
      localStorage.removeItem("token")
      navigate("/login")
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50 font-sans">
      
      {/* SIDEBAR KIRI (SISTEM SERVICE VERSION) */}
      <aside className="hidden w-64 flex-col bg-slate-900 text-white md:flex shadow-2xl">
        <div className="flex h-16 items-center px-6 border-b border-slate-800">
          <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center mr-3 font-bold shadow-lg shadow-blue-900/40">
            M
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">MIP SYSTEM</h1>
        </div>

        {/* NAVIGASI MENU */}
        <nav className="flex-1 space-y-1 p-4 text-sm font-medium">
          {/* DASHBOARD */}
          <Link 
            to="/" 
            className={`flex items-center gap-3 rounded-md px-4 py-2.5 transition-all duration-200 ${
              isActive("/") 
              ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20 font-semibold" 
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </Link>

          {/* SERVICE REQUEST (MENU UTAMA BARU) */}
          <Link 
            to="/service-request" 
            className={`flex items-center gap-3 rounded-md px-4 py-2.5 transition-all duration-200 ${
              isActive("/service-request") 
              ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20 font-semibold" 
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <ClipboardList size={18} />
            Service Request
          </Link>

          {/* INVENTORY (SPAREPART) */}
          <Link 
            to="/inventory" 
            className={`flex items-center gap-3 rounded-md px-4 py-2.5 transition-all duration-200 ${
              isActive("/inventory") 
              ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20 font-semibold" 
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Boxes size={18} />
            Inventory
          </Link>

          {/* SHIPMENT (LOGISTIK) */}
          <Link 
            to="/shipment" 
            className={`flex items-center gap-3 rounded-md px-4 py-2.5 transition-all duration-200 ${
              isActive("/shipment") 
              ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20 font-semibold" 
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Truck size={18} />
            Shipment
          </Link>

          {/* MASTER DATA */}
          <Link 
            to="/manajemen-data" 
            className={`flex items-center gap-3 rounded-md px-4 py-2.5 transition-all duration-200 ${
              isActive("/manajemen-data") 
              ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20 font-semibold" 
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Database size={18} />
            Manajemen Data
          </Link>
        </nav>

        {/* FOOTER SIDEBAR */}
        <div className="p-6 border-t border-slate-800">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold opacity-60">
            T-RECS v1.0.4
          </p>
        </div>
      </aside>

      {/* AREA KONTEN UTAMA */}
      <div className="flex flex-1 flex-col">
        
        {/* HEADER */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8 sticky top-0 z-10 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            {isActive("/") ? "Ringkasan" : location.pathname.replace("/", "").replace("-", " ")}
          </h2>
          
          <div className="flex items-center gap-6">
            {/* NOTIFIKASI */}
            <button className="text-slate-400 hover:text-blue-600 relative p-2 rounded-full hover:bg-slate-50 transition-all">
              <Bell size={20} />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
            </button>

            <div className="h-6 w-px bg-slate-200" />

            {/* DROPDOWN USER */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 outline-none group cursor-pointer">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-slate-800 leading-none group-hover:text-blue-600 transition-colors">Nanda</p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">Full Stack Developer</p>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold border-2 border-white shadow-sm transition-transform active:scale-95 group-hover:scale-105">
                    N
                  </div>
                  <ChevronDown size={14} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
                </button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-56 mt-2 shadow-2xl border-slate-100">
                <DropdownMenuLabel className="font-normal py-3">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold text-slate-900 leading-none">Nanda</p>
                    <p className="text-[11px] text-slate-500 leading-none">nanda@mitrainfoparama.co.id</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem 
                  onClick={() => navigate("/pengaturan")}
                  className="gap-2 cursor-pointer py-2.5 text-slate-600 focus:text-blue-600"
                >
                  <User size={16} /> Profil Akun
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => navigate("/pengaturan")}
                  className="gap-2 cursor-pointer py-2.5 text-slate-600 focus:text-blue-600"
                >
                  <Settings size={16} /> Pengaturan Sistem
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="gap-2 cursor-pointer py-3 text-red-600 focus:text-red-700 focus:bg-red-50 font-bold"
                >
                  <LogOut size={16} /> Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* MAIN PAGE */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      
    </div>
  )
}