'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, AtSign, MessageCircle, Users, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';
import { authApi } from '@/lib/auth';
import type { AppNotification } from '@/lib/notifications-api';
import { cn } from '@/lib/utils';

function iconFor(type: string) {
  if (type === 'team_mention') return AtSign;
  if (type === 'team_group_added') return Users;
  if (type === 'team_group_role') return Shield;
  return MessageCircle;
}

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function NotificationBell() {
  const router = useRouter();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setUserId(authApi.getUser()?.id ?? null);
  }, []);

  const handleIncoming = useCallback(
    (notification: AppNotification) => {
      toast({ title: notification.title, description: notification.body ?? undefined });
    },
    [toast],
  );

  const { notifications, unreadCount, markRead, markAllRead } = useNotifications({
    userId,
    onIncoming: handleIncoming,
  });

  const openNotification = async (notification: AppNotification) => {
    setOpen(false);
    if (!notification.readAt) await markRead(notification.id);
    if (notification.link) router.push(notification.link);
  };

  if (!userId) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative gap-2" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-semibold flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-border">
          <span className="text-sm font-semibold text-gray-900 dark:text-foreground">
            Notifications
          </span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => void markAllRead()}>
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-sm text-center text-gray-500 dark:text-muted-foreground">
              You are all caught up.
            </p>
          ) : (
            notifications.map((notification) => {
              const Icon = iconFor(notification.type);
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => void openNotification(notification)}
                  className={cn(
                    'w-full text-left px-4 py-3 flex gap-3 border-b border-gray-100 dark:border-border/60 hover:bg-gray-50 dark:hover:bg-muted/60 transition-colors',
                    !notification.readAt && 'bg-blue-50/60 dark:bg-blue-950/20',
                  )}
                >
                  <Icon className="h-4 w-4 mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-gray-900 dark:text-foreground">
                      {notification.title}
                    </span>
                    {notification.body && (
                      <span className="block text-xs text-gray-600 dark:text-muted-foreground truncate">
                        {notification.body}
                      </span>
                    )}
                    <span className="block text-[11px] text-gray-400 dark:text-muted-foreground/70 mt-0.5">
                      {timeAgo(notification.createdAt)}
                    </span>
                  </span>
                  {!notification.readAt && (
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
