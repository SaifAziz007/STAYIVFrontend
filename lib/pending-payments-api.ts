import apiClient from './api-client';

export interface PendingPayment {
  id: string;
  userId: string;
  reservationId: string;
  reservationCode?: string;
  guestName: string;
  propertyName?: string;
  platform: string;
  paymentType: 'deposit' | 'refund';
  reason: string;
  status: string;
  checkInDate?: string;
  checkOutDate?: string;
  numberOfGuests?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePendingPaymentDto {
  reservationId: string;
  reservationCode?: string;
  guestName: string;
  propertyName?: string;
  platform: string;
  paymentType: 'deposit' | 'refund';
  reason: string;
  checkInDate?: string;
  checkOutDate?: string;
  numberOfGuests?: number;
}

export const pendingPaymentsApi = {
  createPendingPayment: async (data: CreatePendingPaymentDto): Promise<PendingPayment> => {
    const response = await apiClient.post('/pending-payments', data);
    return response.data.data;
  },

  getPendingPayments: async (status?: string): Promise<PendingPayment[]> => {
    const url = status ? `/pending-payments?status=${status}` : '/pending-payments';
    const response = await apiClient.get(url);
    return response.data.data;
  },

  getPaymentById: async (id: string): Promise<PendingPayment> => {
    const response = await apiClient.get(`/pending-payments/${id}`);
    return response.data.data;
  },

  updatePaymentStatus: async (id: string, status: string): Promise<PendingPayment> => {
    const response = await apiClient.put(`/pending-payments/${id}/status`, { status });
    return response.data.data;
  },

  deletePayment: async (id: string): Promise<void> => {
    await apiClient.delete(`/pending-payments/${id}`);
  },

  getPaymentReservationIds: async (): Promise<string[]> => {
    const response = await apiClient.get('/pending-payments/reservation-ids');
    return response.data.reservationIds;
  },
};
