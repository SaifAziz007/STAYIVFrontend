'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { reviewsApi, Property } from '@/lib/reviews-api';
import { Star, Building2, AlertCircle, Loader2 } from 'lucide-react';

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Loading properties...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reviews</h1>
          <p className="text-gray-600 mt-1">
            View and manage reviews for all your properties
          </p>
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

      {properties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No properties found
            </h2>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              Connect your Hospitable account and sync your properties to view reviews.
            </p>
            <Button onClick={() => router.push('/settings')}>
              Connect Hospitable
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Card
              key={property.id}
              className="hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => handlePropertyClick(property.hospitablePropertyId)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                      {property.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {property.hospitablePropertyId ? (
                        <span className="text-green-600 text-sm">
                          ✓ Connected to Hospitable
                        </span>
                      ) : (
                        <span className="text-orange-600 text-sm">
                          ⚠ Not connected to Hospitable
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-400" />
                    <span className="text-sm text-gray-600">
                      {property.averageRating 
                        ? `${property.averageRating} stars`
                        : 'No reviews yet'
                      }
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {property.totalReviews || 0} reviews
                  </div>
                </div>
                <div className="mt-4">
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}





