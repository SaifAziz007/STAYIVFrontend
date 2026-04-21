import apiClient from './api-client';

export type InquiryRow = {
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

export type InquiriesListParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'arrivalDate' | 'departureDate' | 'platform' | 'lastMessageAt';
  order?: 'asc' | 'desc';
  checkInFrom?: string;
  checkInTo?: string;
};

export type InquiriesListResponse = {
  success: boolean;
  data: InquiryRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function formatInquiryDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export const inquiriesApi = {
  formatDate: formatInquiryDate,

  async list(params: InquiriesListParams = {}): Promise<InquiriesListResponse> {
    const response = await apiClient.get<InquiriesListResponse>('/inquiries', {
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
