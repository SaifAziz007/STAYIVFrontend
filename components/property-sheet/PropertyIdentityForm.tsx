'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { propertySheetsApi } from '@/lib/properties-api';
import { propertyIdentitySchema, PropertyIdentityFormData } from '@/lib/validations/property.schema';
import { Save, AlertCircle } from 'lucide-react';
import PhotoUploader from './PhotoUploader';

interface PropertyIdentityFormProps {
  propertyId: string;
  initialData?: any;
  onSave?: () => void;
}

export default function PropertyIdentityForm({
  propertyId,
  initialData,
  onSave,
}: PropertyIdentityFormProps) {
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PropertyIdentityFormData>({
    resolver: zodResolver(propertyIdentitySchema),
    defaultValues: initialData || {
      propertyName: '',
      propertyType: 'apartment',
      address: {
        street: '',
        unit: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA',
      },
      specifications: {
        bedrooms: 1,
        bathrooms: 1,
        maxGuests: 2,
      },
      photos: [],
      description: '',
    },
  });

  const propertyType = watch('propertyType');
  const photos = watch('photos') || [];

  useEffect(() => {
    if (initialData) {
      Object.keys(initialData).forEach((key) => {
        setValue(key as any, initialData[key]);
      });
    }
  }, [initialData, setValue]);

  const onSubmit = async (data: PropertyIdentityFormData) => {
    console.log('Form submitted with data:', data);
    try {
      setSaving(true);
      setSaveError('');
      setSaveSuccess(false);

      console.log('Calling API with propertyId:', propertyId, 'data:', data);
      await propertySheetsApi.updateIdentity(propertyId, data);
      console.log('Save successful!');
      setSaveSuccess(true);
      onSave?.();

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error('Save error:', error);
      console.error('Error details:', error.response?.data);
      setSaveError(error.response?.data?.message || error.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Show validation errors at the top */}
      {Object.keys(errors).length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900">Please fix the following errors:</h4>
              <ul className="text-sm text-red-700 mt-2 list-disc list-inside space-y-1">
                {Object.entries(errors).map(([key, error]: [string, any]) => (
                  <li key={key}>
                    {key}: {error?.message || 'Invalid value'}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Property Name & Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="propertyName">Property Name *</Label>
          <Input
            id="propertyName"
            placeholder="e.g., Cozy Downtown Apartment"
            {...register('propertyName')}
          />
          {errors.propertyName && (
            <p className="text-sm text-red-600">{errors.propertyName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="propertyType">Property Type *</Label>
          <Select
            value={propertyType}
            onValueChange={(value) => setValue('propertyType', value as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apartment">Apartment</SelectItem>
              <SelectItem value="house">House</SelectItem>
              <SelectItem value="condo">Condo</SelectItem>
              <SelectItem value="villa">Villa</SelectItem>
              <SelectItem value="townhouse">Townhouse</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.propertyType && (
            <p className="text-sm text-red-600">{errors.propertyType.message}</p>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="street">Street Address *</Label>
            <Input
              id="street"
              placeholder="123 Main Street"
              {...register('address.street')}
            />
            {errors.address?.street && (
              <p className="text-sm text-red-600">{errors.address.street.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unit/Apt # (Optional)</Label>
            <Input
              id="unit"
              placeholder="Apt 4B"
              {...register('address.unit')}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              placeholder="New York"
              {...register('address.city')}
            />
            {errors.address?.city && (
              <p className="text-sm text-red-600">{errors.address.city.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State *</Label>
            <Input
              id="state"
              placeholder="NY"
              {...register('address.state')}
            />
            {errors.address?.state && (
              <p className="text-sm text-red-600">{errors.address.state.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="zipCode">ZIP Code *</Label>
            <Input
              id="zipCode"
              placeholder="10001"
              {...register('address.zipCode')}
            />
            {errors.address?.zipCode && (
              <p className="text-sm text-red-600">{errors.address.zipCode.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country *</Label>
          <Input
            id="country"
            placeholder="USA"
            {...register('address.country')}
          />
          {errors.address?.country && (
            <p className="text-sm text-red-600">{errors.address.country.message}</p>
          )}
        </div>
      </div>

      {/* Specifications */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Specifications</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bedrooms">Bedrooms *</Label>
            <Input
              id="bedrooms"
              type="number"
              min="1"
              max="20"
              {...register('specifications.bedrooms', { valueAsNumber: true })}
            />
            {errors.specifications?.bedrooms && (
              <p className="text-sm text-red-600">{errors.specifications.bedrooms.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bathrooms">Bathrooms *</Label>
            <Input
              id="bathrooms"
              type="number"
              min="1"
              max="10"
              step="0.5"
              {...register('specifications.bathrooms', { valueAsNumber: true })}
            />
            {errors.specifications?.bathrooms && (
              <p className="text-sm text-red-600">{errors.specifications.bathrooms.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxGuests">Max Guests *</Label>
            <Input
              id="maxGuests"
              type="number"
              min="1"
              max="50"
              {...register('specifications.maxGuests', { valueAsNumber: true })}
            />
            {errors.specifications?.maxGuests && (
              <p className="text-sm text-red-600">{errors.specifications.maxGuests.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="squareFeet">Square Feet</Label>
            <Input
              id="squareFeet"
              type="number"
              min="1"
              placeholder="Optional"
              {...register('specifications.squareFeet', { 
                valueAsNumber: true,
                setValueAs: v => v === '' ? undefined : Number(v)
              })}
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description * (min 50 characters)</Label>
        <Textarea
          id="description"
          rows={6}
          placeholder="Describe your property, its features, and what makes it special..."
          {...register('description')}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* Listing URLs (Optional) */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Listing URLs (Optional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="airbnb">Airbnb URL</Label>
            <Input
              id="airbnb"
              type="url"
              placeholder="https://airbnb.com/rooms/..."
              {...register('listingUrls.airbnb')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bookingCom">Booking.com URL</Label>
            <Input
              id="bookingCom"
              type="url"
              placeholder="https://booking.com/..."
              {...register('listingUrls.bookingCom')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vrbo">VRBO URL</Label>
            <Input
              id="vrbo"
              type="url"
              placeholder="https://vrbo.com/..."
              {...register('listingUrls.vrbo')}
            />
          </div>
        </div>
      </div>

      {/* Photos Upload */}
      <div className="space-y-2">
        <Label>Property Photos * (At least 1 required)</Label>
        <PhotoUploader
          photos={photos}
          onChange={(newPhotos) => setValue('photos', newPhotos)}
          maxPhotos={20}
        />
        {errors.photos && (
          <p className="text-sm text-red-600">{errors.photos.message}</p>
        )}
      </div>

      {/* Save Messages */}
      {saveSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">✓ Property identity saved successfully!</p>
        </div>
      )}

      {saveError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{saveError}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t">
        <Button type="submit" disabled={saving} size="lg">
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Property Identity'}
        </Button>
      </div>
    </form>
  );
}

