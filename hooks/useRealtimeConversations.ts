import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface ConversationUpdate {
  type: 'reservation' | 'inquiry';
  conversationId: string;
  reservationId?: string;
  message: {
    id: number;
    conversationId: string;
    reservationId?: string;
    platform: string;
    body: string;
    senderType: 'host' | 'guest';
    sender: {
      first_name: string;
      full_name: string;
      locale: string;
      picture_url: string;
      thumbnail_url: string;
      location: string;
    };
    createdAt: string;
    action: string;
  };
  action: string;
}

interface UseRealtimeConversationsOptions {
  userId: string;
  onMessageReceived?: (update: ConversationUpdate) => void;
  onConnectionStatusChange?: (connected: boolean) => void;
}

export function useRealtimeConversations({
  userId,
  onMessageReceived,
  onConnectionStatusChange
}: UseRealtimeConversationsOptions) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Use refs to store latest callbacks to avoid dependency issues
  const onMessageReceivedRef = useRef(onMessageReceived);
  const onConnectionStatusChangeRef = useRef(onConnectionStatusChange);
  
  // Update refs when callbacks change
  useEffect(() => {
    onMessageReceivedRef.current = onMessageReceived;
  }, [onMessageReceived]);
  
  useEffect(() => {
    onConnectionStatusChangeRef.current = onConnectionStatusChange;
  }, [onConnectionStatusChange]);

  // Handle conversation updates from WebSocket
  const handleConversationUpdate = useCallback((update: ConversationUpdate) => {
    console.log('Received real-time conversation update:', update);

    try {
      // Since localStorage caching is removed, just trigger events for UI updates
      // Components can handle updates by refetching data from the database
      
      // Trigger custom event for components to listen to
      window.dispatchEvent(new CustomEvent('realtime-conversation-update', {
        detail: update
      }));

      // Call optional callback using ref
      if (onMessageReceivedRef.current) {
        onMessageReceivedRef.current(update);
      }
    } catch (error) {
      console.error('Error handling conversation update:', error);
    }
  }, []); // Remove onMessageReceived from dependencies to prevent infinite loop

  // Initialize WebSocket connection
  useEffect(() => {
    if (!userId) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    console.log('Connecting to WebSocket at:', `${apiUrl}/conversations`);
    
    // Note: The backend has /api prefix for HTTP routes, but WebSocket connects directly

    const newSocket = io(`${apiUrl}/conversations`, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Connected to real-time conversation updates');
      setIsConnected(true);
      setConnectionError(null);
      
      // Join user's conversation room
      newSocket.emit('join-conversations', { userId });
      
      if (onConnectionStatusChangeRef.current) {
        onConnectionStatusChangeRef.current(true);
      }
    });

    // Welcome message handler
    newSocket.on('welcome', (data) => {
      console.log('Received welcome from WebSocket server:', data);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from real-time updates:', reason);
      setIsConnected(false);
      
      if (onConnectionStatusChangeRef.current) {
        onConnectionStatusChangeRef.current(false);
      }
    });

    newSocket.on('connect_error', (error: any) => {
      console.error('WebSocket connection error:', error);
      console.error('Error details:', {
        message: error.message,
        type: error.type,
        description: error.description,
        context: error.context,
        transport: error.transport
      });
      setConnectionError(error.message);
      setIsConnected(false);
      
      if (onConnectionStatusChangeRef.current) {
        onConnectionStatusChangeRef.current(false);
      }
    });

    // Conversation update handler
    newSocket.on('conversation-update', handleConversationUpdate);

    // Join confirmation handler
    newSocket.on('joined-conversations', (data) => {
      console.log('Successfully joined conversation updates:', data);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up WebSocket connection');
      newSocket.disconnect();
    };
  }, [userId]); // Only userId as dependency since callbacks are handled via refs

  // Manual reconnection function
  const reconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      socket.connect();
    }
  }, [socket]);

  // Leave conversations room
  const leaveConversations = useCallback(() => {
    if (socket && userId) {
      socket.emit('leave-conversations', { userId });
    }
  }, [socket, userId]);

  return {
    socket,
    isConnected,
    connectionError,
    reconnect,
    leaveConversations,
  };
}

/**
 * Hook for listening to conversation updates in components
 */
export function useConversationUpdates(
  onUpdate?: (update: ConversationUpdate) => void
) {
  useEffect(() => {
    const handleUpdate = (event: CustomEvent<ConversationUpdate>) => {
      if (onUpdate) {
        onUpdate(event.detail);
      }
    };

    window.addEventListener('realtime-conversation-update', handleUpdate as EventListener);
    
    return () => {
      window.removeEventListener('realtime-conversation-update', handleUpdate as EventListener);
    };
  }, [onUpdate]);
}

/**
 * Hook for listening to conversation message updates (no longer cached)
 */
export function useCachedMessageUpdates(
  onMessageAdded?: (data: { type: 'reservations' | 'inquiries'; id: string; message: any }) => void
) {
  useEffect(() => {
    const handleMessageAdded = (event: CustomEvent) => {
      if (onMessageAdded) {
        onMessageAdded(event.detail);
      }
    };

    // Listen to real-time updates instead of cache events
    window.addEventListener('realtime-conversation-update', handleMessageAdded as EventListener);
    
    return () => {
      window.removeEventListener('realtime-conversation-update', handleMessageAdded as EventListener);
    };
  }, [onMessageAdded]);
}
