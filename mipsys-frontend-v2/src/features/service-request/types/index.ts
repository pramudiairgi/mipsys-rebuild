// 1. Interface Utama (Untuk menampilkan data di Tabel/Dashboard)
export interface ServiceRequest {
  id: number;
  ticketNumber: string; // Tambahkan ini (sebelumnya mungkin sr_number)
  customerName: string; // Tambahkan ini (sebelumnya mungkin customer_name)
  incomingDate: string; // Tambahkan ini (sebelumnya mungkin created_at)
  statusService: string; // Tambahkan ini
  statusSystem: string; // Tambahkan ini
}
