'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { propertiesApi, propertySheetsApi } from '@/lib/properties-api';
import PropertyIdentityForm from '@/components/property-sheet/PropertyIdentityForm';
import { AccessSecurityForm } from '@/components/property-sheet/AccessSecurityForm';
import { ConnectivityForm } from '@/components/property-sheet/ConnectivityForm';
import { AmenitiesForm } from '@/components/property-sheet/AmenitiesForm';
import ProgressTracker from '@/components/property-sheet/ProgressTracker';
import { ArrowLeft, Home, Key, Wifi, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function PropertySheetPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;
  
  const [property, setProperty] = useState<any>(null);
  const [completion, setCompletion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('identity');

  useEffect(() => {
    loadProperty();
  }, [propertyId]);

  const loadProperty = async () => {
    try {
      const [propertyData, completionData] = await Promise.all([
        propertiesApi.getOne(propertyId),
        propertySheetsApi.getCompletion(propertyId),
      ]);
      setProperty(propertyData);
      setCompletion(completionData);
    } catch (error) {
      console.error('Failed to load property:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Reload completion data
    const completionData = await propertySheetsApi.getCompletion(propertyId);
    setCompletion(completionData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Property not found</h2>
        <Link href="/properties">
          <Button>Back to Properties</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href="/properties">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Properties
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Property Sheet</h1>
        <p className="text-gray-600 mt-1">
          Complete the property information to train your AI assistant
        </p>
      </div>

      {completion && (
        <div className="mb-8">
          <ProgressTracker completion={completion} />
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="identity" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Module 1:</span> Identity
          </TabsTrigger>
          <TabsTrigger value="access" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">Module 2:</span> Access
          </TabsTrigger>
          <TabsTrigger value="connectivity" className="flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            <span className="hidden sm:inline">Module 3:</span> WiFi
          </TabsTrigger>
          <TabsTrigger value="amenities" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Module 4:</span> Amenities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="identity">
          <Card>
            <CardHeader>
              <CardTitle>Module 1: Property Identity</CardTitle>
              <CardDescription>
                Basic information about your property - name, location, specs, and photos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PropertyIdentityForm
                propertyId={propertyId}
                initialData={property.propertySheet?.identityData}
                onSave={handleSave}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle>Module 2: Access & Security</CardTitle>
              <CardDescription>
                Check-in instructions, access codes, parking, and emergency contacts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AccessSecurityForm
                propertyId={propertyId}
                initialData={property.propertySheet}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connectivity">
          <Card>
            <CardHeader>
              <CardTitle>Module 3: Connectivity</CardTitle>
              <CardDescription>
                WiFi details, TV services, and entertainment options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConnectivityForm
                propertyId={propertyId}
                initialData={property.propertySheet}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="amenities">
          <Card>
            <CardHeader>
              <CardTitle>Module 4: Basic Amenities</CardTitle>
              <CardDescription>
                Kitchen, bathroom, bedroom amenities and safety features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AmenitiesForm
                propertyId={propertyId}
                initialData={property.propertySheet}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

