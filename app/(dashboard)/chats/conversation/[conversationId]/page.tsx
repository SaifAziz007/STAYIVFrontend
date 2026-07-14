'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Loader2,
  ArrowLeft,
  MessageCircle,
  Calendar,
  Users,
  Home,
  Flag,
  AlertTriangle,
  Search,
  FileText,
  DollarSign,
  Upload,
} from 'lucide-react';
import {
  conversationsApi,
  type Conversation,
  type ConversationMessage,
  type ReservationConversation,
} from '@/lib/conversations-api';
import { cn } from '@/lib/utils';
import { usePageHeader } from '@/components/layout/page-header-context';
import { getMoodConfig } from '@/lib/chat-mood-config';
import { authApi, canViewScreen, type User } from '@/lib/auth';
import { CHAT_ACTION_TO_SCREEN } from '@/lib/chat-action-permissions';
import { claimedChatsApi } from '@/lib/claimed-chats-api';
import { reviewRemovalApi } from '@/lib/review-removal-api';
import { lostAndFoundApi } from '@/lib/lost-found-api';
import { issuesApi } from '@/lib/issues-api';
import { pendingPaymentsApi } from '@/lib/pending-payments-api';
import { formCollectionApi } from '@/lib/form-collection-api';
import { resolvePropertyNameFromReservation } from '@/lib/reservation-property-display';
import ClaimChatModal from '@/components/claim-chat-modal';
import IssuesModal from '@/components/issues-modal';
import PendingPaymentModal from '@/components/pending-payment-modal';
import FormCollectionModal from '@/components/form-collection-modal';

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
  const [viewer, setViewer] = useState<User | null>(null);
  const [claimedReservationIds, setClaimedReservationIds] = useState<string[]>([]);
  const [reviewRemovalReservationIds, setReviewRemovalReservationIds] = useState<string[]>([]);
  const [lostAndFoundReservationIds, setLostAndFoundReservationIds] = useState<string[]>([]);
  const [issuesReservationIds, setIssuesReservationIds] = useState<string[]>([]);
  const [paymentReservationIds, setPaymentReservationIds] = useState<string[]>([]);
  const [formCollectionReservationIds, setFormCollectionReservationIds] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalActionType, setModalActionType] = useState<
    'claim' | 'review' | 'lost-found' | 'issues' | 'payment' | 'form'
  >('claim');
  const [selectedReservation, setSelectedReservation] = useState<ReservationConversation | null>(null);

  useEffect(() => {
    setViewer(authApi.getUser());
  }, []);

  const loadReservationIds = useCallback(async () => {
    try {
      const [claimedIds, reviewIds, lostFoundIds, issueIds, paymentIds, formIds] = await Promise.all([
        claimedChatsApi.getClaimedReservationIds().catch(() => []),
        reviewRemovalApi.getReviewRemovalReservationIds().catch(() => []),
        lostAndFoundApi.getLostAndFoundReservationIds().catch(() => []),
        issuesApi.getIssueReservationIds().catch(() => []),
        pendingPaymentsApi.getPaymentReservationIds().catch(() => []),
        formCollectionApi.getFormCollectionReservationIds().catch(() => []),
      ]);
      setClaimedReservationIds(claimedIds || []);
      setReviewRemovalReservationIds(reviewIds || []);
      setLostAndFoundReservationIds(lostFoundIds || []);
      setIssuesReservationIds(issueIds || []);
      setPaymentReservationIds(paymentIds || []);
      setFormCollectionReservationIds(formIds || []);
    } catch {
      setClaimedReservationIds([]);
      setReviewRemovalReservationIds([]);
      setLostAndFoundReservationIds([]);
      setIssuesReservationIds([]);
      setPaymentReservationIds([]);
      setFormCollectionReservationIds([]);
    }
  }, []);

  const loadConversationData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Look the conversation up directly on the server (by id) instead of
      // scanning a paginated list — otherwise conversations past the first page
      // fail with "not found".
      const details = await conversationsApi.getConversationDetails(conversationId, bookingType);

      setConversation({ ...details.data.conversation, type: details.data.type });
      setMessages(details.data.messages);
      void loadReservationIds();
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  }, [conversationId, bookingType, loadReservationIds]);

  useEffect(() => {
    if (conversationId) {
      void loadConversationData();
    }
  }, [conversationId, loadConversationData]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const guestHeaderParsed = conversation
    ? conversationsApi.parseGuestData(conversation.guestData)
    : null;
  const guestHeaderName = guestHeaderParsed
    ? `${guestHeaderParsed.first_name} ${guestHeaderParsed.last_name || ''}`.trim()
    : 'Guest';

  const conversationBack = useMemo(
    () => (
      <Button onClick={() => router.push('/chats/all')} variant="outline" size="sm">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
    ),
    [router],
  );

  usePageHeader({
    title: conversation ? `Conversation with ${guestHeaderName}` : 'Conversation',
    description: conversation
      ? `${conversation.platform} · ${bookingType === 'inquiry' ? 'Inquiry' : 'Reservation'}`
      : loading
        ? 'Loading conversation…'
        : undefined,
    actions: conversationBack,
  });

  const getReservationData = (res: ReservationConversation) => {
    const guest = conversationsApi.parseGuestData(res.guestData);
    const guests = conversationsApi.parseGuestsData(res.guestsData);
    return {
      reservationId: res.id,
      reservationCode: res.code || '',
      guestName: guest ? `${guest.first_name} ${guest.last_name || ''}`.trim() : 'Guest',
      guestEmail: guest?.email || '',
      guestPhone: guest?.phone_numbers?.[0] || '',
      propertyName: resolvePropertyNameFromReservation(res) ?? '',
      checkInDate: res.arrivalDate || '',
      checkOutDate: res.departureDate || '',
      platform: res.platform,
      numberOfGuests: (guests?.adult_count || 0) + (guests?.child_count || 0) || 1,
      conversationId: res.conversationId || res.id,
    };
  };

  const isConversationClaimed = (c: Conversation) =>
    c.type === 'reservation' && claimedReservationIds.includes((c as ReservationConversation).id);
  const isConversationInReview = (c: Conversation) =>
    c.type === 'reservation' && reviewRemovalReservationIds.includes((c as ReservationConversation).id);
  const isConversationInLostFound = (c: Conversation) =>
    c.type === 'reservation' && lostAndFoundReservationIds.includes((c as ReservationConversation).id);
  const isConversationInIssues = (c: Conversation) =>
    c.type === 'reservation' && issuesReservationIds.includes((c as ReservationConversation).id);
  const isConversationInPayments = (c: Conversation) =>
    c.type === 'reservation' && paymentReservationIds.includes((c as ReservationConversation).id);
  const isConversationInForms = (c: Conversation) =>
    c.type === 'reservation' && formCollectionReservationIds.includes((c as ReservationConversation).id);

  const handleActionClick = (
    actionType: 'claim' | 'review' | 'lost-found' | 'issues' | 'payment' | 'form',
    res: ReservationConversation,
  ) => {
    setModalActionType(actionType);
    setSelectedReservation(res);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedReservation(null);
    void loadReservationIds();
  };

  const ActionButton = ({
    actionType,
    conv,
    isActioned,
    canUseAction,
  }: {
    actionType: 'claim' | 'review' | 'lost-found' | 'issues' | 'payment' | 'form';
    conv: Conversation;
    isActioned: boolean;
    canUseAction: boolean;
  }) => {
    const config = {
      claim: {
        icon: Flag,
        activeText: 'Claim',
        actionedText: 'Claimed',
        activeClass:
          'text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-800 dark:text-blue-400 dark:border-blue-800/70 dark:hover:bg-blue-950/50 dark:hover:text-blue-100',
        actionedClass:
          'text-gray-500 dark:text-neutral-500 border-gray-300 dark:border-border cursor-not-allowed',
      },
      review: {
        icon: AlertTriangle,
        activeText: 'Review',
        actionedText: 'In Review',
        activeClass:
          'text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-800 dark:text-orange-400 dark:border-orange-800/70 dark:hover:bg-orange-950/45 dark:hover:text-orange-100',
        actionedClass:
          'text-gray-500 dark:text-neutral-500 border-gray-300 dark:border-border cursor-not-allowed',
      },
      'lost-found': {
        icon: Search,
        activeText: 'Lost & Found',
        actionedText: 'Reported',
        activeClass:
          'text-purple-600 border-purple-200 hover:bg-purple-50 hover:text-purple-800 dark:text-purple-400 dark:border-purple-800/70 dark:hover:bg-purple-950/45 dark:hover:text-purple-100',
        actionedClass:
          'text-gray-500 dark:text-neutral-500 border-gray-300 dark:border-border cursor-not-allowed',
      },
      issues: {
        icon: FileText,
        activeText: 'Open Issues',
        actionedText: 'Issue Logged',
        activeClass:
          'text-red-600 border-red-200 hover:bg-red-50 hover:text-red-800 dark:text-red-400 dark:border-red-800/70 dark:hover:bg-red-950/45 dark:hover:text-red-100',
        actionedClass:
          'text-gray-500 dark:text-neutral-500 border-gray-300 dark:border-border cursor-not-allowed',
      },
      payment: {
        icon: DollarSign,
        activeText: 'Pending Payment',
        actionedText: 'Payment Logged',
        activeClass:
          'text-green-600 border-green-200 hover:bg-green-50 hover:text-green-800 dark:text-green-400 dark:border-green-800/70 dark:hover:bg-green-950/45 dark:hover:text-green-100',
        actionedClass:
          'text-gray-500 dark:text-neutral-500 border-gray-300 dark:border-border cursor-not-allowed',
      },
      form: {
        icon: Upload,
        activeText: 'Form Collection',
        actionedText: 'Form Collected',
        activeClass:
          'text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-800 dark:text-indigo-400 dark:border-indigo-800/70 dark:hover:bg-indigo-950/45 dark:hover:text-indigo-100',
        actionedClass:
          'text-gray-500 dark:text-neutral-500 border-gray-300 dark:border-border cursor-not-allowed',
      },
    };

    const { icon: Icon, activeText, actionedText, activeClass, actionedClass } = config[actionType];
    const greyed = isActioned || !canUseAction;
    const noPermission = !canUseAction && !isActioned;

    return (
      <Button
        size="sm"
        variant={greyed ? 'secondary' : 'outline'}
        className={greyed ? actionedClass : activeClass}
        disabled={greyed}
        title={noPermission ? 'You do not have permission for this action' : undefined}
        onClick={(e) => {
          e.stopPropagation();
          if (!greyed) {
            handleActionClick(actionType, conv as ReservationConversation);
          }
        }}
      >
        <Icon className="h-3 w-3 mr-1" />
        {isActioned ? actionedText : activeText}
      </Button>
    );
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
  const reservation = conversation.type === 'reservation' ? (conversation as ReservationConversation) : null;
  const moodCfg = reservation?.mood ? getMoodConfig(reservation.mood) : null;

  return (
    <div className="space-y-6">
      {/* Sticky guest + meta + actions — stays under main app header while scrolling */}
      <div
        className={cn(
          'sticky top-16 z-30 -mx-8 border-b border-border bg-background/95 px-8 pb-4 pt-2 shadow-sm',
          'backdrop-blur-md supports-[backdrop-filter]:bg-background/85',
        )}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarImage src={guest?.profile_picture} />
                <AvatarFallback>
                  {guestName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-foreground">{guestName}</h2>
                  {moodCfg && (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                        moodCfg.className,
                      )}
                    >
                      <span aria-hidden>{moodCfg.icon}</span>
                      {moodCfg.label}
                    </span>
                  )}
                </div>
                {reservation?.propertyName && (
                  <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Home className="h-4 w-4 shrink-0" />
                    <span>{reservation.propertyName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant={bookingType === 'reservation' ? 'default' : 'secondary'}>{bookingType}</Badge>
                  <Badge variant="outline">{conversation.platform}</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            {bookingType === 'reservation' && (
              <>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Check-in</p>
                    <p className="text-muted-foreground">
                      {conversation.arrivalDate ? formatDate(conversation.arrivalDate) : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Check-out</p>
                    <p className="text-muted-foreground">
                      {conversation.departureDate ? formatDate(conversation.departureDate) : 'N/A'}
                    </p>
                  </div>
                </div>
              </>
            )}
            {bookingType === 'inquiry' && (
              <>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Arrival</p>
                    <p className="text-muted-foreground">{conversation.arrivalDate || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Departure</p>
                    <p className="text-muted-foreground">{conversation.departureDate || 'N/A'}</p>
                  </div>
                </div>
              </>
            )}
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="font-medium text-foreground">Guests</p>
                <p className="text-muted-foreground">{guestSummary}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="font-medium text-foreground">Last Message</p>
                <p className="text-muted-foreground">
                  {conversation.lastMessageAt ? formatDate(conversation.lastMessageAt) : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {bookingType === 'reservation' && viewer && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              <ActionButton
                actionType="claim"
                conv={conversation}
                isActioned={isConversationClaimed(conversation)}
                canUseAction={canViewScreen(viewer, CHAT_ACTION_TO_SCREEN.claim)}
              />
              <ActionButton
                actionType="review"
                conv={conversation}
                isActioned={isConversationInReview(conversation)}
                canUseAction={canViewScreen(viewer, CHAT_ACTION_TO_SCREEN.review)}
              />
              <ActionButton
                actionType="lost-found"
                conv={conversation}
                isActioned={isConversationInLostFound(conversation)}
                canUseAction={canViewScreen(viewer, CHAT_ACTION_TO_SCREEN['lost-found'])}
              />
              <ActionButton
                actionType="issues"
                conv={conversation}
                isActioned={isConversationInIssues(conversation)}
                canUseAction={canViewScreen(viewer, CHAT_ACTION_TO_SCREEN.issues)}
              />
              <ActionButton
                actionType="payment"
                conv={conversation}
                isActioned={isConversationInPayments(conversation)}
                canUseAction={canViewScreen(viewer, CHAT_ACTION_TO_SCREEN.payment)}
              />
              <ActionButton
                actionType="form"
                conv={conversation}
                isActioned={isConversationInForms(conversation)}
                canUseAction={canViewScreen(viewer, CHAT_ACTION_TO_SCREEN.form)}
              />
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Messages ({messages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
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
                    className={cn('flex gap-3', isHost ? 'flex-row-reverse' : 'flex-row')}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={senderData?.picture_url} />
                      <AvatarFallback>{isHost ? 'H' : 'G'}</AvatarFallback>
                    </Avatar>
                    <div
                      className={cn('flex-1 max-w-[70%]', isHost ? 'text-right' : 'text-left')}
                    >
                      <div
                        className={cn(
                          'inline-block px-4 py-2 rounded-lg',
                          isHost
                            ? 'bg-blue-500 text-white dark:bg-blue-600'
                            : 'bg-gray-100 text-gray-900 dark:bg-muted dark:text-foreground',
                        )}
                      >
                        <p className="text-sm">{message.body}</p>
                      </div>
                      <div
                        className={cn(
                          'text-xs text-muted-foreground mt-1',
                          isHost ? 'text-right' : 'text-left',
                        )}
                      >
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

      {showModal && selectedReservation && (modalActionType === 'claim' || modalActionType === 'review' || modalActionType === 'lost-found') && (
        <ClaimChatModal
          isOpen={showModal}
          onClose={closeModal}
          actionType={modalActionType}
          reservationData={getReservationData(selectedReservation)}
        />
      )}

      {showModal && selectedReservation && modalActionType === 'issues' && (
        <IssuesModal isOpen={showModal} onClose={closeModal} reservationData={getReservationData(selectedReservation)} />
      )}

      {showModal && selectedReservation && modalActionType === 'payment' && (
        <PendingPaymentModal
          isOpen={showModal}
          onClose={closeModal}
          reservationData={getReservationData(selectedReservation)}
        />
      )}

      {showModal && selectedReservation && modalActionType === 'form' && (
        <FormCollectionModal
          isOpen={showModal}
          onClose={closeModal}
          reservationData={getReservationData(selectedReservation)}
        />
      )}
    </div>
  );
}
