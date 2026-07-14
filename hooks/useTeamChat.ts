import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { TeamMessage } from '@/lib/team-chat-api';
import { getSocketBaseUrl } from '@/lib/socket-url';

interface ConversationUpdate {
  conversationId: string;
  lastMessage: TeamMessage;
}

interface UseTeamChatOptions {
  userId: string;
  onConversationUpdate?: (update: ConversationUpdate) => void;
}

/**
 * Connects to the /team-chat namespace and joins the user's personal room so
 * conversation-list updates (new messages, unread badges) arrive in real time
 * regardless of which thread is currently open.
 */
export function useTeamChat({ userId, onConversationUpdate }: UseTeamChatOptions) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const onConversationUpdateRef = useRef(onConversationUpdate);
  useEffect(() => {
    onConversationUpdateRef.current = onConversationUpdate;
  }, [onConversationUpdate]);

  useEffect(() => {
    if (!userId) return;

    const baseUrl = getSocketBaseUrl();
    const newSocket = io(`${baseUrl}/team-chat`, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join-team-chat', { userId });
    });

    newSocket.on('connect_error', (err) => {
      console.error('Team chat socket connection error:', err.message);
      setIsConnected(false);
    });

    newSocket.on('disconnect', () => setIsConnected(false));

    newSocket.on('team-conversation-update', (update: ConversationUpdate) => {
      onConversationUpdateRef.current?.(update);
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leave-team-chat', { userId });
      newSocket.disconnect();
    };
  }, [userId]);

  const joinConversation = useCallback(
    (conversationId: string) => {
      socket?.emit('join-conversation', { conversationId });
    },
    [socket],
  );

  const leaveConversation = useCallback(
    (conversationId: string) => {
      socket?.emit('leave-conversation', { conversationId });
    },
    [socket],
  );

  return { socket, isConnected, joinConversation, leaveConversation };
}
