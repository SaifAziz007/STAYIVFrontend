'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { reviewsApi, HospitableReview, ReviewsByRating } from '@/lib/reviews-api';
import { Star, ArrowLeft, Calendar, User, MessageSquare, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

type RatingFilter = 'all' | 1 | 2 | 3 | 4 | 5;

export default function PropertyReviewsPage() {
  const params = useParams();
  const router = useRouter();
  const hospitablePropertyId = params.hospitablePropertyId as string;

  const [reviews, setReviews] = useState<HospitableReview[]>([]);
  const [groupedReviews, setGroupedReviews] = useState<ReviewsByRating | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState<RatingFilter>('all');
  const [propertyName, setPropertyName] = useState<string>('Property Reviews');
  const [error, setError] = useState<string | null>(null);
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (hospitablePropertyId) {
      loadReviews();
    }
  }, [hospitablePropertyId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all reviews for the property
      const allReviews = await reviewsApi.getAllPropertyReviews(hospitablePropertyId);
      setReviews(allReviews);
      
      // Group reviews by rating
      const grouped = reviewsApi.groupReviewsByRating(allReviews);
      setGroupedReviews(grouped);
      
      // Set property name (you might want to fetch this from your backend)
      setPropertyName(`Property Reviews (${allReviews.length} total)`);
      
    } catch (error: any) {
      console.error('Failed to load reviews:', error);
      setError('Failed to load reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredReviews = (): HospitableReview[] => {
    if (selectedRating === 'all') return reviews;
    return groupedReviews?.[selectedRating] || [];
  };

  const getRatingCount = (rating: number): number => {
    return groupedReviews?.[rating as keyof ReviewsByRating]?.length || 0;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'h-4 w-4',
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            )}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const toggleReviewExpansion = (reviewId: string) => {
    setExpandedReviews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  const isReviewExpanded = (reviewId: string) => expandedReviews.has(reviewId);

  const averageRating = reviewsApi.calculateAverageRating(reviews);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/reviews')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Properties
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{propertyName}</h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                <span className="text-2xl font-bold">
                  {averageRating > 0 ? averageRating.toFixed(2) : 'N/A'}
                </span>
              </div>
              <span className="text-gray-600">
                {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          </div>
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

      {/* Rating Filter Tabs */}
      {groupedReviews && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedRating === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRating('all')}
              >
                All ({reviews.length})
              </Button>
              {[5, 4, 3, 2, 1].map((rating) => (
                <Button
                  key={rating}
                  variant={selectedRating === rating ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedRating(rating as RatingFilter)}
                  className="gap-1"
                >
                  {[...Array(rating)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-current" />
                  ))}
                  <span>({getRatingCount(rating)})</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {getFilteredReviews().length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <MessageSquare className="h-16 w-16 text-gray-400 mb-4 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No reviews found
            </h2>
            <p className="text-gray-600">
              {selectedRating !== 'all'
                ? `No ${selectedRating}-star reviews for this property.`
                : 'This property has no reviews yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {getFilteredReviews().map((review) => {
            const isExpanded = isReviewExpanded(review.id);
            const hasCollapsibleContent = review.public.response || review.private.feedback || 
              (review.private.detailed_ratings && review.private.detailed_ratings.some(r => r.rating > 0));

            return (
              <Card key={review.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {review.platform.toUpperCase()}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(review.reviewed_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {renderStars(review.public.rating)}
                        <span className="font-semibold text-lg">
                          {review.public.rating}/5
                        </span>
                      </div>
                    </div>
                    {hasCollapsibleContent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleReviewExpansion(review.id)}
                        className="ml-2"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-600" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-600" />
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Public Review - Always visible */}
                  {review.public.review && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {review.guest 
                          ? `${review.guest.first_name}${review.guest.last_name ? ' ' + review.guest.last_name : ''}` 
                          : 'Guest Review'
                        }
                      </h4>
                      <p className="text-gray-700 leading-relaxed">
                        "{review.public.review}"
                      </p>
                    </div>
                  )}

                  {/* Collapsible sections - Only shown when expanded */}
                  {isExpanded && (
                    <>
                      {/* Host Response */}
                      {review.public.response && (
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                          <h4 className="font-semibold text-blue-900 mb-2">Host Response</h4>
                          <p className="text-blue-800 text-sm">
                            "{review.public.response}"
                          </p>
                          {review.responded_at && (
                            <p className="text-xs text-blue-600 mt-2">
                              Responded on {formatDate(review.responded_at)}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Private Feedback */}
                      {review.private.feedback && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                          <h4 className="font-semibold text-yellow-900 mb-2">Private Feedback</h4>
                          <p className="text-yellow-800 text-sm">
                            "{review.private.feedback}"
                          </p>
                        </div>
                      )}

                      {/* Detailed Ratings */}
                      {review.private.detailed_ratings && review.private.detailed_ratings.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Detailed Ratings</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {review.private.detailed_ratings
                              .filter(rating => rating.rating > 0)
                              .map((rating, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <span className="text-sm capitalize text-gray-700">
                                    {rating.type}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {renderStars(rating.rating)}
                                    <span className="text-xs text-gray-600 ml-1">
                                      {rating.rating}
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

