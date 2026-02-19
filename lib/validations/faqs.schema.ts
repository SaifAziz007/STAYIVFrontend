import * as z from 'zod';

const faqEntrySchema = z.object({
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required'),
  category: z.string().min(1, 'Category is required'),
  propertyScope: z.string().optional(),
  platformScope: z.string().optional(),
  confidence: z.number().min(0).max(100),
  escalationRequired: z.boolean().optional(),
  synonyms: z.array(z.string()).optional(),
  lastVerifiedAt: z.string().optional(),
});

const troubleshootingPlaybookSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  title: z.string().min(1, 'Title is required'),
  guestSteps: z.array(z.string()).min(1, 'At least one guest step is required'),
  internalSteps: z.array(z.string()).min(1, 'At least one internal step is required'),
  escalationTrigger: z.string().min(1, 'Escalation trigger is required'),
  vendorSLA: z.string().optional(),
});

const preCheckinChecklistItemSchema = z.object({
  item: z.string().min(1, 'Item is required'),
  priority: z.string().min(1, 'Priority is required'),
  verificationMethod: z.string().optional(),
});

export const faqsSchema = z.object({
  faqs: z.array(faqEntrySchema).min(1, 'At least one FAQ is required'),
  troubleshootingPlaybooks: z.array(troubleshootingPlaybookSchema).optional(),
  preCheckinChecklist: z.array(preCheckinChecklistItemSchema).optional(),
});

export type FAQsFormData = z.infer<typeof faqsSchema>;
