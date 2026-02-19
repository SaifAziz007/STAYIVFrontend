'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { detailedAmenitiesSchema, type DetailedAmenitiesFormData } from '@/lib/validations/detailed-amenities.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';
import { AlertCircle, CheckCircle2, WashingMachine, Flame, Droplets, Zap, Trees, BedDouble, Plus, Trash2 } from 'lucide-react';

interface DetailedAmenitiesFormProps {
  propertyId: string;
  initialData?: any;
  onSave?: () => void;
}

export function DetailedAmenitiesForm({ propertyId, initialData, onSave }: DetailedAmenitiesFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DetailedAmenitiesFormData>({
    resolver: zodResolver(detailedAmenitiesSchema),
    defaultValues: initialData?.detailedAmenitiesData || {
      laundry: { washerAvailable: false, dryerAvailable: false },
      heating: { heatingType: '', controlInstructions: '' },
      hotWater: { waterHeaterType: '' },
      breakerBox: { location: '' },
      bedConfigurations: [],
    },
  });

  const { fields: bedFields, append: appendBed, remove: removeBed } = useFieldArray({ control, name: 'bedConfigurations' });

  const onSubmit = async (data: DetailedAmenitiesFormData) => {
    setIsSaving(true);
    setSaveStatus('idle');
    setErrorMessage('');
    try {
      await apiClient.patch(`/property-sheets/${propertyId}/detailed-amenities`, data);
      setSaveStatus('success');
      onSave?.();
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error: any) {
      setSaveStatus('error');
      setErrorMessage(error.response?.data?.message || 'Failed to save detailed amenities');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Laundry */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WashingMachine className="h-5 w-5" />
            Laundry
          </CardTitle>
          <CardDescription>Washer, dryer availability and laundry details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="washerAvailable"
                checked={watch('laundry.washerAvailable')}
                onCheckedChange={(checked) => setValue('laundry.washerAvailable', checked as boolean)}
              />
              <Label htmlFor="washerAvailable" className="font-normal cursor-pointer">Washer available</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dryerAvailable"
                checked={watch('laundry.dryerAvailable')}
                onCheckedChange={(checked) => setValue('laundry.dryerAvailable', checked as boolean)}
              />
              <Label htmlFor="dryerAvailable" className="font-normal cursor-pointer">Dryer available</Label>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Location</Label>
              <Input {...register('laundry.location')} placeholder="e.g., In-unit, basement" />
            </div>
            <div className="space-y-2">
              <Label>Nearest Laundromat</Label>
              <Input {...register('laundry.nearestLaundromat')} placeholder="e.g., Clean City Laundry - 2 blocks" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Instructions</Label>
            <Textarea {...register('laundry.instructions')} placeholder="How to use the washer/dryer..." rows={2} className="resize-none" />
          </div>
          <div className="space-y-2">
            <Label>Known Limitations</Label>
            <Input {...register('laundry.limitations')} placeholder="e.g., Dryer currently out of order" />
          </div>
        </CardContent>
      </Card>

      {/* Heating */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5" />
            Heating System
          </CardTitle>
          <CardDescription>How the heating works and how to control it</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Heating Type *</Label>
            <Select
              value={watch('heating.heatingType')}
              onValueChange={(value) => setValue('heating.heatingType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select heating type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="central">Central Heating</SelectItem>
                <SelectItem value="radiator">Radiator</SelectItem>
                <SelectItem value="space_heater">Space Heater</SelectItem>
                <SelectItem value="fireplace">Fireplace</SelectItem>
                <SelectItem value="mini_split">Mini Split</SelectItem>
                <SelectItem value="baseboard">Baseboard</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.heating?.heatingType && <p className="text-sm text-red-500">{errors.heating.heatingType.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Control Instructions *</Label>
            <Textarea {...register('heating.controlInstructions')} placeholder="Step-by-step instructions on how to turn on/adjust heating..." rows={4} className="resize-none" />
            <p className="text-xs text-muted-foreground">Be very specific: &quot;Turn the thermostat dial clockwise to desired temperature. Wait 20 min for radiators to warm up.&quot;</p>
            {errors.heating?.controlInstructions && <p className="text-sm text-red-500">{errors.heating.controlInstructions.message}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Thermostat Location</Label>
              <Input {...register('heating.thermostatLocation')} placeholder="e.g., Hallway near bedroom" />
            </div>
            <div className="space-y-2">
              <Label>Warm-Up Time</Label>
              <Input {...register('heating.warmUpTime')} placeholder="e.g., 20-30 minutes" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Backup Space Heaters (count)</Label>
              <Input type="number" {...register('heating.backupSpaceHeaterCount', { valueAsNumber: true })} placeholder="e.g., 2" />
            </div>
            <div className="space-y-2">
              <Label>Space Heater Location</Label>
              <Input {...register('heating.spaceHeaterLocation')} placeholder="e.g., Bedroom closet" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Known Issues</Label>
            <Textarea {...register('heating.knownIssues')} placeholder="Any known heating quirks or seasonal issues..." rows={2} className="resize-none" />
          </div>
        </CardContent>
      </Card>

      {/* Hot Water */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5" />
            Hot Water
          </CardTitle>
          <CardDescription>Water heater details and recovery times</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Water Heater Type *</Label>
            <Select
              value={watch('hotWater.waterHeaterType')}
              onValueChange={(value) => setValue('hotWater.waterHeaterType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select water heater type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tank">Tank (traditional)</SelectItem>
                <SelectItem value="tankless">Tankless (on-demand)</SelectItem>
                <SelectItem value="building_shared">Building Shared</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.hotWater?.waterHeaterType && <p className="text-sm text-red-500">{errors.hotWater.waterHeaterType.message}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Recovery Time</Label>
              <Input {...register('hotWater.recoveryTime')} placeholder="e.g., 20-30 min for tank refill" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Winter Precautions</Label>
            <Input {...register('hotWater.winterPrecautions')} placeholder="e.g., Keep faucets on a drip during extreme cold" />
          </div>
          <div className="space-y-2">
            <Label>Known Issues</Label>
            <Input {...register('hotWater.knownIssues')} placeholder="e.g., Takes a moment to get hot water in the kitchen" />
          </div>
        </CardContent>
      </Card>

      {/* Breaker Box */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Breaker Box / Electrical Panel
          </CardTitle>
          <CardDescription>Location and reset instructions for the breaker box</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Breaker Box Location *</Label>
            <Input {...register('breakerBox.location')} placeholder="e.g., Basement stairwell, behind the door on the left" />
            <p className="text-xs text-muted-foreground">Be very specific — guests need to find this during a power outage in the dark.</p>
            {errors.breakerBox?.location && <p className="text-sm text-red-500">{errors.breakerBox.location.message}</p>}
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="guestAccessible"
              checked={watch('breakerBox.guestAccessible') || false}
              onCheckedChange={(checked) => setValue('breakerBox.guestAccessible', checked as boolean)}
            />
            <Label htmlFor="guestAccessible" className="font-normal cursor-pointer">Guest can access breaker box</Label>
          </div>
          <div className="space-y-2">
            <Label>Reset Instructions</Label>
            <Textarea {...register('breakerBox.resetInstructions')} placeholder="e.g., Flip tripped breaker (middle position) fully OFF, then back ON." rows={3} className="resize-none" />
          </div>
          <div className="space-y-2">
            <Label>Circuit Labels</Label>
            <Input {...register('breakerBox.circuitLabels')} placeholder="e.g., #1 Kitchen, #2 Living Room, #3 Master Bedroom" />
          </div>
        </CardContent>
      </Card>

      {/* Outdoor Space */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trees className="h-5 w-5" />
            Outdoor Space
          </CardTitle>
          <CardDescription>Patio, yard, and outdoor amenities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasOutdoorSpace"
              checked={watch('outdoorSpace.hasOutdoorSpace') || false}
              onCheckedChange={(checked) => setValue('outdoorSpace.hasOutdoorSpace', checked as boolean)}
            />
            <Label htmlFor="hasOutdoorSpace" className="font-normal cursor-pointer">Outdoor space available</Label>
          </div>
          {watch('outdoorSpace.hasOutdoorSpace') && (
            <>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input {...register('outdoorSpace.description')} placeholder="e.g., Large backyard with patio" />
              </div>
              <div className="space-y-2">
                <Label>Outdoor Furniture</Label>
                <Input {...register('outdoorSpace.furniture')} placeholder="e.g., Table, 4 chairs, BBQ grill" />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fencedYard"
                  checked={watch('outdoorSpace.fencedYard') || false}
                  onCheckedChange={(checked) => setValue('outdoorSpace.fencedYard', checked as boolean)}
                />
                <Label htmlFor="fencedYard" className="font-normal cursor-pointer">Fenced yard</Label>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Bed Configurations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BedDouble className="h-5 w-5" />
            Bed Configuration
          </CardTitle>
          <CardDescription>Detailed sleeping arrangements per room</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {bedFields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 bg-gray-50 rounded-lg">
              <Input {...register(`bedConfigurations.${index}.room`)} placeholder="Room name" />
              <Select
                value={watch(`bedConfigurations.${index}.bedType`)}
                onValueChange={(value) => setValue(`bedConfigurations.${index}.bedType`, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Bed type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="king">King</SelectItem>
                  <SelectItem value="queen">Queen</SelectItem>
                  <SelectItem value="full">Full</SelectItem>
                  <SelectItem value="twin">Twin</SelectItem>
                  <SelectItem value="pull-out sofa">Pull-out Sofa</SelectItem>
                  <SelectItem value="air mattress">Air Mattress</SelectItem>
                  <SelectItem value="bunk bed">Bunk Bed</SelectItem>
                </SelectContent>
              </Select>
              <Input type="number" {...register(`bedConfigurations.${index}.count`, { valueAsNumber: true })} placeholder="Count" />
              <div className="flex gap-2">
                <Input {...register(`bedConfigurations.${index}.notes`)} placeholder="Notes" />
                <Button type="button" variant="ghost" size="sm" onClick={() => removeBed(index)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => appendBed({ room: '', bedType: '', count: 1 })}>
            <Plus className="h-4 w-4 mr-2" /> Add Bed
          </Button>
          <div className="space-y-2">
            <Label>Extra Bedding Location</Label>
            <Input {...register('extraBeddingLocation')} placeholder="e.g., Under the couch in the front room" />
          </div>
        </CardContent>
      </Card>

      {saveStatus === 'success' && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-green-800">Detailed amenities saved successfully!</span>
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
          {isSaving ? 'Saving...' : 'Save Detailed Amenities'}
        </Button>
      </div>
    </form>
  );
}
