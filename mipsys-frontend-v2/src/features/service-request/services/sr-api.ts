import axios from 'axios';
import { ServiceRequest } from '../types'; // Import interface yang Mas buat tadi

const api = axios.create({
  baseURL: 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
});

export const srApi = {
  // 1. Ambil Semua Data Dashboard
  getAll: (search = '', page = 1, limit = 10) =>
    api
      .get('/service-requests/dashboard', { params: { search, page, limit } })
      .then((r) => r.data),

  // 2. Ambil Detail Per Unit
  getOne: (id: string | number) =>
    api.get(`/service-requests/${id}`).then((r) => r.data),

  // 3. Create: Menangani Entry Baru
  create: async (rawData: any) => {
    // Mapping data agar sesuai DTO Backend 'create-service-request.dto.ts'
    const payload = {
      ...rawData,
      adminId: 1, // Hardcoded sementara
      onsite_cost: Number(rawData.onsite_cost || 0),
      other_cost: Number(rawData.other_cost || 0),
    };
    const response = await api.post('/service-requests/entry', payload);
    return response.data;
  },

  // 4. Update Technician (Diagnosa): BAGIAN KRUSIAL!
  updateTechnician: async (id: string | number, rawData: any) => {
    const payload = {
      technicianFixId: Number(rawData.techId),
      problemDescription: rawData.remarks,
      statusService: rawData.status, // Contoh: 'SERVICE' atau 'DONE'
      parts: (rawData.parts || []).map((p: any) => ({
        partName: p.partName,
        quantity: Number(p.quantity),
        unitPrice: Number(p.unitPrice),
      })),
    };

    const response = await api.patch(
      `/service-requests/${id}/technician`,
      payload,
    );
    return response.data;
  },

  // 5. Proses Kasir (Finalize)
  prosesKasir: (id: string | number, rawData: any) => {
    const payload = {
      ...rawData,
      onsiteFee: Number(rawData.onsiteFee || 0),
      serviceFee: Number(rawData.serviceFee || 0),
    };
    return api
      .patch(`/service-requests/${id}/kasir`, payload)
      .then((r) => r.data);
  },
};
