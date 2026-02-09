import * as z from 'zod';

const buildingAccessSchema = z.object({
  type: z.enum(['single_unit', 'multi_unit', 'gated_community']),
  entryMethod: z.enum(['key', 'door_code', 'key_card', 'smart_lock', 'intercom']),
  code: z.string().optional(),
  instructions: z.string().min(10, 'Instructions must be at least 10 characters'),
  codeValidity: z.object({
    from: z.enum(['booking', 'checkin', 'day_before']),
    to: z.enum(['checkout', 'day_after', 'custom']),
    customDays: z.number().optional(),
  }).optional(),
});

const unitAccessSchema = z.object({
  entryMethod: z.enum(['key', 'door_code', 'key_card', 'smart_lock', 'lockbox']),
  code: z.string().optional(),
  lockboxLocation: z.string().optional(),
  instructions: z.string().min(10, 'Instructions must be at least 10 characters'),
});

const parkingSchema = z.object({
  type: z.enum(['included', 'paid', 'street', 'none']),
  instructions: z.string().optional(),
  cost: z.number().min(0).optional(),
  permitRequired: z.boolean().optional(),
});

const emergencyContactsSchema = z.object({
  primary: z.string().min(10, 'Primary contact is required'),
  primaryName: z.string().min(2, 'Primary contact name is required'),
  backup: z.string().optional(),
  backupName: z.string().optional(),
  locksmith: z.string().optional(),
  locksmithName: z.string().optional(),
  building: z.string().optional(),
  buildingName: z.string().optional(),
});

export const accessSecuritySchema = z.object({
  buildingAccess: buildingAccessSchema,
  unitAccess: unitAccessSchema,
  parking: parkingSchema,
  emergencyContacts: emergencyContactsSchema,
  additionalInstructions: z.string().optional(),
});

export type AccessSecurityFormData = z.infer<typeof accessSecuritySchema>;








