'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { accessSecuritySchema, type AccessSecurityFormData } from '@/lib/validations/access-security.schema';
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
import { AlertCircle, CheckCircle2, Key, MapPin, Phone, Building2 } from 'lucide-react';

interface AccessSecurityFormProps {
  propertyId: string;
  initialData?: any;
}

export function AccessSecurityForm({ propertyId, initialData }: AccessSecurityFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AccessSecurityFormData>({
    resolver: zodResolver(accessSecuritySchema),
    defaultValues: initialData?.accessData || {
      buildingAccess: {
        type: 'single_unit',
        entryMethod: 'key',
        instructions: '',
      },
      unitAccess: {
        entryMethod: 'key',
        instructions: '',
      },
      parking: {
        type: 'none',
      },
      emergencyContacts: {
        primary: '',
        primaryName: '',
      },
    },
  });

  const buildingAccessType = watch('buildingAccess.type');
  const buildingEntryMethod = watch('buildingAccess.entryMethod');
  const unitEntryMethod = watch('unitAccess.entryMethod');
  const parkingType = watch('parking.type');

  const onSubmit = async (data: AccessSecurityFormData) => {
    console.log('Form submitted with data:', data);
    setIsSaving(true);
    setSaveStatus('idle');
    setErrorMessage('');

    try {
      console.log('Making API call to:', `/property-sheets/${propertyId}/access`);
      const response = await apiClient.patch(`/property-sheets/${propertyId}/access`, data);
      console.log('API response:', response.data);
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error: any) {
      console.error('Error saving access & security:', error);
      setSaveStatus('error');
      setErrorMessage(error.response?.data?.message || 'Failed to save access & security information');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Building Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Building Access
          </CardTitle>
          <CardDescription>
            How guests enter the building or property complex
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="buildingAccessType">Building Type *</Label>
              <Select
                value={watch('buildingAccess.type')}
                onValueChange={(value) => setValue('buildingAccess.type', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select building type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single_unit">Single Unit (House)</SelectItem>
                  <SelectItem value="multi_unit">Multi-Unit (Apartment)</SelectItem>
                  <SelectItem value="gated_community">Gated Community</SelectItem>
                </SelectContent>
              </Select>
              {errors.buildingAccess?.type && (
                <p className="text-sm text-red-500">{errors.buildingAccess.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="buildingEntryMethod">Entry Method *</Label>
              <Select
                value={watch('buildingAccess.entryMethod')}
                onValueChange={(value) => setValue('buildingAccess.entryMethod', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select entry method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="key">Physical Key</SelectItem>
                  <SelectItem value="door_code">Door Code</SelectItem>
                  <SelectItem value="key_card">Key Card</SelectItem>
                  <SelectItem value="smart_lock">Smart Lock</SelectItem>
                  <SelectItem value="intercom">Intercom</SelectItem>
                </SelectContent>
              </Select>
              {errors.buildingAccess?.entryMethod && (
                <p className="text-sm text-red-500">{errors.buildingAccess.entryMethod.message}</p>
              )}
            </div>
          </div>

          {(buildingEntryMethod === 'door_code' || buildingEntryMethod === 'smart_lock') && (
            <div className="space-y-2">
              <Label htmlFor="buildingAccessCode">Access Code</Label>
              <Input
                id="buildingAccessCode"
                {...register('buildingAccess.code')}
                placeholder="e.g., 1234#"
              />
              {errors.buildingAccess?.code && (
                <p className="text-sm text-red-500">{errors.buildingAccess.code.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="buildingInstructions">Entry Instructions *</Label>
            <Textarea
              id="buildingInstructions"
              {...register('buildingAccess.instructions')}
              placeholder="Detailed step-by-step instructions for entering the building..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Be specific: "Enter code 1234#, push door firmly, take elevator to 3rd floor"
            </p>
            {errors.buildingAccess?.instructions && (
              <p className="text-sm text-red-500">{errors.buildingAccess.instructions.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Unit Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Unit Access
          </CardTitle>
          <CardDescription>
            How guests enter the specific unit/apartment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unitEntryMethod">Entry Method *</Label>
              <Select
                value={watch('unitAccess.entryMethod')}
                onValueChange={(value) => setValue('unitAccess.entryMethod', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select entry method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="key">Physical Key</SelectItem>
                  <SelectItem value="door_code">Door Code</SelectItem>
                  <SelectItem value="key_card">Key Card</SelectItem>
                  <SelectItem value="smart_lock">Smart Lock</SelectItem>
                  <SelectItem value="lockbox">Lockbox</SelectItem>
                </SelectContent>
              </Select>
              {errors.unitAccess?.entryMethod && (
                <p className="text-sm text-red-500">{errors.unitAccess.entryMethod.message}</p>
              )}
            </div>

            {(unitEntryMethod === 'door_code' || unitEntryMethod === 'smart_lock') && (
              <div className="space-y-2">
                <Label htmlFor="unitAccessCode">Access Code</Label>
                <Input
                  id="unitAccessCode"
                  {...register('unitAccess.code')}
                  placeholder="e.g., 5678"
                />
                {errors.unitAccess?.code && (
                  <p className="text-sm text-red-500">{errors.unitAccess.code.message}</p>
                )}
              </div>
            )}

            {unitEntryMethod === 'lockbox' && (
              <div className="space-y-2">
                <Label htmlFor="lockboxLocation">Lockbox Location</Label>
                <Input
                  id="lockboxLocation"
                  {...register('unitAccess.lockboxLocation')}
                  placeholder="e.g., On the door handle"
                />
                {errors.unitAccess?.lockboxLocation && (
                  <p className="text-sm text-red-500">{errors.unitAccess.lockboxLocation.message}</p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="unitInstructions">Entry Instructions *</Label>
            <Textarea
              id="unitInstructions"
              {...register('unitAccess.instructions')}
              placeholder="Detailed instructions for entering the unit..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Include details like which door, key location, lockbox code, etc.
            </p>
            {errors.unitAccess?.instructions && (
              <p className="text-sm text-red-500">{errors.unitAccess.instructions.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Parking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Parking
          </CardTitle>
          <CardDescription>
            Parking availability and instructions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="parkingType">Parking Type *</Label>
            <Select
              value={watch('parking.type')}
              onValueChange={(value) => setValue('parking.type', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parking type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="included">Included (Free)</SelectItem>
                <SelectItem value="paid">Paid Parking</SelectItem>
                <SelectItem value="street">Street Parking</SelectItem>
                <SelectItem value="none">No Parking</SelectItem>
              </SelectContent>
            </Select>
            {errors.parking?.type && (
              <p className="text-sm text-red-500">{errors.parking.type.message}</p>
            )}
          </div>

          {parkingType !== 'none' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="parkingInstructions">Parking Instructions</Label>
                <Textarea
                  id="parkingInstructions"
                  {...register('parking.instructions')}
                  placeholder="Where to park, spot number, access instructions..."
                  rows={3}
                  className="resize-none"
                />
                {errors.parking?.instructions && (
                  <p className="text-sm text-red-500">{errors.parking.instructions.message}</p>
                )}
              </div>

              {parkingType === 'paid' && (
                <div className="space-y-2">
                  <Label htmlFor="parkingCost">Cost (per day)</Label>
                  <Input
                    id="parkingCost"
                    type="number"
                    step="0.01"
                    {...register('parking.cost', { valueAsNumber: true })}
                    placeholder="e.g., 15.00"
                  />
                  {errors.parking?.cost && (
                    <p className="text-sm text-red-500">{errors.parking.cost.message}</p>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="permitRequired"
                  checked={watch('parking.permitRequired')}
                  onCheckedChange={(checked) => setValue('parking.permitRequired', checked as boolean)}
                />
                <Label htmlFor="permitRequired" className="font-normal cursor-pointer">
                  Parking permit required
                </Label>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Emergency Contacts
          </CardTitle>
          <CardDescription>
            Important contacts for guests in case of issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryName">Primary Contact Name *</Label>
              <Input
                id="primaryName"
                {...register('emergencyContacts.primaryName')}
                placeholder="e.g., John Smith"
              />
              {errors.emergencyContacts?.primaryName && (
                <p className="text-sm text-red-500">{errors.emergencyContacts.primaryName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="primary">Primary Contact Phone *</Label>
              <Input
                id="primary"
                {...register('emergencyContacts.primary')}
                placeholder="e.g., +1 (555) 123-4567"
              />
              {errors.emergencyContacts?.primary && (
                <p className="text-sm text-red-500">{errors.emergencyContacts.primary.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="backupName">Backup Contact Name</Label>
              <Input
                id="backupName"
                {...register('emergencyContacts.backupName')}
                placeholder="e.g., Jane Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="backup">Backup Contact Phone</Label>
              <Input
                id="backup"
                {...register('emergencyContacts.backup')}
                placeholder="e.g., +1 (555) 987-6543"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="locksmithName">Locksmith Name</Label>
              <Input
                id="locksmithName"
                {...register('emergencyContacts.locksmithName')}
                placeholder="e.g., 24/7 Locksmith"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="locksmith">Locksmith Phone</Label>
              <Input
                id="locksmith"
                {...register('emergencyContacts.locksmith')}
                placeholder="e.g., +1 (555) 111-2222"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="buildingName">Building Manager Name</Label>
              <Input
                id="buildingName"
                {...register('emergencyContacts.buildingName')}
                placeholder="e.g., Property Management Co."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="building">Building Manager Phone</Label>
              <Input
                id="building"
                {...register('emergencyContacts.building')}
                placeholder="e.g., +1 (555) 333-4444"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Instructions</CardTitle>
          <CardDescription>
            Any other important access or security information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            {...register('additionalInstructions')}
            placeholder="Any additional notes about access, security, or special instructions..."
            rows={4}
            className="resize-none"
          />
        </CardContent>
      </Card>

      {/* Save Status Messages */}
      {saveStatus === 'success' && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-green-800">Access & Security information saved successfully!</span>
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
              {Object.entries(errors).map(([key, error]) => (
                <li key={key}>{error.message || `Error in ${key}`}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving} size="lg">
          {isSaving ? 'Saving...' : 'Save Access & Security'}
        </Button>
      </div>
    </form>
  );
}








