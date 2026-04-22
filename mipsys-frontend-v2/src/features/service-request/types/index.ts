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

  // ID STAFF
  technicianCheckId?: number | null;
  technicianFixId?: number | null;

  // FINANSIAL (Pisahkan sesuai kebutuhan bisnis)
  partFee: string; // Biaya sparepart
  serviceFee: string; // Biaya jasa teknisi
  onsiteFee: string; // Biaya kunjungan/transport
}

export interface UpdateDiagnosisPayload {
  technicianFixId: number;
  problemDescription: string;
  statusService: ServiceRequest['statusService']; // Ambil tipe dari interface utama
  parts: {
    partName: string;
    quantity: number;
    unitPrice: number;
  }[];
}
