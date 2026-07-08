import apiClient from './api-client';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface TeamMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  sender: { id: string; name: string; email: string };
}

export interface TeamConversation {
  id: string;
  isGroup: boolean;
  name: string | null;
  participants: TeamMember[];
  lastMessage: TeamMessage | null;
  lastReadAt: string | null;
  unreadCount: number;
  updatedAt: string;
}

export const teamChatApi = {
  async listMembers(): Promise<TeamMember[]> {
    const { data } = await apiClient.get('/team-chat/members');
    return data;
  },

  async listConversations(): Promise<TeamConversation[]> {
    const { data } = await apiClient.get('/team-chat/conversations');
    return data;
  },

  async startConversation(participantIds: string[], opts?: { isGroup?: boolean; name?: string }) {
    const { data } = await apiClient.post('/team-chat/conversations', {
      participantIds,
      ...opts,
    });
    return data as TeamConversation;
  },

  async getConversation(id: string) {
    const { data } = await apiClient.get(`/team-chat/conversations/${id}`);
    return data as TeamConversation;
  },

  async getMessages(id: string, page = 1, limit = 50): Promise<TeamMessage[]> {
    const { data } = await apiClient.get(`/team-chat/conversations/${id}/messages`, {
      params: { page, limit },
    });
    return data;
  },

  async sendMessage(id: string, body: string): Promise<TeamMessage> {
    const { data } = await apiClient.post(`/team-chat/conversations/${id}/messages`, { body });
    return data;
  },

  async markAsRead(id: string) {
    const { data } = await apiClient.post(`/team-chat/conversations/${id}/read`);
    return data;
  },
};
