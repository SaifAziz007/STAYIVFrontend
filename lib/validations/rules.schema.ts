import * as z from 'zod';

const noiseRulesSchema = z.object({
  quietHoursStart: z.string().min(1, 'Quiet hours start time is required'),
  quietHoursEnd: z.string().min(1, 'Quiet hours end time is required'),
  hasNoiseMonitor: z.boolean(),
  noiseMonitorType: z.string().optional(),
  noiseNotes: z.string().optional(),
});

const smokingRulesSchema = z.object({
  smokingAllowed: z.boolean(),
  hasSmokeMonitor: z.boolean().optional(),
  smokingFineAmount: z.number().min(0).optional(),
  smokingNotes: z.string().optional(),
});

const petRulesSchema = z.object({
  petsAllowed: z.boolean(),
  petFeePerNight: z.number().min(0).optional(),
  maxPetWeight: z.number().min(0).optional(),
  petRestrictions: z.string().optional(),
  petNotes: z.string().optional(),
});

const partyRulesSchema = z.object({
  partiesAllowed: z.boolean(),
  maxOccupancy: z.number().min(0).optional(),
  partyNotes: z.string().optional(),
});

const checkoutRulesSchema = z.object({
  checkoutChecklist: z.array(z.string()).min(1, 'At least one checkout task is required'),
  checkoutNotes: z.string().optional(),
});

export const rulesSchema = z.object({
  noise: noiseRulesSchema,
  smoking: smokingRulesSchema,
  pets: petRulesSchema,
  parties: partyRulesSchema,
  checkout: checkoutRulesSchema,
  minimumStay: z.number().min(1).max(365).optional(),
  generalRulesSummary: z.string().optional(),
  furniturePolicy: z.string().optional(),
});

export type RulesFormData = z.infer<typeof rulesSchema>;
