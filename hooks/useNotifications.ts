'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getSocketBaseUrl } from '@/lib/socket-url';
import { notificationsApi, type AppNotification } from '@/lib/notifications-api';

interface UseNotificationsOptions {
  userId: string | null;
  /** Called for each notification that arrives while the app is open. */
  onIncoming?: (notification: AppNotification) => void;
}

/**
 * Loads the notification feed and keeps it live over the /notifications
 * namespace, so the bell updates on every screen rather than only in team chat.
 */
export function useNotifications({ userId, onIncoming }: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const onIncomingRef = useRef(onIncoming);
  useEffect(() => {
    onIncomingRef.current = onIncoming;
  }, [onIncoming]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [list, count] = await Promise.all([
        notificationsApi.list({ limit: 30 }),
        notificationsApi.unreadCount(),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!userId) return;

    const socket: Socket = io(`${getSocketBaseUrl()}/notifications`, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    });

    socket.on('connect', () => socket.emit('join-notifications', { userId }));

    socket.on('notification', (notification: AppNotification) => {
      setNotifications((current) =>
        current.some((n) => n.id === notification.id) ? current : [notification, ...current],
      );
      onIncomingRef.current?.(notification);
    });

    socket.on('notification-count', ({ unreadCount: count }: { unreadCount: number }) => {
      setUnreadCount(count);
    });

    return () => {
      socket.emit('leave-notifications', { userId });
      socket.disconnect();
    };
  }, [userId]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((current) =>
      current.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
    try {
      setUnreadCount(await notificationsApi.markRead(id));
    } catch (error) {
      console.error('Failed to mark notification read:', error);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const now = new Date().toISOString();
    setNotifications((current) => current.map((n) => (n.readAt ? n : { ...n, readAt: now })));
    try {
      setUnreadCount(await notificationsApi.markAllRead());
    } catch (error) {
      console.error('Failed to mark notifications read:', error);
    }
  }, []);

  return { notifications, unreadCount, loading, refresh, markRead, markAllRead };
}
