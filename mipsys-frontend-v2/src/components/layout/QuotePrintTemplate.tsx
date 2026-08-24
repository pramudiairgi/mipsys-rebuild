'use client';

import React from 'react';

export interface QuotePrintPart {
  id: number;
  partName: string;
  quantity: number;
  priceAtAction?: number | string | null;
}

interface QuotePrintTemplateProps {
  ticketNumber: string;
  parts: QuotePrintPart[];
  serviceFee: number;
  partFee: number;
}

export const QuotePrintTemplate = React.forwardRef<
  HTMLDivElement,
  QuotePrintTemplateProps
>((props, ref) => {
  const { ticketNumber, parts, serviceFee, partFee } = props;

  const crmData = {
    companyName: 'MiPSys',
    companyAddress: 'Jl. Raya Service No. 1',
    companyPhone: '(021) 1234-5678',
    ticketNumber,
    date: new Date().toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  };

  const subtotal = partFee + serviceFee;
  const ppn = Math.round(subtotal * 0.11);
  const grandTotal = Math.round(subtotal * 1.11);

  return (
    <div
      ref={ref}
      className="bg-white text-stone-900"
      style={{
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
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
          <p className="text-[10px] text-stone-400 mt-1">
            No. {crmData.ticketNumber}
          </p>
        </div>
      </div>

      {/* Info Tiket */}
      <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
        <div>
          <p className="text-[10px] font-bold text-stone-400 uppercase mb-0.5">
            Kepada
          </p>
          <p className="font-bold text-stone-900">Yth. Pelanggan</p>
          <p className="text-xs text-stone-600">di Tempat</p>
        </div>
        <div className="text-right space-y-1">
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase">
              Tanggal
            </p>
            <p className="text-sm text-stone-900">{crmData.date}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase">
              No. Tiket
            </p>
            <p className="text-sm font-bold text-stone-900">
              {crmData.ticketNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Pembukaan */}
      <p className="text-xs text-stone-700 mb-6 leading-relaxed">
        Dengan hormat, bersama ini kami sampaikan penawaran biaya
        perbaikan/service untuk unit Bapak/Ibu sebagai berikut:
      </p>

      {/* Rincian Biaya */}
      <table
        className="w-full mb-6"
        style={{ borderCollapse: 'collapse' }}
      >
        <thead>
          <tr>
            <th className="w-8 text-center border border-stone-300 bg-stone-100 px-3 py-2 text-[10px] font-extrabold uppercase text-stone-500">
              No
            </th>
            <th className="text-left border border-stone-300 bg-stone-100 px-3 py-2 text-[10px] font-extrabold uppercase text-stone-500">
              Item Pekerjaan / Sparepart
            </th>
            <th className="w-16 text-center border border-stone-300 bg-stone-100 px-3 py-2 text-[10px] font-extrabold uppercase text-stone-500">
              Qty
            </th>
            <th className="w-32 text-right border border-stone-300 bg-stone-100 px-3 py-2 text-[10px] font-extrabold uppercase text-stone-500">
              Harga Satuan
            </th>
            <th className="w-32 text-right border border-stone-300 bg-stone-100 px-3 py-2 text-[10px] font-extrabold uppercase text-stone-500">
              Jumlah
            </th>
          </tr>
        </thead>
        <tbody>
          {parts.map((part, idx) => (
            <tr key={part.id}>
              <td className="text-center text-stone-500 border border-stone-300 px-3 py-2 text-xs">
                {idx + 1}
              </td>
              <td className="font-semibold border border-stone-300 px-3 py-2 text-xs">
                {part.partName}
              </td>
              <td className="text-center border border-stone-300 px-3 py-2 text-xs">
                {part.quantity}
              </td>
              <td className="text-right border border-stone-300 px-3 py-2 text-xs">
                Rp {Number(part.priceAtAction ?? 0).toLocaleString('id-ID')}
              </td>
              <td className="text-right font-semibold border border-stone-300 px-3 py-2 text-xs">
                Rp{' '}
                {(Number(part.priceAtAction ?? 0) * part.quantity).toLocaleString(
                  'id-ID',
                )}
              </td>
            </tr>
          ))}
          <tr>
            <td className="text-center text-stone-500 border border-stone-300 px-3 py-2 text-xs">
              {parts.length + 1}
            </td>
            <td className="font-semibold border border-stone-300 px-3 py-2 text-xs">
              Biaya Jasa (Service Fee)
            </td>
            <td className="text-center border border-stone-300 px-3 py-2 text-xs">
              1
            </td>
            <td className="text-right border border-stone-300 px-3 py-2 text-xs">
              Rp {serviceFee.toLocaleString('id-ID')}
            </td>
            <td className="text-right font-semibold border border-stone-300 px-3 py-2 text-xs">
              Rp {serviceFee.toLocaleString('id-ID')}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Ringkasan Total */}
      <div className="ml-auto w-80 space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-stone-500">Total Biaya Part</span>
          <span className="font-semibold text-stone-900">
            Rp {partFee.toLocaleString('id-ID')}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-stone-500">Total Biaya Jasa</span>
          <span className="font-semibold text-stone-900">
            Rp {serviceFee.toLocaleString('id-ID')}
          </span>
        </div>
        <div className="flex justify-between text-xs border-t border-stone-200 pt-1.5">
          <span className="font-bold text-stone-700">Subtotal</span>
          <span className="font-bold text-stone-900">
            Rp {subtotal.toLocaleString('id-ID')}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-stone-500">PPN 11%</span>
          <span className="font-semibold text-stone-900">
            Rp {ppn.toLocaleString('id-ID')}
          </span>
        </div>
        <hr className="border-stone-300 border-t-2" />
        <div className="flex justify-between">
          <span className="font-black text-stone-700 uppercase text-sm">
            Grand Total
          </span>
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
            <p className="text-[10px] font-bold text-stone-400 uppercase mb-2">
              Ketentuan:
            </p>
            <ul className="text-[10px] text-stone-500 space-y-1 list-disc list-inside leading-relaxed">
              <li>Penawaran berlaku 7 hari sejak tanggal diterbitkan</li>
              <li>Harga sudah termasuk PPN 11%</li>
              <li>Pembayaran dilakukan di kasir sebelum unit diambil</li>
              <li>Garansi pekerjaan sesuai ketentuan yang berlaku</li>
            </ul>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold text-stone-400 uppercase mb-8">
              Hormat Kami,
            </p>
            <div className="h-12" />
            <p className="text-xs font-bold text-stone-900">
              (________________________)
            </p>
            <p className="text-[10px] text-stone-400">
              Manajemen {crmData.companyName}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-stone-200 text-center text-[9px] text-stone-400">
        <p>
          {crmData.companyName} — {crmData.companyAddress} | Telp:{' '}
          {crmData.companyPhone}
        </p>
        <p className="mt-0.5">
          Dokumen ini dibuat secara otomatis dan tidak memerlukan tanda tangan
          basah
        </p>
      </div>
    </div>
  );
});

QuotePrintTemplate.displayName = 'QuotePrintTemplate';

function numberToWords(num: number): string {
  if (num === 0) return 'Nol Rupiah';
  const units = ['', 'Ribu', 'Juta', 'Miliar', 'Triliun'];
  const ones = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan',
    'Sembilan', 'Sepuluh', 'Sebelas', 'Duabelas', 'Tigabelas', 'Empatbelas',
    'Limabelas', 'Enambelas', 'Tujuhbelas', 'Delapanbelas', 'Sembilanbelas',
  ];
  const tens = [
    '', '', 'Dua Puluh', 'Tiga Puluh', 'Empat Puluh', 'Lima Puluh',
    'Enam Puluh', 'Tujuh Puluh', 'Delapan Puluh', 'Sembilan Puluh',
  ];

  function convert(n: number): string {
    if (n < 0) return 'Minus ' + convert(-n);
    if (n < 12) return ones[n] || '';
    if (n < 20) return ones[n] || '';
    if (n < 100)
      return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 200) return 'Seratus ' + convert(n - 100);
    if (n < 1000)
      return ones[Math.floor(n / 100)] + ' Ratus ' + convert(n % 100);
    for (let i = 1; i < units.length; i++) {
      const divisor = Math.pow(1000, i);
      if (n < divisor * 1000) {
        const prefix =
          n < divisor * 10 && i === 1 ? 'Se' : convert(Math.floor(n / divisor)) + ' ';
        return prefix + units[i] + (n % divisor ? ' ' + convert(n % divisor) : '');
      }
    }
    return '';
  }

  return convert(Math.round(num)) + ' Rupiah';
}
