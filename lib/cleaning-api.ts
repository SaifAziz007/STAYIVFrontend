import { apiClient } from './api-client';

export interface CreateCleaningDto {
  reservationId: string;
  reservationCode?: string;
  guestName: string;
  propertyId?: string;
  propertyName?: string;
  hospitablePropertyId?: string;
  platform: string;
  checkoutDate: string;
  arrivalDate?: string;
  departureDate?: string;
  numberOfGuests: number;
  notes?: string;
  reservationData: any;
}

export interface Cleaning {
  id: string;
  userId: string;
  reservationId: string;
  reservationCode?: string;
  guestName: string;
  propertyId?: string;
  propertyName?: string;
  hospitablePropertyId?: string;
  platform: string;
  checkoutDate: string;
  arrivalDate?: string;
  departureDate?: string;
  numberOfGuests: number;
  status: string;
  notes?: string;
  reservationData: any;
  markedDoneAt: string;
  createdAt: string;
  updatedAt: string;
}

class CleaningApi {
  /**
   * Mark a cleaning as done
   */
  async markCleaningDone(dto: CreateCleaningDto): Promise<Cleaning> {
    const response = await apiClient.post('/cleaning/mark-done', dto);
    return response.data.data;
  }

  /**
   * Get all cleaning records
   */
  async getCleanings(checkoutDate?: string): Promise<Cleaning[]> {
    const params = checkoutDate ? { checkoutDate } : {};
    const response = await apiClient.get('/cleaning', { params });
    return response.data.data;
  }

  /**
   * Get all cleaning reservation IDs
   */
  async getCleaningReservationIds(checkoutDate?: string): Promise<string[]> {
    const params = checkoutDate ? { checkoutDate } : {};
    const response = await apiClient.get('/cleaning/reservation-ids', { params });
    return response.data.reservationIds;
  }

  /**
   * Check if a reservation has a cleaning record
   */
  async hasCleaningRecord(reservationId: string): Promise<boolean> {
    const response = await apiClient.get(`/cleaning/check/${reservationId}`);
    return response.data.hasRecord;
  }

  /**
   * Get a single cleaning record
   */
  async getCleaningById(id: string): Promise<Cleaning> {
    const response = await apiClient.get(`/cleaning/${id}`);
    return response.data.data;
  }

  /**
   * Update cleaning record
   */
  async updateCleaning(id: string, status: string, notes?: string): Promise<Cleaning> {
    const response = await apiClient.put(`/cleaning/${id}`, { status, notes });
    return response.data.data;
  }

  /**
   * Delete a cleaning record
   */
  async deleteCleaning(id: string): Promise<void> {
    await apiClient.delete(`/cleaning/${id}`);
  }
}

export const cleaningApi = new CleaningApi();





