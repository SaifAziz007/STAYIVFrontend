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
  /** Membership or group settings changed — refetch the conversation. */
  onConversationChanged?: (conversationId: string) => void;
  /** @stayiv is working on an answer in this conversation. */
  onAssistantThinking?: (conversationId: string, thinking: boolean) => void;
}

/**
 * Connects to the /team-chat namespace and joins the user's personal room so
 * conversation-list updates (new messages, unread badges) arrive in real time
 * regardless of which thread is currently open.
 */
export function useTeamChat({
  userId,
  onConversationUpdate,
  onConversationChanged,
  onAssistantThinking,
}: UseTeamChatOptions) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const onConversationUpdateRef = useRef(onConversationUpdate);
  const onConversationChangedRef = useRef(onConversationChanged);
  const onAssistantThinkingRef = useRef(onAssistantThinking);

  useEffect(() => {
    onConversationUpdateRef.current = onConversationUpdate;
    onConversationChangedRef.current = onConversationChanged;
    onAssistantThinkingRef.current = onAssistantThinking;
  }, [onConversationUpdate, onConversationChanged, onAssistantThinking]);

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

    newSocket.on('team-conversation-changed', ({ conversationId }: { conversationId: string }) => {
      onConversationChangedRef.current?.(conversationId);
    });

    newSocket.on(
      'assistant-thinking',
      ({ conversationId, thinking }: { conversationId: string; thinking: boolean }) => {
        onAssistantThinkingRef.current?.(conversationId, thinking);
      },
    );

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
