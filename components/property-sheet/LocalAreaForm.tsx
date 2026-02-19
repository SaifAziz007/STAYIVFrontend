'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { localAreaSchema, type LocalAreaFormData } from '@/lib/validations/local-area.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';
import { AlertCircle, CheckCircle2, Car, Bus, ShoppingCart, UtensilsCrossed, Plus, Trash2, MapPin } from 'lucide-react';

interface LocalAreaFormProps {
  propertyId: string;
  initialData?: any;
  onSave?: () => void;
}

export function LocalAreaForm({ propertyId, initialData, onSave }: LocalAreaFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LocalAreaFormData>({
    resolver: zodResolver(localAreaSchema),
    defaultValues: initialData?.localAreaData || {
      onSiteParkingSummary: '',
      parkingOptions: [],
      streetParkingRules: [],
      transitStops: [],
      groceryStores: [],
      restaurants: [],
      pharmacies: [],
    },
  });

  const { fields: parkingFields, append: appendParking, remove: removeParking } = useFieldArray({ control, name: 'parkingOptions' });
  const { fields: streetFields, append: appendStreet, remove: removeStreet } = useFieldArray({ control, name: 'streetParkingRules' });
  const { fields: transitFields, append: appendTransit, remove: removeTransit } = useFieldArray({ control, name: 'transitStops' });
  const { fields: groceryFields, append: appendGrocery, remove: removeGrocery } = useFieldArray({ control, name: 'groceryStores' });
  const { fields: restaurantFields, append: appendRestaurant, remove: removeRestaurant } = useFieldArray({ control, name: 'restaurants' });

  const onSubmit = async (data: LocalAreaFormData) => {
    setIsSaving(true);
    setSaveStatus('idle');
    setErrorMessage('');
    try {
      await apiClient.patch(`/property-sheets/${propertyId}/local-area`, data);
      setSaveStatus('success');
      onSave?.();
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error: any) {
      setSaveStatus('error');
      setErrorMessage(error.response?.data?.message || 'Failed to save local area');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Parking Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Parking
          </CardTitle>
          <CardDescription>On-site and nearby parking options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>On-Site Parking Summary *</Label>
            <Textarea {...register('onSiteParkingSummary')} placeholder="e.g., Free driveway parking for 2 cars. Additional street parking available." rows={3} className="resize-none" />
            {errors.onSiteParkingSummary && <p className="text-sm text-red-500">{errors.onSiteParkingSummary.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Parking Constraints Disclosure</Label>
            <Input {...register('parkingConstraintsDisclosure')} placeholder="e.g., Street parking restricted on Wednesdays for street cleaning" />
          </div>

          <div className="border-t pt-4">
            <Label className="text-base font-semibold">Nearby Parking Options</Label>
            {parkingFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-3 p-3 bg-gray-50 rounded-lg">
                <Input {...register(`parkingOptions.${index}.name`)} placeholder="Lot name" />
                <Input {...register(`parkingOptions.${index}.location`)} placeholder="Address" />
                <Input {...register(`parkingOptions.${index}.pricing`)} placeholder="$1/hr" />
                <div className="flex gap-2">
                  <Input type="number" {...register(`parkingOptions.${index}.walkingMinutes`, { valueAsNumber: true })} placeholder="Walk min" />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeParking(index)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendParking({ name: '', location: '', pricing: '' })}>
              <Plus className="h-4 w-4 mr-2" /> Add Parking Option
            </Button>
          </div>

          <div className="border-t pt-4">
            <Label className="text-base font-semibold">Street Parking Rules</Label>
            {streetFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3 p-3 bg-gray-50 rounded-lg">
                <Input {...register(`streetParkingRules.${index}.street`)} placeholder="Street name" />
                <Input {...register(`streetParkingRules.${index}.restriction`)} placeholder="No parking Wed 8AM-6PM" />
                <div className="flex gap-2">
                  <Input {...register(`streetParkingRules.${index}.permitRequired`)} placeholder="Permit info" />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeStreet(index)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendStreet({ street: '', restriction: '' })}>
              <Plus className="h-4 w-4 mr-2" /> Add Street Rule
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bus className="h-5 w-5" />
            Public Transit
          </CardTitle>
          <CardDescription>Nearby bus stops, train stations, and transit options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {transitFields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg">
              <Input {...register(`transitStops.${index}.stopName`)} placeholder="Stop name" />
              <Input type="number" {...register(`transitStops.${index}.walkingMinutes`, { valueAsNumber: true })} placeholder="Walk min" />
              <div className="flex gap-2">
                <Input {...register(`transitStops.${index}.typicalTimeToDowntown`)} placeholder="Time to downtown" />
                <Button type="button" variant="ghost" size="sm" onClick={() => removeTransit(index)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => appendTransit({ stopName: '' })}>
            <Plus className="h-4 w-4 mr-2" /> Add Transit Stop
          </Button>
        </CardContent>
      </Card>

      {/* Nearby Places */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Grocery Stores
          </CardTitle>
          <CardDescription>Nearby grocery stores and supermarkets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {groceryFields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg">
              <Input {...register(`groceryStores.${index}.name`)} placeholder="Store name" />
              <Input type="number" {...register(`groceryStores.${index}.walkingMinutes`, { valueAsNumber: true })} placeholder="Walk min" />
              <div className="flex gap-2">
                <Input type="number" {...register(`groceryStores.${index}.drivingMinutes`, { valueAsNumber: true })} placeholder="Drive min" />
                <Button type="button" variant="ghost" size="sm" onClick={() => removeGrocery(index)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => appendGrocery({ name: '' })}>
            <Plus className="h-4 w-4 mr-2" /> Add Grocery Store
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5" />
            Restaurants
          </CardTitle>
          <CardDescription>Nearby dining options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {restaurantFields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg">
              <Input {...register(`restaurants.${index}.name`)} placeholder="Restaurant name" />
              <Input type="number" {...register(`restaurants.${index}.walkingMinutes`, { valueAsNumber: true })} placeholder="Walk min" />
              <div className="flex gap-2">
                <Input {...register(`restaurants.${index}.notes`)} placeholder="Cuisine / notes" />
                <Button type="button" variant="ghost" size="sm" onClick={() => removeRestaurant(index)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => appendRestaurant({ name: '' })}>
            <Plus className="h-4 w-4 mr-2" /> Add Restaurant
          </Button>
        </CardContent>
      </Card>

      {/* Area Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Area Information
          </CardTitle>
          <CardDescription>Emergency services and walkability</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nearest Emergency Room</Label>
            <Input {...register('nearestEmergencyRoom')} placeholder="e.g., City Hospital ER - 123 Main St (10 min drive)" />
          </div>
          <div className="space-y-2">
            <Label>Walkability Summary</Label>
            <Textarea {...register('walkabilitySummary')} placeholder="e.g., Very walkable neighborhood. Most errands can be done on foot within 10 minutes." rows={3} className="resize-none" />
          </div>
        </CardContent>
      </Card>

      {saveStatus === 'success' && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-green-800">Local area information saved successfully!</span>
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{errorMessage}</span>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving} size="lg">
          {isSaving ? 'Saving...' : 'Save Local Area'}
        </Button>
      </div>
    </form>
  );
}
