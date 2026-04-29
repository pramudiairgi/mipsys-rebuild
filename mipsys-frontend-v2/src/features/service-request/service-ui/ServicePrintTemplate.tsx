// src/features/service-request/service-ui/ServicePrintTemplate.tsx
import React from 'react';
import { ServiceRequest } from '../types';

export const ServicePrintTemplate = React.forwardRef<
  HTMLDivElement,
  { data: ServiceRequest }
>((props, ref) => {
  const { data } = props;

  // Pastikan data biaya dalam tipe number
  const sFee = Number(data.serviceFee || 0);
  const pFee = Number(data.partFee || 0);
  const totalBiaya = sFee + pFee;

  return (
    <div
      ref={ref}
      className="p-12 text-slate-900 bg-white"
      style={{ minHeight: '297mm', fontFamily: 'sans-serif' }}
    >
      {/* HEADER */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter">
            MIPSYS
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">
            Enterprise AAA - Service Report
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-400 uppercase">
            Nomor Tiket
          </p>
          <h2 className="text-xl font-black">{data.ticketNumber}</h2>
          <p className="text-[10px] font-medium text-slate-500 mt-1">
            Dicetak:{' '}
            {new Date().toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* INFO PELANGGAN & UNIT */}
      <div className="grid grid-cols-2 gap-12 mb-10">
        <div className="space-y-1">
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
            Informasi Pelanggan
          </h3>
          <p className="font-bold text-lg">{data.customerName}</p>
          <p className="text-sm text-slate-600">{data.customerPhone}</p>
          <p className="text-sm text-slate-600 leading-relaxed">
            {data.customerAddress}
          </p>
        </div>
        <div className="space-y-1">
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
            Detail Perangkat
          </h3>
          <p className="font-bold text-lg">{data.modelName}</p>
          <p className="text-sm font-mono bg-slate-100 px-2 py-0.5 rounded w-fit">
            S/N: {data.serialNumber}
          </p>
          <p className="text-sm text-slate-600 italic">
            Tipe:{' '}
            {data.serviceType === 'WARRANTY'
              ? 'Garansi (Warranty)'
              : 'Non-Garansi'}
          </p>
        </div>
      </div>

      {/* ANALISA TEKNIS */}
      <div className="mb-10">
        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 border-b pb-1">
          Analisa & Tindakan Akhir
        </h3>
        <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 italic text-sm leading-relaxed text-slate-700">
          "{data.remarksHistory || 'Tidak ada catatan diagnosa teknis.'}"
        </div>
      </div>

      {/* RINCIAN BIAYA (TABEL) */}
      <div className="mb-10">
        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 border-b pb-1">
          Rincian Estimasi Biaya
        </h3>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="py-3 font-black uppercase text-[10px]">
                Deskripsi Layanan / Part
              </th>
              <th className="py-3 font-black uppercase text-[10px] text-center">
                Qty
              </th>
              <th className="py-3 font-black uppercase text-[10px] text-right">
                Harga Satuan
              </th>
              <th className="py-3 font-black uppercase text-[10px] text-right">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Baris Biaya Jasa */}
            <tr>
              <td className="py-4 font-bold">
                Biaya Jasa Servis ({data.serviceType})
              </td>
              <td className="py-4 text-center">1</td>
              <td className="py-4 text-right">
                Rp {sFee.toLocaleString('id-ID')}
              </td>
              <td className="py-4 text-right">
                Rp {sFee.toLocaleString('id-ID')}
              </td>
            </tr>

            {/* Daftar Spareparts */}
            {data.parts && data.parts.length > 0 ? (
              data.parts.map((part, index) => (
                <tr key={index}>
                  <td className="py-4">
                    <p className="font-bold">{part.partName}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-medium">
                      Suku Cadang
                    </p>
                  </td>
                  <td className="py-4 text-center">{part.quantity}</td>
                  <td className="py-4 text-right">
                    Rp {Number(part.unitPrice).toLocaleString('id-ID')}
                  </td>
                  <td className="py-4 text-right">
                    Rp{' '}
                    {(
                      Number(part.quantity) * Number(part.unitPrice)
                    ).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="py-4 text-center text-slate-400 text-xs italic"
                >
                  Tidak ada penggunaan suku cadang
                </td>
              </tr>
            )}
          </tbody>
          {/* TOTAL AREA */}
          <tfoot>
            <tr className="border-t-2 border-slate-900">
              <td
                colSpan={3}
                className="py-6 text-right font-black text-sm uppercase tracking-tighter"
              >
                Total Estimasi Keseluruhan
              </td>
              <td className="py-6 text-right font-black text-xl text-blue-700 tracking-tighter">
                Rp {totalBiaya.toLocaleString('id-ID')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* FOOTER / TANDA TANGAN */}
      <div className="mt-16 grid grid-cols-2 gap-24 text-center">
        <div>
          <p className="text-[10px] mb-24 text-slate-400 uppercase font-black tracking-widest">
            Customer / Pelanggan
          </p>
          <div className="border-b border-slate-900 w-full"></div>
          <p className="mt-2 font-bold text-sm">( {data.customerName} )</p>
        </div>
        <div>
          <p className="text-[10px] mb-24 text-slate-400 uppercase font-black tracking-widest">
            Admin
          </p>
          <div className="border-b border-slate-900 w-full"></div>
          <p className="mt-2 font-bold text-sm">MIPSYS Enterprise AAA</p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-12 text-[9px] text-slate-400 leading-relaxed border-t pt-4">
        <p className="font-bold uppercase mb-1">Catatan:</p>
        <p>
          1. Laporan ini merupakan estimasi biaya perbaikan sementara
          berdasarkan hasil diagnosa teknis.
        </p>
        <p>
          2. Barang yang sudah diservis wajib diambil dalam waktu 30 hari,
          kerusakan setelah masa tersebut bukan tanggung jawab kami.
        </p>
        <p>3. Simpan dokumen ini sebagai bukti pengambilan unit.</p>
      </div>
    </div>
  );
});

ServicePrintTemplate.displayName = 'ServicePrintTemplate';
