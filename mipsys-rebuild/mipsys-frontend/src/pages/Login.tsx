import { useState } from "react"
import { useNavigate } from "react-router-dom"
// Import api di-comment dulu kalau belum mau dipakai
// import api from "@/lib/axios" 
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ShieldCheck, Loader2, AlertCircle, User } from "lucide-react"

export default function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  const navigate = useNavigate()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // SIMULASI LOGIN (MOCKING)
    setTimeout(() => {
      // Mas Nanda bisa set aturan login manual di sini
      // Contoh: Login hanya bisa kalau username adalah "admin"
      if (username === "nanda" && password === "admin123") {
        // 1. Set token palsu agar ProtectedRoute di App.tsx mengizinkan lewat
        localStorage.setItem("token", "dummy-token-trecs-2026")
        
        setIsLoading(false)
        // 2. Langsung masuk ke Dashboard
        navigate("/")
      } else {
        setIsLoading(false)
        setError("Username atau password salah! (Hint: nanda / admin123)")
      }
    }, 1000) // Efek loading 1 detik biar kelihatan keren
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4 relative">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-100/50 blur-3xl" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-slate-200/50 blur-3xl" />
      </div>

      <Card className="w-full max-w-md shadow-xl border-slate-200 z-10">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <ShieldCheck className="text-white" size={28} />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">T-RECS LOGIN</CardTitle>
          <CardDescription>
            Mode Pengembangan: Masukkan username & password manual.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  id="username" 
                  type="text" 
                  placeholder="nanda" 
                  required 
                  className="pl-10 bg-slate-50/50"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="admin123"
                required 
                className="bg-slate-50/50"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                "Masuk Sekarang"
              )}
            </Button>
            <p className="text-center text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              PT Mitrainfoparama • Offline Mode
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}