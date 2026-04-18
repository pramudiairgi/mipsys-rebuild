"use client";

import { useEffect, useState } from "react";
import { srApi } from "../services/sr-api";
import { ServiceRequest } from "../types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";

export function DashboardTable() {
  const [data, setData] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // STATE: Untuk Pencarian dan Paginasi
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState(""); 
  const [page, setPage] = useState(1);
  const limit = 10; 

  const fetchServiceRequests = async () => {
    try {
      setIsLoading(true);
      const result = await srApi.getAll(searchTerm, page, limit);

      // Pastikan data yang diambil adalah array
      const dataArray = Array.isArray(result) ? result : result.data || [];
      setData(dataArray);
    } catch (error) {
      console.error("Gagal mengambil data SR:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceRequests();
  }, [page, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); 
    setSearchTerm(searchInput);
  };

  return (
    <div className="space-y-4">
      {/* BAGIAN ATAS: Kotak Pencarian */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nama pelanggan, model, atau No SR..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="default" className="bg-slate-900">
            Cari
          </Button>
        </form>
      </div>

      {/* BAGIAN TENGAH: Tabel Data */}
      <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold">No. SR</TableHead>
              <TableHead className="font-bold">Nama Pelanggan</TableHead>
              <TableHead className="font-bold">Model Mesin</TableHead>
              {/* KOLOM BARU */}
              <TableHead className="font-bold text-blue-600">Serial Number</TableHead>
              <TableHead className="font-bold">Mode Servis</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="font-bold">Tanggal Masuk</TableHead>
              <TableHead className="text-right font-bold">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={8} // Update colSpan menjadi 8 karena tambah 1 kolom
                  className="text-center py-20 text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                    <p>Menghubungkan ke server Mipsys...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-20 text-muted-foreground">
                  {searchTerm ? "Data tidak ditemukan." : "Belum ada data Service Request."}
                </TableCell>
              </TableRow>
            ) : (
              data.map((sr) => (
                <TableRow key={sr.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-bold text-slate-700">{sr.sr_number}</TableCell>
                  <TableCell className="max-w-50 truncate">{sr.customer_name}</TableCell>
                  <TableCell>{sr.machine_model}</TableCell>
                  
                  {/* ISI DATA SERIAL NUMBER */}
                  <TableCell>
                    <code className="text-[11px] bg-blue-50 text-blue-700 px-2 py-1 rounded font-mono border border-blue-100">
                      {sr.serial_number || "-"}
                    </code>
                  </TableCell>

                  <TableCell>{sr.service_mode}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={sr.status === "0" ? "default" : "secondary"}
                      className={sr.status === "0" ? "bg-slate-900" : ""}
                    >
                      {sr.status === "0" ? "Baru" : sr.status === "1" ? "Diproses" : "Selesai"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {new Date(sr.created_at).toLocaleDateString("id-ID")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/service-request/${sr.id}`}>
                      <Button variant="outline" size="sm" className="hover:bg-slate-900 hover:text-white transition-all">
                        Detail
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* BAGIAN BAWAH: Navigasi Paginasi */}
      <div className="flex items-center justify-between py-2 px-1">
        <p className="text-sm text-slate-500">
          Menampilkan <span className="font-bold">{data.length}</span> data per halaman
        </p>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
          >
            Sebelumnya
          </Button>
          <div className="bg-slate-100 px-3 py-1 rounded text-sm font-bold text-slate-700">
            {page}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={data.length < limit || isLoading}
          >
            Selanjutnya
          </Button>
        </div>
      </div>
    </div>
  );
}