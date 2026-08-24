import apiClient from './api-client';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  /** 'admin' | 'member' inside a group conversation. */
  groupRole?: string;
}

export interface TeamMessageMention {
  id: string;
  userId: string | null;
  kind: 'user' | 'assistant' | 'everyone' | string;
  handle: string;
}

export interface TeamAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
}

export interface TeamMessage {
  id: string;
  conversationId: string;
  senderId: string | null;
  authorType: 'user' | 'assistant' | string;
  body: string;
  createdAt: string;
  sender: { id: string; name: string; email: string } | null;
  mentions: TeamMessageMention[];
  attachments: TeamAttachment[];
}

export interface TeamConversation {
  id: string;
  isGroup: boolean;
  name: string | null;
  createdById?: string;
  participants: TeamMember[];
  myRole: 'admin' | 'member' | string;
  lastMessage: TeamMessage | null;
  lastReadAt: string | null;
  unreadCount: number;
  unreadMentionCount: number;
  updatedAt: string;
}

/** Handle that routes a message to the Ask AI assistant. */
export const ASSISTANT_HANDLE = 'stayiv';
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

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

  async sendMessage(id: string, body: string, attachmentIds?: string[]): Promise<TeamMessage> {
    const { data } = await apiClient.post(`/team-chat/conversations/${id}/messages`, {
      body,
      ...(attachmentIds?.length ? { attachmentIds } : {}),
    });
    return data;
  },

  async markAsRead(id: string) {
    const { data } = await apiClient.post(`/team-chat/conversations/${id}/read`);
    return data;
  },

  // --- group administration ---

  async renameGroup(id: string, name: string) {
    const { data } = await apiClient.patch(`/team-chat/conversations/${id}`, { name });
    return data as TeamConversation;
  },

  async addMembers(id: string, userIds: string[]) {
    const { data } = await apiClient.post(`/team-chat/conversations/${id}/members`, { userIds });
    return data as TeamConversation;
  },

  async removeMember(id: string, memberId: string) {
    const { data } = await apiClient.delete(`/team-chat/conversations/${id}/members/${memberId}`);
    return data as TeamConversation;
  },

  async setMemberRole(id: string, memberId: string, role: 'admin' | 'member') {
    const { data } = await apiClient.patch(
      `/team-chat/conversations/${id}/members/${memberId}/role`,
      { role },
    );
    return data as TeamConversation;
  },

  // --- attachments ---

  async uploadAttachment(conversationId: string, file: File): Promise<TeamAttachment> {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post(
      `/team-chat/conversations/${conversationId}/attachments`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data;
  },

  /**
   * Attachment bytes sit behind the JWT-guarded API, so they cannot be used as a
   * plain <img src>. Fetch them as a blob and hand back an object URL.
   */
  async fetchAttachmentUrl(attachmentId: string): Promise<string> {
    const { data } = await apiClient.get(`/team-chat/attachments/${attachmentId}`, {
      responseType: 'blob',
    });
    return URL.createObjectURL(data as Blob);
  },
};
