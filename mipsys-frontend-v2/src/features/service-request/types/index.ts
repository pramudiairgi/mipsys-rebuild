// 1. Interface Utama (Untuk menampilkan data di Tabel/Dashboard)
export interface ServiceRequest {
  id: number;
  ticketNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  problemDescription: string;
  createdAt: string;
  technicianCheckId: string;
  technicianFixId: string;
  modelName: string;
  serialNumber: string;
  serviceType: string;
  incomingDate: string;
  statusService: string;
  statusSystem: string;
  partFee: string;
  serviceFee: string;
}
