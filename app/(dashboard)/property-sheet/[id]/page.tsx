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
import { DetailedAmenitiesForm } from '@/components/property-sheet/DetailedAmenitiesForm';
import { RulesForm } from '@/components/property-sheet/RulesForm';
import { LocalAreaForm } from '@/components/property-sheet/LocalAreaForm';
import { OperationsForm } from '@/components/property-sheet/OperationsForm';
import { FAQsForm } from '@/components/property-sheet/FAQsForm';
import ProgressTracker from '@/components/property-sheet/ProgressTracker';
import {
  ArrowLeft, Home, Key, Wifi, Sparkles,
  WashingMachine, ScrollText, MapPin, Settings, HelpCircle,
} from 'lucide-react';
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
    const completionData = await propertySheetsApi.getCompletion(propertyId);
    setCompletion(completionData);
    const propertyData = await propertiesApi.getOne(propertyId);
    setProperty(propertyData);
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

  const tabs = [
    { value: 'identity', label: 'Identity', icon: Home, module: 1 },
    { value: 'access', label: 'Access', icon: Key, module: 2 },
    { value: 'connectivity', label: 'WiFi', icon: Wifi, module: 3 },
    { value: 'amenities', label: 'Amenities', icon: Sparkles, module: 4 },
    { value: 'detailed-amenities', label: 'Detailed', icon: WashingMachine, module: 5 },
    { value: 'rules', label: 'Rules', icon: ScrollText, module: 6 },
    { value: 'local-area', label: 'Local Area', icon: MapPin, module: 7 },
    { value: 'operations', label: 'Operations', icon: Settings, module: 8 },
    { value: 'faqs', label: 'FAQs', icon: HelpCircle, module: 9 },
  ];

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
          Complete all 9 modules to fully train your AI assistant
        </p>
      </div>

      {completion && (
        <div className="mb-8">
          <ProgressTracker completion={completion} />
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 mb-8 p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">M{tab.module}:</span>
                {tab.label}
              </TabsTrigger>
            );
          })}
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

        <TabsContent value="detailed-amenities">
          <Card>
            <CardHeader>
              <CardTitle>Module 5: Detailed Amenities</CardTitle>
              <CardDescription>
                Laundry, heating system, hot water, breaker box, outdoor space, and bed configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DetailedAmenitiesForm
                propertyId={propertyId}
                initialData={property.propertySheet}
                onSave={handleSave}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Module 6: House Rules</CardTitle>
              <CardDescription>
                Noise, smoking, pets, parties, checkout checklist, and general rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RulesForm
                propertyId={propertyId}
                initialData={property.propertySheet}
                onSave={handleSave}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="local-area">
          <Card>
            <CardHeader>
              <CardTitle>Module 7: Local Area</CardTitle>
              <CardDescription>
                Parking options, transit, grocery stores, restaurants, and walkability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LocalAreaForm
                propertyId={propertyId}
                initialData={property.propertySheet}
                onSave={handleSave}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations">
          <Card>
            <CardHeader>
              <CardTitle>Module 8: Operations</CardTitle>
              <CardDescription>
                Check-in/out policies, cancellation, support flow, incident protocols, and discounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OperationsForm
                propertyId={propertyId}
                initialData={property.propertySheet}
                onSave={handleSave}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faqs">
          <Card>
            <CardHeader>
              <CardTitle>Module 9: FAQs & Knowledge Base</CardTitle>
              <CardDescription>
                Frequently asked questions, troubleshooting playbooks, and pre-check-in checklist
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FAQsForm
                propertyId={propertyId}
                initialData={property.propertySheet}
                onSave={handleSave}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
