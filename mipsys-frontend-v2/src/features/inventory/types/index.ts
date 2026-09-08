export interface SparePart {
  id: number;
  partCode: string;
  partName: string;
  modelName: string;
  stock: number;
  price: number;
  ipStatus: 'IP' | 'Non IP';
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PartFilterParams {
  search?: string;
  page?: number;
  limit?: number;
}
