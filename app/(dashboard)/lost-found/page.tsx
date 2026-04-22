'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { lostAndFoundApi, LostAndFound, ImageAttachment } from '@/lib/lost-found-api';
import { Package, Loader2, AlertCircle, Calendar, Users, Trash2, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageGalleryModal } from '@/components/image-gallery-modal';
import { cn } from '@/lib/utils';
import { usePageHeader } from '@/components/layout/page-header-context';
import { resolvePropertyNameFromRecord } from '@/lib/reservation-property-display';

export default function LostAndFoundPage() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<LostAndFound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved' | 'returned'>('all');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await lostAndFoundApi.getLostAndFoundEntries();
      console.log('Lost & Found entries:', data);
      setEntries(data);
    } catch (error: any) {
      console.error('Failed to load lost & found entries:', error);
      setError('Failed to load lost & found entries. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lost & found entry?')) {
      return;
    }

    try {
      await lostAndFoundApi.deleteLostAndFound(id);
      toast({
        title: 'Success!',
        description: 'Lost & Found entry deleted successfully.',
      });
      loadEntries();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete lost & found entry.',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await lostAndFoundApi.updateLostAndFoundStatus(id, newStatus);
      toast({
        title: 'Success!',
        description: 'Status updated successfully.',
      });
      loadEntries();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update status.',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
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
      case 'returned':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/45 dark:text-blue-300 border-0';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-muted dark:text-muted-foreground border-0';
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

  const handleImageClick = (attachments: ImageAttachment[] | undefined, index: number) => {
    if (!attachments || attachments.length === 0) return;
    // Convert base64 attachments to data URLs
    const dataUrls = attachments.map(att => getImageDataUrl(att));
    setSelectedImages(dataUrls);
    setSelectedImageIndex(index);
    setGalleryOpen(true);
  };

  // Filter entries by status
  const filteredEntries = statusFilter === 'all' 
    ? entries 
    : entries.filter(entry => entry.status === statusFilter);

  // Count by status
  const statusCounts = {
    all: entries.length,
    pending: entries.filter(e => e.status === 'pending').length,
    resolved: entries.filter(e => e.status === 'resolved').length,
    returned: entries.filter(e => e.status === 'returned').length,
  };

  const lostFoundHeaderActions = useMemo(() => {
    if (loading) return null;
    return (
      <div className="flex flex-wrap items-center gap-3 px-4 py-2 bg-purple-50 dark:bg-purple-950/40 rounded-lg border border-purple-200 dark:border-purple-800/60 max-w-full">
        <Package className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0" />
        <span className="text-2xl font-bold text-gray-900 dark:text-foreground">{filteredEntries.length}</span>
        <span className="text-gray-600 dark:text-muted-foreground text-sm font-medium">
          {statusFilter === 'all' ? 'Total Items' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Items`}
        </span>
      </div>
    );
  }, [loading, filteredEntries.length, statusFilter]);

  usePageHeader({
    title: 'Lost & Found',
    description: 'Manage lost and found items from guest reservations',
    actions: lostFoundHeaderActions,
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600 dark:text-purple-400 mb-4" />
        <p className="text-gray-600 dark:text-muted-foreground">Loading lost & found entries...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Status Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-border">
          <nav className="flex flex-wrap gap-x-6 gap-y-1" aria-label="Tabs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={cn(
                'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors -mb-px bg-transparent',
                statusFilter === 'all'
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-muted-foreground dark:hover:text-foreground dark:hover:border-border'
              )}
            >
              All
              <span
                className={cn(
                  'ml-2 py-0.5 px-2.5 rounded-full text-xs',
                  statusFilter === 'all'
                    ? 'bg-purple-100 text-purple-600 dark:bg-purple-950/55 dark:text-purple-300'
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
              onClick={() => setStatusFilter('returned')}
              className={cn(
                'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors -mb-px bg-transparent',
                statusFilter === 'returned'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-muted-foreground dark:hover:text-foreground dark:hover:border-border'
              )}
            >
              Returned
              <span
                className={cn(
                  'ml-2 py-0.5 px-2.5 rounded-full text-xs',
                  statusFilter === 'returned'
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/55 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-muted dark:text-muted-foreground'
                )}
              >
                {statusCounts.returned}
              </span>
            </button>
          </nav>
        </div>
      </div>

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

      {filteredEntries.length === 0 ? (
        <Card className="border-gray-200 dark:border-border">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="p-4 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-950/50 dark:to-indigo-950/50 rounded-2xl mb-6">
              <Package className="h-16 w-16 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground mb-2">
              {statusFilter === 'all' ? 'No lost & found entries yet' : `No ${statusFilter} items`}
            </h2>
            <p className="text-gray-600 dark:text-muted-foreground text-center max-w-md">
              {statusFilter === 'all' 
                ? 'When you report a lost or found item, it will appear here for tracking.'
                : `No items with status "${statusFilter}" at the moment.`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => {
            const propertyLabel = resolvePropertyNameFromRecord(entry);
            return (
            <Card key={entry.id} className="hover:shadow-md transition-shadow border-gray-200 dark:border-border">
              <CardHeader>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <Badge className={getPlatformColor(entry.platform)}>
                        {entry.platform.toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(entry.status)}>
                        {entry.status.toUpperCase()}
                      </Badge>
                      {entry.reservationCode && (
                        <span className="text-sm text-gray-600 dark:text-muted-foreground font-mono">
                          {entry.reservationCode}
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-xl text-card-foreground">{entry.guestName}</CardTitle>
                    <CardDescription className="mt-2 text-muted-foreground">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {formatDate(entry.arrivalDate)} - {formatDate(entry.departureDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{entry.numberOfGuests} guests</span>
                        </div>
                        {propertyLabel && (
                          <span className="text-sm">📍 {propertyLabel}</span>
                        )}
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={entry.status}
                      onChange={(e) => handleStatusChange(entry.id, e.target.value)}
                      className="text-sm border border-gray-300 dark:border-border rounded px-2 py-1 bg-white dark:bg-card text-foreground"
                    >
                      <option value="pending">Pending</option>
                      <option value="resolved">Resolved</option>
                      <option value="returned">Returned</option>
                    </select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Contact Information */}
                  {(entry.guestEmail || entry.guestPhone) && (
                    <div className="bg-gray-50 dark:bg-muted rounded-lg p-4 border border-transparent dark:border-border/60">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-foreground mb-2">
                        Contact Information
                      </h4>
                      <div className="space-y-1 text-sm">
                        {entry.guestEmail && (
                          <p className="text-gray-700 dark:text-neutral-300">
                            <span className="font-medium text-foreground">Email:</span> {entry.guestEmail}
                          </p>
                        )}
                        {entry.guestPhone && (
                          <p className="text-gray-700 dark:text-neutral-300">
                            <span className="font-medium text-foreground">Phone:</span> {entry.guestPhone}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {entry.description && (
                    <div className="bg-purple-50 dark:bg-purple-950/35 rounded-lg p-4 border border-purple-100/80 dark:border-purple-900/50">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-foreground mb-2">
                        Item Description
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-neutral-300">{entry.description}</p>
                    </div>
                  )}

                  {/* Attachments */}
                  {entry.attachments && entry.attachments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-foreground mb-3 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Photos ({entry.attachments.length})
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {entry.attachments.map((attachment, index) => (
                          <button
                            key={index}
                            onClick={() => handleImageClick(entry.attachments, index)}
                            className="group relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 dark:border-border hover:border-purple-500 dark:hover:border-purple-400 transition-all hover:shadow-lg bg-gray-100 dark:bg-muted flex items-center justify-center"
                          >
                            <img
                              src={getImageDataUrl(attachment)}
                              alt={attachment.name || `Attachment ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {/* Overlay on hover */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center pointer-events-none">
                              <ImageIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            {/* Image number badge */}
                            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                              {index + 1}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Meta Information */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-muted-foreground pt-2 border-t border-gray-200 dark:border-border">
                    <span>Reported on {formatDate(entry.createdAt)}</span>
                    <span>Last updated {formatDate(entry.updatedAt)}</span>
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





