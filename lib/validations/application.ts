import { z } from "zod";
import { APPLICATION_STATUSES } from "@/lib/constants/statuses";

export const HOUSING_TYPES = {
  OWN_HOUSE: "own_house",
  RENT_HOUSE: "rent_house",
  APARTMENT: "apartment",
  CONDO: "condo",
  OTHER: "other",
} as const;

export const EXPERIENCE_LEVELS = {
  FIRST_TIME: "first_time",
  EXPERIENCED: "experienced",
  EXPERT: "expert",
} as const;

export const adoptionApplicationSchema = z.object({
  dog_id: z.string().uuid("Invalid dog selection"),
  housing_type: z.enum(
    [
      HOUSING_TYPES.OWN_HOUSE,
      HOUSING_TYPES.RENT_HOUSE,
      HOUSING_TYPES.APARTMENT,
      HOUSING_TYPES.CONDO,
      HOUSING_TYPES.OTHER,
    ],
    {
      errorMap: () => ({ message: "Please select housing type" }),
    }
  ),
  has_yard: z.boolean().default(false),
  has_other_pets: z.boolean().default(false),
  other_pets_details: z.string().trim().max(500).optional(),
  household_members_count: z.coerce
    .number()
    .int("Members count must be an integer")
    .min(1, "Household must have at least 1 member")
    .max(20, "Please provide a valid count"),
  experience_level: z.enum(
    [
      EXPERIENCE_LEVELS.FIRST_TIME,
      EXPERIENCE_LEVELS.EXPERIENCED,
      EXPERIENCE_LEVELS.EXPERT,
    ],
    {
      errorMap: () => ({ message: "Please select your pet experience level" }),
    }
  ),
  reason_for_adopting: z
    .string()
    .trim()
    .min(30, "Please provide at least 30 characters explaining why you want to adopt this dog")
    .max(2000, "Reason must not exceed 2000 characters"),
});

export type AdoptionApplicationInput = z.infer<typeof adoptionApplicationSchema>;

export const applicationStatusUpdateSchema = z.object({
  status: z.enum([
    APPLICATION_STATUSES.PENDING,
    APPLICATION_STATUSES.UNDER_REVIEW,
    APPLICATION_STATUSES.APPROVED,
    APPLICATION_STATUSES.REJECTED,
    APPLICATION_STATUSES.COMPLETED,
    APPLICATION_STATUSES.CANCELLED,
  ]),
  admin_notes: z.string().trim().max(1000).optional(),
  rejection_reason: z.string().trim().max(500).optional(),
});

export type ApplicationStatusUpdateInput = z.infer<
  typeof applicationStatusUpdateSchema
>;
