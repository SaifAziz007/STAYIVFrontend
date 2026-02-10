'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { reviewRemovalApi, ReviewRemoval } from '@/lib/review-removal-api';
import { AlertTriangle, Loader2, AlertCircle, Calendar, Users, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ReviewRemovalPage() {
  const { toast } = useToast();
  const [reviewRemovals, setReviewRemovals] = useState<ReviewRemoval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed' | 'removed'>('all');

  useEffect(() => {
    loadReviewRemovals();
  }, []);

  const loadReviewRemovals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reviewRemovalApi.getReviewRemovals();
      console.log('Review/Removals:', data);
      setReviewRemovals(data);
    } catch (error: any) {
      console.error('Failed to load review/removals:', error);
      setError('Failed to load review/removal entries. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review/removal entry?')) {
      return;
    }

    try {
      await reviewRemovalApi.deleteReviewRemoval(id);
      toast({
        title: 'Success!',
        description: 'Review/Removal entry deleted successfully.',
      });
      loadReviewRemovals();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete review/removal entry.',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await reviewRemovalApi.updateReviewRemovalStatus(id, newStatus);
      toast({
        title: 'Success!',
        description: 'Status updated successfully.',
      });
      loadReviewRemovals();
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
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'removed':
        return 'bg-red-100 text-red-800';
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

  // Filter review/removals by status
  const filteredReviewRemovals = statusFilter === 'all' 
    ? reviewRemovals 
    : reviewRemovals.filter(item => item.status === statusFilter);

  // Count by status
  const statusCounts = {
    all: reviewRemovals.length,
    pending: reviewRemovals.filter(r => r.status === 'pending').length,
    reviewed: reviewRemovals.filter(r => r.status === 'reviewed').length,
    removed: reviewRemovals.filter(r => r.status === 'removed').length,
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-orange-600 mb-4" />
        <p className="text-gray-600">Loading review/removal entries...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review/Removal</h1>
          <p className="text-gray-600 mt-1">
            Manage reservations flagged for review or removal
          </p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-orange-50 rounded-lg border border-orange-200">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <span className="text-2xl font-bold text-gray-900">{filteredReviewRemovals.length}</span>
          <span className="text-gray-600 text-sm font-medium">
            {statusFilter === 'all' ? 'Total Entries' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Entries`}
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
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              All
              <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${
                statusFilter === 'all' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
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
              onClick={() => setStatusFilter('reviewed')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${statusFilter === 'reviewed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Reviewed
              <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${
                statusFilter === 'reviewed' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {statusCounts.reviewed}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('removed')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${statusFilter === 'removed'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Removed
              <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${
                statusFilter === 'removed' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {statusCounts.removed}
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

      {filteredReviewRemovals.length === 0 ? (
        <Card className="border-gray-200">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="p-4 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl mb-6">
              <AlertTriangle className="h-16 w-16 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {statusFilter === 'all' ? 'No review/removal entries yet' : `No ${statusFilter} entries`}
            </h2>
            <p className="text-gray-600 text-center max-w-md">
              {statusFilter === 'all' 
                ? 'When you mark a reservation for review/removal, it will appear here for tracking.'
                : `No entries with status "${statusFilter}" at the moment.`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReviewRemovals.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow border-gray-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={getPlatformColor(item.platform)}>
                        {item.platform.toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status.toUpperCase()}
                      </Badge>
                      {item.reservationCode && (
                        <span className="text-sm text-gray-600 font-mono">
                          {item.reservationCode}
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-xl">{item.guestName}</CardTitle>
                    <CardDescription className="mt-2">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {formatDate(item.arrivalDate)} - {formatDate(item.departureDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{item.numberOfGuests} guests</span>
                        </div>
                        {item.propertyName && (
                          <span className="text-sm">📍 {item.propertyName}</span>
                        )}
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="pending">Pending</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="removed">Removed</option>
                    </select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Contact Information */}
                  {(item.guestEmail || item.guestPhone) && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        Contact Information
                      </h4>
                      <div className="space-y-1 text-sm">
                        {item.guestEmail && (
                          <p className="text-gray-700">
                            <span className="font-medium">Email:</span> {item.guestEmail}
                          </p>
                        )}
                        {item.guestPhone && (
                          <p className="text-gray-700">
                            <span className="font-medium">Phone:</span> {item.guestPhone}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {item.notes && (
                    <div className="bg-orange-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        Review/Removal Notes
                      </h4>
                      <p className="text-sm text-gray-700">{item.notes}</p>
                    </div>
                  )}

                  {/* Meta Information */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                    <span>Flagged on {formatDate(item.createdAt)}</span>
                    <span>Last updated {formatDate(item.updatedAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}





