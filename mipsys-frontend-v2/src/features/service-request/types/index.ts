export interface ServiceRequest {
  id: number;
  ticketNumber: string;

  // IDENTITAS (Hasil Join)
  customerName: string;
  customerPhone: string;
  customerAddress: string;

  // PERANGKAT (Hasil Join)
  modelName: string;
  serialNumber: string;

  // LOGIKA STATUS (Paling Penting!)
  // Kita kunci nilainya agar tidak bisa diisi sembarang teks
  serviceType: 'WARRANTY' | 'NON_WARRANTY';

  statusService:
    | 'WAITING CHECK'
    | 'PENDING APPROVAL'
    | 'PENDING PART'
    | 'SERVICE'
    | 'DONE'
    | 'CANCEL';

  statusSystem: 'OPEN' | 'CLOSED';

  // DESKRIPSI & TANGGAL
  problemDescription: string;
  incomingDate: string;
  createdAt: string;

  // ID STAFF (Gunakan number | null karena di awal data ini kosong)
  technicianCheckId?: number | null;
  technicianFixId?: number | null;

  // FINANSIAL (Pisahkan sesuai kebutuhan bisnis)
  partFee: string; // Biaya sparepart
  serviceFee: string; // Biaya jasa teknisi
  onsiteFee: string; // Biaya kunjungan/transport
}
