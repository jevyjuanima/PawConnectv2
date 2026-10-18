-- ============================================================
-- PAWCONNECT MIGRATION: FOLLOW-UP VIDEO COLUMN
-- Migration: 20261018000001_followup_video.sql
--
-- Additive change only:
--   1. Adds optional video_storage_path TEXT column to post_adoption_followups.
--   2. Updates protect_post_adoption_followup_fields trigger function to
--      validate that the new column belongs to the adopter''s path prefix.
--
-- This migration does NOT:
--   - Recreate, drop, or modify any existing tables, columns, or indexes.
--   - Modify existing RLS policies.
--   - Touch any data rows.
--   - Apply a migration to the live database automatically.
-- ============================================================

-- 1. Add optional video_storage_path column to post_adoption_followups
ALTER TABLE public.post_adoption_followups
  ADD COLUMN IF NOT EXISTS video_storage_path TEXT;

-- 2. Update field-protection trigger to include video_storage_path ownership check.
CREATE OR REPLACE FUNCTION public.protect_post_adoption_followup_fields()
RETURNS TRIGGER AS $func$
BEGIN
  IF NOT public.is_admin() THEN
    -- Non-admins cannot create follow-up schedules
    IF TG_OP = 'INSERT' THEN
      RAISE EXCEPTION 'Only administrators can create follow-up schedules.';
    ELSIF TG_OP = 'UPDATE' THEN
      -- 1. Prevent modification of reviewed reports
      IF OLD.status = 'reviewed' THEN
        RAISE EXCEPTION 'Reviewed follow-up reports are finalized and cannot be modified.';
      END IF;

      -- 2. Prevent modification of reports while pending staff review
      IF OLD.status = 'submitted' THEN
        RAISE EXCEPTION 'Submitted follow-up reports cannot be modified while pending staff review.';
      END IF;

      -- 3. Only allow transitions from upcoming, due, or needs_follow_up to submitted
      IF OLD.status NOT IN ('upcoming', 'due', 'needs_follow_up') THEN
        RAISE EXCEPTION 'Invalid follow-up status transition from current state.';
      END IF;

      IF NEW.status != 'submitted' THEN
        RAISE EXCEPTION 'Adopters can only transition follow-up status to submitted.';
      END IF;

      -- 4. Prevent tampering with administrative, schedule, or identity fields
      IF NEW.id IS DISTINCT FROM OLD.id OR
         NEW.adopter_id IS DISTINCT FROM OLD.adopter_id OR
         NEW.application_id IS DISTINCT FROM OLD.application_id OR
         NEW.dog_id IS DISTINCT FROM OLD.dog_id OR
         NEW.month_number IS DISTINCT FROM OLD.month_number OR
         NEW.due_date IS DISTINCT FROM OLD.due_date OR
         NEW.reviewer_id IS DISTINCT FROM OLD.reviewer_id OR
         NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at OR
         NEW.requires_additional_followup IS DISTINCT FROM OLD.requires_additional_followup OR
         NEW.additional_followup_instructions IS DISTINCT FROM OLD.additional_followup_instructions OR
         NEW.created_at IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION 'Adopters cannot modify administrative, schedule, or identity fields.';
      END IF;

      -- 5. Validate required report fields upon submission
      IF NEW.submitted_at IS NULL THEN
        RAISE EXCEPTION 'Submission timestamp is required when submitting a monthly report.';
      END IF;

      IF NEW.general_health IS NULL OR length(trim(NEW.general_health)) = 0 THEN
        RAISE EXCEPTION 'General health description is required.';
      END IF;

      IF NEW.eating_behavior_adjustment IS NULL OR length(trim(NEW.eating_behavior_adjustment)) = 0 THEN
        RAISE EXCEPTION 'Eating and behavior adjustment description is required.';
      END IF;

      IF NEW.veterinary_care IS NULL OR length(trim(NEW.veterinary_care)) = 0 THEN
        RAISE EXCEPTION 'Veterinary care details are required.';
      END IF;

      IF NEW.living_environment IS NULL OR length(trim(NEW.living_environment)) = 0 THEN
        RAISE EXCEPTION 'Living environment details are required.';
      END IF;

      -- 6. Prevent tampering with photo_storage_path outside the adopter''s folder
      IF NEW.photo_storage_path IS NOT NULL AND length(trim(NEW.photo_storage_path)) > 0 THEN
        IF NOT (NEW.photo_storage_path LIKE 'dogs/' || NEW.adopter_id || '/%' OR NEW.photo_storage_path LIKE 'followups/' || NEW.adopter_id || '/%') THEN
          RAISE EXCEPTION 'photo_storage_path must belong to the adopter folder.';
        END IF;
      END IF;

      -- 7. Prevent tampering with video_storage_path outside the adopter''s folder
      IF NEW.video_storage_path IS NOT NULL AND length(trim(NEW.video_storage_path)) > 0 THEN
        IF NOT (NEW.video_storage_path LIKE 'dogs/' || NEW.adopter_id || '/%') THEN
          RAISE EXCEPTION 'video_storage_path must belong to the adopter dogs/ folder.';
        END IF;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog;
