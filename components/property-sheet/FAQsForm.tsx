'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { faqsSchema, type FAQsFormData } from '@/lib/validations/faqs.schema';
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
import { AlertCircle, CheckCircle2, HelpCircle, Wrench, ClipboardCheck, Plus, Trash2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface FAQsFormProps {
  propertyId: string;
  initialData?: any;
  onSave?: () => void;
}

export function FAQsForm({ propertyId, initialData, onSave }: FAQsFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [expandedPlaybook, setExpandedPlaybook] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FAQsFormData>({
    resolver: zodResolver(faqsSchema),
    defaultValues: initialData?.faqsData || {
      faqs: [],
      troubleshootingPlaybooks: [],
      preCheckinChecklist: [],
    },
  });

  const { fields: faqFields, append: appendFaq, remove: removeFaq } = useFieldArray({ control, name: 'faqs' });
  const { fields: playbookFields } = useFieldArray({ control, name: 'troubleshootingPlaybooks' });
  const { fields: checklistFields, append: appendChecklist, remove: removeChecklist } = useFieldArray({ control, name: 'preCheckinChecklist' });

  const onSubmit = async (data: FAQsFormData) => {
    setIsSaving(true);
    setSaveStatus('idle');
    setErrorMessage('');
    try {
      await apiClient.patch(`/property-sheets/${propertyId}/faqs`, data);
      setSaveStatus('success');
      onSave?.();
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error: any) {
      setSaveStatus('error');
      setErrorMessage(error.response?.data?.message || 'Failed to save FAQs');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSeedFaqs = async () => {
    setIsSeeding(true);
    try {
      const response = await apiClient.post(`/ai/properties/${propertyId}/seed-faqs`);
      const sheetResponse = await apiClient.get(`/property-sheets/${propertyId}`);
      const faqsData = sheetResponse.data.faqsData;
      if (faqsData) {
        reset(faqsData);
      }
      setSaveStatus('success');
      onSave?.();
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error: any) {
      setSaveStatus('error');
      setErrorMessage(error.response?.data?.message || 'Failed to seed FAQs');
    } finally {
      setIsSeeding(false);
    }
  };

  const faqCategories = [
    'access', 'parking', 'wifi', 'checkin', 'checkout',
    'amenities', 'rules', 'local_area', 'billing', 'troubleshooting', 'other',
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Auto-Generate FAQs */}
      {faqFields.length === 0 && (
        <Card className="border-dashed border-blue-300 bg-blue-50/50">
          <CardContent className="pt-6 text-center">
            <Sparkles className="h-10 w-10 text-blue-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Auto-Generate FAQs</h3>
            <p className="text-sm text-gray-600 mb-4">
              Automatically generate FAQs, troubleshooting playbooks, and pre-check-in checklists
              based on your existing property data.
            </p>
            <Button type="button" onClick={handleSeedFaqs} disabled={isSeeding} className="bg-blue-600 hover:bg-blue-700">
              {isSeeding ? 'Generating...' : 'Generate Default FAQs'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* FAQs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            FAQs ({faqFields.length})
          </CardTitle>
          <CardDescription>
            Frequently asked questions that the AI can answer automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {faqFields.map((field, index) => (
            <div key={field.id} className="border rounded-lg overflow-hidden">
              <div
                className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {watch(`faqs.${index}.question`) || `FAQ ${index + 1}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {watch(`faqs.${index}.category`) || 'No category'} • Confidence: {watch(`faqs.${index}.confidence`) || 0}%
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); removeFaq(index); }}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                  {expandedFaq === index ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
              {expandedFaq === index && (
                <div className="p-4 space-y-3">
                  <div className="space-y-2">
                    <Label>Question *</Label>
                    <Input {...register(`faqs.${index}.question`)} placeholder="What would a guest ask?" />
                  </div>
                  <div className="space-y-2">
                    <Label>Answer *</Label>
                    <Textarea {...register(`faqs.${index}.answer`)} placeholder="Complete answer for the guest..." rows={3} className="resize-none" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={watch(`faqs.${index}.category`)}
                        onValueChange={(value) => setValue(`faqs.${index}.category`, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {faqCategories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat.replace('_', ' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Confidence (0-100)</Label>
                      <Input type="number" {...register(`faqs.${index}.confidence`, { valueAsNumber: true })} min={0} max={100} />
                    </div>
                    <div className="flex items-end pb-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`escalation-${index}`}
                          checked={watch(`faqs.${index}.escalationRequired`) || false}
                          onCheckedChange={(checked) => setValue(`faqs.${index}.escalationRequired`, checked as boolean)}
                        />
                        <Label htmlFor={`escalation-${index}`} className="font-normal cursor-pointer text-sm">
                          Needs escalation
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendFaq({
              question: '',
              answer: '',
              category: 'other',
              confidence: 80,
              escalationRequired: false,
            })}
          >
            <Plus className="h-4 w-4 mr-2" /> Add FAQ
          </Button>
        </CardContent>
      </Card>

      {/* Troubleshooting Playbooks (read-only display, auto-generated) */}
      {playbookFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Troubleshooting Playbooks ({playbookFields.length})
            </CardTitle>
            <CardDescription>
              Deterministic troubleshooting flows for common guest issues (auto-generated)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {playbookFields.map((field, index) => (
              <div key={field.id} className="border rounded-lg overflow-hidden">
                <div
                  className="flex items-center justify-between p-3 bg-orange-50 cursor-pointer hover:bg-orange-100"
                  onClick={() => setExpandedPlaybook(expandedPlaybook === index ? null : index)}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {watch(`troubleshootingPlaybooks.${index}.title`) || `Playbook ${index + 1}`}
                    </p>
                  </div>
                  {expandedPlaybook === index ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
                {expandedPlaybook === index && (
                  <div className="p-4 space-y-3 text-sm">
                    <div>
                      <p className="font-semibold text-gray-700 mb-1">Guest Steps:</p>
                      <ol className="list-decimal list-inside space-y-1 text-gray-600">
                        {(watch(`troubleshootingPlaybooks.${index}.guestSteps`) || []).map((step: string, i: number) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700 mb-1">Escalation Trigger:</p>
                      <p className="text-gray-600">{watch(`troubleshootingPlaybooks.${index}.escalationTrigger`)}</p>
                    </div>
                    {watch(`troubleshootingPlaybooks.${index}.vendorSLA`) && (
                      <div>
                        <p className="font-semibold text-gray-700 mb-1">Vendor SLA:</p>
                        <p className="text-gray-600">{watch(`troubleshootingPlaybooks.${index}.vendorSLA`)}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pre-Check-in Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Pre-Check-in Checklist ({checklistFields.length})
          </CardTitle>
          <CardDescription>
            Items to verify before each guest arrival to prevent common issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {checklistFields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input {...register(`preCheckinChecklist.${index}.item`)} placeholder="Checklist item" className="md:col-span-2" />
                <Select
                  value={watch(`preCheckinChecklist.${index}.priority`)}
                  onValueChange={(value) => setValue(`preCheckinChecklist.${index}.priority`, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeChecklist(index)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendChecklist({ item: '', priority: 'high' })}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Checklist Item
          </Button>
        </CardContent>
      </Card>

      {saveStatus === 'success' && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-green-800">FAQs and knowledge base saved successfully!</span>
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
          {isSaving ? 'Saving...' : 'Save FAQs & Knowledge Base'}
        </Button>
      </div>
    </form>
  );
}
