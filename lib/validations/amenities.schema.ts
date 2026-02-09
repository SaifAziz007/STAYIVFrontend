import * as z from 'zod';

const kitchenSchema = z.object({
  hasFullKitchen: z.boolean(),
  appliances: z.array(z.enum([
    'refrigerator',
    'stove',
    'oven',
    'microwave',
    'dishwasher',
    'coffee_maker',
    'toaster',
    'blender',
  ])).optional(),
  cookware: z.boolean().optional(),
  dishes: z.boolean().optional(),
  utensils: z.boolean().optional(),
  basicEssentials: z.array(z.string()).optional(),
  kitchenNotes: z.string().optional(),
});

const bathroomSchema = z.object({
  bathroomCount: z.number().min(1, 'At least 1 bathroom is required'),
  hasShampoo: z.boolean().optional(),
  hasConditioner: z.boolean().optional(),
  hasBodyWash: z.boolean().optional(),
  hasTowels: z.boolean().optional(),
  hasHairDryer: z.boolean().optional(),
  hasToiletPaper: z.boolean().optional(),
  bathroomNotes: z.string().optional(),
});

const bedroomSchema = z.object({
  hasLinens: z.boolean(),
  hasPillows: z.boolean(),
  hasBlankets: z.boolean(),
  hasClosetSpace: z.boolean().optional(),
  hasHangers: z.boolean().optional(),
  hasIron: z.boolean().optional(),
  bedroomNotes: z.string().optional(),
});

const safetySchema = z.object({
  hasSmokeDetector: z.boolean(),
  hasFireExtinguisher: z.boolean().optional(),
  hasFirstAidKit: z.boolean().optional(),
  hasCarbonMonoxideDetector: z.boolean().optional(),
  emergencyExitPlan: z.string().optional(),
  safetyNotes: z.string().optional(),
});

const climateControlSchema = z.object({
  hasHeating: z.boolean(),
  heatingType: z.enum(['central', 'space_heater', 'fireplace', 'radiator', 'other']).optional(),
  hasAirConditioning: z.boolean(),
  acType: z.enum(['central', 'window_unit', 'portable', 'split_system', 'other']).optional(),
  hasFans: z.boolean().optional(),
  climateNotes: z.string().optional(),
});

export const amenitiesSchema = z.object({
  kitchen: kitchenSchema,
  bathroom: bathroomSchema,
  bedroom: bedroomSchema,
  safety: safetySchema,
  climateControl: climateControlSchema,
  additionalAmenities: z.string().optional(),
});

export type AmenitiesFormData = z.infer<typeof amenitiesSchema>;








