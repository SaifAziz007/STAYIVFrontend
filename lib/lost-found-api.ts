import apiClient from './api-client';

export interface ImageAttachment {
  url: string;
  type?: string;
  size?: number;
  name?: string;
  data?: string;  // Base64 encoded image data
}

export interface LostAndFound {
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
  itemDescription?: string;
  itemLocation?: string;
  notes?: string;
  attachments?: ImageAttachment[];
  reservationData: any;
  status: string;
  createdAt: string;
  updatedAt: string;
  arrivalDate?: string;
  departureDate?: string;
  description?: string;
}

export const lostAndFoundApi = {
  createLostAndFound: async (data: any) => {
    const response = await apiClient.post('/lost-found', data);
    return response.data;
  },

  getLostAndFoundEntries: async () => {
    const response = await apiClient.get('/lost-found');
    return response.data.data;
  },

  getLostAndFoundReservationIds: async () => {
    const response = await apiClient.get('/lost-found/reservation-ids');
    return response.data.reservationIds;
  },

  getLostAndFoundById: async (id: string) => {
    const response = await apiClient.get(`/lost-found/${id}`);
    return response.data.data;
  },

  updateLostAndFoundStatus: async (id: string, status: string, description?: string) => {
    const response = await apiClient.put(`/lost-found/${id}/status`, {
      status,
      description,
    });
    return response.data;
  },

  deleteLostAndFound: async (id: string) => {
    const response = await apiClient.delete(`/lost-found/${id}`);
    return response.data;
  },

  checkLostAndFoundStatus: async (reservationId: string) => {
    const response = await apiClient.get(`/lost-found/check/${reservationId}`);
    return response.data;
  },
};