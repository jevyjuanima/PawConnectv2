import { z } from "zod";
import { SCREENING_STATUSES } from "@/lib/constants/statuses";

export const householdScreeningSchema = z.object({
  household_agreement: z.boolean().refine((val) => val === true, {
    message: "All household members must agree to the adoption",
  }),
  housing_type: z.string().min(1, "Please specify your housing arrangement"),
  landlord_permission: z.boolean().optional().nullable(),
  has_children: z.boolean().default(false),
  children_details: z.string().trim().max(500).optional().nullable(),
  household_members_details: z
    .string()
    .trim()
    .min(5, "Please describe the household members and daily routine")
    .max(1000, "Must not exceed 1000 characters"),
  existing_pets_details: z.string().trim().max(1000).optional().nullable(),
  pet_care_experience: z
    .string()
    .trim()
    .min(10, "Please describe your previous pet-care experience")
    .max(1000, "Must not exceed 1000 characters"),
  daily_alone_hours: z.coerce
    .number()
    .int("Hours must be a whole number")
    .min(0, "Hours cannot be negative")
    .max(24, "Cannot exceed 24 hours"),
  daily_care_arrangements: z
    .string()
    .trim()
    .min(10, "Please outline daily care, feeding, and exercise arrangements")
    .max(1000, "Must not exceed 1000 characters"),
  emergency_vet_care_plan: z
    .string()
    .trim()
    .min(10, "Please describe your plan for regular veterinary care and unexpected medical emergencies")
    .max(1000, "Must not exceed 1000 characters"),
  screening_consent: z.boolean().refine((val) => val === true, {
    message: "You must consent to the collection and administrative review of screening answers",
  }),
});

export type HouseholdScreeningInput = z.infer<typeof householdScreeningSchema>;

export const screeningReviewSchema = z.object({
  status: z.enum([
    SCREENING_STATUSES.PENDING,
    SCREENING_STATUSES.UNDER_REVIEW,
    SCREENING_STATUSES.APPROVED,
    SCREENING_STATUSES.REJECTED,
  ]),
  admin_notes: z.string().trim().max(2000).optional(),
  rejection_reason: z.string().trim().max(1000).optional(),
});

export type ScreeningReviewInput = z.infer<typeof screeningReviewSchema>;
