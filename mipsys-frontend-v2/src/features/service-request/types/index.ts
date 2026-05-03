export interface OrderPart {
  id?: number;
  sparePartId?: number | null;
  partName: string;
  quantity: number;
  unitPrice: string;
  partCode?: string;
  modelName?: string;
  block?: string;
  ipStatus?: 'IP' | 'Non IP';
}

export interface ServiceRequest {
  id: number;
  ticketNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  serviceType: 'WARRANTY' | 'NON_WARRANTY';
  modelName: string;
  serialNumber: string;
  statusService:
    | 'WAITING CHECK'
    | 'PENDING APPROVAL'
    | 'PENDING PART'
    | 'SERVICE'
    | 'DONE'
    | 'CANCEL';
  statusSystem: 'OPEN' | 'CLOSED';
  problemDescription: string;
  remarksHistory: string;
  partFee: number;
  serviceFee: number;
  technicianCheckId: number | null;
  orderParts?: any[];
  parts?: OrderPart[];

  incomingDate: string;
  createdAt: string;
}

export interface UpdateDiagnosisPayload {
  ticketNumber: string;
  technicianCheckId: number;
  remarksHistory: string;
  statusService: string;
  serviceFee: number;
  parts: OrderPart[];
}
