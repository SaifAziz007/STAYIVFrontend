'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { rulesSchema, type RulesFormData } from '@/lib/validations/rules.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';
import { AlertCircle, CheckCircle2, Volume2, Cigarette, PawPrint, PartyPopper, LogOut, Plus, Trash2 } from 'lucide-react';

interface RulesFormProps {
  propertyId: string;
  initialData?: any;
  onSave?: () => void;
}

export function RulesForm({ propertyId, initialData, onSave }: RulesFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RulesFormData>({
    resolver: zodResolver(rulesSchema),
    defaultValues: initialData?.rulesData || {
      noise: { quietHoursStart: '22:00', quietHoursEnd: '08:00', hasNoiseMonitor: false },
      smoking: { smokingAllowed: false },
      pets: { petsAllowed: false },
      parties: { partiesAllowed: false },
      checkout: { checkoutChecklist: ['Take out trash', 'Wash dishes', 'Lock the door'] },
    },
  });

  const [checklistItems, setChecklistItems] = useState<string[]>(
    initialData?.rulesData?.checkout?.checkoutChecklist || ['Take out trash', 'Wash dishes', 'Lock the door']
  );

  const onSubmit = async (data: RulesFormData) => {
    setIsSaving(true);
    setSaveStatus('idle');
    setErrorMessage('');
    try {
      await apiClient.patch(`/property-sheets/${propertyId}/rules`, data);
      setSaveStatus('success');
      onSave?.();
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error: any) {
      setSaveStatus('error');
      setErrorMessage(error.response?.data?.message || 'Failed to save rules');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Noise Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Noise Rules
          </CardTitle>
          <CardDescription>Quiet hours and noise monitoring</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quiet Hours Start *</Label>
              <Input type="time" {...register('noise.quietHoursStart')} />
              {errors.noise?.quietHoursStart && <p className="text-sm text-red-500">{errors.noise.quietHoursStart.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Quiet Hours End *</Label>
              <Input type="time" {...register('noise.quietHoursEnd')} />
              {errors.noise?.quietHoursEnd && <p className="text-sm text-red-500">{errors.noise.quietHoursEnd.message}</p>}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasNoiseMonitor"
              checked={watch('noise.hasNoiseMonitor')}
              onCheckedChange={(checked) => setValue('noise.hasNoiseMonitor', checked as boolean)}
            />
            <Label htmlFor="hasNoiseMonitor" className="font-normal cursor-pointer">
              Noise monitoring device installed (e.g., Minut sensor)
            </Label>
          </div>
          {watch('noise.hasNoiseMonitor') && (
            <div className="space-y-2">
              <Label>Monitor Type</Label>
              <Input {...register('noise.noiseMonitorType')} placeholder="e.g., Minut" />
            </div>
          )}
          <div className="space-y-2">
            <Label>Additional Noise Notes</Label>
            <Textarea {...register('noise.noiseNotes')} placeholder="Any additional noise-related notes..." rows={2} className="resize-none" />
          </div>
        </CardContent>
      </Card>

      {/* Smoking Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cigarette className="h-5 w-5" />
            Smoking Rules
          </CardTitle>
          <CardDescription>Smoking policy and monitoring</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="smokingAllowed"
              checked={watch('smoking.smokingAllowed')}
              onCheckedChange={(checked) => setValue('smoking.smokingAllowed', checked as boolean)}
            />
            <Label htmlFor="smokingAllowed" className="font-normal cursor-pointer">
              Smoking allowed on property
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasSmokeMonitor"
              checked={watch('smoking.hasSmokeMonitor') || false}
              onCheckedChange={(checked) => setValue('smoking.hasSmokeMonitor', checked as boolean)}
            />
            <Label htmlFor="hasSmokeMonitor" className="font-normal cursor-pointer">
              Smoke monitor installed (e.g., FreshAir)
            </Label>
          </div>
          {!watch('smoking.smokingAllowed') && (
            <div className="space-y-2">
              <Label>Smoking Violation Fine ($)</Label>
              <Input type="number" {...register('smoking.smokingFineAmount', { valueAsNumber: true })} placeholder="e.g., 250" />
            </div>
          )}
          <div className="space-y-2">
            <Label>Smoking Notes</Label>
            <Textarea {...register('smoking.smokingNotes')} placeholder="Additional smoking policy notes..." rows={2} className="resize-none" />
          </div>
        </CardContent>
      </Card>

      {/* Pet Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PawPrint className="h-5 w-5" />
            Pet Rules
          </CardTitle>
          <CardDescription>Pet policy, fees, and restrictions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="petsAllowed"
              checked={watch('pets.petsAllowed')}
              onCheckedChange={(checked) => setValue('pets.petsAllowed', checked as boolean)}
            />
            <Label htmlFor="petsAllowed" className="font-normal cursor-pointer">
              Pets allowed
            </Label>
          </div>
          {watch('pets.petsAllowed') && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pet Fee ($/night)</Label>
                  <Input type="number" {...register('pets.petFeePerNight', { valueAsNumber: true })} placeholder="e.g., 25" />
                </div>
                <div className="space-y-2">
                  <Label>Max Pet Weight (lbs)</Label>
                  <Input type="number" {...register('pets.maxPetWeight', { valueAsNumber: true })} placeholder="e.g., 50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Pet Restrictions</Label>
                <Input {...register('pets.petRestrictions')} placeholder="e.g., No aggressive breeds" />
              </div>
              <div className="space-y-2">
                <Label>Pet Notes</Label>
                <Textarea {...register('pets.petNotes')} placeholder="e.g., Pets not allowed on furniture, sofas, or beds" rows={2} className="resize-none" />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Party Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PartyPopper className="h-5 w-5" />
            Party & Event Rules
          </CardTitle>
          <CardDescription>Party and gathering policies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="partiesAllowed"
              checked={watch('parties.partiesAllowed')}
              onCheckedChange={(checked) => setValue('parties.partiesAllowed', checked as boolean)}
            />
            <Label htmlFor="partiesAllowed" className="font-normal cursor-pointer">
              Parties and events allowed
            </Label>
          </div>
          <div className="space-y-2">
            <Label>Max Occupancy</Label>
            <Input type="number" {...register('parties.maxOccupancy', { valueAsNumber: true })} placeholder="e.g., 10" />
          </div>
          <div className="space-y-2">
            <Label>Party Notes</Label>
            <Textarea {...register('parties.partyNotes')} placeholder="Additional party/event notes..." rows={2} className="resize-none" />
          </div>
        </CardContent>
      </Card>

      {/* Checkout Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Checkout Checklist
          </CardTitle>
          <CardDescription>Tasks guests should complete before leaving</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {checklistItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={item}
                onChange={(e) => {
                  const updated = [...checklistItems];
                  updated[index] = e.target.value;
                  setChecklistItems(updated);
                  setValue('checkout.checkoutChecklist', updated);
                }}
                placeholder={`Checkout task ${index + 1}`}
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => {
                const updated = checklistItems.filter((_, i) => i !== index);
                setChecklistItems(updated);
                setValue('checkout.checkoutChecklist', updated);
              }}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => {
            const updated = [...checklistItems, ''];
            setChecklistItems(updated);
            setValue('checkout.checkoutChecklist', updated);
          }}>
            <Plus className="h-4 w-4 mr-2" /> Add Task
          </Button>
          <div className="space-y-2">
            <Label>Checkout Notes</Label>
            <Textarea {...register('checkout.checkoutNotes')} placeholder="Additional checkout instructions..." rows={2} className="resize-none" />
          </div>
        </CardContent>
      </Card>

      {/* General */}
      <Card>
        <CardHeader>
          <CardTitle>General Rules</CardTitle>
          <CardDescription>Overall house rules summary and minimum stay</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Minimum Stay (nights)</Label>
            <Input type="number" {...register('minimumStay', { valueAsNumber: true })} placeholder="e.g., 2" />
          </div>
          <div className="space-y-2">
            <Label>General Rules Summary</Label>
            <Textarea {...register('generalRulesSummary')} placeholder="A summary of all house rules for guests..." rows={4} className="resize-none" />
          </div>
          <div className="space-y-2">
            <Label>Furniture Policy</Label>
            <Input {...register('furniturePolicy')} placeholder="e.g., Please do not rearrange furniture" />
          </div>
        </CardContent>
      </Card>

      {saveStatus === 'success' && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-green-800">House rules saved successfully!</span>
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
          {isSaving ? 'Saving...' : 'Save House Rules'}
        </Button>
      </div>
    </form>
  );
}
