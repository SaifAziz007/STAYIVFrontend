'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { lostAndFoundApi, LostAndFound, ImageAttachment } from '@/lib/lost-found-api';
import { Package, Loader2, AlertCircle, Calendar, Users, Trash2, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageGalleryModal } from '@/components/image-gallery-modal';

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
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'returned':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'airbnb':
        return 'bg-red-100 text-red-700';
      case 'booking':
      case 'booking.com':
        return 'bg-blue-100 text-blue-700';
      case 'vrbo':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
        <p className="text-gray-600">Loading lost & found entries...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lost & Found</h1>
          <p className="text-gray-600 mt-1">
            Manage lost and found items from guest reservations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-purple-600" />
          <span className="text-2xl font-bold text-gray-900">{filteredEntries.length}</span>
          <span className="text-gray-600">
            {statusFilter === 'all' ? 'Total Items' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Items`}
          </span>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${statusFilter === 'all'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              All
              <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${
                statusFilter === 'all' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {statusCounts.all}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('pending')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${statusFilter === 'pending'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Pending
              <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${
                statusFilter === 'pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {statusCounts.pending}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('resolved')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${statusFilter === 'resolved'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Resolved
              <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${
                statusFilter === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {statusCounts.resolved}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('returned')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${statusFilter === 'returned'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Returned
              <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${
                statusFilter === 'returned' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {statusCounts.returned}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {statusFilter === 'all' ? 'No lost & found entries yet' : `No ${statusFilter} items`}
            </h2>
            <p className="text-gray-600 text-center max-w-md">
              {statusFilter === 'all' 
                ? 'When you report a lost or found item, it will appear here for tracking.'
                : `No items with status "${statusFilter}" at the moment.`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <Card key={entry.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={getPlatformColor(entry.platform)}>
                        {entry.platform.toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(entry.status)}>
                        {entry.status.toUpperCase()}
                      </Badge>
                      {entry.reservationCode && (
                        <span className="text-sm text-gray-600 font-mono">
                          {entry.reservationCode}
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-xl">{entry.guestName}</CardTitle>
                    <CardDescription className="mt-2">
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
                        {entry.propertyName && (
                          <span className="text-sm">📍 {entry.propertyName}</span>
                        )}
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={entry.status}
                      onChange={(e) => handleStatusChange(entry.id, e.target.value)}
                      className="text-sm border rounded px-2 py-1"
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
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Contact Information */}
                  {(entry.guestEmail || entry.guestPhone) && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        Contact Information
                      </h4>
                      <div className="space-y-1 text-sm">
                        {entry.guestEmail && (
                          <p className="text-gray-700">
                            <span className="font-medium">Email:</span> {entry.guestEmail}
                          </p>
                        )}
                        {entry.guestPhone && (
                          <p className="text-gray-700">
                            <span className="font-medium">Phone:</span> {entry.guestPhone}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {entry.description && (
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        Item Description
                      </h4>
                      <p className="text-sm text-gray-700">{entry.description}</p>
                    </div>
                  )}

                  {/* Attachments */}
                  {entry.attachments && entry.attachments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Photos ({entry.attachments.length})
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {entry.attachments.map((attachment, index) => (
                          <button
                            key={index}
                            onClick={() => handleImageClick(entry.attachments, index)}
                            className="group relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-purple-500 transition-all hover:shadow-lg bg-gray-100 flex items-center justify-center"
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
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                    <span>Reported on {formatDate(entry.createdAt)}</span>
                    <span>Last updated {formatDate(entry.updatedAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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





