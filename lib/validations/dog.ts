import { z } from "zod";
import { DOG_SIZES, DOG_GENDERS, DOG_STATUSES } from "@/lib/constants/statuses";

export const dogSubmissionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must not exceed 50 characters"),
  breed: z
    .string()
    .trim()
    .min(2, "Breed must be at least 2 characters")
    .max(80, "Breed must not exceed 80 characters"),
  age_years: z.coerce
    .number()
    .int("Age years must be an integer")
    .min(0, "Age cannot be negative")
    .max(25, "Please enter a realistic age"),
  age_months: z.coerce
    .number()
    .int("Age months must be an integer")
    .min(0, "Months cannot be negative")
    .max(11, "Months must be between 0 and 11")
    .default(0),
  gender: z.enum([DOG_GENDERS.MALE, DOG_GENDERS.FEMALE], {
    errorMap: () => ({ message: "Please select gender" }),
  }),
  size: z.enum(
    [
      DOG_SIZES.SMALL,
      DOG_SIZES.MEDIUM,
      DOG_SIZES.LARGE,
      DOG_SIZES.GIANT,
    ],
    {
      errorMap: () => ({ message: "Please select dog size" }),
    }
  ),
  color: z.string().trim().max(50).optional(),
  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description must not exceed 2000 characters"),
  medical_history: z.string().trim().max(1000).optional(),
  vaccinated: z.boolean().default(false),
  spayed_neutered: z.boolean().default(false),
  special_needs: z.string().trim().max(500).optional(),
  location: z
    .string()
    .trim()
    .min(2, "Location is required")
    .max(100, "Location must not exceed 100 characters"),
});

export type DogSubmissionInput = z.infer<typeof dogSubmissionSchema>;

export const dogStatusUpdateSchema = z.object({
  status: z.enum([
    DOG_STATUSES.PENDING,
    DOG_STATUSES.AVAILABLE,
    DOG_STATUSES.RESERVED,
    DOG_STATUSES.ADOPTED,
    DOG_STATUSES.REJECTED,
    DOG_STATUSES.ARCHIVED,
  ]),
  rejection_reason: z.string().trim().max(500).optional(),
});

export type DogStatusUpdateInput = z.infer<typeof dogStatusUpdateSchema>;
