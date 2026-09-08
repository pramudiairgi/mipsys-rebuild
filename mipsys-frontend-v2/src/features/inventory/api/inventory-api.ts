import { apiClient } from '@/src/lib/api-client';

export interface InventoryPart {
  id: number;
  partCode: string;
  partName: string;
  stock: number;
  minStock: number;
  price: number;
  location?: string;
  modelName?: string;
}

export const inventoryApi = {
  getParts: (search?: string, status?: 'ok' | 'low' | 'empty') =>
    apiClient
      .get('/inventory/parts', { params: { search, status } })
      .then((r) => r.data as InventoryPart[]),

  searchParts: (query: string) =>
    apiClient
      .get('/inventory/parts/search', { params: { q: query } })
      .then((r) => r.data as InventoryPart[]),

  getPart: (id: number) =>
    apiClient.get(`/inventory/parts/${id}`).then((r) => r.data as InventoryPart),

  getLowStockAlert: () =>
    apiClient.get('/inventory/low-stock-alert').then((r) => r.data as InventoryPart[]),

  getModels: () =>
    apiClient.get('/inventory/models').then((r) => r.data as string[]),

  reserveStock: (partId: number, data: { quantity: number; srTicketNumber: string; performedBy: number }) =>
    apiClient.post(`/inventory/parts/${partId}/reserve`, data).then((r) => r.data),
};

export interface CategoryModel {
  id: number;
  name: string;
  description?: string;
}

export const categoryModelsApi = {
  getAll: () =>
    apiClient.get('/category-models').then((r) => r.data as CategoryModel[]),

  getById: (id: number) =>
    apiClient.get(`/category-models/${id}`).then((r) => r.data as CategoryModel),

  create: (name: string, description?: string) =>
    apiClient.post('/category-models', { name, description }).then((r) => r.data),

  update: (id: number, name: string, description?: string) =>
    apiClient.patch(`/category-models/${id}`, { name, description }).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete(`/category-models/${id}`).then((r) => r.data),
};
