import apiClient from './api-client';

export interface FormCollection {
  id: string;
  userId: string;
  reservationId: string;
  reservationCode?: string;
  guestName: string;
  propertyName?: string;
  platform: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  checkInDate?: string;
  checkOutDate?: string;
  numberOfGuests?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFormCollectionDto {
  reservationId: string;
  reservationCode?: string;
  guestName: string;
  propertyName?: string;
  platform: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  checkInDate?: string;
  checkOutDate?: string;
  numberOfGuests?: number;
}

export const formCollectionApi = {
  createFormCollection: async (data: CreateFormCollectionDto): Promise<FormCollection> => {
    const response = await apiClient.post('/form-collection', data);
    return response.data.data;
  },

  getFormCollections: async (): Promise<FormCollection[]> => {
    const response = await apiClient.get('/form-collection');
    return response.data.data;
  },

  getFormCollectionById: async (id: string): Promise<FormCollection> => {
    const response = await apiClient.get(`/form-collection/${id}`);
    return response.data.data;
  },

  deleteFormCollection: async (id: string): Promise<void> => {
    await apiClient.delete(`/form-collection/${id}`);
  },

  getFormCollectionReservationIds: async (): Promise<string[]> => {
    const response = await apiClient.get('/form-collection/reservation-ids');
    return response.data.reservationIds;
  },
};
