import { useState, useEffect, useCallback } from 'react';
import { srApi } from '../api/sr-api';
import { toast } from 'react-hot-toast';

export interface ServiceRequestDetail {
  id: number | null;
  customerName: string;
  phone: string;
  address: string;
  modelName: string;
  serialNumber: string;
  problemDescription: string;
  statusService: string;
  serviceType: string;
  incomingDate: string;
  checkDate?: string;
  spDate?: string;
  approveDate?: string;
  readyDate?: string;
  closeDate?: string;
  serviceFee: string;
  partFee: string;
  hasInvoice?: boolean;
}

export const useServiceRequest = (ticketNumber: string) => {
  const [data, setData] = useState<ServiceRequestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    if (!ticketNumber) return;
    try {
      setIsLoading(true);
      const res = await srApi.getDetail(ticketNumber);
      setData({
        id: res.id || res.service_request_id || null,
        customerName: res.customerName || res.customer_name || '',
        phone: res.phone || res.customer_phone || '',
        address: res.address || res.customer_address || '',
        modelName: res.modelName || res.model_name || '',
        serialNumber: res.serialNumber || res.serial_number || '',
        problemDescription:
          res.problemDescription || res.problem_description || '',
        statusService: res.statusService || res.status_service || '',
        serviceType: res.serviceType || 'NON_WARRANTY',
        incomingDate: res.incomingDate || '',
        checkDate: res.checkDate || undefined,
        spDate: res.spDate || undefined,
        approveDate: res.approveDate || undefined,
        readyDate: res.readyDate || undefined,
        closeDate: res.closeDate || undefined,
        serviceFee: res.serviceFee || '0',
        partFee: res.partFee || '0',
        hasInvoice: res.hasInvoice ?? false,
      });
    } catch (error) {
      toast.error('Gagal sinkronisasi data unit');
    } finally {
      setIsLoading(false);
    }
  }, [ticketNumber]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { data, setData, isLoading, refetch: fetchDetail };
};
