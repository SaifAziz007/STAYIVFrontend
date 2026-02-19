import * as z from 'zod';

const laundrySchema = z.object({
  washerAvailable: z.boolean(),
  dryerAvailable: z.boolean(),
  location: z.string().optional(),
  instructions: z.string().optional(),
  limitations: z.string().optional(),
  nearestLaundromat: z.string().optional(),
});

const heatingDetailsSchema = z.object({
  heatingType: z.string().min(1, 'Heating type is required'),
  controlInstructions: z.string().min(10, 'Control instructions must be at least 10 characters'),
  thermostatLocation: z.string().optional(),
  warmUpTime: z.string().optional(),
  backupSpaceHeaterCount: z.number().min(0).optional(),
  spaceHeaterLocation: z.string().optional(),
  knownIssues: z.string().optional(),
});

const hotWaterDetailsSchema = z.object({
  waterHeaterType: z.string().min(1, 'Water heater type is required'),
  recoveryTime: z.string().optional(),
  knownIssues: z.string().optional(),
  winterPrecautions: z.string().optional(),
});

const breakerBoxSchema = z.object({
  location: z.string().min(5, 'Breaker box location must be at least 5 characters'),
  guestAccessible: z.boolean().optional(),
  resetInstructions: z.string().optional(),
  circuitLabels: z.string().optional(),
});

const outdoorSpaceSchema = z.object({
  hasOutdoorSpace: z.boolean(),
  description: z.string().optional(),
  furniture: z.string().optional(),
  fencedYard: z.boolean().optional(),
});

const bedConfigurationSchema = z.object({
  room: z.string().min(1, 'Room name is required'),
  bedType: z.string().min(1, 'Bed type is required'),
  count: z.number().min(1).optional(),
  notes: z.string().optional(),
});

export const detailedAmenitiesSchema = z.object({
  laundry: laundrySchema,
  heating: heatingDetailsSchema,
  hotWater: hotWaterDetailsSchema,
  breakerBox: breakerBoxSchema,
  outdoorSpace: outdoorSpaceSchema.optional(),
  bedConfigurations: z.array(bedConfigurationSchema).optional(),
  extraBeddingLocation: z.string().optional(),
  knownLimitations: z.array(z.string()).optional(),
});

export type DetailedAmenitiesFormData = z.infer<typeof detailedAmenitiesSchema>;
