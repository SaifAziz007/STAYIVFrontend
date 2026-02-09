import * as z from 'zod';

const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  unit: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'ZIP code is required'),
  country: z.string().min(1, 'Country is required'),
});

const coordinatesSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

const specificationsSchema = z.object({
  bedrooms: z.number().min(1, 'At least 1 bedroom required').max(20),
  bathrooms: z.number().min(1, 'At least 1 bathroom required').max(10),
  squareFeet: z.number().min(1).optional(),
  maxGuests: z.number().min(1, 'At least 1 guest required').max(50),
});

const photoSchema = z.object({
  id: z.string(),
  url: z.string().min(1, 'Photo URL is required'), // Accept both URLs and base64
  caption: z.string().optional(),
  order: z.number(),
});

const listingUrlsSchema = z.object({
  airbnb: z.string().url('Invalid Airbnb URL').optional().or(z.literal('')),
  bookingCom: z.string().url('Invalid Booking.com URL').optional().or(z.literal('')),
  vrbo: z.string().url('Invalid VRBO URL').optional().or(z.literal('')),
});

export const propertyIdentitySchema = z.object({
  propertyName: z.string().min(3, 'Property name must be at least 3 characters').max(100),
  propertyType: z.enum(['apartment', 'house', 'condo', 'villa', 'townhouse', 'other']),
  address: addressSchema,
  coordinates: coordinatesSchema.optional(),
  specifications: specificationsSchema,
  photos: z.array(photoSchema).min(1, 'At least 1 photo is required').max(20, 'Maximum 20 photos allowed'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  listingUrls: listingUrlsSchema.optional(),
});

export type PropertyIdentityFormData = z.infer<typeof propertyIdentitySchema>;

