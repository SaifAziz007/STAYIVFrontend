import * as z from 'zod';

const checkinPolicySchema = z.object({
  standardTime: z.string().min(1, 'Check-in time is required'),
  earlyCheckinAvailable: z.boolean(),
  earlyCheckinFee: z.number().min(0).optional(),
  earliestCheckinTime: z.string().optional(),
  earlyCheckinConditions: z.string().optional(),
  selfCheckin: z.boolean().optional(),
  checkinNotes: z.string().optional(),
});

const checkoutPolicySchema = z.object({
  standardTime: z.string().min(1, 'Check-out time is required'),
  lateCheckoutAvailable: z.boolean(),
  lateCheckoutFee: z.number().min(0).optional(),
  latestCheckoutTime: z.string().optional(),
  checkoutNotes: z.string().optional(),
});

const cancellationPolicySchema = z.object({
  policyType: z.string().min(1, 'Policy type is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  refundExceptions: z.boolean().optional(),
  cancellationNotes: z.string().optional(),
});

const supportFlowSchema = z.object({
  primaryPhone: z.string().min(1, 'Primary phone is required'),
  backupPhone: z.string().optional(),
  supportHours: z.string().min(1, 'Support hours are required'),
  afterHoursInstructions: z.string().min(1, 'After-hours instructions are required'),
  responseTimeSLA: z.number().min(1).optional(),
});

const incidentProtocolSchema = z.object({
  powerOutageSteps: z.string().min(1, 'Power outage steps are required'),
  noHeatSteps: z.string().min(1, 'No heat steps are required'),
  waterOutageSteps: z.string().min(1, 'Water outage steps are required'),
  pestReportSteps: z.string().min(1, 'Pest report steps are required'),
  cleaningIssueSteps: z.string().min(1, 'Cleaning issue steps are required'),
  vendorResponseSLA: z.number().min(1).optional(),
  relocationPolicy: z.string().optional(),
});

const discountPolicySchema = z.object({
  weeklyDiscount: z.number().min(0).optional(),
  monthlyDiscount: z.number().min(0).optional(),
  gapNightDiscount: z.number().min(0).optional(),
  discountNotes: z.string().optional(),
});

export const operationsSchema = z.object({
  checkin: checkinPolicySchema,
  checkout: checkoutPolicySchema,
  cancellation: cancellationPolicySchema,
  support: supportFlowSchema,
  incidents: incidentProtocolSchema,
  discounts: discountPolicySchema.optional(),
});

export type OperationsFormData = z.infer<typeof operationsSchema>;
