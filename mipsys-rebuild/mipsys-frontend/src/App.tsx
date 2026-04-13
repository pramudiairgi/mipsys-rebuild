import { PropsWithChildren } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

// Import Layout
import DashboardLayout from "@/components/layout/DashboardLayout"

// Import Pages
import Login from "@/pages/Login"
import Dashboard from "@/pages/Dashboard"
import ServiceRequest from "@/pages/ServiceRequest"
import Inventory from "@/pages/Inventory"
import Shipment from "@/pages/Shipment"
import DataManagement from "@/pages/DataManagement"
import Settings from "@/pages/Settings"

/**
 * Komponen ProtectedRoute
 * Menggunakan PropsWithChildren untuk menangani 'children' secara otomatis
 */
const ProtectedRoute = ({ children }: PropsWithChildren) => {
  const token = localStorage.getItem("token")
  
  // Jika tidak ada token, paksa ke halaman login
  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. RUTE PUBLIK: Login */}
        <Route path="/login" element={<Login />} />

        {/* 2. RUTE INTERNAL (TERPROTEKSI) */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Routes>
                  {/* Dashboard / Ringkasan */}
                  <Route path="/" element={<Dashboard />} />
                  
                  {/* Menu Utama: Service Request */}
                  <Route path="/service-request" element={<ServiceRequest />} />
                  
                  {/* Manajemen Stok & Logistik */}
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/shipment" element={<Shipment />} />
                  
                  {/* Master Data & Konfigurasi */}
                  <Route path="/manajemen-data" element={<DataManagement />} />
                  <Route path="/pengaturan" element={<Settings />} />

                  {/* Catch-all: Redirect ke Dashboard jika route tidak dikenal */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}