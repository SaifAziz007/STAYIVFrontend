'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, ArrowLeft, MessageCircle, Calendar, Users, MapPin } from 'lucide-react';
import { conversationsApi, type Conversation, type ConversationMessage } from '@/lib/conversations-api';
import { cn } from '@/lib/utils';

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;
  const searchParams = useSearchParams();
  const bookingType = searchParams.get('type') as 'inquiry' | 'reservation';
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (conversationId) {
      loadConversationData();
    }
  }, [conversationId]);

  const loadConversationData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load conversation details and messages in parallel
      const [conversationData, messagesData] = await Promise.all([
        conversationsApi.getConversationById(conversationId, bookingType),
        conversationsApi.getConversationMessages(conversationId)
      ]);

      setConversation(conversationData);
      setMessages(messagesData.data);
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-red-500 text-center">
          <h2 className="text-lg font-semibold">Error Loading Conversation</h2>
          <p className="text-sm">{error || 'Conversation not found'}</p>
        </div>
        <Button onClick={() => router.push('/chats/all')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Conversations
        </Button>
      </div>
    );
  }

  const guest = conversationsApi.parseGuestData(conversation.guestData);
  const guests = conversationsApi.parseGuestsData(conversation.guestsData);
  const guestName = guest ? `${guest.first_name} ${guest.last_name || ''}`.trim() : 'Guest';
  const guestSummary = conversationsApi.getGuestSummary(conversation.guestsData);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button onClick={() => router.push('/chats/all')} variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Conversation with {guestName}</h1>
      </div>

      {/* Conversation Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={guest?.profile_picture} />
                <AvatarFallback>
                  {guestName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{guestName}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={bookingType === 'reservation' ? 'default' : 'secondary'}>
                    {bookingType}
                  </Badge>
                  <Badge variant="outline">{conversation.platform}</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {bookingType === 'reservation' && (
              <>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Check-in</p>
                    <p className="text-sm text-gray-600">
                      {conversation.arrivalDate ? formatDate(conversation.arrivalDate) : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Check-out</p>
                    <p className="text-sm text-gray-600">
                      {conversation.departureDate ? formatDate(conversation.departureDate) : 'N/A'}
                    </p>
                  </div>
                </div>
              </>
            )}
            {bookingType === 'inquiry' && (
              <>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Arrival</p>
                    <p className="text-sm text-gray-600">
                      {conversation.arrivalDate || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Departure</p>
                    <p className="text-sm text-gray-600">
                      {conversation.departureDate || 'N/A'}
                    </p>
                  </div>
                </div>
              </>
            )}
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Guests</p>
                <p className="text-sm text-gray-600">{guestSummary}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Last Message</p>
                <p className="text-sm text-gray-600">
                  {conversation.lastMessageAt ? formatDate(conversation.lastMessageAt) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Messages ({messages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No messages found for this conversation</p>
              <p className="text-sm mt-2">Messages may still be syncing from Hospitable</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isHost = message.senderType === 'host';
                const senderData = message.senderData ? JSON.parse(message.senderData) : null;
                
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      isHost ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={senderData?.picture_url} />
                      <AvatarFallback>
                        {isHost ? 'H' : 'G'}
                      </AvatarFallback>
                    </Avatar>
                    <div className={cn(
                      "flex-1 max-w-[70%]",
                      isHost ? "text-right" : "text-left"
                    )}>
                      <div className={cn(
                        "inline-block px-4 py-2 rounded-lg",
                        isHost 
                          ? "bg-blue-500 text-white" 
                          : "bg-gray-100 text-gray-900"
                      )}>
                        <p className="text-sm">{message.body}</p>
                      </div>
                      <div className={cn(
                        "text-xs text-gray-500 mt-1",
                        isHost ? "text-right" : "text-left"
                      )}>
                        <span>{senderData?.first_name || (isHost ? 'Host' : 'Guest')}</span>
                        <span className="mx-1">•</span>
                        <span>{formatMessageTime(message.messageCreatedAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

