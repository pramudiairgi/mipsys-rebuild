# Design: Perbaikan Cetak Penawaran (Print Mismatch)

**Tanggal:** 2026-08-23
**Status:** Disetujui
**Konteks:** Menu Service Request → tombol "Cetak" pada modal penawaran.

## Masalah

Pada modal "Cetak Penawaran" (`ApproveQuoteModal.tsx`), preview di layar (halaman putih `.print-area`) sudah benar, tetapi hasil cetak (`window.print()`) tidak sama dengan preview:

1. **Posisi/lebar tidak full** — `.print-area` diposisikan absolut relatif terhadap `DialogPrimitive.Content` Radix yang `fixed`, `max-w-3xl`, `translate(-50%,-50%)`, dan `overflow-hidden`. Hasil cetak bukan halaman A4 penuh.
2. **Styling tidak sesuai** — CSS cetak menggunakan `body * { visibility:hidden }` + `visibility:visible` pada `.print-area`. Browser secara default tidak mencetak background graphics, sehingga warna (judul emerald, header tabel abu-abu, border) pudar/hilang dibanding preview. Container `overflow-hidden`/`overflow-y-auto` juga memotong konten tinggi (footer, tanda tangan).

## Pendekatan yang Dipilih

**Portal dokumen cetak.** Ekstrak markup halaman putih menjadi komponen `QuoteDocument` yang murni presentasional. Komponen ini dirender dua kali:

- **Preview layar:** di dalam area scroll modal (tampilan tetap sama).
- **Cetakan:** via `ReactDOM.createPortal` ke `document.body` dalam wrapper `.print-portal` yang `display:none` di layar dan `display:block` (A4 penuh) hanya saat `@media print`.

Karena preview dan cetakan memakai komponen **sama**, hasil cetak dijamin identik dengan preview, lebar penuh, dan warna benar (via `print-color-adjust: exact`).

Pendekatan alternatif yang ditolak:
- **Netralkan batasan dialog di CSS cetak** — diff lebih kecil tapi rapuh, bergantung class internal Radix & overlay.
- **`window.open` jendela baru** — terpisah penuh tapi kehilangan konteks styling SPA & UX kurang nyaman.

## Desain Detail

### 1. Komponen baru `QuoteDocument.tsx`

Lokasi: `src/features/service-request/components/QuoteDocument.tsx`

Props:
- `ticketNumber: string`
- `parts: { partName: string; partCode?: string; quantity: number; priceAtAction?: number }[]`
- `savedServiceFee: number`
- `savedPartFee: number`
- `date: string` (sudah diformat `id-ID`)

Komponen murni presentasional berisi markup persis halaman putih saat ini (`ApproveQuoteModal.tsx:240-380`): kop surat, info tiket, pembukaan, tabel rincian biaya, ringkasan total (part, jasa, subtotal, PPN 11%, grand total), terbilang, ketentuan, dan footer. Helper `numberToWords` dipindah ke sini (atau di-share via util).

Tidak ada chrome modal (header/footer tombol) di dalamnya.

### 2. Refaktor `ApproveQuoteModal.tsx`

- Import `QuoteDocument` dan `react-dom` `createPortal`.
- **Preview layar:** ganti markup `.print-area` (baris 239-381) dengan `<QuoteDocument ... />` dibungkus wrapper yang sama (`p-[15mm] !bg-white !text-black`, `minHeight: 297mm`) agar tampilan layar tidak berubah.
- **Cetakan:** tambahkan `createPortal(<div className="print-portal"><QuoteDocument ... /></div>, document.body)` yang dirender hanya saat `step === 'preview'`.
- `handlePrint` tetap memanggil `window.print()`.
- Hapus helper `numberToWords` dari file ini (dipindah ke `QuoteDocument`).

Data yang dibutuhkan sudah ada di modal: `parts`, `savedServiceFee`, `savedPartFee`, `ticketNumber`, dan `crmData.date`.

### 3. CSS cetak (ganti blok `<style jsx global>` baris 160-200)

```css
@media print {
  body > *:not(.print-portal) {
    display: none !important;
  }
  .print-portal {
    display: block !important;
    position: absolute;
    inset: 0;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  @page {
    margin: 0;
    size: A4;
  }
}

.print-table th,
.print-table td {
  border: 1px solid #d1d5db !important;
  padding: 8px 12px !important;
  font-size: 12px !important;
}
.print-table th {
  background-color: #f3f4f6 !important;
  font-weight: 800 !important;
  text-transform: uppercase !important;
  font-size: 10px !important;
  color: #6b7280 !important;
}
.print-table td {
  color: #111827 !important;
}
```

Wrapper `.print-portal` diberi `!bg-white !text-black` dan `p-[15mm]` (sama dengan preview) sehingga halaman cetak persis sama dengan preview.

### 4. Penanganan Error

- Jika `parts` kosong atau `savedServiceFee`/`savedPartFee` bernilai 0, `QuoteDocument` tetap merender struktur surat dengan nilai 0 (konsisten dengan preview saat ini — tidak ada perubahan perilaku).
- Portal hanya dibuat saat `step === 'preview'` dan `document` tersedia (guard `typeof document !== 'undefined'` untuk SSR safety).

### 5. Pengujian

- **Unit (`QuoteDocument.test.tsx`):** render dengan parts & fee sampel → assert konten kop surat, nomor tiket, baris tabel, grand total, dan terbilang muncul; snapshot untuk mendeteksi regresi layout.
- **Manual:** buka SR yang memiliki quote tersimpan → klik "Cetak" → bandingkan preview layar dan pratinjau cetak browser: lebar A4 penuh, warna (judul emerald, header abu-abu, border) muncul, semua bagian (footer & tanda tangan) lengkap dan tidak terpotong.

## Kriteria Sukses

- Hasil cetak identik dengan preview di layar (lebar, warna, layout, kelengkapan konten).
- Tidak ada regresi pada tampilan preview modal.
- Lint & build frontend lolos.
