import { z } from "zod";
import { FOLLOWUP_STATUSES } from "@/lib/constants/statuses";

export const followupReportSchema = z.object({
  followup_id: z.string().uuid("Invalid follow-up identifier"),
  general_health: z
    .string()
    .trim()
    .min(10, "Please describe the dog's general health, coat, weight, and condition")
    .max(1000, "Must not exceed 1000 characters"),
  eating_behavior_adjustment: z
    .string()
    .trim()
    .min(10, "Please describe eating habits, energy level, behavior, and household adjustment")
    .max(1000, "Must not exceed 1000 characters"),
  veterinary_care: z
    .string()
    .trim()
    .min(5, "Please note recent veterinary visits, vaccinations, or ongoing health plans")
    .max(1000, "Must not exceed 1000 characters"),
  living_environment: z
    .string()
    .trim()
    .min(5, "Please describe sleeping arrangements, daily exercise, and environment")
    .max(1000, "Must not exceed 1000 characters"),
  problems_concerns: z.string().trim().max(1000).optional().nullable(),
  photo_url: z.string().url().optional().nullable().or(z.literal("")),
  photo_storage_path: z.string().optional().nullable().or(z.literal("")),
  video_storage_path: z.string().optional().nullable().or(z.literal("")),
});

export type FollowupReportInput = z.infer<typeof followupReportSchema>;

export const followupReviewSchema = z.object({
  followup_id: z.string().uuid("Invalid follow-up identifier"),
  status: z.enum([
    FOLLOWUP_STATUSES.REVIEWED,
    FOLLOWUP_STATUSES.NEEDS_FOLLOW_UP,
  ]),
  admin_notes: z.string().trim().max(2000).optional(),
  requires_additional_followup: z.boolean().default(false),
  additional_followup_instructions: z.string().trim().max(1000).optional(),
});

export type FollowupReviewInput = z.infer<typeof followupReviewSchema>;
