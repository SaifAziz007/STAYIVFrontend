import apiClient from './api-client';

export interface ClaimedChat {
  id: string;
  userId: string;
  reservationId: string;
  reservationCode?: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  propertyName?: string;
  platform: string;
  arrivalDate: string;
  departureDate: string;
  numberOfGuests: number;
  claimReason?: string;
  notes?: string;
  attachments?: any[];
  reservationData: any;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImageAttachment {
  data: string;
  type: string;
  name: string;
}

export const claimedChatsApi = {
  createClaimedChat: async (data: any) => {
    const response = await apiClient.post('/claimed-chats', data);
    return response.data;
  },

  getClaimedChats: async () => {
    const response = await apiClient.get('/claimed-chats');
    return response.data.claimedChats;
  },

  // Add the missing delete method
  deleteClaimedChat: async (id: string) => {
    const response = await apiClient.delete(`/claimed-chats/${id}`);
    return response.data;
  },

  // Add other missing methods that the backend supports
  getClaimedChatById: async (id: string) => {
    const response = await apiClient.get(`/claimed-chats/${id}`);
    return response.data;
  },

  updateClaimedChatStatus: async (id: string, status: string, notes?: string) => {
    const response = await apiClient.put(`/claimed-chats/${id}/status`, {
      status,
      notes,
    });
    return response.data;
  },

  getClaimedReservationIds: async () => {
    const response = await apiClient.get('/claimed-chats/reservation-ids');
    return response.data.reservationIds;
  },

  checkReservationClaimed: async (reservationId: string) => {
    const response = await apiClient.get(`/claimed-chats/check/${reservationId}`);
    return response.data;
  },
  
};