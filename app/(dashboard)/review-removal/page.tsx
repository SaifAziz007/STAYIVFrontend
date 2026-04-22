'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { reviewRemovalApi, ReviewRemoval } from '@/lib/review-removal-api';
import { AlertTriangle, Loader2, AlertCircle, Calendar, Users, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { usePageHeader } from '@/components/layout/page-header-context';
import { resolvePropertyNameFromRecord } from '@/lib/reservation-property-display';

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
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/45 dark:text-yellow-300 border-0';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/45 dark:text-blue-300 border-0';
      case 'removed':
        return 'bg-red-100 text-red-800 dark:bg-red-950/45 dark:text-red-300 border-0';
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

  const reviewRemovalHeaderActions = useMemo(() => {
    if (loading) return null;
    return (
      <div className="flex flex-wrap items-center gap-3 px-4 py-2 bg-orange-50 dark:bg-orange-950/40 rounded-lg border border-orange-200 dark:border-orange-800/60 max-w-full">
        <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0" />
        <span className="text-2xl font-bold text-gray-900 dark:text-foreground">{filteredReviewRemovals.length}</span>
        <span className="text-gray-600 dark:text-muted-foreground text-sm font-medium">
          {statusFilter === 'all' ? 'Total Entries' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Entries`}
        </span>
      </div>
    );
  }, [loading, filteredReviewRemovals.length, statusFilter]);

  usePageHeader({
    title: 'Review/Removal',
    description: 'Manage reservations flagged for review or removal',
    actions: reviewRemovalHeaderActions,
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-orange-600 dark:text-orange-400 mb-4" />
        <p className="text-gray-600 dark:text-muted-foreground">Loading review/removal entries...</p>
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
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-muted-foreground dark:hover:text-foreground dark:hover:border-border'
              )}
            >
              All
              <span
                className={cn(
                  'ml-2 py-0.5 px-2.5 rounded-full text-xs',
                  statusFilter === 'all'
                    ? 'bg-orange-100 text-orange-600 dark:bg-orange-950/55 dark:text-orange-300'
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
              onClick={() => setStatusFilter('reviewed')}
              className={cn(
                'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors -mb-px bg-transparent',
                statusFilter === 'reviewed'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-muted-foreground dark:hover:text-foreground dark:hover:border-border'
              )}
            >
              Reviewed
              <span
                className={cn(
                  'ml-2 py-0.5 px-2.5 rounded-full text-xs',
                  statusFilter === 'reviewed'
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/55 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-muted dark:text-muted-foreground'
                )}
              >
                {statusCounts.reviewed}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('removed')}
              className={cn(
                'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors -mb-px bg-transparent',
                statusFilter === 'removed'
                  ? 'border-red-500 text-red-600 dark:text-red-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-muted-foreground dark:hover:text-foreground dark:hover:border-border'
              )}
            >
              Removed
              <span
                className={cn(
                  'ml-2 py-0.5 px-2.5 rounded-full text-xs',
                  statusFilter === 'removed'
                    ? 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-muted dark:text-muted-foreground'
                )}
              >
                {statusCounts.removed}
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

      {filteredReviewRemovals.length === 0 ? (
        <Card className="border-gray-200 dark:border-border">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="p-4 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-950/50 dark:to-amber-950/45 rounded-2xl mb-6">
              <AlertTriangle className="h-16 w-16 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground mb-2">
              {statusFilter === 'all' ? 'No review/removal entries yet' : `No ${statusFilter} entries`}
            </h2>
            <p className="text-gray-600 dark:text-muted-foreground text-center max-w-md">
              {statusFilter === 'all' 
                ? 'When you mark a reservation for review/removal, it will appear here for tracking.'
                : `No entries with status "${statusFilter}" at the moment.`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReviewRemovals.map((item) => {
            const propertyLabel = resolvePropertyNameFromRecord(item);
            return (
            <Card key={item.id} className="hover:shadow-md transition-shadow border-gray-200 dark:border-border">
              <CardHeader>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <Badge className={getPlatformColor(item.platform)}>
                        {item.platform.toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status.toUpperCase()}
                      </Badge>
                      {item.reservationCode && (
                        <span className="text-sm text-gray-600 dark:text-muted-foreground font-mono">
                          {item.reservationCode}
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-xl text-card-foreground">{item.guestName}</CardTitle>
                    <CardDescription className="mt-2 text-muted-foreground">
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
                        {propertyLabel && (
                          <span className="text-sm">📍 {propertyLabel}</span>
                        )}
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      className="text-sm border border-gray-300 dark:border-border rounded px-2 py-1 bg-white dark:bg-card text-foreground"
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
                      <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Contact Information */}
                  {(item.guestEmail || item.guestPhone) && (
                    <div className="bg-gray-50 dark:bg-muted rounded-lg p-4 border border-transparent dark:border-border/60">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-foreground mb-2">
                        Contact Information
                      </h4>
                      <div className="space-y-1 text-sm">
                        {item.guestEmail && (
                          <p className="text-gray-700 dark:text-neutral-300">
                            <span className="font-medium text-foreground">Email:</span> {item.guestEmail}
                          </p>
                        )}
                        {item.guestPhone && (
                          <p className="text-gray-700 dark:text-neutral-300">
                            <span className="font-medium text-foreground">Phone:</span> {item.guestPhone}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {item.notes && (
                    <div className="bg-orange-50 dark:bg-orange-950/35 rounded-lg p-4 border border-orange-100/80 dark:border-orange-900/50">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-foreground mb-2">
                        Review/Removal Notes
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-neutral-300">{item.notes}</p>
                    </div>
                  )}

                  {/* Meta Information */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-muted-foreground pt-2 border-t border-gray-200 dark:border-border">
                    <span>Flagged on {formatDate(item.createdAt)}</span>
                    <span>Last updated {formatDate(item.updatedAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}





