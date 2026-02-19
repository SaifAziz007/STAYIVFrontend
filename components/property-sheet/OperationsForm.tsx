'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { operationsSchema, type OperationsFormData } from '@/lib/validations/operations.schema';
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
import { AlertCircle, CheckCircle2, Clock, LogOut, Ban, Phone, AlertTriangle, Percent } from 'lucide-react';

interface OperationsFormProps {
  propertyId: string;
  initialData?: any;
  onSave?: () => void;
}

export function OperationsForm({ propertyId, initialData, onSave }: OperationsFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OperationsFormData>({
    resolver: zodResolver(operationsSchema),
    defaultValues: initialData?.operationsData || {
      checkin: { standardTime: '16:00', earlyCheckinAvailable: false, selfCheckin: true },
      checkout: { standardTime: '11:00', lateCheckoutAvailable: false },
      cancellation: { policyType: 'moderate', description: '' },
      support: { primaryPhone: '', supportHours: '8:00 AM - 10:00 PM', afterHoursInstructions: '' },
      incidents: { powerOutageSteps: '', noHeatSteps: '', waterOutageSteps: '', pestReportSteps: '', cleaningIssueSteps: '' },
    },
  });

  const onSubmit = async (data: OperationsFormData) => {
    setIsSaving(true);
    setSaveStatus('idle');
    setErrorMessage('');
    try {
      await apiClient.patch(`/property-sheets/${propertyId}/operations`, data);
      setSaveStatus('success');
      onSave?.();
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error: any) {
      setSaveStatus('error');
      setErrorMessage(error.response?.data?.message || 'Failed to save operations');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Check-in Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Check-in Policy
          </CardTitle>
          <CardDescription>Standard and early check-in times and conditions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Standard Check-in Time *</Label>
              <Input type="time" {...register('checkin.standardTime')} />
              {errors.checkin?.standardTime && <p className="text-sm text-red-500">{errors.checkin.standardTime.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Earliest Possible Check-in</Label>
              <Input type="time" {...register('checkin.earliestCheckinTime')} />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="earlyCheckinAvailable"
              checked={watch('checkin.earlyCheckinAvailable')}
              onCheckedChange={(checked) => setValue('checkin.earlyCheckinAvailable', checked as boolean)}
            />
            <Label htmlFor="earlyCheckinAvailable" className="font-normal cursor-pointer">
              Early check-in available
            </Label>
          </div>
          {watch('checkin.earlyCheckinAvailable') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Early Check-in Fee ($)</Label>
                <Input type="number" {...register('checkin.earlyCheckinFee', { valueAsNumber: true })} placeholder="e.g., 25" />
              </div>
              <div className="space-y-2">
                <Label>Conditions</Label>
                <Input {...register('checkin.earlyCheckinConditions')} placeholder="e.g., Depends on cleaner schedule" />
              </div>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="selfCheckin"
              checked={watch('checkin.selfCheckin') || false}
              onCheckedChange={(checked) => setValue('checkin.selfCheckin', checked as boolean)}
            />
            <Label htmlFor="selfCheckin" className="font-normal cursor-pointer">
              Self check-in available
            </Label>
          </div>
          <div className="space-y-2">
            <Label>Check-in Notes</Label>
            <Textarea {...register('checkin.checkinNotes')} placeholder="Additional check-in instructions..." rows={2} className="resize-none" />
          </div>
        </CardContent>
      </Card>

      {/* Check-out Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Check-out Policy
          </CardTitle>
          <CardDescription>Standard and late check-out times</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Standard Check-out Time *</Label>
              <Input type="time" {...register('checkout.standardTime')} />
              {errors.checkout?.standardTime && <p className="text-sm text-red-500">{errors.checkout.standardTime.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Latest Possible Check-out</Label>
              <Input type="time" {...register('checkout.latestCheckoutTime')} />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="lateCheckoutAvailable"
              checked={watch('checkout.lateCheckoutAvailable')}
              onCheckedChange={(checked) => setValue('checkout.lateCheckoutAvailable', checked as boolean)}
            />
            <Label htmlFor="lateCheckoutAvailable" className="font-normal cursor-pointer">
              Late check-out available
            </Label>
          </div>
          {watch('checkout.lateCheckoutAvailable') && (
            <div className="space-y-2">
              <Label>Late Check-out Fee ($)</Label>
              <Input type="number" {...register('checkout.lateCheckoutFee', { valueAsNumber: true })} placeholder="e.g., 25" />
            </div>
          )}
          <div className="space-y-2">
            <Label>Check-out Notes</Label>
            <Textarea {...register('checkout.checkoutNotes')} placeholder="Additional check-out notes..." rows={2} className="resize-none" />
          </div>
        </CardContent>
      </Card>

      {/* Cancellation Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5" />
            Cancellation Policy
          </CardTitle>
          <CardDescription>Cancellation terms and refund conditions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Policy Type *</Label>
            <Select
              value={watch('cancellation.policyType')}
              onValueChange={(value) => setValue('cancellation.policyType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select policy type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flexible">Flexible</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="strict">Strict</SelectItem>
                <SelectItem value="super_strict">Super Strict</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea {...register('cancellation.description')} placeholder="Full cancellation policy text..." rows={3} className="resize-none" />
            {errors.cancellation?.description && <p className="text-sm text-red-500">{errors.cancellation.description.message}</p>}
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="refundExceptions"
              checked={watch('cancellation.refundExceptions') || false}
              onCheckedChange={(checked) => setValue('cancellation.refundExceptions', checked as boolean)}
            />
            <Label htmlFor="refundExceptions" className="font-normal cursor-pointer">
              Refund exceptions may apply
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Support Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Support Contact
          </CardTitle>
          <CardDescription>How guests reach you for help</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary Phone *</Label>
              <Input {...register('support.primaryPhone')} placeholder="+1 (555) 123-4567" />
              {errors.support?.primaryPhone && <p className="text-sm text-red-500">{errors.support.primaryPhone.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Backup Phone</Label>
              <Input {...register('support.backupPhone')} placeholder="+1 (555) 987-6543" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Support Hours *</Label>
            <Input {...register('support.supportHours')} placeholder="e.g., 8:00 AM - 10:00 PM" />
            {errors.support?.supportHours && <p className="text-sm text-red-500">{errors.support.supportHours.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>After-Hours Instructions *</Label>
            <Textarea {...register('support.afterHoursInstructions')} placeholder="e.g., Text only after 10 PM. For emergencies, call." rows={3} className="resize-none" />
            {errors.support?.afterHoursInstructions && <p className="text-sm text-red-500">{errors.support.afterHoursInstructions.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Response Time SLA (minutes)</Label>
            <Input type="number" {...register('support.responseTimeSLA', { valueAsNumber: true })} placeholder="e.g., 15" />
          </div>
        </CardContent>
      </Card>

      {/* Incident Protocols */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Incident Protocols
          </CardTitle>
          <CardDescription>What to tell guests when things go wrong</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Power Outage Steps *</Label>
            <Textarea {...register('incidents.powerOutageSteps')} placeholder="Steps for guests when power goes out..." rows={3} className="resize-none" />
            {errors.incidents?.powerOutageSteps && <p className="text-sm text-red-500">{errors.incidents.powerOutageSteps.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>No Heat / Hot Water Steps *</Label>
            <Textarea {...register('incidents.noHeatSteps')} placeholder="Steps for guests when there's no heat or hot water..." rows={3} className="resize-none" />
            {errors.incidents?.noHeatSteps && <p className="text-sm text-red-500">{errors.incidents.noHeatSteps.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Water Outage Steps *</Label>
            <Textarea {...register('incidents.waterOutageSteps')} placeholder="Steps for guests when water is out..." rows={3} className="resize-none" />
            {errors.incidents?.waterOutageSteps && <p className="text-sm text-red-500">{errors.incidents.waterOutageSteps.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Pest Report Steps *</Label>
            <Textarea {...register('incidents.pestReportSteps')} placeholder="Steps for guests when they see pests..." rows={3} className="resize-none" />
            {errors.incidents?.pestReportSteps && <p className="text-sm text-red-500">{errors.incidents.pestReportSteps.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Cleaning Issue Steps *</Label>
            <Textarea {...register('incidents.cleaningIssueSteps')} placeholder="Steps for guests when property is not clean..." rows={3} className="resize-none" />
            {errors.incidents?.cleaningIssueSteps && <p className="text-sm text-red-500">{errors.incidents.cleaningIssueSteps.message}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vendor Response SLA (hours)</Label>
              <Input type="number" {...register('incidents.vendorResponseSLA', { valueAsNumber: true })} placeholder="e.g., 4" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Relocation Policy</Label>
            <Textarea {...register('incidents.relocationPolicy')} placeholder="What happens if the unit is uninhabitable..." rows={2} className="resize-none" />
          </div>
        </CardContent>
      </Card>

      {/* Discounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Discount Policies
          </CardTitle>
          <CardDescription>Long-stay and gap-night discounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Weekly Discount (%)</Label>
              <Input type="number" {...register('discounts.weeklyDiscount', { valueAsNumber: true })} placeholder="e.g., 10" />
            </div>
            <div className="space-y-2">
              <Label>Monthly Discount (%)</Label>
              <Input type="number" {...register('discounts.monthlyDiscount', { valueAsNumber: true })} placeholder="e.g., 20" />
            </div>
            <div className="space-y-2">
              <Label>Gap Night Discount (%)</Label>
              <Input type="number" {...register('discounts.gapNightDiscount', { valueAsNumber: true })} placeholder="e.g., 15" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Discount Notes</Label>
            <Textarea {...register('discounts.discountNotes')} placeholder="Additional discount policy notes..." rows={2} className="resize-none" />
          </div>
        </CardContent>
      </Card>

      {saveStatus === 'success' && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-green-800">Operations saved successfully!</span>
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
          {isSaving ? 'Saving...' : 'Save Operations'}
        </Button>
      </div>
    </form>
  );
}
