# Cetak Penawaran Print Mismatch — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the printed "Cetak Penawaran" output identical to the on-screen preview (full A4 width, correct colors, complete content) by rendering the quote through a print-only portal.

**Architecture:** Extract the white-page markup from `ApproveQuoteModal` into a reusable `QuoteDocument` component. Render it once for the on-screen preview (unchanged look) and once more via `ReactDOM.createPortal` into `document.body` inside a `.print-portal` wrapper that is hidden on screen but shown full-page in `@media print`. A single `@media print` CSS rule hides the whole app and forces color printing, so preview == print by construction.

**Tech Stack:** React 19, Next.js 16 (App Router), TypeScript, styled-jsx (already used in modal), Vitest + @testing-library/react + jsdom (bootstrapped in this plan for the component test).

---

## File Structure

- **Create** `src/features/service-request/components/QuoteDocument.tsx` — pure presentational quote document (kop surat, table, totals, terbilang, ketentuan, footer). Owns `numberToWords` helper.
- **Create** `vitest.config.ts` — Vitest config for React/Next component tests.
- **Create** `src/features/service-request/components/QuoteDocument.test.tsx` — unit test for `QuoteDocument`.
- **Modify** `src/components/layout/ApproveQuoteModal.tsx` — replace inline `.print-area` markup with `<QuoteDocument>`, add the print portal, replace the `<style jsx global>` block with the new print CSS, remove the now-duplicated `numberToWords` and inline CRM markup.
- **Modify** `package.json` — add `test` script and Vitest devDependencies.

---

### Task 1: Bootstrap Vitest for the frontend

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Add devDependencies and test script to `package.json`**

In `package.json`, add to `scripts`:
```json
"test": "vitest run",
"test:watch": "vitest"
```
Add to `devDependencies` (use compatible versions for React 19 / Next 16):
```json
"@testing-library/jest-dom": "^6.4.0",
"@testing-library/react": "^16.0.0",
"@vitejs/plugin-react": "^4.3.0",
"jsdom": "^25.0.0",
"vitest": "^2.1.0"
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
```

- [ ] **Step 3: Create `vitest.setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Install dependencies**

Run: `npm install`
Expected: installs cleanly, no peer-dependency errors.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts vitest.setup.ts
git commit -m "chore: bootstrap Vitest + Testing Library for frontend"
```

---

### Task 2: Write the failing test for `QuoteDocument`

**Files:**
- Create: `src/features/service-request/components/QuoteDocument.test.tsx`

- [ ] **Step 1: Write the test (must fail — component does not exist yet)**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { QuoteDocument } from './QuoteDocument';

const parts = [
  { partName: 'Belt Timing', partCode: 'BT-01', quantity: 2, priceAtAction: 50000 },
  { partName: 'Oil Filter', partCode: 'OF-09', quantity: 1, priceAtAction: 25000 },
];

describe('QuoteDocument', () => {
  it('renders company name and document title', () => {
    render(
      <QuoteDocument
        ticketNumber="SR-1001"
        date="23 Agustus 2026"
        parts={parts}
        savedServiceFee={100000}
        savedPartFee={125000}
      />,
    );
    expect(screen.getByText('MiPSys')).toBeInTheDocument();
    expect(screen.getByText('SURAT PENAWARAN')).toBeInTheDocument();
  });

  it('renders each proposed part with quantity and line total', () => {
    render(
      <QuoteDocument
        ticketNumber="SR-1001"
        date="23 Agustus 2026"
        parts={parts}
        savedServiceFee={100000}
        savedPartFee={125000}
      />,
    );
    expect(screen.getByText('Belt Timing')).toBeInTheDocument();
    expect(screen.getByText('Oil Filter')).toBeInTheDocument();
    // line total Belt Timing = 2 x 50000 = 100.000
    expect(screen.getByText(/100\.000/)).toBeInTheDocument();
  });

  it('renders grand total including PPN 11%', () => {
    render(
      <QuoteDocument
        ticketNumber="SR-1001"
        date="23 Agustus 2026"
        parts={parts}
        savedServiceFee={100000}
        savedPartFee={125000}
      />,
    );
    // subtotal = 125000 + 100000 = 225000; +11% = 249750
    expect(screen.getByText(/249\.750/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module './QuoteDocument'` or `QuoteDocument is not exported`.

- [ ] **Step 3: Commit the failing test**

```bash
git add src/features/service-request/components/QuoteDocument.test.tsx
git commit -m "test: add failing test for QuoteDocument"
```

---

### Task 3: Implement `QuoteDocument`

**Files:**
- Create: `src/features/service-request/components/QuoteDocument.tsx`

- [ ] **Step 1: Create the component with the extracted markup**

```tsx
'use client';

export interface QuotePart {
  partName: string;
  partCode?: string | null;
  quantity: number;
  priceAtAction?: number | null;
}

export interface QuoteDocumentProps {
  ticketNumber: string;
  date: string;
  parts: QuotePart[];
  savedServiceFee: number;
  savedPartFee: number;
}

const PPN_RATE = 0.11;

function numberToWords(num: number): string {
  if (num === 0) return 'Nol Rupiah';
  const units = ['', 'Ribu', 'Juta', 'Miliar', 'Triliun'];
  const ones = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas', 'Duabelas', 'Tigabelas', 'Empatbelas', 'Limabelas', 'Enambelas', 'Tujuhbelas', 'Delapanbelas', 'Sembilanbelas'];
  const tens = ['', '', 'Dua Puluh', 'Tiga Puluh', 'Empat Puluh', 'Lima Puluh', 'Enam Puluh', 'Tujuh Puluh', 'Delapan Puluh', 'Sembilan Puluh'];

  function convert(n: number): string {
    if (n < 0) return 'Minus ' + convert(-n);
    if (n < 12) return ones[n] || '';
    if (n < 20) return ones[n] || '';
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 200) return 'Seratus ' + convert(n - 100);
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Ratus ' + convert(n % 100);
    for (let i = 1; i < units.length; i++) {
      const divisor = Math.pow(1000, i);
      if (n < divisor * 1000) {
        const prefix = n < divisor * 10 && i === 1 ? 'Se' : convert(Math.floor(n / divisor)) + ' ';
        return prefix + units[i] + (n % divisor ? ' ' + convert(n % divisor) : '');
      }
    }
    return '';
  }

  return convert(Math.round(num)) + ' Rupiah';
}

export function QuoteDocument({
  ticketNumber,
  date,
  parts,
  savedServiceFee,
  savedPartFee,
}: QuoteDocumentProps) {
  const subtotal = savedPartFee + savedServiceFee;
  const ppn = Math.round(subtotal * PPN_RATE);
  const grandTotal = subtotal + ppn;

  const crmData = {
    companyName: 'MiPSys',
    companyAddress: 'Jl. Raya Service No. 1',
    companyPhone: '(021) 1234-5678',
    ticketNumber,
    date,
  };

  return (
    <div
      className="p-[15mm] !bg-white !text-black"
      style={{ minHeight: '297mm', boxSizing: 'border-box' }}
    >
      {/* Kop Surat */}
      <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-stone-300">
        <div>
          <h1 className="text-3xl font-black text-stone-900 uppercase tracking-tight">
            {crmData.companyName}
          </h1>
          <p className="text-xs text-stone-500 mt-1">{crmData.companyAddress}</p>
          <p className="text-xs text-stone-500">{crmData.companyPhone}</p>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-black text-emerald-700 uppercase tracking-widest">
            SURAT PENAWARAN
          </h2>
          <p className="text-[10px] text-stone-400 mt-1">No. {crmData.ticketNumber}</p>
        </div>
      </div>

      {/* Info Tiket */}
      <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
        <div>
          <p className="text-[10px] font-bold text-stone-400 uppercase mb-0.5">Kepada</p>
          <p className="font-bold text-stone-900">Yth. Pelanggan</p>
          <p className="text-xs text-stone-600">di Tempat</p>
        </div>
        <div className="text-right space-y-1">
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase">Tanggal</p>
            <p className="text-sm text-stone-900">{crmData.date}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase">No. Tiket</p>
            <p className="text-sm font-bold text-stone-900">{crmData.ticketNumber}</p>
          </div>
        </div>
      </div>

      {/* Pembukaan */}
      <p className="text-xs text-stone-700 mb-6 leading-relaxed">
        Dengan hormat, bersama ini kami sampaikan penawaran biaya perbaikan/service untuk unit
        Bapak/Ibu sebagai berikut:
      </p>

      {/* Rincian Biaya */}
      <table className="print-table w-full mb-6" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th className="w-8 text-center">No</th>
            <th className="text-left">Item Pekerjaan / Sparepart</th>
            <th className="w-16 text-center">Qty</th>
            <th className="w-32 text-right">Harga Satuan</th>
            <th className="w-32 text-right">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          {parts.map((part, idx) => (
            <tr key={idx}>
              <td className="text-center text-stone-500">{idx + 1}</td>
              <td className="font-semibold">{part.partName}</td>
              <td className="text-center">{part.quantity}</td>
              <td className="text-right">
                Rp {Number(part.priceAtAction ?? 0).toLocaleString('id-ID')}
              </td>
              <td className="text-right font-semibold">
                Rp {(Number(part.priceAtAction ?? 0) * part.quantity).toLocaleString('id-ID')}
              </td>
            </tr>
          ))}
          <tr>
            <td className="text-center text-stone-500">{parts.length + 1}</td>
            <td className="font-semibold">Biaya Jasa (Service Fee)</td>
            <td className="text-center">1</td>
            <td className="text-right">Rp {savedServiceFee.toLocaleString('id-ID')}</td>
            <td className="text-right font-semibold">
              Rp {savedServiceFee.toLocaleString('id-ID')}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Ringkasan Total */}
      <div className="ml-auto w-80 space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-stone-500">Total Biaya Part</span>
          <span className="font-semibold text-stone-900">Rp {savedPartFee.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-stone-500">Total Biaya Jasa</span>
          <span className="font-semibold text-stone-900">Rp {savedServiceFee.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between text-xs border-t border-stone-200 pt-1.5">
          <span className="font-bold text-stone-700">Subtotal</span>
          <span className="font-bold text-stone-900">Rp {subtotal.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-stone-500">PPN 11%</span>
          <span className="font-semibold text-stone-900">Rp {ppn.toLocaleString('id-ID')}</span>
        </div>
        <hr className="border-stone-300 border-t-2" />
        <div className="flex justify-between">
          <span className="font-black text-stone-700 uppercase text-sm">Grand Total</span>
          <span className="text-xl font-black text-emerald-700">
            Rp {grandTotal.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Terbilang */}
      <p className="text-[11px] text-stone-500 mt-2 text-right italic">
        # {numberToWords(grandTotal)}
      </p>

      {/* Catatan & Syarat */}
      <div className="mt-10 pt-6 border-t border-stone-200">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase mb-2">Ketentuan:</p>
            <ul className="text-[10px] text-stone-500 space-y-1 list-disc list-inside leading-relaxed">
              <li>Penawaran berlaku 7 hari sejak tanggal diterbitkan</li>
              <li>Harga sudah termasuk PPN 11%</li>
              <li>Pembayaran dilakukan di kasir sebelum unit diambil</li>
              <li>Garansi pekerjaan sesuai ketentuan yang berlaku</li>
            </ul>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold text-stone-400 uppercase mb-8">Hormat Kami,</p>
            <div className="h-12" />
            <p className="text-xs font-bold text-stone-900">(________________________)</p>
            <p className="text-[10px] text-stone-400">Manajemen {crmData.companyName}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-stone-200 text-center text-[9px] text-stone-400">
        <p>{crmData.companyName} — {crmData.companyAddress} | Telp: {crmData.companyPhone}</p>
        <p className="mt-0.5">Dokumen ini dibuat secara otomatis dan tidak memerlukan tanda tangan basah</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run the test to verify it passes**

Run: `npm test`
Expected: PASS (3 tests).

- [ ] **Step 3: Commit**

```bash
git add src/features/service-request/components/QuoteDocument.tsx src/features/service-request/components/QuoteDocument.test.tsx
git commit -m "feat: extract QuoteDocument component with unit test"
```

---

### Task 4: Refactor `ApproveQuoteModal` to use the portal + `QuoteDocument`

**Files:**
- Modify: `src/components/layout/ApproveQuoteModal.tsx`

- [ ] **Step 1: Update imports**

At the top of `ApproveQuoteModal.tsx`, change the React import to include `createPortal` and add the `QuoteDocument` import:

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { QuoteDocument } from '@/src/features/service-request/components/QuoteDocument';
```

- [ ] **Step 2: Compute the print date once (near the other derived values, around line 104)**

Replace the existing `crmData` object (lines 150-156) with a date-only value, since `QuoteDocument` now owns the CRM header. Add:

```tsx
const printDate = new Date().toLocaleDateString('id-ID', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});
```

Remove the old `crmData` constant block (it is no longer used in the modal).

- [ ] **Step 3: Replace the `<style jsx global>` block (lines 160-200)**

Replace the entire `<style jsx global>{...}</style>` block with:

```tsx
      <style jsx global>{`
        .print-portal {
          display: none;
        }
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
      `}</style>
```

- [ ] **Step 4: Replace the inline preview markup with `<QuoteDocument>`**

In the `step === 'preview'` branch, replace the block starting at `<div ref={printRef} className="print-area">` (line 239) through its closing `</div>` (line 381) — i.e. the entire white-page markup — with:

```tsx
                  <div className="flex-1 overflow-y-auto">
                    <QuoteDocument
                      ticketNumber={ticketNumber}
                      date={printDate}
                      parts={parts}
                      savedServiceFee={savedServiceFee}
                      savedPartFee={savedPartFee}
                    />
                  </div>
```

(Keep the surrounding `<div className="flex-1 overflow-y-auto">` wrapper exactly as-is; only swap its child.)

- [ ] **Step 5: Remove the unused `printRef`**

The `printRef` (line 60, `const printRef = useRef<HTMLDivElement>(null);`) is no longer attached to any element. Delete that line and the now-unused `useRef` import if it is not used elsewhere in the file.

- [ ] **Step 6: Add the print-only portal (render next to the `<Dialog>` return, e.g. just before the closing `</>`)**

Add inside the fragment returned by the component, after the `</Dialog>`:

```tsx
      {typeof document !== 'undefined' && step === 'preview' &&
        createPortal(
          <div className="print-portal">
            <QuoteDocument
              ticketNumber={ticketNumber}
              date={printDate}
              parts={parts}
              savedServiceFee={savedServiceFee}
              savedPartFee={savedPartFee}
            />
          </div>,
          document.body,
        )}
```

- [ ] **Step 7: Remove the duplicated `numberToWords` helper**

Delete the `numberToWords` function definition from `ApproveQuoteModal.tsx` (the block at the end of the file, lines ~655-679). It now lives in `QuoteDocument`.

- [ ] **Step 8: Run lint**

Run: `npm run lint`
Expected: no errors. (Fix any unused-import or type errors, e.g. if `useRef` removal leaves an unused import.)

- [ ] **Step 9: Run build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 10: Commit**

```bash
git add src/components/layout/ApproveQuoteModal.tsx
git commit -m "fix: render print quote via portal so output matches preview"
```

---

### Task 5: Manual verification

**Files:** none (verification only)

- [ ] **Step 1: Start the frontend and backend**

Run in two terminals:
```bash
# backend
cd ../mipsys-backend && npm run dev
# frontend
npm run dev
```

- [ ] **Step 2: Open a Service Request that already has a saved quote**

Navigate to a ticket in `WAITING_APPROVE`/`CHECK` state that has a saved quote (service fee + proposed parts). The modal's preview step should show the white A4-style page.

- [ ] **Step 3: Trigger print and compare**

Click **Cetak**. In the browser print preview, verify ALL of:
- Width fills the full A4 page (no dialog-shaped box / no large empty margins).
- Colors present: emerald "SURAT PENAWARAN" heading, gray table header row, borders.
- All sections present and not cut off: kop surat, table, ringkasan total, terbilang, ketentuan, tanda tangan, footer.
- The on-screen preview and the printed page are visually identical in layout and styling.

- [ ] **Step 4: Run the unit test suite once more**

Run: `npm test`
Expected: PASS.

---

## Self-Review Notes

- **Spec coverage:** Portal approach (spec §Desain 2) → Task 4 steps 5-6. `QuoteDocument` extraction (spec §1) → Task 3. CSS (spec §3) → Task 4 step 3. Unit test (spec §5) → Task 2-3. Manual check (spec §5) → Task 5. All covered.
- **No placeholders:** every code step contains full source.
- **Type consistency:** `QuoteDocument` prop names (`ticketNumber`, `date`, `parts`, `savedServiceFee`, `savedPartFee`) match both the import in `ApproveQuoteModal` and the test. `parts` in the modal is `ProposedPart[]` which structurally satisfies `QuotePart[]` (has `partName`, `partCode`, `quantity`, `priceAtAction`).
