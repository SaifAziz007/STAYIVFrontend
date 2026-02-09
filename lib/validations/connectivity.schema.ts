import * as z from 'zod';

const wifiNetworkSchema = z.object({
  ssid: z.string().min(1, 'WiFi network name (SSID) is required'),
  password: z.string().min(1, 'WiFi password is required'),
  speed: z.string().optional(),
  routerLocation: z.string().min(5, 'Router location must be at least 5 characters'),
  additionalNetworks: z.array(z.object({
    ssid: z.string(),
    password: z.string(),
    description: z.string().optional(),
  })).optional(),
});

const tvServiceSchema = z.object({
  hasCableTV: z.boolean(),
  cableProvider: z.string().optional(),
  cableInstructions: z.string().optional(),
  streamingServices: z.array(z.enum([
    'netflix',
    'hulu',
    'disney_plus',
    'amazon_prime',
    'hbo_max',
    'apple_tv',
    'youtube_tv',
    'other'
  ])).optional(),
  otherServices: z.string().optional(),
  remoteLocation: z.string().optional(),
  tvInstructions: z.string().optional(),
});

const entertainmentSchema = z.object({
  hasSmartTV: z.boolean(),
  tvCount: z.number().min(0).optional(),
  hasGamingConsole: z.boolean().optional(),
  gamingConsoles: z.array(z.string()).optional(),
  hasBluRayPlayer: z.boolean().optional(),
  hasSoundSystem: z.boolean().optional(),
  soundSystemInstructions: z.string().optional(),
  otherEntertainment: z.string().optional(),
});

export const connectivitySchema = z.object({
  wifi: wifiNetworkSchema,
  tv: tvServiceSchema,
  entertainment: entertainmentSchema,
  additionalInstructions: z.string().optional(),
});

export type ConnectivityFormData = z.infer<typeof connectivitySchema>;








