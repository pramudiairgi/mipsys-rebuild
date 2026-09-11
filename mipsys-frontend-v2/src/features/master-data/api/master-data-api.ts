import { apiClient } from '@/src/lib/api-client';

export interface CustomerData {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  customerType?: string;
}

export interface StaffData {
  id: number;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TECHNICIAN';
}

export interface ProductData {
  id: number;
  modelName: string;
  serialNumber: string;
}

export interface CategoryModelData {
  id: number;
  name: string;
  description?: string;
}

export const masterDataApi = {
  customers: {
    getAll: (search?: string) =>
      apiClient.get('/customers', { params: { search } }).then((r) => r.data as CustomerData[]),
    create: (data: { name: string; phone?: string; address?: string; customerType?: string }) =>
      apiClient.post('/customers', data).then((r) => r.data),
    update: (id: number, data: { name?: string; phone?: string; address?: string; customerType?: string }) =>
      apiClient.patch(`/customers/${id}`, data).then((r) => r.data),
    delete: (id: number) =>
      apiClient.delete(`/customers/${id}`).then((r) => r.data),
  },
  staff: {
    getAll: () =>
      apiClient.get('/staff').then((r) => r.data as StaffData[]),
    create: (data: { name: string; role: 'SUPER_ADMIN' | 'ADMIN' | 'TECHNICIAN' }) =>
      apiClient.post('/staff', data).then((r) => r.data),
    update: (id: number, data: { name?: string; role?: 'ADMIN' | 'TECHNICIAN' }) =>
      apiClient.patch(`/staff/${id}`, data).then((r) => r.data),
    delete: (id: number) =>
      apiClient.delete(`/staff/${id}`).then((r) => r.data),
  },
  products: {
    getAll: (search?: string) =>
      apiClient.get('/products', { params: { search } }).then((r) => r.data as ProductData[]),
    create: (data: { modelName: string; serialNumber: string }) =>
      apiClient.post('/products', data).then((r) => r.data),
    update: (id: number, data: { modelName?: string; serialNumber?: string }) =>
      apiClient.patch(`/products/${id}`, data).then((r) => r.data),
    delete: (id: number) =>
      apiClient.delete(`/products/${id}`).then((r) => r.data),
  },
  categoryModels: {
    getAll: () =>
      apiClient.get('/category-models').then((r) => r.data as CategoryModelData[]),
    create: (data: { name: string; description?: string }) =>
      apiClient.post('/category-models', data).then((r) => r.data),
    update: (id: number, data: { name?: string; description?: string }) =>
      apiClient.patch(`/category-models/${id}`, data).then((r) => r.data),
    delete: (id: number) =>
      apiClient.delete(`/category-models/${id}`).then((r) => r.data),
  },
};
