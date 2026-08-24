import apiClient from './api-client';

export type NotificationType =
  | 'team_mention'
  | 'team_message'
  | 'team_group_added'
  | 'team_group_role';

export interface AppNotification {
  id: string;
  type: NotificationType | string;
  title: string;
  body: string | null;
  link: string | null;
  conversationId: string | null;
  messageId: string | null;
  readAt: string | null;
  createdAt: string;
}

export const notificationsApi = {
  async list(opts?: { unreadOnly?: boolean; limit?: number }): Promise<AppNotification[]> {
    const { data } = await apiClient.get('/notifications', {
      params: { unreadOnly: opts?.unreadOnly ? 'true' : undefined, limit: opts?.limit },
    });
    return data;
  },

  async unreadCount(): Promise<number> {
    const { data } = await apiClient.get('/notifications/unread-count');
    return data.unreadCount ?? 0;
  },

  async markRead(id: string): Promise<number> {
    const { data } = await apiClient.post(`/notifications/${id}/read`);
    return data.unreadCount ?? 0;
  },

  async markAllRead(): Promise<number> {
    const { data } = await apiClient.post('/notifications/read-all');
    return data.unreadCount ?? 0;
  },
};
