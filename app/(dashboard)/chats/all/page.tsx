'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, MessageCircle, Calendar, Users, MapPin, RefreshCw, AlertCircle, Flag, AlertTriangle, Search, Home, FileText, DollarSign, Upload } from 'lucide-react';
import { conversationsApi, type Conversation, type ReservationConversation, type InquiryConversation } from '@/lib/conversations-api';
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


export default function AllChatsPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
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

  // Mood configuration helper
  const getMoodConfig = (mood: string | null) => {
    if (!mood) return null;

    const moodLower = mood.toLowerCase().trim();

    const moodConfigs: Record<string, { label: string; className: string; icon: string }> = {
      // Positive moods
      'happy': {
        label: 'Happy',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: '😊'
      },
      'excited': {
        label: 'Excited',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: '🤩'
      },
      'satisfied': {
        label: 'Satisfied',
        className: 'bg-green-50 text-green-700 border-green-200',
        icon: '😌'
      },
      'pleased': {
        label: 'Pleased',
        className: 'bg-teal-50 text-teal-700 border-teal-200',
        icon: '😊'
      },
      'grateful': {
        label: 'Grateful',
        className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        icon: '🙏'
      },

      // Neutral moods
      'neutral': {
        label: 'Neutral',
        className: 'bg-gray-50 text-gray-700 border-gray-200',
        icon: '😐'
      },
      'calm': {
        label: 'Calm',
        className: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: '😌'
      },
      'curious': {
        label: 'Curious',
        className: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: '🤔'
      },

      // Negative moods
      'frustrated': {
        label: 'Frustrated',
        className: 'bg-orange-50 text-orange-700 border-orange-200',
        icon: '😤'
      },
      'disappointed': {
        label: 'Disappointed',
        className: 'bg-red-50 text-red-700 border-red-200',
        icon: '😞'
      },
      'concerned': {
        label: 'Concerned',
        className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        icon: '😟'
      },
      'angry': {
        label: 'Angry',
        className: 'bg-red-100 text-red-800 border-red-300',
        icon: '😠'
      },
      'confused': {
        label: 'Confused',
        className: 'bg-slate-50 text-slate-700 border-slate-200',
        icon: '😕'
      },

      // Professional moods
      'polite': {
        label: 'Polite',
        className: 'bg-sky-50 text-sky-700 border-sky-200',
        icon: '🙂'
      },
      'professional': {
        label: 'Professional',
        className: 'bg-slate-50 text-slate-700 border-slate-200',
        icon: '💼'
      },
      'friendly': {
        label: 'Friendly',
        className: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: '😄'
      }
    };

    // Find exact match first
    if (moodLower in moodConfigs) {
      return moodConfigs[moodLower];
    }

    // Find partial matches
    for (const [key, config] of Object.entries(moodConfigs)) {
      if (moodLower.includes(key) || key.includes(moodLower)) {
        return config;
      }
    }

    // Default fallback for unknown moods
    return {
      label: mood.charAt(0).toUpperCase() + mood.slice(1),
      className: 'bg-gray-50 text-gray-600 border-gray-200',
      icon: '💭'
    };
  };

  // Get mood statistics
  const getMoodStats = () => {
    const moodCounts: Record<string, number> = {};

    conversations
      .filter(c => c.type === 'reservation')
      .forEach(conversation => {
        const reservation = conversation as ReservationConversation;
        if (reservation.mood) {
          const moodConfig = getMoodConfig(reservation.mood);
          if (moodConfig) {
            const moodKey = moodConfig.label;
            moodCounts[moodKey] = (moodCounts[moodKey] || 0) + 1;
          }
        }
      });

    return Object.entries(moodCounts)
      .map(([mood, count]) => ({ mood, count }))
      .sort((a, b) => b.count - a.count);
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load conversations
      const conversationsResponse = await conversationsApi.getConversations(1, 100);
      const conversations = conversationsResponse.data;
      setConversations(conversations);

      // Load all reservation IDs in parallel
      try {
        const [claimedIds, reviewIds, lostFoundIds, issueIds, paymentIds, formIds] = await Promise.all([
          claimedChatsApi.getClaimedReservationIds().catch(() => []),
          reviewRemovalApi.getReviewRemovalReservationIds().catch(() => []),
          lostAndFoundApi.getLostAndFoundReservationIds().catch(() => []),
          issuesApi.getIssueReservationIds().catch(() => []),
          pendingPaymentsApi.getPaymentReservationIds().catch(() => []),
          formCollectionApi.getFormCollectionReservationIds().catch(() => [])
        ]);

        setClaimedReservationIds(claimedIds || []);
        setReviewRemovalReservationIds(reviewIds || []);
        setLostAndFoundReservationIds(lostFoundIds || []);
        setIssuesReservationIds(issueIds || []);
        setPaymentReservationIds(paymentIds || []);
        setFormCollectionReservationIds(formIds || []);
      } catch (error) {
        console.error('Failed to load reservation IDs:', error);
        // Set empty arrays if loading fails
        setClaimedReservationIds([]);
        setReviewRemovalReservationIds([]);
        setLostAndFoundReservationIds([]);
        setIssuesReservationIds([]);
        setPaymentReservationIds([]);
        setFormCollectionReservationIds([]);
      }

    } catch (error: any) {
      console.error('Failed to load conversations:', error);
      setError('Failed to load conversations. Please try again.');
    } finally {
      setLoading(false);
    }
  };
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
    onActionClick
  }: {
    actionType: 'claim' | 'review' | 'lost-found' | 'issues' | 'payment' | 'form';
    conversation: Conversation;
    isActioned: boolean;
    onActionClick: (actionType: 'claim' | 'review' | 'lost-found' | 'issues' | 'payment' | 'form', conversation: ReservationConversation) => void;
  }) => {
    const config = {
      claim: {
        icon: Flag,
        activeText: 'Claim',
        actionedText: 'Claimed',
        activeClass: 'text-blue-600 border-blue-200 hover:bg-blue-50',
        actionedClass: 'text-gray-500 border-gray-300 cursor-not-allowed'
      },
      review: {
        icon: AlertTriangle,
        activeText: 'Review',
        actionedText: 'In Review',
        activeClass: 'text-orange-600 border-orange-200 hover:bg-orange-50',
        actionedClass: 'text-gray-500 border-gray-300 cursor-not-allowed'
      },
      'lost-found': {
        icon: Search,
        activeText: 'Lost & Found',
        actionedText: 'Reported',
        activeClass: 'text-purple-600 border-purple-200 hover:bg-purple-50',
        actionedClass: 'text-gray-500 border-gray-300 cursor-not-allowed'
      },
      'issues': {
        icon: FileText,
        activeText: 'Open Issues',
        actionedText: 'Issue Logged',
        activeClass: 'text-red-600 border-red-200 hover:bg-red-50',
        actionedClass: 'text-gray-500 border-gray-300 cursor-not-allowed'
      },
      'payment': {
        icon: DollarSign,
        activeText: 'Pending Payment',
        actionedText: 'Payment Logged',
        activeClass: 'text-green-600 border-green-200 hover:bg-green-50',
        actionedClass: 'text-gray-500 border-gray-300 cursor-not-allowed'
      },
      'form': {
        icon: Upload,
        activeText: 'Form Collection',
        actionedText: 'Form Collected',
        activeClass: 'text-indigo-600 border-indigo-200 hover:bg-indigo-50',
        actionedClass: 'text-gray-500 border-gray-300 cursor-not-allowed'
      }
    };

    const { icon: Icon, activeText, actionedText, activeClass, actionedClass } = config[actionType];

    return (
      <Button
        size="sm"
        variant={isActioned ? "secondary" : "outline"}
        className={isActioned ? actionedClass : activeClass}
        disabled={isActioned}
        onClick={(e) => {
          e.stopPropagation();
          if (!isActioned) {
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
      propertyName: 'Property', // This would come from property data if available
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

  const handleSyncConversations = async () => {
    try {
      setSyncing(true);
      setError(null);

      const syncResult = await conversationsApi.syncConversations();
      console.log('Sync result:', syncResult);

      await loadConversations(); // Reload after sync

      // Show success message with counts
      if (syncResult.data?.synced) {
        const { reservations, inquiries, messages } = syncResult.data.synced;
        console.log(`Sync completed: ${reservations} reservations, ${inquiries} inquiries, ${messages} messages`);

        if (reservations === 0 && inquiries === 0) {
          setError('Sync completed but no conversations were found. This might be because all your conversations are older than 6 months or in the future beyond 2 years.');
        }
      }
    } catch (error: any) {
      console.error('Error syncing conversations:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to sync conversations. Please try again.';
      setError(errorMessage);
    } finally {
      setSyncing(false);
    }
  };

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


  const getFilteredConversations = () => {
    let filtered = conversations;

    // Filter by tab
    switch (activeTab) {
      case 'reservations':
        filtered = filtered.filter(conv => conv.type === 'reservation');
        break;
      case 'inquiries':
        filtered = filtered.filter(conv => conv.type === 'inquiry');
        break;
      default:
        break;
    }

    // Filter by mood (only for reservations)
    if (selectedMoods.length > 0) {
      filtered = filtered.filter(conversation => {
        if (conversation.type !== 'reservation') return true;

        const reservation = conversation as ReservationConversation;
        if (!reservation.mood) return false;

        const moodConfig = getMoodConfig(reservation.mood);
        return moodConfig && selectedMoods.includes(moodConfig.label);
      });
    }

    // Filter by early check-in
    if (showEarlyCheckin) {
      filtered = filtered.filter(conversation => {
        if (conversation.type !== 'reservation') return false;
        return (conversation as ReservationConversation).earlyCheckin === true;
      });
    }

    // Filter by late check-out
    if (showLateCheckout) {
      filtered = filtered.filter(conversation => {
        if (conversation.type !== 'reservation') return false;
        return (conversation as ReservationConversation).lateCheckout === true;
      });
    }

    return filtered;
  };




  const renderConversationCard = (conversation: Conversation) => {
    const guest = conversationsApi.parseGuestData(conversation.guestData);
    const guests = conversationsApi.parseGuestsData(conversation.guestsData);
    const guestName = guest ? `${guest.first_name} ${guest.last_name || ''}`.trim() : 'Guest';
    const guestSummary = conversationsApi.getGuestSummary(conversation.guestsData);

    return (
      <Card
        key={conversation.id}
        className="hover:shadow-lg transition-all cursor-pointer border border-gray-200 bg-white"
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
                  <h3 className="font-bold text-gray-900 text-base">{guestName}</h3>
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
                    <Home className="h-3.5 w-3.5 text-gray-600" />
                    <span className="text-sm text-gray-700 font-medium">
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
                  <Badge className="text-xs bg-gray-200 text-gray-700 border-0 font-medium">
                    {conversation.type}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="text-right text-sm">
              {conversation.lastMessageAt && (
                <div>
                  <div className="font-semibold text-gray-900">{conversationsApi.formatDateForDisplay(conversation.lastMessageAt)}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{conversationsApi.formatTimeForDisplay(conversation.lastMessageAt)}</div>
                </div>
              )}
            </div>
          </div>

          {/* Check-in/Check-out Section */}
          {conversation.type === 'reservation' && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3.5 border border-green-200 shadow-sm">
                <div className="flex items-center gap-2 text-green-700 mb-1.5">
                  <Calendar className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wide">Check-in</span>
                </div>
                <div className="font-bold text-gray-900 text-base">
                  {conversationsApi.formatDateForDisplay((conversation as ReservationConversation).arrivalDate)}
                </div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-3.5 border border-red-200 shadow-sm">
                <div className="flex items-center gap-2 text-red-700 mb-1.5">
                  <Calendar className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wide">Check-out</span>
                </div>
                <div className="font-bold text-gray-900 text-base">
                  {conversationsApi.formatDateForDisplay((conversation as ReservationConversation).departureDate)}
                </div>
              </div>
            </div>
          )}

          {/* Details Section */}
          <div className="flex items-center gap-6 mb-4 text-sm text-gray-700">
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
              <Users className="h-4 w-4 text-gray-500" />
              <span className="font-semibold text-gray-700">{guestSummary}</span>
            </div>
            {guest?.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
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
            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-300">
              <ActionButton
                actionType="claim"
                conversation={conversation}
                isActioned={isConversationClaimed(conversation)}
                onActionClick={handleActionClick}
              />
              <ActionButton
                actionType="review"
                conversation={conversation}
                isActioned={isConversationInReview(conversation)}
                onActionClick={handleActionClick}
              />
              <ActionButton
                actionType="lost-found"
                conversation={conversation}
                isActioned={isConversationInLostFound(conversation)}
                onActionClick={handleActionClick}
              />
              <ActionButton
                actionType="issues"
                conversation={conversation}
                isActioned={isConversationInIssues(conversation)}
                onActionClick={handleActionClick}
              />
              <ActionButton
                actionType="payment"
                conversation={conversation}
                isActioned={isConversationInPayments(conversation)}
                onActionClick={handleActionClick}
              />
              <ActionButton
                actionType="form"
                conversation={conversation}
                isActioned={isConversationInForms(conversation)}
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
            <p className="text-gray-600">Loading conversations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Latest Conversations</h1>
          <p className="text-gray-600 mt-1">
            All recent inquiries and reservations from your properties
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSyncConversations}
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

        </div>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-6">
        {/* Enhanced Filter Sidebar */}
        <div className="w-72 flex-shrink-0">
          <Card className="sticky top-6 shadow-sm border-gray-200">
            <CardHeader className="pb-4 border-b bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <CardTitle className="text-lg font-bold text-gray-900">Filters</CardTitle>
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
              <CardDescription className="text-xs text-gray-500 mt-1">
                {selectedMoods.length === 0 && !showEarlyCheckin && !showLateCheckout
                  ? 'No filters applied'
                  : `${selectedMoods.length + (showEarlyCheckin ? 1 : 0) + (showLateCheckout ? 1 : 0)} active filter${(selectedMoods.length + (showEarlyCheckin ? 1 : 0) + (showLateCheckout ? 1 : 0)) > 1 ? 's' : ''}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* Special Requests Section */}
              <div className="border-b border-gray-100">
                <div className="px-4 py-3 bg-white">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Special Requests</h3>
                </div>
                <div className="p-3 space-y-2">
                  {/* Early Check-in Filter */}
                  <div
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all",
                      showEarlyCheckin
                        ? "bg-orange-50 border border-orange-200 shadow-sm"
                        : "hover:bg-gray-50 border border-transparent"
                    )}
                    onClick={() => setShowEarlyCheckin(!showEarlyCheckin)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        showEarlyCheckin ? "bg-orange-100" : "bg-gray-100"
                      )}>
                        <span className="text-base">⏰</span>
                      </div>
                      <span className={cn(
                        "text-sm font-medium",
                        showEarlyCheckin ? "text-orange-900" : "text-gray-700"
                      )}>Early Check-in</span>
                    </div>
                    <Badge
                      className={cn(
                        "text-xs font-semibold min-w-[24px] h-6 flex items-center justify-center",
                        showEarlyCheckin 
                          ? "bg-orange-200 text-orange-900 border-0" 
                          : "bg-gray-200 text-gray-600 border-0"
                      )}
                    >
                      {conversations.filter(c =>
                        c.type === 'reservation' && (c as ReservationConversation).earlyCheckin
                      ).length}
                    </Badge>
                  </div>

                  {/* Late Check-out Filter */}
                  <div
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all",
                      showLateCheckout
                        ? "bg-blue-50 border border-blue-200 shadow-sm"
                        : "hover:bg-gray-50 border border-transparent"
                    )}
                    onClick={() => setShowLateCheckout(!showLateCheckout)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        showLateCheckout ? "bg-blue-100" : "bg-gray-100"
                      )}>
                        <span className="text-base">🕐</span>
                      </div>
                      <span className={cn(
                        "text-sm font-medium",
                        showLateCheckout ? "text-blue-900" : "text-gray-700"
                      )}>Late Check-out</span>
                    </div>
                    <Badge
                      className={cn(
                        "text-xs font-semibold min-w-[24px] h-6 flex items-center justify-center",
                        showLateCheckout 
                          ? "bg-blue-200 text-blue-900 border-0" 
                          : "bg-gray-200 text-gray-600 border-0"
                      )}
                    >
                      {conversations.filter(c =>
                        c.type === 'reservation' && (c as ReservationConversation).lateCheckout
                      ).length}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Mood Filter Section */}
              <div>
                <div className="px-4 py-3 bg-white">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Filter by Mood</h3>
                </div>
                <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
                  {getMoodStats().map(({ mood, count }) => {
                    const isSelected = selectedMoods.includes(mood);
                    const moodConfig = getMoodConfig(mood.toLowerCase());

                    return (
                      <div
                        key={mood}
                        className={cn(
                          "flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all",
                          isSelected
                            ? "bg-blue-50 border border-blue-200 shadow-sm"
                            : "hover:bg-gray-50 border border-transparent"
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
                            isSelected ? moodConfig?.className : "bg-gray-100"
                          )}>
                            <span className="text-base">{moodConfig?.icon || '💭'}</span>
                          </div>
                          <span className={cn(
                            "text-sm font-medium",
                            isSelected ? "text-blue-900" : "text-gray-700"
                          )}>{mood}</span>
                        </div>
                        <Badge
                          className={cn(
                            "text-xs font-semibold min-w-[24px] h-6 flex items-center justify-center",
                            isSelected 
                              ? "bg-blue-200 text-blue-900 border-0" 
                              : "bg-gray-200 text-gray-600 border-0"
                          )}
                        >
                          {count}
                        </Badge>
                      </div>
                    );
                  })}

                  {getMoodStats().length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                        <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-1">No mood data available</p>
                      <p className="text-xs text-gray-500">
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
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                All ({conversations.length})
              </TabsTrigger>
              <TabsTrigger value="reservations">
                Reservations ({conversations.filter(c => c.type === 'reservation').length})
              </TabsTrigger>
              <TabsTrigger value="inquiries">
                Inquiries ({conversations.filter(c => c.type === 'inquiry').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="space-y-4">
                {getFilteredConversations().length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No conversations found
                      </h3>
                      <p className="text-gray-600 mb-4">
                        No conversations available. Try syncing from Hospitable.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  getFilteredConversations().map(renderConversationCard)
                )}
              </div>
            </TabsContent>

            <TabsContent value="reservations" className="mt-6">
              <div className="space-y-4">
                {getFilteredConversations().length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No reservations found
                      </h3>
                      <p className="text-gray-600">
                        No reservations available.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  getFilteredConversations().map(renderConversationCard)
                )}
              </div>
            </TabsContent>

            <TabsContent value="inquiries" className="mt-6">
              <div className="space-y-4">
                {getFilteredConversations().length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No inquiries found
                      </h3>
                      <p className="text-gray-600">No inquiries available.</p>
                    </CardContent>
                  </Card>
                ) : (
                  getFilteredConversations().map(renderConversationCard)
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