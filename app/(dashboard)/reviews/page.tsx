'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { reviewsApi, Property } from '@/lib/reviews-api';
import { Star, Building2, AlertCircle, Loader2 } from 'lucide-react';
import { usePageHeader } from '@/components/layout/page-header-context';

export default function ReviewsPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reviewsApi.getProperties();
      console.log('Loaded properties:', data);
      setProperties(data);
    } catch (error: any) {
      console.error('Failed to load properties:', error);
      setError('Failed to load properties. Please ensure your Hospitable account is connected.');
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyClick = (hospitablePropertyId: string | null) => {
    if (!hospitablePropertyId) {
      alert('This property is not connected to Hospitable');
      return;
    }
    router.push(`/reviews/${hospitablePropertyId}`);
  };

  usePageHeader({
    title: 'Reviews',
    description: 'View and manage reviews for all your properties',
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mb-4" />
        <p className="text-gray-600 dark:text-muted-foreground">Loading properties...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
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

      {properties.length === 0 ? (
        <Card className="border-gray-200 dark:border-border">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-2xl mb-6">
              <Building2 className="h-16 w-16 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground mb-2">
              No properties found
            </h2>
            <p className="text-gray-600 dark:text-muted-foreground mb-6 text-center max-w-md">
              Connect your Hospitable account and sync your properties to view reviews.
            </p>
            <Button onClick={() => router.push('/settings')} className="gap-2">
              Connect Hospitable
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Card
              key={property.id}
              className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-gray-200 dark:border-border"
              onClick={() => handlePropertyClick(property.hospitablePropertyId)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-card-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {property.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {property.hospitablePropertyId ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/45 dark:text-green-300 dark:border-green-800 text-xs font-medium">
                          <span>✓</span> Connected to Hospitable
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800 text-xs font-medium">
                          <span>⚠</span> Not connected
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-foreground">
                      {property.averageRating 
                        ? `${property.averageRating} stars`
                        : 'No reviews yet'
                      }
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-muted-foreground font-medium">
                    {property.totalReviews || 0} reviews
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={!property.hospitablePropertyId}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePropertyClick(property.hospitablePropertyId);
                  }}
                >
                  View Reviews
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}





