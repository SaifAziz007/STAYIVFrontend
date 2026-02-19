import * as z from 'zod';

const parkingOptionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  location: z.string().min(1, 'Location is required'),
  pricing: z.string().min(1, 'Pricing info is required'),
  walkingMinutes: z.number().min(0).optional(),
  notes: z.string().optional(),
});

const streetParkingRuleSchema = z.object({
  street: z.string().min(1, 'Street name is required'),
  restriction: z.string().min(1, 'Restriction is required'),
  permitRequired: z.string().optional(),
});

const nearbyPlaceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().optional(),
  walkingMinutes: z.number().min(0).optional(),
  drivingMinutes: z.number().min(0).optional(),
  notes: z.string().optional(),
});

const transitOptionSchema = z.object({
  stopName: z.string().min(1, 'Stop name is required'),
  address: z.string().optional(),
  walkingMinutes: z.number().min(0).optional(),
  routes: z.array(z.string()).optional(),
  typicalTimeToDowntown: z.string().optional(),
});

export const localAreaSchema = z.object({
  onSiteParkingSummary: z.string().min(5, 'Parking summary must be at least 5 characters'),
  parkingOptions: z.array(parkingOptionSchema).optional(),
  streetParkingRules: z.array(streetParkingRuleSchema).optional(),
  transitStops: z.array(transitOptionSchema).optional(),
  groceryStores: z.array(nearbyPlaceSchema).optional(),
  restaurants: z.array(nearbyPlaceSchema).optional(),
  pharmacies: z.array(nearbyPlaceSchema).optional(),
  nearestEmergencyRoom: z.string().optional(),
  walkabilitySummary: z.string().optional(),
  nearbyAttractions: z.array(z.string()).optional(),
  parkingConstraintsDisclosure: z.string().optional(),
});

export type LocalAreaFormData = z.infer<typeof localAreaSchema>;
