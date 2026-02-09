'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { propertiesApi, Property } from '@/lib/properties-api';
import { PlusCircle, Home, Trash2 } from 'lucide-react';

export default function PropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const data = await propertiesApi.getAll();
      setProperties(data);
    } catch (error) {
      console.error('Failed to load properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProperty = async () => {
    try {
      setCreating(true);
      const newProperty = await propertiesApi.create();
      router.push(`/property-sheet/${newProperty.id}`);
    } catch (error) {
      console.error('Failed to create property:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    
    try {
      await propertiesApi.delete(id);
      setProperties(properties.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete property:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Properties</h1>
          <p className="text-gray-600 mt-1">
            Manage your vacation rental properties
          </p>
        </div>
        <Button onClick={handleCreateProperty} disabled={creating}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {creating ? 'Creating...' : 'Add Property'}
        </Button>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Home className="h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No properties yet
            </h2>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              Get started by adding your first property. You&apos;ll be able to fill in
              details and train the AI to handle guest communication.
            </p>
            <Button onClick={handleCreateProperty} disabled={creating}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Your First Property
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Card key={property.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    {property.propertySheet?.identityData?.propertyName || 'Unnamed Property'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteProperty(property.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <CardDescription>
                  {property.propertySheet?.identityData?.address?.city || 'No location set'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Overall Completion</span>
                      <span className="font-semibold">
                        {property.propertySheet?.overallCompletion || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${property.propertySheet?.overallCompletion || 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="text-xs text-gray-600">
                    AI Status:{' '}
                    <span className="font-medium">
                      {property.propertySheet?.aiTrainingStatus || 'Not Started'}
                    </span>
                  </div>

                  <Link href={`/property-sheet/${property.id}`}>
                    <Button className="w-full" variant="outline">
                      Edit Property Sheet
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}








