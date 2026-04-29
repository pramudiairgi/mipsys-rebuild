import axios from 'axios';

// Konfigurasi Axios
const api = axios.create({
  baseURL: 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
});

export const srApi = {
  // 1. Ambil Semua Data Dashboard
  getAll: (search = '', page = 1, limit = 10) =>
    api
      .get('/service-request/dashboard', { params: { search, page, limit } })
      .then((r) => r.data),

  // 2. Ambil Detail Per Unit
  getOne: (id: string | number) =>
    api.get(`/service-request/${id}`).then((r) => r.data),

  getDashboardStats: () =>
    api.get('/service-request/stats').then((r) => r.data),

  getActivities: () =>
    api.get('/service-request/activities').then((r) => r.data),

  // 3. Create Entry Baru
  create: async (rawData: any) => {
    const payload = {
      ...rawData,
      adminId: 1,
    };
    const response = await api.post('/service-request/entry', payload);
    return response.data;
  },

  // 4. Update Technician (Diagnosa & Hardware Check)
  updateTechnician: async (ticketNumber: string | number, rawData: any) => {
    const payload = {
      technicianFixId: Number(rawData.techId || rawData.technicianFixId),
      remarksHistory: rawData.remarks || rawData.remarksHistory,
      statusService: rawData.status || rawData.statusService,

      // Pastikan hardwareCheck ikut terkirim jika ada
      hardwareCheck: rawData.hardwareCheck || null,

      parts: (rawData.parts || []).map((p: any) => ({
        partName: p.partName,
        quantity: Number(p.quantity),
        unitPrice: String(p.unitPrice),
        sparePartId: p.sparePartId || null,
      })),
    };

    const response = await api.patch(
      `/service-request/${ticketNumber}/diagnosis`,
      payload,
    );
    return response.data;
  },

  // 5. Proses Kasir (Finalize)
  prosesKasir: (ticketNumber: string | number, rawData: any) => {
    const payload = {
      ...rawData,
      onsiteFee: Number(rawData.onsiteFee || 0),
      serviceFee: Number(rawData.serviceFee || 0),
    };
    return api
      .patch(`/service-request/${ticketNumber}/kasir`, payload)
      .then((r) => r.data);
  },
};

export default api;
