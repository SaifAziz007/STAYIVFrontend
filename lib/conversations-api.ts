import apiClient from './api-client';

// Types for the new database-driven conversations
export interface ConversationGuest {
  first_name: string;
  last_name?: string;
  email?: string;
  phone_numbers?: string[];
  profile_picture?: string;
  location?: string;
  language?: string;
}

export interface ConversationGuests {
  total: number;
  adult_count: number;
  child_count: number;
  infant_count: number;
  pet_count?: number;
}

export interface BaseConversation {
  id: string;
  userId: string;
  platform: string;
  conversationLanguage?: string;
  lastMessageAt?: string;
  guestData?: string; // JSON string
  guestsData?: string; // JSON string
  rawData: string; // JSON string
  createdAt: string;
  updatedAt: string;
  type: 'reservation' | 'inquiry';
}

export interface ReservationConversation extends BaseConversation {
  type: 'reservation';
  code?: string;
  platformId?: string;
  bookingDate?: string;
  arrivalDate?: string;
  departureDate?: string;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  conversationId?: string;
  status?: string;
  mood?:string;
  propertyName?: string; 
   earlyCheckin?: boolean;  // Add this
  lateCheckout?: boolean;  // Add this
}

export interface InquiryConversation extends BaseConversation {
  type: 'inquiry';
  hospitableInquiryId?: string; // Hospitable's inquiry ID used as conversation identifier
  inquiryDate?: string;
  arrivalDate?: string; // Date string
  departureDate?: string; // Date string
}

export type Conversation = ReservationConversation | InquiryConversation;

export interface ConversationMessage {
  id: number;
  userId: string;
  conversationId: string;
  conversationType: 'reservation' | 'inquiry';
  platform: string;
  platformId?: string;
  contentType?: string;
  body?: string;
  senderType?: 'host' | 'guest';
  senderData?: string; // JSON string
  messageCreatedAt: string;
  rawData: string; // JSON string
  createdAt: string;
  updatedAt: string;
}

export interface ConversationsResponse {
  success: boolean;
  data: Conversation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ConversationDetailsResponse {
  success: boolean;
  data: {
    conversation: Conversation;
    messages: ConversationMessage[];
    type: 'reservation' | 'inquiry';
  };
}

export interface MessagesResponse {
  success: boolean;
  data: ConversationMessage[];
}

export const conversationsApi = {
  /**
   * Check if user has Hospitable properties
   */
  async checkProperties(): Promise<any> {
    const response = await apiClient.get('/conversations/check-properties');
    return response.data;
  },

  /**
   * Debug endpoint to check user properties and sync status
   */
  async getDebugInfo(): Promise<any> {
    const response = await apiClient.get('/conversations/debug');
    return response.data;
  },

  /**
   * Sync conversations from Hospitable API (called once when account is created)
   */
  async syncConversations(): Promise<{ 
    success: boolean; 
    message: string; 
    data?: { 
      synced: { 
        reservations: number; 
        inquiries: number; 
        messages: number; 
      } 
    } 
  }> {
    const response = await apiClient.post('/conversations/sync');
    return response.data;
  },

  /**
 * Get reservations by checkout date (for cleaning schedule)
 */
async getReservationsByCheckout(date: string): Promise<ReservationConversation[]> {
  const response = await apiClient.get('/conversations/reservations/by-checkout', {
    params: { date }
  });
  return response.data.data;
},

  /**
   * Get conversations from database (sorted by last_message_at DESC)
   */
  async getConversations(
    page: number = 1,
    limit: number = 20,
    type?: 'reservation' | 'inquiry'
  ): Promise<ConversationsResponse> {
    const params: any = { page, limit };
    if (type) {
      params.type = type;
    }

    const response = await apiClient.get('/conversations', { params });
    return response.data;
  },

  /**
   * Get conversation by ID
   */
  async getConversationById(conversationId: string, bookingType: 'inquiry' | 'reservation'): Promise<Conversation> {
    // First try to get from the conversations list to determine type
    const conversationsResponse = await apiClient.get('/conversations', {
      params: { type: bookingType }
    });    const conversations = conversationsResponse.data.data;
    
    if (!Array.isArray(conversations)) {
      throw new Error('Invalid conversations response');
    }
    
    let conversation: Conversation;
    if (bookingType === 'reservation') {
      conversation = conversations.find((c: ReservationConversation) => c.conversationId === conversationId);
    } else {
      conversation = conversations.find((c: InquiryConversation) => c.hospitableInquiryId === conversationId);
    }
    
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }
    
    return conversation;
  },

  /**
   * Get conversation details with messages
   */
  async getConversationDetails(
    conversationId: string,
    type: 'reservation' | 'inquiry'
  ): Promise<ConversationDetailsResponse> {
    const response = await apiClient.get(`/conversations/${conversationId}`, {
      params: { type }
    });
    return response.data;
  },

  /**
   * Get messages for a specific conversation
   */
  async getConversationMessages(conversationId: string): Promise<MessagesResponse> {
    const response = await apiClient.get(`/conversations/${conversationId}/messages`);
    return response.data;
  },

  /**
   * Parse guest data from JSON string
   */
  parseGuestData(guestDataJson?: string): ConversationGuest | null {
    if (!guestDataJson) return null;
    try {
      return JSON.parse(guestDataJson);
    } catch {
      return null;
    }
  },

  /**
   * Parse guests data from JSON string
   */
  parseGuestsData(guestsDataJson?: string): ConversationGuests | null {
    if (!guestsDataJson) return null;
    try {
      return JSON.parse(guestsDataJson);
    } catch {
      return null;
    }
  },

  /**
   * Parse sender data from JSON string
   */
  parseSenderData(senderDataJson?: string): any | null {
    if (!senderDataJson) return null;
    try {
      return JSON.parse(senderDataJson);
    } catch {
      return null;
    }
  },

  /**
   * Format date for display
   */
  formatDateForDisplay(dateString?: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  /**
   * Format time for display
   */
  formatTimeForDisplay(dateString?: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  /**
   * Get guest count summary
   */
  getGuestSummary(guestsData?: string): string {
    const guests = this.parseGuestsData(guestsData);
    if (!guests) return 'N/A';

    const parts = [];
    if (guests.adult_count > 0) parts.push(`${guests.adult_count} adult${guests.adult_count > 1 ? 's' : ''}`);
    if (guests.child_count > 0) parts.push(`${guests.child_count} child${guests.child_count > 1 ? 'ren' : ''}`);
    if (guests.infant_count > 0) parts.push(`${guests.infant_count} infant${guests.infant_count > 1 ? 's' : ''}`);
    
    return parts.length > 0 ? parts.join(', ') : `${guests.total} guest${guests.total > 1 ? 's' : ''}`;
  },

  /**
   * Get platform color for badges
   */
  getPlatformColor(platform: string): string {
    switch (platform.toLowerCase()) {
      case 'airbnb':
        return 'bg-red-100 text-red-700';
      case 'booking':
      case 'booking.com':
        return 'bg-blue-100 text-blue-700';
      case 'vrbo':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  },

};
