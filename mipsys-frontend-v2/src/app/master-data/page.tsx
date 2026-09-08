'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Package,
  Tags,
  Percent,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Label } from '@/src/components/ui/label';
import { Input } from '@/src/components/ui/input';
import { PageHeader } from '@/src/components/ui/page-header';
import { SearchBar } from '@/src/components/ui/search-bar';
import { DataTable } from '@/src/components/ui/data-table';
import type { Column } from '@/src/components/ui/data-table';
import ConfirmModal from '@/src/components/ui/confirm-modal';
import { toast } from 'react-hot-toast';
import { masterDataApi } from '@/src/features/master-data/api/master-data-api';
import type { CustomerData, StaffData, ProductData, CategoryModelData } from '@/src/features/master-data/api/master-data-api';
import { useAuth } from '@/src/lib/auth-context';
import { financeApi } from '@/src/features/finance/api/finance-api';

type TabType = 'customers' | 'staff' | 'products' | 'category-models' | 'ppn-config';

interface ModalState {
  open: boolean;
  mode: 'create' | 'edit';
  id?: number;
}

const tabs = [
  { id: 'customers' as TabType, label: 'Pelanggan', icon: <Users size={16} aria-hidden="true" /> },
  { id: 'staff' as TabType, label: 'Staff', icon: <UserCheck size={16} aria-hidden="true" /> },
  { id: 'products' as TabType, label: 'Produk', icon: <Package size={16} aria-hidden="true" /> },
  { id: 'category-models' as TabType, label: 'Model', icon: <Tags size={16} aria-hidden="true" /> },
  { id: 'ppn-config' as TabType, label: 'PPN', icon: <Percent size={16} aria-hidden="true" /> },
];

export default function MasterDataPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('customers');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [staff, setStaff] = useState<StaffData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [categoryModels, setCategoryModels] = useState<CategoryModelData[]>([]);

  const [modal, setModal] = useState<ModalState>({ open: false, mode: 'create' });
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number } | null>(null);
  const [ppnConfig, setPpnConfig] = useState<{ ppnRate: number; ppnFormula: string; ppnRounding: string; ppnInclusive: boolean } | null>(null);
  const [ppnLoading, setPpnLoading] = useState(false);
  const [ppnSaving, setPpnSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [c, s, p, m] = await Promise.all([
        masterDataApi.customers.getAll(),
        masterDataApi.staff.getAll(),
        masterDataApi.products.getAll(),
        masterDataApi.categoryModels.getAll(),
      ]);
      setCustomers(c);
      setStaff(s);
      setProducts(p);
      setCategoryModels(m);
    } catch {
      toast.error('Gagal memuat data master');
    }
    setLoading(false);
  };

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'ppn-config') {
      setPpnLoading(true);
      financeApi.getPpnConfig().then(setPpnConfig).catch(() => toast.error('Gagal memuat konfigurasi PPN')).finally(() => setPpnLoading(false));
    }
  }, [activeTab]);

  const openCreate = () => {
    setFormData({});
    setModal({ open: true, mode: 'create' });
  };

  const openEdit = (data: Record<string, any>) => {
    setFormData(data);
    setModal({ open: true, mode: 'edit', id: data.id });
  };

  const closeModal = () => {
    setModal({ open: false, mode: 'create' });
    setFormData({});
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (activeTab === 'customers') {
        if (modal.mode === 'create') {
          await masterDataApi.customers.create(formData as any);
        } else {
          await masterDataApi.customers.update(modal.id!, formData as any);
        }
      } else if (activeTab === 'staff') {
        if (modal.mode === 'create') {
          await masterDataApi.staff.create(formData as any);
        } else {
          await masterDataApi.staff.update(modal.id!, formData as any);
        }
      } else if (activeTab === 'products') {
        if (modal.mode === 'create') {
          await masterDataApi.products.create(formData as any);
        } else {
          await masterDataApi.products.update(modal.id!, formData as any);
        }
      } else if (activeTab === 'category-models') {
        if (modal.mode === 'create') {
          await masterDataApi.categoryModels.create(formData as any);
        } else {
          await masterDataApi.categoryModels.update(modal.id!, formData as any);
        }
      }
      closeModal();
      fetchData();
    } catch {
      toast.error('Gagal menyimpan data');
    }
    setSubmitting(false);
  };

  const handleDelete = (id: number) => {
    setConfirmDelete({ id });
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    try {
      if (activeTab === 'customers') await masterDataApi.customers.delete(confirmDelete.id);
      else if (activeTab === 'staff') await masterDataApi.staff.delete(confirmDelete.id);
      else if (activeTab === 'products') await masterDataApi.products.delete(confirmDelete.id);
      else if (activeTab === 'category-models') await masterDataApi.categoryModels.delete(confirmDelete.id);
      setConfirmDelete(null);
      fetchData();
    } catch {
      toast.error('Gagal menghapus data');
    }
  };

  const filteredCustomers = customers.filter(
    (c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone?.includes(searchTerm)
  );
  const filteredStaff = staff.filter((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredProducts = products.filter(
    (p) => p.modelName.toLowerCase().includes(searchTerm.toLowerCase()) || p.serialNumber.includes(searchTerm)
  );
  const filteredModels = categoryModels.filter((m) => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const renderModalFields = () => {
    if (activeTab === 'customers') {
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="customer-name">Nama</Label>
            <Input id="customer-name" placeholder="Nama" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-11 rounded-xl border-2 font-bold" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="customer-phone">Telepon</Label>
            <Input id="customer-phone" placeholder="Telepon" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-11 rounded-xl border-2 font-bold" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="customer-address">Alamat</Label>
            <Input id="customer-address" placeholder="Alamat" value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="h-11 rounded-xl border-2 font-bold" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="customer-type">Tipe</Label>
            <select id="customer-type" value={formData.customerType || ''} onChange={(e) => setFormData({ ...formData, customerType: e.target.value })} className="w-full h-11 rounded-xl border-2 bg-transparent px-3 font-bold outline-none">
              <option value="">Pilih Tipe</option>
              <option value="PERSONAL">Personal</option>
              <option value="CORPORATE">Corporate</option>
            </select>
          </div>
        </div>
      );
    }
    if (activeTab === 'staff') {
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="staff-name">Nama</Label>
            <Input id="staff-name" placeholder="Nama" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-11 rounded-xl border-2 font-bold" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="staff-role">Role</Label>
            <select id="staff-role" value={formData.role || ''} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full h-11 rounded-xl border-2 bg-transparent px-3 font-bold outline-none">
              <option value="">Pilih Role</option>
              <option value="ADMIN">Admin</option>
              <option value="TECHNICIAN">Teknisi</option>
            </select>
          </div>
        </div>
      );
    }
    if (activeTab === 'products') {
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="product-model">Nama Model</Label>
            <Input id="product-model" placeholder="Nama Model" value={formData.modelName || ''} onChange={(e) => setFormData({ ...formData, modelName: e.target.value })} className="h-11 rounded-xl border-2 font-bold" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="product-serial">Serial Number</Label>
            <Input id="product-serial" placeholder="Serial Number" value={formData.serialNumber || ''} onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })} className="h-11 rounded-xl border-2 font-bold" />
          </div>
        </div>
      );
    }
    if (activeTab === 'category-models') {
      return (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="model-name">Nama Model</Label>
            <Input id="model-name" placeholder="Nama Model" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-11 rounded-xl border-2 font-bold" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="model-desc">Deskripsi (opsional)</Label>
            <Input id="model-desc" placeholder="Deskripsi (opsional)" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="h-11 rounded-xl border-2 font-bold" />
          </div>
        </div>
      );
    }
    return null;
  };

  const getColumns = (): Column<any>[] => {
    if (activeTab === 'customers') {
      return [
        {
          header: 'Nama',
          cell: (c: CustomerData) => <span className="font-bold text-[var(--foreground)]">{c.name}</span>,
        },
        {
          header: 'Telepon',
          cell: (c: CustomerData) => <span className="text-[var(--muted-foreground)] font-medium">{c.phone || '-'}</span>,
        },
        {
          header: 'Alamat',
          cell: (c: CustomerData) => <span className="text-sm text-[var(--muted-foreground)]">{c.address || '-'}</span>,
        },
        {
          header: 'Tipe',
          headerClassName: 'text-center',
          cell: (c: CustomerData) => (
            <div className="flex justify-center">
              <Badge className={c.customerType === 'CORPORATE' ? 'bg-[var(--primary)]/10 text-[var(--primary)] border-none font-black text-[9px]' : 'bg-[var(--muted)]/50 text-[var(--muted-foreground)] border-none font-black text-[9px]'}>
                {c.customerType || '-'}
              </Badge>
            </div>
          ),
        },
        {
          header: 'Aksi',
          headerClassName: 'text-center',
          cell: (c: CustomerData) =>
            isAdmin ? (
              <div className="flex items-center justify-center gap-2">
                <Button onClick={() => openEdit(c)} variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-[var(--muted)]/50 text-[var(--muted-foreground)] hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)]" aria-label="Edit data">
                  <Pencil size={16} aria-hidden="true" />
                </Button>
                <Button onClick={() => handleDelete(c.id)} variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-[var(--muted)]/50 text-[var(--muted-foreground)] hover:bg-[var(--destructive)] hover:text-[var(--destructive-foreground)]" aria-label="Hapus data">
                  <Trash2 size={16} aria-hidden="true" />
                </Button>
              </div>
            ) : null,
        },
      ];
    }
    if (activeTab === 'staff') {
      return [
        {
          header: 'Nama',
          cell: (s: StaffData) => <span className="font-bold text-[var(--foreground)]">{s.name}</span>,
        },
        {
          header: 'Role',
          cell: (s: StaffData) => (
            <Badge className={s.role === 'ADMIN' ? 'bg-[var(--primary)]/10 text-[var(--primary)] border-none font-black text-[9px]' : 'bg-amber-100/20 text-amber-400 border-none font-black text-[9px]'}>
              {s.role === 'ADMIN' ? 'Admin' : 'Teknisi'}
            </Badge>
          ),
        },
        {
          header: 'Aksi',
          headerClassName: 'text-center',
          cell: (s: StaffData) =>
            isAdmin ? (
              <div className="flex items-center justify-center gap-2">
                <Button onClick={() => openEdit(s)} variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-[var(--muted)]/50 text-[var(--muted-foreground)] hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)]" aria-label="Edit data">
                  <Pencil size={16} aria-hidden="true" />
                </Button>
                <Button onClick={() => handleDelete(s.id)} variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-[var(--muted)]/50 text-[var(--muted-foreground)] hover:bg-[var(--destructive)] hover:text-[var(--destructive-foreground)]" aria-label="Hapus data">
                  <Trash2 size={16} aria-hidden="true" />
                </Button>
              </div>
            ) : null,
        },
      ];
    }
    if (activeTab === 'products') {
      return [
        {
          header: 'Nama Model',
          cell: (p: ProductData) => <span className="font-bold text-[var(--foreground)]">{p.modelName}</span>,
        },
        {
          header: 'Serial Number',
          cell: (p: ProductData) => <span className="text-[var(--muted-foreground)] font-medium">{p.serialNumber}</span>,
        },
        {
          header: 'Aksi',
          headerClassName: 'text-center',
          cell: (p: ProductData) =>
            isAdmin ? (
              <div className="flex items-center justify-center gap-2">
                <Button onClick={() => openEdit(p)} variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-[var(--muted)]/50 text-[var(--muted-foreground)] hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)]" aria-label="Edit data">
                  <Pencil size={16} aria-hidden="true" />
                </Button>
                <Button onClick={() => handleDelete(p.id)} variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-[var(--muted)]/50 text-[var(--muted-foreground)] hover:bg-[var(--destructive)] hover:text-[var(--destructive-foreground)]" aria-label="Hapus data">
                  <Trash2 size={16} aria-hidden="true" />
                </Button>
              </div>
            ) : null,
        },
      ];
    }
    return [
      {
        header: 'Nama Model',
        cell: (m: CategoryModelData) => <span className="font-bold text-[var(--foreground)]">{m.name}</span>,
      },
      {
        header: 'Deskripsi',
        cell: (m: CategoryModelData) => <span className="text-sm text-[var(--muted-foreground)]">{m.description || '-'}</span>,
      },
      {
        header: 'Aksi',
        headerClassName: 'text-center',
        cell: (m: CategoryModelData) =>
          isAdmin ? (
            <div className="flex items-center justify-center gap-2">
              <Button onClick={() => openEdit(m)} variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-[var(--muted)]/50 text-[var(--muted-foreground)] hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)]" aria-label="Edit data">
                <Pencil size={16} aria-hidden="true" />
              </Button>
              <Button onClick={() => handleDelete(m.id)} variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-[var(--muted)]/50 text-[var(--muted-foreground)] hover:bg-[var(--destructive)] hover:text-[var(--destructive-foreground)]" aria-label="Hapus data">
                <Trash2 size={16} aria-hidden="true" />
              </Button>
            </div>
          ) : null,
      },
    ];
  };

  const getData = () => {
    switch (activeTab) {
      case 'customers': return filteredCustomers;
      case 'staff': return filteredStaff;
      case 'products': return filteredProducts;
      case 'category-models': return filteredModels;
      case 'ppn-config': return [];
    }
  };

  const handleSavePpn = async () => {
    if (!ppnConfig) return;
    setPpnSaving(true);
    try {
      const updated = await financeApi.updatePpnConfig(ppnConfig);
      setPpnConfig(updated);
      toast.success('Konfigurasi PPN berhasil disimpan');
    } catch {
      toast.error('Gagal menyimpan konfigurasi PPN');
    }
    setPpnSaving(false);
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Master Database"
        subtitle="Manajemen data master pelanggan, staff, produk, dan model."
      />

      <div className="flex gap-2 bg-[var(--card)] p-2 rounded-2xl border border-border/20 overflow-x-auto">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
            className={`flex items-center gap-2 px-5 py-6 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap ${
              activeTab === tab.id ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-0' : ''
            }`}
          >
            {tab.icon}
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === 'ppn-config' ? (
        <div className="glass-panel rounded-[2rem] p-6 md:p-8 space-y-6 border border-border/20">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--foreground)] flex items-center gap-2"><Percent size={16} /> Rumus PPN</h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">Atur cara perhitungan PPN untuk invoice. Berlaku untuk invoice baru; invoice lama tetap pakai snapshot rate.</p>
          </div>
          {ppnLoading || !ppnConfig ? (
            <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] py-8"><Loader2 className="motion-safe:animate-spin" size={16} /> Memuat konfigurasi…</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Tarif PPN (%)</Label>
                  <Input type="number" step="0.25" min={0} max={100} value={String(ppnConfig.ppnRate)} onChange={(e) => setPpnConfig({ ...ppnConfig, ppnRate: parseFloat(e.target.value) || 0 })} className="h-11 rounded-xl border-2 font-bold" />
                </div>
                <div className="space-y-1.5">
                  <Label>Rumus</Label>
                  <select value={ppnConfig.ppnFormula} onChange={(e) => setPpnConfig({ ...ppnConfig, ppnFormula: e.target.value })} className="w-full h-11 rounded-xl border-2 bg-transparent px-3 font-bold outline-none">
                    <option value="EXCLUSIVE">EXCLUSIVE (PPN di atas DPP)</option>
                    <option value="INCLUSIVE">INCLUSIVE (PPN di dalam total)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Pembulatan</Label>
                  <select value={ppnConfig.ppnRounding} onChange={(e) => setPpnConfig({ ...ppnConfig, ppnRounding: e.target.value })} className="w-full h-11 rounded-xl border-2 bg-transparent px-3 font-bold outline-none">
                    <option value="HALF_UP">HALF_UP (toFixed 2 + Math.round)</option>
                    <option value="NONE">NONE (tanpa pembulatan)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Mode Inclusive</Label>
                  <select value={String(ppnConfig.ppnInclusive)} onChange={(e) => setPpnConfig({ ...ppnConfig, ppnInclusive: e.target.value === 'true' })} className="w-full h-11 rounded-xl border-2 bg-transparent px-3 font-bold outline-none">
                    <option value="false">Tidak — pakai Rumus</option>
                    <option value="true">Ya — paksa Inclusive</option>
                  </select>
                </div>
              </div>
              <div className="paper-card rounded-2xl p-4 border border-border/20 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">Preview (contoh DPP 1.000.000)</p>
                {(() => {
                  const subtotal = 1000000;
                  const rate = ppnConfig.ppnRate;
                  const inclusive = ppnConfig.ppnInclusive || ppnConfig.ppnFormula === 'INCLUSIVE';
                  let ppn: number; let total: number;
                  if (inclusive) { total = subtotal; ppn = total * rate / (100 + rate); if (ppnConfig.ppnRounding !== 'NONE') ppn = Number(ppn.toFixed(2)); } else { ppn = ppnConfig.ppnRounding === 'NONE' ? subtotal * rate / 100 : Math.round(subtotal * rate / 100); total = subtotal + ppn; }
                  return (
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-[var(--muted-foreground)]">DPP Rp 1.000.000 → PPN {rate}% = Rp {Math.round(ppn).toLocaleString('id-ID')} → Total Rp {Math.round(total).toLocaleString('id-ID')}</span>
                      <span className="text-[var(--primary)]">{inclusive ? 'INCLUSIVE' : 'EXCLUSIVE'} / {ppnConfig.ppnRounding}</span>
                    </div>
                  );
                })()}
                <p className="text-[10px] text-[var(--muted-foreground)] italic">Perubahan hanya berlaku untuk invoice yang dibuat setelah disimpan.</p>
              </div>
              <Button onClick={handleSavePpn} disabled={ppnSaving} className="h-12 rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 font-black text-xs uppercase tracking-widest px-8">
                {ppnSaving ? <Loader2 size={16} className="motion-safe:animate-spin" /> : <Check size={16} />} Simpan Konfigurasi
              </Button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-4">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder={`Cari ${activeTab === 'customers' ? 'pelanggan' : activeTab === 'staff' ? 'staff' : activeTab === 'products' ? 'produk' : 'model'}...`}
            />
            {isAdmin && (
              <Button onClick={openCreate} className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] font-black px-6 py-6 rounded-2xl shadow-lg flex gap-2 uppercase text-xs tracking-widest border-none shrink-0">
                <Plus size={16} strokeWidth={3} aria-hidden="true" /> Tambah Data
              </Button>
            )}
          </div>

          <DataTable
            columns={getColumns()}
            data={getData()}
            keyExtractor={(item: any) => item.id}
            isLoading={loading}
            headerTitle={
              <>{tabs.find((t) => t.id === activeTab)?.icon} Data {tabs.find((t) => t.id === activeTab)?.label}</>
            }
            footer={
              <p className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest italic">
                Data master untuk referensi sistem
              </p>
            }
          />
        </>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        message="Data yang dihapus tidak bisa dikembalikan."
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete(null)}
      />

      {modal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
          <div className="bg-[var(--card)] rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-border/30 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200">
            <div className="bg-[var(--card)] text-[var(--foreground)] p-6 flex justify-between items-center border-b border-border/20">
              <h2 className="text-xs font-black uppercase tracking-widest">
                {modal.mode === 'create' ? 'Tambah' : 'Edit'} {tabs.find((t) => t.id === activeTab)?.label}
              </h2>
              <Button onClick={closeModal} variant="ghost" size="icon" className="rounded-xl" aria-label="Tutup modal">
                <X size={18} aria-hidden="true" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              {renderModalFields()}
              <div className="flex gap-3 pt-2">
                <Button onClick={closeModal} variant="outline" className="flex-1 h-12 rounded-2xl border-2 font-black text-xs uppercase tracking-widest">
                  Batal
                </Button>
                <Button onClick={handleSubmit} disabled={submitting} className="flex-1 h-12 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] rounded-2xl font-black text-xs uppercase tracking-widest border-none disabled:opacity-50">
                  {submitting ? <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" /> : <Check size={16} aria-hidden="true" />} Simpan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
