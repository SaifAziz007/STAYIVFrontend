import apiClient from './api-client';

export interface Issue {
  id: string;
  userId: string;
  reservationId: string;
  reservationCode?: string;
  guestName: string;
  propertyName?: string;
  platform: string;
  openIssues?: string;
  closedIssues?: string;
  status: string;
  checkInDate?: string;
  checkOutDate?: string;
  numberOfGuests?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIssueDto {
  reservationId: string;
  reservationCode?: string;
  guestName: string;
  propertyName?: string;
  platform: string;
  openIssues?: string;
  closedIssues?: string;
  checkInDate?: string;
  checkOutDate?: string;
  numberOfGuests?: number;
}

export const issuesApi = {
  createIssue: async (data: CreateIssueDto): Promise<Issue> => {
    const response = await apiClient.post('/issues', data);
    return response.data.data;
  },

  getIssues: async (status?: string): Promise<Issue[]> => {
    const url = status ? `/issues?status=${status}` : '/issues';
    const response = await apiClient.get(url);
    return response.data.data;
  },

  getIssueById: async (id: string): Promise<Issue> => {
    const response = await apiClient.get(`/issues/${id}`);
    return response.data.data;
  },

  updateIssueStatus: async (id: string, status: string): Promise<Issue> => {
    const response = await apiClient.put(`/issues/${id}/status`, { status });
    return response.data.data;
  },

  deleteIssue: async (id: string): Promise<void> => {
    await apiClient.delete(`/issues/${id}`);
  },

  getIssueReservationIds: async (): Promise<string[]> => {
    const response = await apiClient.get('/issues/reservation-ids');
    return response.data.reservationIds;
  },
};
