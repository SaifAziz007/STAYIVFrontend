import apiClient from './api-client';

export interface ReviewRemoval {
  id: string;
  userId: string;
  reservationId: string;
  reservationCode?: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  propertyName?: string;
  platform: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  notes?: string;
  attachments?: any[];
  reservationData: any;
  status: string;
  createdAt: string;
  updatedAt: string;
  arrivalDate?: string;      
  departureDate?: string; 
}

export const reviewRemovalApi = {
  createReviewRemoval: async (data: any) => {
    const response = await apiClient.post('/review-removal', data);
    return response.data;
  },

  getReviewRemovals: async () => {
    const response = await apiClient.get('/review-removal');
    return response.data.data;
  },

  getReviewRemovalReservationIds: async () => {
    const response = await apiClient.get('/review-removal/reservation-ids');
    return response.data.reservationIds;
  },

  // Add missing methods
  getReviewRemovalById: async (id: string) => {
    const response = await apiClient.get(`/review-removal/${id}`);
    return response.data.data;
  },

  updateReviewRemovalStatus: async (id: string, status: string, notes?: string) => {
    const response = await apiClient.put(`/review-removal/${id}/status`, {
      status,
      notes,
    });
    return response.data;
  },

  deleteReviewRemoval: async (id: string) => {
    const response = await apiClient.delete(`/review-removal/${id}`);
    return response.data;
  },

  checkReviewRemovalStatus: async (reservationId: string) => {
    const response = await apiClient.get(`/review-removal/check/${reservationId}`);
    return response.data;
  },
};