import apiClient from './api-client';

export type ReservationRow = {
  id: string;
  guestName: string;
  propertyName: string | null;
  guestsSummary: string;
  checkIn: string | null;
  checkOut: string | null;
  nights: number | null;
  mood: string | null;
  platform: string;
};

export type ReservationsListParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'arrivalDate' | 'departureDate' | 'propertyName' | 'platform';
  order?: 'asc' | 'desc';
  checkInFrom?: string;
  checkInTo?: string;
};

export type ReservationsListResponse = {
  success: boolean;
  data: ReservationRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function formatReservationDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export const reservationsApi = {
  formatDate: formatReservationDate,

  async list(params: ReservationsListParams = {}): Promise<ReservationsListResponse> {
    const response = await apiClient.get<ReservationsListResponse>('/reservations', {
      params: {
        page: params.page,
        limit: params.limit,
        search: params.search || undefined,
        sortBy: params.sortBy,
        order: params.order,
        checkInFrom: params.checkInFrom || undefined,
        checkInTo: params.checkInTo || undefined,
      },
    });
    return response.data;
  },
};
