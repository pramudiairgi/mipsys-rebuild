import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001', // Pastikan port backend benar
  headers: { 'Content-Type': 'application/json' },
});

export const srApi = {
  getAll: (search = '', page = 1, limit = 10) =>
    api
      .get('/service-requests/dashboard', { params: { search, page, limit } })
      .then((r) => r.data),

  getOne: (id: string) =>
    api.get(`/service-requests/${id}`).then((r) => r.data),

  create: async (data: any) => {
    try {
      // Injeksi adminId: 1 karena sistem login belum ada
      const payload = {
        ...data,
        adminId: 1,
      };

      const response = await api.post('/service-requests/entry', payload);
      return response.data;
    } catch (error) {
      console.error('Gagal membuat tiket baru:', error);
      throw error;
    }
  },

  updateTechnician: (id: string, data: any) =>
    api.patch(`/service-requests/${id}/technician`, data).then((r) => r.data),

  prosesKasir: (id: string, data: any) =>
    api.patch(`/service-requests/${id}/kasir`, data).then((r) => r.data),
};
