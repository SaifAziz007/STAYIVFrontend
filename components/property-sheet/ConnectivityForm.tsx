'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { connectivitySchema, type ConnectivityFormData } from '@/lib/validations/connectivity.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { apiClient } from '@/lib/api-client';
import { AlertCircle, CheckCircle2, Wifi, Tv, Gamepad2 } from 'lucide-react';

interface ConnectivityFormProps {
  propertyId: string;
  initialData?: any;
}

const STREAMING_SERVICES = [
  { value: 'netflix', label: 'Netflix' },
  { value: 'hulu', label: 'Hulu' },
  { value: 'disney_plus', label: 'Disney+' },
  { value: 'amazon_prime', label: 'Amazon Prime Video' },
  { value: 'hbo_max', label: 'HBO Max' },
  { value: 'apple_tv', label: 'Apple TV+' },
  { value: 'youtube_tv', label: 'YouTube TV' },
  { value: 'other', label: 'Other' },
];

export function ConnectivityForm({ propertyId, initialData }: ConnectivityFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ConnectivityFormData>({
    resolver: zodResolver(connectivitySchema),
    defaultValues: initialData?.connectivityData || {
      wifi: {
        ssid: '',
        password: '',
        routerLocation: '',
      },
      tv: {
        hasCableTV: false,
        streamingServices: [],
      },
      entertainment: {
        hasSmartTV: false,
        tvCount: 1,
      },
    },
  });

  const hasCableTV = watch('tv.hasCableTV');
  const hasSmartTV = watch('entertainment.hasSmartTV');
  const hasGamingConsole = watch('entertainment.hasGamingConsole');
  const hasSoundSystem = watch('entertainment.hasSoundSystem');
  const streamingServices = watch('tv.streamingServices') || [];

  const toggleStreamingService = (service: string) => {
    const current = streamingServices || [];
    const updated = current.includes(service as any)
      ? current.filter((s) => s !== service)
      : [...current, service as any];
    setValue('tv.streamingServices', updated as any);
  };

  const onSubmit = async (data: ConnectivityFormData) => {
    console.log('Form submitted with data:', data);
    setIsSaving(true);
    setSaveStatus('idle');
    setErrorMessage('');

    try {
      console.log('Making API call to:', `/property-sheets/${propertyId}/connectivity`);
      const response = await apiClient.patch(`/property-sheets/${propertyId}/connectivity`, data);
      console.log('API response:', response.data);
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error: any) {
      console.error('Error saving connectivity:', error);
      setSaveStatus('error');
      setErrorMessage(error.response?.data?.message || 'Failed to save connectivity information');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* WiFi Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            WiFi Network
          </CardTitle>
          <CardDescription>
            Primary WiFi network details for guests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wifi.ssid">Network Name (SSID) *</Label>
              <Input
                id="wifi.ssid"
                {...register('wifi.ssid')}
                placeholder="e.g., MyHomeWiFi"
              />
              {errors.wifi?.ssid && (
                <p className="text-sm text-red-500">{errors.wifi.ssid.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="wifi.password">WiFi Password *</Label>
              <Input
                id="wifi.password"
                {...register('wifi.password')}
                placeholder="e.g., SecurePassword123"
                type="text"
              />
              {errors.wifi?.password && (
                <p className="text-sm text-red-500">{errors.wifi.password.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wifi.speed">Internet Speed (optional)</Label>
              <Input
                id="wifi.speed"
                {...register('wifi.speed')}
                placeholder="e.g., 500 Mbps"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wifi.routerLocation">Router Location *</Label>
              <Input
                id="wifi.routerLocation"
                {...register('wifi.routerLocation')}
                placeholder="e.g., Living room TV stand"
              />
              {errors.wifi?.routerLocation && (
                <p className="text-sm text-red-500">{errors.wifi.routerLocation.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TV & Streaming Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tv className="h-5 w-5" />
            TV & Streaming Services
          </CardTitle>
          <CardDescription>
            Available TV services and streaming platforms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="tv.hasCableTV"
              checked={hasCableTV}
              onCheckedChange={(checked) => setValue('tv.hasCableTV', checked as boolean)}
            />
            <Label htmlFor="tv.hasCableTV" className="font-normal cursor-pointer">
              Property has Cable/Satellite TV
            </Label>
          </div>

          {hasCableTV && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
              <div className="space-y-2">
                <Label htmlFor="tv.cableProvider">Cable Provider</Label>
                <Input
                  id="tv.cableProvider"
                  {...register('tv.cableProvider')}
                  placeholder="e.g., Comcast, DirecTV"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tv.cableInstructions">Cable Instructions</Label>
                <Input
                  id="tv.cableInstructions"
                  {...register('tv.cableInstructions')}
                  placeholder="e.g., Channel guide on coffee table"
                />
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Label>Available Streaming Services</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {STREAMING_SERVICES.map((service) => (
                <div key={service.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`streaming-${service.value}`}
                    checked={streamingServices.includes(service.value as any)}
                    onCheckedChange={() => toggleStreamingService(service.value)}
                  />
                  <Label
                    htmlFor={`streaming-${service.value}`}
                    className="font-normal cursor-pointer text-sm"
                  >
                    {service.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {streamingServices.includes('other') && (
            <div className="space-y-2">
              <Label htmlFor="tv.otherServices">Other Streaming Services</Label>
              <Input
                id="tv.otherServices"
                {...register('tv.otherServices')}
                placeholder="e.g., Peacock, Paramount+"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tv.remoteLocation">Remote Control Location</Label>
              <Input
                id="tv.remoteLocation"
                {...register('tv.remoteLocation')}
                placeholder="e.g., Coffee table drawer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tv.tvInstructions">TV Instructions</Label>
              <Input
                id="tv.tvInstructions"
                {...register('tv.tvInstructions')}
                placeholder="e.g., Press Input to switch sources"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entertainment Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5" />
            Entertainment Options
          </CardTitle>
          <CardDescription>
            Additional entertainment amenities available
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="entertainment.hasSmartTV"
                checked={hasSmartTV}
                onCheckedChange={(checked) => setValue('entertainment.hasSmartTV', checked as boolean)}
              />
              <Label htmlFor="entertainment.hasSmartTV" className="font-normal cursor-pointer">
                Smart TV available
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entertainment.tvCount">Number of TVs</Label>
              <Input
                id="entertainment.tvCount"
                type="number"
                min="0"
                {...register('entertainment.tvCount', { valueAsNumber: true })}
                placeholder="e.g., 2"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="entertainment.hasGamingConsole"
              checked={hasGamingConsole}
              onCheckedChange={(checked) => setValue('entertainment.hasGamingConsole', checked as boolean)}
            />
            <Label htmlFor="entertainment.hasGamingConsole" className="font-normal cursor-pointer">
              Gaming console(s) available
            </Label>
          </div>

          {hasGamingConsole && (
            <div className="space-y-2 ml-6">
              <Label htmlFor="entertainment.gamingConsoles">Gaming Consoles (comma-separated)</Label>
              <Input
                id="entertainment.gamingConsoles"
                value={(watch('entertainment.gamingConsoles') || []).join(', ')}
                placeholder="e.g., PlayStation 5, Xbox Series X"
                onChange={(e) => {
                  const value = e.target.value;
                  const consoles = value.split(',').map(s => s.trim()).filter(Boolean);
                  setValue('entertainment.gamingConsoles', consoles);
                }}
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="entertainment.hasBluRayPlayer"
              checked={watch('entertainment.hasBluRayPlayer')}
              onCheckedChange={(checked) => setValue('entertainment.hasBluRayPlayer', checked as boolean)}
            />
            <Label htmlFor="entertainment.hasBluRayPlayer" className="font-normal cursor-pointer">
              Blu-ray/DVD player available
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="entertainment.hasSoundSystem"
              checked={hasSoundSystem}
              onCheckedChange={(checked) => setValue('entertainment.hasSoundSystem', checked as boolean)}
            />
            <Label htmlFor="entertainment.hasSoundSystem" className="font-normal cursor-pointer">
              Sound system available
            </Label>
          </div>

          {hasSoundSystem && (
            <div className="space-y-2 ml-6">
              <Label htmlFor="entertainment.soundSystemInstructions">Sound System Instructions</Label>
              <Textarea
                id="entertainment.soundSystemInstructions"
                {...register('entertainment.soundSystemInstructions')}
                placeholder="e.g., Use Bluetooth to connect, remote is in drawer"
                rows={3}
                className="resize-none"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="entertainment.otherEntertainment">Other Entertainment Options</Label>
            <Textarea
              id="entertainment.otherEntertainment"
              {...register('entertainment.otherEntertainment')}
              placeholder="e.g., Board games in closet, books on shelf"
              rows={3}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Additional Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Instructions</CardTitle>
          <CardDescription>
            Any other connectivity or entertainment information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            {...register('additionalInstructions')}
            placeholder="Any additional notes about WiFi, TV, or entertainment options..."
            rows={4}
            className="resize-none"
          />
        </CardContent>
      </Card>

      {/* Save Status Messages */}
      {saveStatus === 'success' && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-green-800">Connectivity information saved successfully!</span>
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{errorMessage}</span>
        </div>
      )}

      {/* Validation Errors Summary */}
      {Object.keys(errors).length > 0 && (
        <div className="flex items-start gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-yellow-800 font-medium">Please fix the following errors:</p>
            <ul className="list-disc list-inside text-yellow-700 text-sm mt-1">
              {Object.entries(errors).map(([key, error]: [string, any]) => {
                // Handle nested errors
                if (error.message) {
                  return <li key={key}>{error.message}</li>;
                } else if (typeof error === 'object') {
                  // Nested error object - extract all nested messages
                  return Object.entries(error).map(([nestedKey, nestedError]: [string, any]) => (
                    <li key={`${key}.${nestedKey}`}>
                      {nestedError?.message || `Error in ${key}.${nestedKey}`}
                    </li>
                  ));
                }
                return <li key={key}>Error in {key}</li>;
              })}
            </ul>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving} size="lg">
          {isSaving ? 'Saving...' : 'Save Connectivity'}
        </Button>
      </div>
    </form>
  );
}

