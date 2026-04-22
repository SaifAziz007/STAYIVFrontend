'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { claimedChatsApi, ClaimedChat, ImageAttachment } from '@/lib/claimed-chats-api';
import { Flag, Loader2, AlertCircle, Calendar, Users, ExternalLink, FileIcon, Trash2, Image as ImageIcon, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageGalleryModal } from '@/components/image-gallery-modal';
import { cn } from '@/lib/utils';
import { isSameDay } from 'date-fns';
import { usePageHeader } from '@/components/layout/page-header-context';
import { resolvePropertyNameFromRecord } from '@/lib/reservation-property-display';

export default function ClaimedChatsPage() {
  const { toast } = useToast();
  const [claimedChats, setClaimedChats] = useState<ClaimedChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved' | 'closed'>('all');
  const [selectedDueDate, setSelectedDueDate] = useState<Date | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    loadClaimedChats();
  }, []);

  const loadClaimedChats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await claimedChatsApi.getClaimedChats();
      console.log('Claimed chats:', data);
      setClaimedChats(data);
    } catch (error: any) {
      console.error('Failed to load claimed chats:', error);
      setError('Failed to load claimed chats. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this claimed chat?')) {
      return;
    }

    try {
      await claimedChatsApi.deleteClaimedChat(id);
      toast({
        title: 'Success!',
        description: 'Claimed chat deleted successfully.',
      });
      loadClaimedChats();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete claimed chat.',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await claimedChatsApi.updateClaimedChatStatus(id, newStatus);
      toast({
        title: 'Success!',
        description: 'Status updated successfully.',
      });
      loadClaimedChats();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update status.',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/45 dark:text-yellow-300 border-0';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-950/45 dark:text-green-300 border-0';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-muted dark:text-muted-foreground border-0';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/45 dark:text-blue-300 border-0';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'airbnb':
        return 'bg-red-100 text-red-700 dark:bg-red-950/45 dark:text-red-300 border-0';
      case 'booking':
      case 'booking.com':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/45 dark:text-blue-300 border-0';
      case 'vrbo':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/45 dark:text-yellow-300 border-0';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-muted dark:text-muted-foreground border-0';
    }
  };

  // Helper to convert base64 to data URL
  const getImageDataUrl = (attachment: ImageAttachment): string => {
    return `data:${attachment.type};base64,${attachment.data}`;
  };

  const handleImageClick = (attachments: ImageAttachment[], index: number) => {
    // Convert base64 attachments to data URLs
    const dataUrls = attachments.map(att => getImageDataUrl(att));
    setSelectedImages(dataUrls);
    setSelectedImageIndex(index);
    setGalleryOpen(true);
  };

  // Check if a claim is due on a specific date (departure date + 13 days = selected date)
  const isDueOnDate = (departureDate: string, targetDate: Date): boolean => {
    const departure = new Date(departureDate);
    const dueDate = new Date(departure);
    dueDate.setDate(dueDate.getDate() + 13);

    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    return dueDate.getTime() === target.getTime();
  };

  // Filter claimed chats by status
  let filteredClaimedChats = statusFilter === 'all'
    ? claimedChats
    : claimedChats.filter(chat => chat.status === statusFilter);

  // Apply due date filter if a date is selected
  if (selectedDueDate) {
    filteredClaimedChats = filteredClaimedChats.filter(chat => isDueOnDate(chat.departureDate, selectedDueDate));
  }

  // Count by status
  const statusCounts = {
    all: claimedChats.length,
    pending: claimedChats.filter(c => c.status === 'pending').length,
    resolved: claimedChats.filter(c => c.status === 'resolved').length,
    closed: claimedChats.filter(c => c.status === 'closed').length,
  };

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const claimedHeaderActions = useMemo(() => {
    if (loading) return null;
    return (
      <div className="flex flex-wrap items-center gap-3 px-4 py-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-800/60 max-w-full">
        <Flag className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
        <span className="text-2xl font-bold text-gray-900 dark:text-foreground">{filteredClaimedChats.length}</span>
        <span className="text-gray-600 dark:text-muted-foreground text-sm font-medium">
          {selectedDueDate
            ? `Claims Due on ${formatDisplayDate(selectedDueDate)}`
            : statusFilter === 'all'
              ? 'Total Claims'
              : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Claims`}
        </span>
      </div>
    );
  }, [loading, filteredClaimedChats.length, selectedDueDate, statusFilter]);

  usePageHeader({
    title: 'Claimed Chats',
    description: 'Manage and track your claimed reservations',
    actions: claimedHeaderActions,
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mb-4" />
        <p className="text-gray-600 dark:text-muted-foreground">Loading claimed chats...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Status Filter Tabs — single bottom border; tabs use transparent bg so the line stays continuous */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-border">
          <nav className="flex flex-wrap gap-x-6 gap-y-1" aria-label="Tabs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={cn(
                'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors -mb-px bg-transparent',
                statusFilter === 'all'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-muted-foreground dark:hover:text-foreground dark:hover:border-border'
              )}
            >
              All
              <span
                className={cn(
                  'ml-2 py-0.5 px-2.5 rounded-full text-xs',
                  statusFilter === 'all'
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/55 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-muted dark:text-muted-foreground'
                )}
              >
                {statusCounts.all}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={cn(
                'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors -mb-px bg-transparent',
                statusFilter === 'pending'
                  ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-muted-foreground dark:hover:text-foreground dark:hover:border-border'
              )}
            >
              Pending
              <span
                className={cn(
                  'ml-2 py-0.5 px-2.5 rounded-full text-xs',
                  statusFilter === 'pending'
                    ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-950/55 dark:text-yellow-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-muted dark:text-muted-foreground'
                )}
              >
                {statusCounts.pending}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('resolved')}
              className={cn(
                'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors -mb-px bg-transparent',
                statusFilter === 'resolved'
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-muted-foreground dark:hover:text-foreground dark:hover:border-border'
              )}
            >
              Resolved
              <span
                className={cn(
                  'ml-2 py-0.5 px-2.5 rounded-full text-xs',
                  statusFilter === 'resolved'
                    ? 'bg-green-100 text-green-600 dark:bg-green-950/50 dark:text-green-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-muted dark:text-muted-foreground'
                )}
              >
                {statusCounts.resolved}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('closed')}
              className={cn(
                'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors -mb-px bg-transparent',
                statusFilter === 'closed'
                  ? 'border-gray-500 text-gray-700 dark:border-neutral-500 dark:text-neutral-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-muted-foreground dark:hover:text-foreground dark:hover:border-border'
              )}
            >
              Closed
              <span
                className={cn(
                  'ml-2 py-0.5 px-2.5 rounded-full text-xs',
                  statusFilter === 'closed'
                    ? 'bg-gray-200 text-gray-700 dark:bg-muted dark:text-muted-foreground'
                    : 'bg-gray-100 text-gray-600 dark:bg-muted dark:text-muted-foreground'
                )}
              >
                {statusCounts.closed}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Date Filter Sub-tab */}
      <Card className="mb-6 border-gray-200 dark:border-border">
        <CardHeader>
          <CardTitle className="text-base text-card-foreground">Filter by Due Date</CardTitle>
          <CardDescription>
            Select a date to view claims due to be filed on that date (departure date + 13 days)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !selectedDueDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {selectedDueDate ? formatDisplayDate(selectedDueDate) : "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={selectedDueDate || undefined}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDueDate(date);
                      setIsCalendarOpen(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button
              variant={selectedDueDate && isSameDay(selectedDueDate, new Date()) ? "default" : "outline"}
              onClick={() => setSelectedDueDate(new Date())}
              className={cn(
                "flex items-center gap-2",
                selectedDueDate && isSameDay(selectedDueDate, new Date())
                  ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                  : "text-blue-600 border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950/45"
              )}
            >
              <Calendar className="h-4 w-4" />
              Today
            </Button>

            {selectedDueDate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDueDate(null)}
                className="text-gray-600 hover:text-gray-900 dark:text-muted-foreground dark:hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filter
              </Button>
            )}

            {selectedDueDate && (
              <div className="text-sm text-gray-600 dark:text-muted-foreground">
                {filteredClaimedChats.length} claim{filteredClaimedChats.length !== 1 ? 's' : ''} due on this date
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/25">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-200">Error</p>
                <p className="text-sm text-red-700 dark:text-red-300/90">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredClaimedChats.length === 0 ? (
        <Card className="border-gray-200 dark:border-border">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-2xl mb-6">
              <Flag className="h-16 w-16 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground mb-2">
              {statusFilter === 'all' ? 'No claimed chats yet' : `No ${statusFilter} chats`}
            </h2>
            <p className="text-gray-600 dark:text-muted-foreground text-center max-w-md">
              {selectedDueDate
                ? `No claims are due on ${formatDisplayDate(selectedDueDate)} (departure date + 13 days).`
                : statusFilter === 'all'
                  ? 'When you claim a reservation, it will appear here for tracking and management.'
                  : `No claimed chats with status "${statusFilter}" at the moment.`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredClaimedChats.map((chat) => {
            const propertyLabel = resolvePropertyNameFromRecord(chat);
            return (
            <Card key={chat.id} className="hover:shadow-md transition-shadow border-gray-200 dark:border-border">
              <CardHeader>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <Badge className={getPlatformColor(chat.platform)}>
                        {chat.platform.toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(chat.status)}>
                        {chat.status.toUpperCase()}
                      </Badge>
                      {chat.reservationCode && (
                        <span className="text-sm text-gray-600 dark:text-muted-foreground font-mono">
                          {chat.reservationCode}
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-xl text-card-foreground">{chat.guestName}</CardTitle>
                    <CardDescription className="mt-2 text-muted-foreground">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {formatDate(chat.arrivalDate)} - {formatDate(chat.departureDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{chat.numberOfGuests} guests</span>
                        </div>
                        {propertyLabel && (
                          <span className="text-sm">📍 {propertyLabel}</span>
                        )}
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={chat.status}
                      onChange={(e) => handleStatusChange(chat.id, e.target.value)}
                      className="text-sm border border-gray-300 dark:border-border rounded px-2 py-1 bg-white dark:bg-card text-foreground"
                    >
                      <option value="pending">Pending</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(chat.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Contact Information */}
                  {(chat.guestEmail || chat.guestPhone) && (
                    <div className="bg-gray-50 dark:bg-muted rounded-lg p-4 border border-transparent dark:border-border/60">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-foreground mb-2">
                        Contact Information
                      </h4>
                      <div className="space-y-1 text-sm">
                        {chat.guestEmail && (
                          <p className="text-gray-700 dark:text-neutral-300">
                            <span className="font-medium text-foreground">Email:</span> {chat.guestEmail}
                          </p>
                        )}
                        {chat.guestPhone && (
                          <p className="text-gray-700 dark:text-neutral-300">
                            <span className="font-medium text-foreground">Phone:</span> {chat.guestPhone}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Claim Details */}
                  {(chat.claimReason || chat.notes) && (
                    <div className="bg-blue-50 dark:bg-blue-950/35 rounded-lg p-4 border border-blue-100/80 dark:border-blue-900/50">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-foreground mb-2">
                        Claim Details
                      </h4>
                      {chat.claimReason && (
                        <p className="text-sm text-gray-700 dark:text-neutral-300 mb-2">
                          <span className="font-medium text-foreground">Reason:</span> {chat.claimReason}
                        </p>
                      )}
                      {chat.notes && (
                        <p className="text-sm text-gray-700 dark:text-neutral-300">
                          <span className="font-medium text-foreground">Notes:</span> {chat.notes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Attachments */}
                  {/* Attachments */}
                  {chat.attachments && Array.isArray(chat.attachments) && chat.attachments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-foreground mb-3 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Attachments ({chat.attachments.length})
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        {(chat.attachments || []).map((attachment, index) => (
                          <button
                            key={index}
                            onClick={() => handleImageClick(chat.attachments || [], index)}
                            className="group relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 dark:border-border hover:border-blue-300 dark:hover:border-blue-500"
                          >
                            <img
                              src={getImageDataUrl(attachment)}
                              alt={attachment.name || `Attachment ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Meta Information */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-muted-foreground pt-2 border-t border-gray-200 dark:border-border">
                    <span>Claimed on {formatDate(chat.createdAt)}</span>
                    <span>Last updated {formatDate(chat.updatedAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      {/* Image Gallery Modal */}
      <ImageGalleryModal
        images={selectedImages}
        initialIndex={selectedImageIndex}
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
      />
    </div>
  );
}

