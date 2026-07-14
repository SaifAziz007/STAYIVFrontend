'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, MessageCircle, Calendar, Users, MapPin, RefreshCw, AlertCircle, Flag, AlertTriangle, Search, Home, FileText, DollarSign, Upload, X } from 'lucide-react';
import { conversationsApi, type Conversation, type ReservationConversation, type InquiryConversation, type MoodStats } from '@/lib/conversations-api';
import ClaimChatModal from '@/components/claim-chat-modal';
import { cn } from '@/lib/utils';
import { claimedChatsApi } from '@/lib/claimed-chats-api';
import { reviewRemovalApi } from '@/lib/review-removal-api';
import { lostAndFoundApi } from '@/lib/lost-found-api';
import { issuesApi } from '@/lib/issues-api';
import { pendingPaymentsApi } from '@/lib/pending-payments-api';
import { formCollectionApi } from '@/lib/form-collection-api';
import IssuesModal from '@/components/issues-modal';
import PendingPaymentModal from '@/components/pending-payment-modal';
import FormCollectionModal from '@/components/form-collection-modal';
import { authApi, canViewScreen, type User } from '@/lib/auth';
import { CHAT_ACTION_TO_SCREEN } from '@/lib/chat-action-permissions';
import { usePageHeader } from '@/components/layout/page-header-context';
import { getMoodConfig } from '@/lib/chat-mood-config';
import { resolvePropertyNameFromReservation } from '@/lib/reservation-property-display';
import { useConversationSync } from '@/hooks/useConversationSync';
import { SyncProgress } from '@/components/chats/sync-progress';


export default function AllChatsPage() {
  const router = useRouter();
  const [viewer, setViewer] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'reservations' | 'inquiries'>('all');
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalActionType, setModalActionType] = useState<'claim' | 'review' | 'lost-found' | 'issues' | 'payment' | 'form'>('claim');
  const [selectedConversation, setSelectedConversation] = useState<ReservationConversation | null>(null);
  const [claimedReservationIds, setClaimedReservationIds] = useState<string[]>([]);
  const [reviewRemovalReservationIds, setReviewRemovalReservationIds] = useState<string[]>([]);
  const [lostAndFoundReservationIds, setLostAndFoundReservationIds] = useState<string[]>([]);
  const [issuesReservationIds, setIssuesReservationIds] = useState<string[]>([]);
  const [paymentReservationIds, setPaymentReservationIds] = useState<string[]>([]);
  const [formCollectionReservationIds, setFormCollectionReservationIds] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [showEarlyCheckin, setShowEarlyCheckin] = useState(false);  // Add this
  const [showLateCheckout, setShowLateCheckout] = useState(false);  // Add this
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [moodStats, setMoodStats] = useState<MoodStats | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const PAGE_SIZE = 20;

  // Debounce the search box so we don't hit the server on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Mood chips grouped by display label (backend returns raw mood strings).
  const moodLabelStats = useMemo(() => {
    const map = new Map<
      string,
      { label: string; count: number; rawMoods: string[] }
    >();
    for (const { mood, count } of moodStats?.moods ?? []) {
      const config = getMoodConfig(mood);
      if (!config) continue;
      const entry = map.get(config.label) ?? { label: config.label, count: 0, rawMoods: [] };
      entry.count += count;
      entry.rawMoods.push(mood);
      map.set(config.label, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [moodStats]);

  // Raw mood strings for the currently selected mood labels (sent to the server).
  const selectedRawMoods = useMemo(
    () =>
      moodLabelStats
        .filter((m) => selectedMoods.includes(m.label))
        .flatMap((m) => m.rawMoods),
    [moodLabelStats, selectedMoods],
  );

  const loadMoodStats = useCallback(async () => {
    try {
      setMoodStats(await conversationsApi.getMoodStats());
    } catch (err) {
      console.error('Failed to load mood stats:', err);
    }
  }, []);

  useEffect(() => {
    setViewer(authApi.getUser());
  }, []);

  // Load mood/tab stats once on mount (and re-load after a sync completes).
  useEffect(() => {
    void loadMoodStats();
  }, [loadMoodStats]);

  // (Re)load the current page whenever the tab, filters or page change.
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const type =
        activeTab === 'reservations'
          ? 'reservation'
          : activeTab === 'inquiries'
            ? 'inquiry'
            : undefined;

      const res = await conversationsApi.getConversations(currentPage, PAGE_SIZE, type, {
        moods: selectedRawMoods.length ? selectedRawMoods : undefined,
        earlyCheckin: showEarlyCheckin,
        lateCheckout: showLateCheckout,
        search: debouncedSearch || undefined,
      });
      setConversations(res.data);
      setTotal(res.pagination.total ?? res.data.length);
    } catch (error: any) {
      console.error('Failed to load conversations:', error);
      setError('Failed to load conversations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, selectedRawMoods, showEarlyCheckin, showLateCheckout, debouncedSearch]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  // Reset to the first page whenever the tab or filters change.
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedMoods, showEarlyCheckin, showLateCheckout, debouncedSearch]);

  // Load the reservation-action id lists once (used to badge action buttons).
  const loadActionIds = useCallback(async () => {
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
    } catch (error) {
      console.error('Failed to load reservation IDs:', error);
    }
  }, []);

  useEffect(() => {
    void loadActionIds();
  }, [loadActionIds]);

  // Helper functions to check if a conversation has been actioned
  const isConversationClaimed = (conversation: Conversation): boolean => {
    if (conversation.type === 'reservation') {
      const reservation = conversation as ReservationConversation;
      return claimedReservationIds.includes(reservation.id);
    }
    return false;
  };

  const isConversationInReview = (conversation: Conversation): boolean => {
    if (conversation.type === 'reservation') {
      const reservation = conversation as ReservationConversation;
      return reviewRemovalReservationIds.includes(reservation.id);
    }
    return false;
  };

  const isConversationInLostFound = (conversation: Conversation): boolean => {
    if (conversation.type === 'reservation') {
      const reservation = conversation as ReservationConversation;
      return lostAndFoundReservationIds.includes(reservation.id);
    }
    return false;
  };

  const isConversationInIssues = (conversation: Conversation): boolean => {
    if (conversation.type === 'reservation') {
      const reservation = conversation as ReservationConversation;
      return issuesReservationIds.includes(reservation.id);
    }
    return false;
  };

  const isConversationInPayments = (conversation: Conversation): boolean => {
    if (conversation.type === 'reservation') {
      const reservation = conversation as ReservationConversation;
      return paymentReservationIds.includes(reservation.id);
    }
    return false;
  };

  const isConversationInForms = (conversation: Conversation): boolean => {
    if (conversation.type === 'reservation') {
      const reservation = conversation as ReservationConversation;
      return formCollectionReservationIds.includes(reservation.id);
    }
    return false;
  };

  // Action Button Components
  const ActionButton = ({
    actionType,
    conversation,
    isActioned,
    canUseAction,
    onActionClick
  }: {
    actionType: 'claim' | 'review' | 'lost-found' | 'issues' | 'payment' | 'form';
    conversation: Conversation;
    isActioned: boolean;
    canUseAction: boolean;
    onActionClick: (actionType: 'claim' | 'review' | 'lost-found' | 'issues' | 'payment' | 'form', conversation: ReservationConversation) => void;
  }) => {
    const config = {
      claim: {
        icon: Flag,
        activeText: 'Claim',
        actionedText: 'Claimed',
        activeClass:
          'text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-800 dark:text-blue-400 dark:border-blue-800/70 dark:hover:bg-blue-950/50 dark:hover:text-blue-100',
        actionedClass: 'text-gray-500 dark:text-neutral-500 border-gray-300 dark:border-border cursor-not-allowed'
      },
      review: {
        icon: AlertTriangle,
        activeText: 'Review',
        actionedText: 'In Review',
        activeClass:
          'text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-800 dark:text-orange-400 dark:border-orange-800/70 dark:hover:bg-orange-950/45 dark:hover:text-orange-100',
        actionedClass: 'text-gray-500 dark:text-neutral-500 border-gray-300 dark:border-border cursor-not-allowed'
      },
      'lost-found': {
        icon: Search,
        activeText: 'Lost & Found',
        actionedText: 'Reported',
        activeClass:
          'text-purple-600 border-purple-200 hover:bg-purple-50 hover:text-purple-800 dark:text-purple-400 dark:border-purple-800/70 dark:hover:bg-purple-950/45 dark:hover:text-purple-100',
        actionedClass: 'text-gray-500 dark:text-neutral-500 border-gray-300 dark:border-border cursor-not-allowed'
      },
      'issues': {
        icon: FileText,
        activeText: 'Open Issues',
        actionedText: 'Issue Logged',
        activeClass:
          'text-red-600 border-red-200 hover:bg-red-50 hover:text-red-800 dark:text-red-400 dark:border-red-800/70 dark:hover:bg-red-950/45 dark:hover:text-red-100',
        actionedClass: 'text-gray-500 dark:text-neutral-500 border-gray-300 dark:border-border cursor-not-allowed'
      },
      'payment': {
        icon: DollarSign,
        activeText: 'Pending Payment',
        actionedText: 'Payment Logged',
        activeClass:
          'text-green-600 border-green-200 hover:bg-green-50 hover:text-green-800 dark:text-green-400 dark:border-green-800/70 dark:hover:bg-green-950/45 dark:hover:text-green-100',
        actionedClass: 'text-gray-500 dark:text-neutral-500 border-gray-300 dark:border-border cursor-not-allowed'
      },
      'form': {
        icon: Upload,
        activeText: 'Form Collection',
        actionedText: 'Form Collected',
        activeClass:
          'text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-800 dark:text-indigo-400 dark:border-indigo-800/70 dark:hover:bg-indigo-950/45 dark:hover:text-indigo-100',
        actionedClass: 'text-gray-500 dark:text-neutral-500 border-gray-300 dark:border-border cursor-not-allowed'
      }
    };

    const { icon: Icon, activeText, actionedText, activeClass, actionedClass } = config[actionType];
    const greyed = isActioned || !canUseAction;
    const noPermission = !canUseAction && !isActioned;

    return (
      <Button
        size="sm"
        variant={greyed ? "secondary" : "outline"}
        className={greyed ? actionedClass : activeClass}
        disabled={greyed}
        title={noPermission ? 'You do not have permission for this action' : undefined}
        onClick={(e) => {
          e.stopPropagation();
          if (!greyed) {
            onActionClick(actionType, conversation as ReservationConversation);
          }
        }}
      >
        <Icon className="h-3 w-3 mr-1" />
        {isActioned ? actionedText : activeText}
      </Button>
    );
  };
  const getReservationData = (conversation: ReservationConversation) => {
    const guest = conversationsApi.parseGuestData(conversation.guestData);
    const guests = conversationsApi.parseGuestsData(conversation.guestsData);

    return {
      reservationId: conversation.id,
      reservationCode: conversation.code || '',
      guestName: guest ? `${guest.first_name} ${guest.last_name || ''}`.trim() : 'Guest',
      guestEmail: guest?.email || '',
      guestPhone: guest?.phone_numbers?.[0] || '',
      propertyName: resolvePropertyNameFromReservation(conversation) ?? '',
      checkInDate: conversation.arrivalDate || '',
      checkOutDate: conversation.departureDate || '',
      platform: conversation.platform,
      numberOfGuests: (guests?.adult_count || 0) + (guests?.child_count || 0) || 1,
      conversationId: conversation.conversationId || conversation.id,
    };
  };

  const handleActionClick = (actionType: 'claim' | 'review' | 'lost-found' | 'issues' | 'payment' | 'form', conversation: ReservationConversation) => {
    setModalActionType(actionType);
    setSelectedConversation(conversation);
    setShowModal(true);
  };

  const {
    syncing,
    job: syncJob,
    counts: syncCounts,
    start: startSync,
  } = useConversationSync({
    onComplete: () => {
      // Reload the list and the aggregate stats once the sync finishes.
      void loadConversations();
      void loadMoodStats();
    },
  });

  const handleSyncConversations = () => {
    void startSync();
  };

  const syncConversationsRef = useRef(handleSyncConversations);
  syncConversationsRef.current = handleSyncConversations;
  const chatsHeaderActions = useMemo(
    () => (
      <Button
        onClick={() => void syncConversationsRef.current()}
        disabled={syncing}
        variant="outline"
      >
        {syncing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Syncing...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync from Hospitable
          </>
        )}
      </Button>
    ),
    [syncing],
  );

  usePageHeader({
    title: 'Latest Conversations',
    description: 'All recent inquiries and reservations from your properties',
    actions: chatsHeaderActions,
  });

  const handleDebugInfo = async () => {
    try {
      const debugInfo = await conversationsApi.getDebugInfo();
      console.log('Debug Info:', debugInfo);
      alert('Debug info logged to console. Check browser console.');
    } catch (error: any) {
      console.error('Error getting debug info:', error);
      alert('Error getting debug info: ' + error.message);
    }
  };


  // Filtering + pagination now happen server-side; `conversations` is already
  // the filtered page for the active tab.




  const renderConversationCard = (conversation: Conversation) => {
    const guest = conversationsApi.parseGuestData(conversation.guestData);
    const guests = conversationsApi.parseGuestsData(conversation.guestsData);
    const guestName = guest ? `${guest.first_name} ${guest.last_name || ''}`.trim() : 'Guest';
    const guestSummary = conversationsApi.getGuestSummary(conversation.guestsData);

    return (
      <Card
        key={conversation.id}
        className="hover:shadow-lg transition-all cursor-pointer border border-gray-200 dark:border-border bg-white dark:bg-card"
        onClick={() => {
          const conversationIdentifier = conversation.type === 'reservation'
            ? (conversation as ReservationConversation).conversationId
            : (conversation as InquiryConversation).hospitableInquiryId;
          router.push(`/chats/conversation/${conversationIdentifier}?type=${conversation.type}`);
        }}
      >
        <CardContent className="p-5">
          {/* Header Section */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
                <AvatarImage src={guest?.profile_picture} />
                <AvatarFallback className="bg-gradient-to-br from-orange-400 to-pink-500 text-white font-bold text-lg">
                  {guestName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900 dark:text-foreground text-base">{guestName}</h3>
                  {/* Mood badge */}
                  {conversation.type === 'reservation' && (conversation as ReservationConversation).mood && (() => {
                    const moodConfig = getMoodConfig((conversation as ReservationConversation).mood || null);
                    return moodConfig ? (
                      <Badge
                        variant="outline"
                        className={`text-xs px-2 py-0.5 font-medium ${moodConfig.className}`}
                      >
                        <span className="mr-1">{moodConfig.icon}</span>
                        {moodConfig.label}
                      </Badge>
                    ) : null;
                  })()}
                </div>
                {/* Property Name */}
                {conversation.type === 'reservation' && (conversation as ReservationConversation).propertyName && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Home className="h-3.5 w-3.5 text-gray-600 dark:text-neutral-400" />
                    <span className="text-sm text-gray-700 dark:text-neutral-300 font-medium">
                      {(conversation as ReservationConversation).propertyName}
                    </span>
                  </div>
                )}
                {/* Platform badges */}
                <div className="flex items-center gap-2">
                  <Badge
                    className={`text-xs font-medium ${conversation.platform === 'airbnb' ? 'bg-[#FF5A5F] text-white border-0' : 'bg-blue-600 text-white border-0'}`}
                  >
                    {conversation.platform}
                  </Badge>
                  <Badge className="text-xs bg-gray-200 dark:bg-muted text-gray-700 dark:text-neutral-300 border-0 font-medium">
                    {conversation.type}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="text-right text-sm">
              {conversation.lastMessageAt && (
                <div>
                  <div className="font-semibold text-gray-900 dark:text-foreground">{conversationsApi.formatDateForDisplay(conversation.lastMessageAt)}</div>
                  <div className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">{conversationsApi.formatTimeForDisplay(conversation.lastMessageAt)}</div>
                </div>
              )}
            </div>
          </div>

          {/* Check-in/Check-out Section */}
          {conversation.type === 'reservation' && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl p-3.5 border border-green-200 dark:border-green-900 shadow-sm">
                <div className="flex items-center gap-2 text-green-700 mb-1.5">
                  <Calendar className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wide">Check-in</span>
                </div>
                <div className="font-bold text-gray-900 dark:text-foreground text-base">
                  {conversationsApi.formatDateForDisplay((conversation as ReservationConversation).arrivalDate)}
                </div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 rounded-xl p-3.5 border border-red-200 dark:border-red-900 shadow-sm">
                <div className="flex items-center gap-2 text-red-700 mb-1.5">
                  <Calendar className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wide">Check-out</span>
                </div>
                <div className="font-bold text-gray-900 dark:text-foreground text-base">
                  {conversationsApi.formatDateForDisplay((conversation as ReservationConversation).departureDate)}
                </div>
              </div>
            </div>
          )}

          {/* Details Section */}
          <div className="flex items-center gap-6 mb-4 text-sm text-gray-700 dark:text-neutral-300">
            {conversation.type === 'reservation' && (conversation as ReservationConversation).nights && (
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                <span className="font-semibold text-gray-700">
                  <span className="text-gray-900">{(conversation as ReservationConversation).nights}</span> nights
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500 dark:text-neutral-400" />
              <span className="font-semibold text-gray-700">{guestSummary}</span>
            </div>
            {guest?.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500 dark:text-neutral-400" />
                <span className="font-semibold text-gray-700">{guest.location}</span>
              </div>
            )}
          </div>

          {/* Special Request Badges */}
          {conversation.type === 'reservation' && ((conversation as ReservationConversation).earlyCheckin || (conversation as ReservationConversation).lateCheckout) && (
            <div className="flex items-center gap-2 mb-4">
              {(conversation as ReservationConversation).earlyCheckin && (
                <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300 font-medium text-xs">
                  <span className="mr-1">⏰</span>
                  Early Check-in
                </Badge>
              )}
              {(conversation as ReservationConversation).lateCheckout && (
                <Badge className="bg-violet-100 text-violet-800 border-violet-300 font-medium text-xs">
                  <span className="mr-1">🕐</span>
                  Late Check-out
                </Badge>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {conversation.type === 'reservation' && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-300 dark:border-border">
              <ActionButton
                actionType="claim"
                conversation={conversation}
                isActioned={isConversationClaimed(conversation)}
                canUseAction={canViewScreen(viewer, CHAT_ACTION_TO_SCREEN.claim)}
                onActionClick={handleActionClick}
              />
              <ActionButton
                actionType="review"
                conversation={conversation}
                isActioned={isConversationInReview(conversation)}
                canUseAction={canViewScreen(viewer, CHAT_ACTION_TO_SCREEN.review)}
                onActionClick={handleActionClick}
              />
              <ActionButton
                actionType="lost-found"
                conversation={conversation}
                isActioned={isConversationInLostFound(conversation)}
                canUseAction={canViewScreen(viewer, CHAT_ACTION_TO_SCREEN['lost-found'])}
                onActionClick={handleActionClick}
              />
              <ActionButton
                actionType="issues"
                conversation={conversation}
                isActioned={isConversationInIssues(conversation)}
                canUseAction={canViewScreen(viewer, CHAT_ACTION_TO_SCREEN.issues)}
                onActionClick={handleActionClick}
              />
              <ActionButton
                actionType="payment"
                conversation={conversation}
                isActioned={isConversationInPayments(conversation)}
                canUseAction={canViewScreen(viewer, CHAT_ACTION_TO_SCREEN.payment)}
                onActionClick={handleActionClick}
              />
              <ActionButton
                actionType="form"
                conversation={conversation}
                isActioned={isConversationInForms(conversation)}
                canUseAction={canViewScreen(viewer, CHAT_ACTION_TO_SCREEN.form)}
                onActionClick={handleActionClick}
              />
            </div>
          )}

          {/* Inquiry specific layout */}
          {conversation.type === 'inquiry' && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>
                    Inquiry: {conversationsApi.formatDateForDisplay((conversation as InquiryConversation).inquiryDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>
                    Dates: {(conversation as InquiryConversation).arrivalDate} - {(conversation as InquiryConversation).departureDate}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-neutral-400">Loading conversations...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const renderPagination = () => {
    if (total <= PAGE_SIZE) return null;
    const start = (currentPage - 1) * PAGE_SIZE + 1;
    const end = Math.min(currentPage * PAGE_SIZE, total);
    return (
      <div className="flex items-center justify-between mt-6">
        <p className="text-sm text-gray-600 dark:text-muted-foreground">
          Showing {start}–{end} of {total}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-700 dark:text-foreground px-2">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      {error && (
        <Card className="mb-6 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <SyncProgress job={syncJob} counts={syncCounts} syncing={syncing} />

      <div className="flex gap-6">
        {/* Enhanced Filter Sidebar */}
        <div className="w-72 flex-shrink-0">
          <Card className="sticky top-6 shadow-sm border-gray-200 dark:border-border">
            <CardHeader className="pb-4 border-b border-gray-200 dark:border-border bg-white dark:bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-foreground">Filters</CardTitle>
                </div>
                {(selectedMoods.length > 0 || showEarlyCheckin || showLateCheckout) && (
                  <button
                    onClick={() => {
                      setSelectedMoods([]);
                      setShowEarlyCheckin(false);
                      setShowLateCheckout(false);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
              <CardDescription className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                {selectedMoods.length === 0 && !showEarlyCheckin && !showLateCheckout
                  ? 'No filters applied'
                  : `${selectedMoods.length + (showEarlyCheckin ? 1 : 0) + (showLateCheckout ? 1 : 0)} active filter${(selectedMoods.length + (showEarlyCheckin ? 1 : 0) + (showLateCheckout ? 1 : 0)) > 1 ? 's' : ''}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* Special Requests Section */}
              <div className="border-b border-gray-100 dark:border-border">
                <div className="px-4 py-3 bg-white dark:bg-card">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400">Special Requests</h3>
                </div>
                <div className="p-3 space-y-2">
                  {/* Early Check-in Filter */}
                  <div
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all",
                      showEarlyCheckin
                        ? "bg-orange-50 border border-orange-200 shadow-sm dark:bg-orange-950/40 dark:border-orange-800/70 dark:shadow-none"
                        : "hover:bg-gray-50 dark:hover:bg-muted/50 border border-transparent"
                    )}
                    onClick={() => setShowEarlyCheckin(!showEarlyCheckin)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        showEarlyCheckin ? "bg-orange-100 dark:bg-orange-900/40" : "bg-gray-100 dark:bg-muted"
                      )}>
                        <span className="text-base">⏰</span>
                      </div>
                      <span className={cn(
                        "text-sm font-medium",
                        showEarlyCheckin ? "text-orange-900 dark:text-orange-300" : "text-gray-700 dark:text-neutral-300"
                      )}>Early Check-in</span>
                    </div>
                    <Badge
                      className={cn(
                        "text-xs font-semibold min-w-[24px] h-6 flex items-center justify-center",
                        showEarlyCheckin
                          ? "bg-orange-200 dark:bg-orange-900/60 text-orange-900 dark:text-orange-300 border-0"
                          : "bg-gray-200 dark:bg-secondary text-gray-600 dark:text-neutral-300 border-0"
                      )}
                    >
                      {moodStats?.earlyCheckin ?? 0}
                    </Badge>
                  </div>

                  {/* Late Check-out Filter */}
                  <div
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all",
                      showLateCheckout
                        ? "bg-blue-50 border border-blue-200 shadow-sm dark:bg-blue-950/45 dark:border-blue-800/70 dark:shadow-none"
                        : "hover:bg-gray-50 dark:hover:bg-muted/50 border border-transparent"
                    )}
                    onClick={() => setShowLateCheckout(!showLateCheckout)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        showLateCheckout ? "bg-blue-100 dark:bg-blue-900/40" : "bg-gray-100 dark:bg-muted"
                      )}>
                        <span className="text-base">🕐</span>
                      </div>
                      <span className={cn(
                        "text-sm font-medium",
                        showLateCheckout ? "text-blue-900 dark:text-blue-300" : "text-gray-700 dark:text-neutral-300"
                      )}>Late Check-out</span>
                    </div>
                    <Badge
                      className={cn(
                        "text-xs font-semibold min-w-[24px] h-6 flex items-center justify-center",
                        showLateCheckout
                          ? "bg-blue-200 dark:bg-blue-900/60 text-blue-900 dark:text-blue-300 border-0"
                          : "bg-gray-200 dark:bg-secondary text-gray-600 dark:text-neutral-300 border-0"
                      )}
                    >
                      {moodStats?.lateCheckout ?? 0}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Mood Filter Section */}
              <div>
                <div className="px-4 py-3 bg-white dark:bg-card">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-400">Filter by Mood</h3>
                </div>
                <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
                  {moodLabelStats.map(({ label: mood, count, rawMoods }) => {
                    const isSelected = selectedMoods.includes(mood);
                    const moodConfig = getMoodConfig(rawMoods[0]);

                    return (
                      <div
                        key={mood}
                        className={cn(
                          "flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all",
                          isSelected
                            ? "bg-blue-50 border border-blue-200 shadow-sm dark:bg-blue-950/45 dark:border-blue-800/70 dark:shadow-none"
                            : "hover:bg-gray-50 dark:hover:bg-muted/50 border border-transparent"
                        )}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedMoods(prev => prev.filter(m => m !== mood));
                          } else {
                            setSelectedMoods(prev => [...prev, mood]);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            isSelected ? moodConfig?.className : "bg-gray-100 dark:bg-muted"
                          )}>
                            <span className="text-base">{moodConfig?.icon || '💭'}</span>
                          </div>
                          <span className={cn(
                            "text-sm font-medium",
                            isSelected ? "text-blue-900 dark:text-blue-300" : "text-gray-700 dark:text-neutral-300"
                          )}>{mood}</span>
                        </div>
                        <Badge
                          className={cn(
                            "text-xs font-semibold min-w-[24px] h-6 flex items-center justify-center",
                            isSelected
                              ? "bg-blue-200 dark:bg-blue-900/60 text-blue-900 dark:text-blue-300 border-0"
                              : "bg-gray-200 dark:bg-secondary text-gray-600 dark:text-neutral-300 border-0"
                          )}
                        >
                          {count}
                        </Badge>
                      </div>
                    );
                  })}

                  {moodLabelStats.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-muted flex items-center justify-center mx-auto mb-3">
                        <svg className="h-6 w-6 text-gray-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-foreground mb-1">No mood data available</p>
                      <p className="text-xs text-gray-500 dark:text-neutral-400">
                        Sync conversations to see mood analysis
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conversations List */}
        <div className="flex-1 min-w-0">
          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-neutral-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by guest name, email or property…"
              className="pl-9 pr-9"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                All ({(moodStats?.totals.reservations ?? 0) + (moodStats?.totals.inquiries ?? 0)})
              </TabsTrigger>
              <TabsTrigger value="reservations">
                Reservations ({moodStats?.totals.reservations ?? 0})
              </TabsTrigger>
              <TabsTrigger value="inquiries">
                Inquiries ({moodStats?.totals.inquiries ?? 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="space-y-4">
                {conversations.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <MessageCircle className="h-12 w-12 text-gray-400 dark:text-neutral-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">
                        No conversations found
                      </h3>
                      <p className="text-gray-600 dark:text-neutral-400 mb-4">
                        No conversations available. Try syncing from Hospitable.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {conversations.map(renderConversationCard)}
                    {renderPagination()}
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="reservations" className="mt-6">
              <div className="space-y-4">
                {conversations.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <MessageCircle className="h-12 w-12 text-gray-400 dark:text-neutral-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">
                        No reservations found
                      </h3>
                      <p className="text-gray-600">
                        No reservations available.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {conversations.map(renderConversationCard)}
                    {renderPagination()}
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="inquiries" className="mt-6">
              <div className="space-y-4">
                {conversations.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <MessageCircle className="h-12 w-12 text-gray-400 dark:text-neutral-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">
                        No inquiries found
                      </h3>
                      <p className="text-gray-600 dark:text-neutral-400">No inquiries available.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {conversations.map(renderConversationCard)}
                    {renderPagination()}
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {/* Universal Action Modal */}
      {showModal && selectedConversation && (modalActionType === 'claim' || modalActionType === 'review' || modalActionType === 'lost-found') && (
        <ClaimChatModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedConversation(null);
          }}
          actionType={modalActionType}
          reservationData={getReservationData(selectedConversation)}
        />
      )}

      {showModal && selectedConversation && modalActionType === 'issues' && (
        <IssuesModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedConversation(null);
            loadConversations(); // Reload to update badges
          }}
          reservationData={getReservationData(selectedConversation)}
        />
      )}

      {showModal && selectedConversation && modalActionType === 'payment' && (
        <PendingPaymentModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedConversation(null);
            loadConversations(); // Reload to update badges
          }}
          reservationData={getReservationData(selectedConversation)}
        />
      )}

      {showModal && selectedConversation && modalActionType === 'form' && (
        <FormCollectionModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedConversation(null);
            loadConversations(); // Reload to update badges
          }}
          reservationData={getReservationData(selectedConversation)}
        />
      )}
    </div>
  );
}