'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { amenitiesSchema, type AmenitiesFormData } from '@/lib/validations/amenities.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { apiClient } from '@/lib/api-client';
import { AlertCircle, CheckCircle2, ChefHat, Bath, Bed, Shield, Thermometer } from 'lucide-react';

interface AmenitiesFormProps {
  propertyId: string;
  initialData?: any;
}

const KITCHEN_APPLIANCES = [
  { value: 'refrigerator', label: 'Refrigerator' },
  { value: 'stove', label: 'Stove' },
  { value: 'oven', label: 'Oven' },
  { value: 'microwave', label: 'Microwave' },
  { value: 'dishwasher', label: 'Dishwasher' },
  { value: 'coffee_maker', label: 'Coffee Maker' },
  { value: 'toaster', label: 'Toaster' },
  { value: 'blender', label: 'Blender' },
];

export function AmenitiesForm({ propertyId, initialData }: AmenitiesFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AmenitiesFormData>({
    resolver: zodResolver(amenitiesSchema),
    defaultValues: initialData?.amenitiesData || {
      kitchen: {
        hasFullKitchen: false,
        appliances: [],
      },
      bathroom: {
        bathroomCount: 1,
      },
      bedroom: {
        hasLinens: false,
        hasPillows: false,
        hasBlankets: false,
      },
      safety: {
        hasSmokeDetector: false,
      },
      climateControl: {
        hasHeating: false,
        hasAirConditioning: false,
      },
    },
  });

  const hasFullKitchen = watch('kitchen.hasFullKitchen');
  const appliances = watch('kitchen.appliances') || [];
  const hasHeating = watch('climateControl.hasHeating');
  const hasAirConditioning = watch('climateControl.hasAirConditioning');

  const toggleAppliance = (appliance: string) => {
    const current = appliances || [];
    const updated = current.includes(appliance as any)
      ? current.filter((a) => a !== appliance)
      : [...current, appliance as any];
    setValue('kitchen.appliances', updated as any);
  };

  const onSubmit = async (data: AmenitiesFormData) => {
    console.log('Form submitted with data:', data);
    setIsSaving(true);
    setSaveStatus('idle');
    setErrorMessage('');

    try {
      console.log('Making API call to:', `/property-sheets/${propertyId}/amenities`);
      const response = await apiClient.patch(`/property-sheets/${propertyId}/amenities`, data);
      console.log('API response:', response.data);
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error: any) {
      console.error('Error saving amenities:', error);
      setSaveStatus('error');
      setErrorMessage(error.response?.data?.message || 'Failed to save amenities information');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Kitchen Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Kitchen Amenities
          </CardTitle>
          <CardDescription>
            Kitchen appliances and essentials available to guests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="kitchen.hasFullKitchen"
              checked={hasFullKitchen}
              onCheckedChange={(checked) => setValue('kitchen.hasFullKitchen', checked as boolean)}
            />
            <Label htmlFor="kitchen.hasFullKitchen" className="font-normal cursor-pointer">
              Full kitchen available
            </Label>
          </div>

          <div className="space-y-3">
            <Label>Kitchen Appliances</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {KITCHEN_APPLIANCES.map((appliance) => (
                <div key={appliance.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`appliance-${appliance.value}`}
                    checked={appliances.includes(appliance.value as any)}
                    onCheckedChange={() => toggleAppliance(appliance.value)}
                  />
                  <Label
                    htmlFor={`appliance-${appliance.value}`}
                    className="font-normal cursor-pointer text-sm"
                  >
                    {appliance.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="kitchen.cookware"
                checked={watch('kitchen.cookware')}
                onCheckedChange={(checked) => setValue('kitchen.cookware', checked as boolean)}
              />
              <Label htmlFor="kitchen.cookware" className="font-normal cursor-pointer">
                Pots & Pans
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="kitchen.dishes"
                checked={watch('kitchen.dishes')}
                onCheckedChange={(checked) => setValue('kitchen.dishes', checked as boolean)}
              />
              <Label htmlFor="kitchen.dishes" className="font-normal cursor-pointer">
                Dishes & Plates
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="kitchen.utensils"
                checked={watch('kitchen.utensils')}
                onCheckedChange={(checked) => setValue('kitchen.utensils', checked as boolean)}
              />
              <Label htmlFor="kitchen.utensils" className="font-normal cursor-pointer">
                Utensils
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="kitchen.kitchenNotes">Kitchen Notes</Label>
            <Textarea
              id="kitchen.kitchenNotes"
              {...register('kitchen.kitchenNotes')}
              placeholder="e.g., Coffee and tea provided, spices available"
              rows={3}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bathroom Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bath className="h-5 w-5" />
            Bathroom Amenities
          </CardTitle>
          <CardDescription>
            Bathroom essentials and toiletries provided
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bathroom.bathroomCount">Number of Bathrooms *</Label>
            <Input
              id="bathroom.bathroomCount"
              type="number"
              min="1"
              {...register('bathroom.bathroomCount', { valueAsNumber: true })}
            />
            {errors.bathroom?.bathroomCount && (
              <p className="text-sm text-red-500">{errors.bathroom.bathroomCount.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="bathroom.hasShampoo"
                checked={watch('bathroom.hasShampoo')}
                onCheckedChange={(checked) => setValue('bathroom.hasShampoo', checked as boolean)}
              />
              <Label htmlFor="bathroom.hasShampoo" className="font-normal cursor-pointer">
                Shampoo
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="bathroom.hasConditioner"
                checked={watch('bathroom.hasConditioner')}
                onCheckedChange={(checked) => setValue('bathroom.hasConditioner', checked as boolean)}
              />
              <Label htmlFor="bathroom.hasConditioner" className="font-normal cursor-pointer">
                Conditioner
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="bathroom.hasBodyWash"
                checked={watch('bathroom.hasBodyWash')}
                onCheckedChange={(checked) => setValue('bathroom.hasBodyWash', checked as boolean)}
              />
              <Label htmlFor="bathroom.hasBodyWash" className="font-normal cursor-pointer">
                Body Wash
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="bathroom.hasTowels"
                checked={watch('bathroom.hasTowels')}
                onCheckedChange={(checked) => setValue('bathroom.hasTowels', checked as boolean)}
              />
              <Label htmlFor="bathroom.hasTowels" className="font-normal cursor-pointer">
                Towels
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="bathroom.hasHairDryer"
                checked={watch('bathroom.hasHairDryer')}
                onCheckedChange={(checked) => setValue('bathroom.hasHairDryer', checked as boolean)}
              />
              <Label htmlFor="bathroom.hasHairDryer" className="font-normal cursor-pointer">
                Hair Dryer
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="bathroom.hasToiletPaper"
                checked={watch('bathroom.hasToiletPaper')}
                onCheckedChange={(checked) => setValue('bathroom.hasToiletPaper', checked as boolean)}
              />
              <Label htmlFor="bathroom.hasToiletPaper" className="font-normal cursor-pointer">
                Toilet Paper
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bathroom.bathroomNotes">Bathroom Notes</Label>
            <Textarea
              id="bathroom.bathroomNotes"
              {...register('bathroom.bathroomNotes')}
              placeholder="e.g., Extra towels in closet, heated floors"
              rows={3}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bedroom Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bed className="h-5 w-5" />
            Bedroom Amenities
          </CardTitle>
          <CardDescription>
            Bedding and bedroom essentials provided
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="bedroom.hasLinens"
                checked={watch('bedroom.hasLinens')}
                onCheckedChange={(checked) => setValue('bedroom.hasLinens', checked as boolean)}
              />
              <Label htmlFor="bedroom.hasLinens" className="font-normal cursor-pointer">
                Bed Linens *
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="bedroom.hasPillows"
                checked={watch('bedroom.hasPillows')}
                onCheckedChange={(checked) => setValue('bedroom.hasPillows', checked as boolean)}
              />
              <Label htmlFor="bedroom.hasPillows" className="font-normal cursor-pointer">
                Pillows *
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="bedroom.hasBlankets"
                checked={watch('bedroom.hasBlankets')}
                onCheckedChange={(checked) => setValue('bedroom.hasBlankets', checked as boolean)}
              />
              <Label htmlFor="bedroom.hasBlankets" className="font-normal cursor-pointer">
                Blankets *
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="bedroom.hasClosetSpace"
                checked={watch('bedroom.hasClosetSpace')}
                onCheckedChange={(checked) => setValue('bedroom.hasClosetSpace', checked as boolean)}
              />
              <Label htmlFor="bedroom.hasClosetSpace" className="font-normal cursor-pointer">
                Closet Space
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="bedroom.hasHangers"
                checked={watch('bedroom.hasHangers')}
                onCheckedChange={(checked) => setValue('bedroom.hasHangers', checked as boolean)}
              />
              <Label htmlFor="bedroom.hasHangers" className="font-normal cursor-pointer">
                Hangers
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="bedroom.hasIron"
                checked={watch('bedroom.hasIron')}
                onCheckedChange={(checked) => setValue('bedroom.hasIron', checked as boolean)}
              />
              <Label htmlFor="bedroom.hasIron" className="font-normal cursor-pointer">
                Iron & Board
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bedroom.bedroomNotes">Bedroom Notes</Label>
            <Textarea
              id="bedroom.bedroomNotes"
              {...register('bedroom.bedroomNotes')}
              placeholder="e.g., Extra blankets in closet, blackout curtains"
              rows={3}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Safety Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Safety Features
          </CardTitle>
          <CardDescription>
            Safety equipment and emergency information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="safety.hasSmokeDetector"
                checked={watch('safety.hasSmokeDetector')}
                onCheckedChange={(checked) => setValue('safety.hasSmokeDetector', checked as boolean)}
              />
              <Label htmlFor="safety.hasSmokeDetector" className="font-normal cursor-pointer">
                Smoke Detector *
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="safety.hasFireExtinguisher"
                checked={watch('safety.hasFireExtinguisher')}
                onCheckedChange={(checked) => setValue('safety.hasFireExtinguisher', checked as boolean)}
              />
              <Label htmlFor="safety.hasFireExtinguisher" className="font-normal cursor-pointer">
                Fire Extinguisher
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="safety.hasFirstAidKit"
                checked={watch('safety.hasFirstAidKit')}
                onCheckedChange={(checked) => setValue('safety.hasFirstAidKit', checked as boolean)}
              />
              <Label htmlFor="safety.hasFirstAidKit" className="font-normal cursor-pointer">
                First Aid Kit
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="safety.hasCarbonMonoxideDetector"
                checked={watch('safety.hasCarbonMonoxideDetector')}
                onCheckedChange={(checked) => setValue('safety.hasCarbonMonoxideDetector', checked as boolean)}
              />
              <Label htmlFor="safety.hasCarbonMonoxideDetector" className="font-normal cursor-pointer">
                CO Detector
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="safety.emergencyExitPlan">Emergency Exit Plan</Label>
            <Textarea
              id="safety.emergencyExitPlan"
              {...register('safety.emergencyExitPlan')}
              placeholder="e.g., Exit map posted on back of door, nearest exit is..."
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="safety.safetyNotes">Safety Notes</Label>
            <Textarea
              id="safety.safetyNotes"
              {...register('safety.safetyNotes')}
              placeholder="e.g., Emergency services number, hospital location"
              rows={3}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Climate Control Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            Climate Control
          </CardTitle>
          <CardDescription>
            Heating and cooling systems available
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="climateControl.hasHeating"
                  checked={hasHeating}
                  onCheckedChange={(checked) => setValue('climateControl.hasHeating', checked as boolean)}
                />
                <Label htmlFor="climateControl.hasHeating" className="font-normal cursor-pointer">
                  Heating available *
                </Label>
              </div>

              {hasHeating && (
                <div className="ml-6 space-y-2">
                  <Label htmlFor="climateControl.heatingType">Heating Type</Label>
                  <Select
                    value={watch('climateControl.heatingType')}
                    onValueChange={(value) => setValue('climateControl.heatingType', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select heating type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="central">Central Heating</SelectItem>
                      <SelectItem value="space_heater">Space Heater</SelectItem>
                      <SelectItem value="fireplace">Fireplace</SelectItem>
                      <SelectItem value="radiator">Radiator</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="climateControl.hasAirConditioning"
                  checked={hasAirConditioning}
                  onCheckedChange={(checked) => setValue('climateControl.hasAirConditioning', checked as boolean)}
                />
                <Label htmlFor="climateControl.hasAirConditioning" className="font-normal cursor-pointer">
                  Air Conditioning *
                </Label>
              </div>

              {hasAirConditioning && (
                <div className="ml-6 space-y-2">
                  <Label htmlFor="climateControl.acType">AC Type</Label>
                  <Select
                    value={watch('climateControl.acType')}
                    onValueChange={(value) => setValue('climateControl.acType', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select AC type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="central">Central AC</SelectItem>
                      <SelectItem value="window_unit">Window Unit</SelectItem>
                      <SelectItem value="portable">Portable AC</SelectItem>
                      <SelectItem value="split_system">Split System</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="climateControl.hasFans"
              checked={watch('climateControl.hasFans')}
              onCheckedChange={(checked) => setValue('climateControl.hasFans', checked as boolean)}
            />
            <Label htmlFor="climateControl.hasFans" className="font-normal cursor-pointer">
              Fans available
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="climateControl.climateNotes">Climate Control Notes</Label>
            <Textarea
              id="climateControl.climateNotes"
              {...register('climateControl.climateNotes')}
              placeholder="e.g., Thermostat instructions, optimal temperature settings"
              rows={3}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Additional Amenities */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Amenities</CardTitle>
          <CardDescription>
            Any other amenities or features worth mentioning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            {...register('additionalAmenities')}
            placeholder="e.g., Washer/dryer, workspace, outdoor grill, pool access"
            rows={4}
            className="resize-none"
          />
        </CardContent>
      </Card>

      {/* Save Status Messages */}
      {saveStatus === 'success' && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-green-800">Amenities information saved successfully!</span>
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
                if (error.message) {
                  return <li key={key}>{error.message}</li>;
                } else if (typeof error === 'object') {
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
          {isSaving ? 'Saving...' : 'Save Amenities'}
        </Button>
      </div>
    </form>
  );
}








