-- ============================================================
-- PAWCONNECT MIGRATION: INSTRUCTOR-REQUESTED FEATURES
-- Migration: 20261015000001_instructor_features.sql
--
-- Features implemented:
-- 1. Dog video upload columns & dog-videos storage bucket
-- 2. Household & family background suitability screening table & RLS
-- 3. Monthly post-adoption monitoring schedules & reports table & RLS
-- ============================================================

-- ------------------------------------------------------------
-- 1. EXTEND DOGS TABLE FOR VIDEO SUPPORT
-- ------------------------------------------------------------
ALTER TABLE public.dogs
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS video_storage_path TEXT;

-- ------------------------------------------------------------
-- 2. STORAGE CONFIGURATION FOR DOG VIDEOS (50MB, MP4 & WebM, Private)
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dog-videos',
  'dog-videos',
  false,
  52428800, -- 50MB
  ARRAY['video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['video/mp4', 'video/webm'];

-- Storage Policies for dog-videos
DROP POLICY IF EXISTS "Public read dog videos" ON storage.objects;
DROP POLICY IF EXISTS "Authorized users can read dog videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload dog videos" ON storage.objects;
DROP POLICY IF EXISTS "Owners or admin can update dog videos" ON storage.objects;
DROP POLICY IF EXISTS "Owners or admin can delete dog videos" ON storage.objects;

-- Only authenticated users who own the video path, or admins, or viewers of an approved dog can read
CREATE POLICY "Authorized users can read dog videos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'dog-videos'
    AND (
      public.is_admin()
      OR storage.objects.name LIKE 'dogs/' || public.current_user_clerk_id() || '/%'
      OR EXISTS (
        SELECT 1 FROM public.dogs
        WHERE dogs.video_storage_path = storage.objects.name
        AND dogs.status IN ('available', 'reserved', 'adopted')
      )
    )
  );

CREATE POLICY "Authenticated users can upload dog videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'dog-videos'
    AND (LOWER(storage.extension(name)) IN ('mp4', 'webm'))
    AND (
      public.is_admin()
      OR storage.objects.name LIKE 'dogs/' || public.current_user_clerk_id() || '/%'
    )
  );

CREATE POLICY "Owners or admin can update dog videos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'dog-videos'
    AND (
      public.is_admin()
      OR storage.objects.name LIKE 'dogs/' || public.current_user_clerk_id() || '/%'
    )
  );

CREATE POLICY "Owners or admin can delete dog videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'dog-videos'
    AND (
      public.is_admin()
      OR storage.objects.name LIKE 'dogs/' || public.current_user_clerk_id() || '/%'
    )
  );

-- Ensure updated_at trigger function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- 3. HOUSEHOLD & FAMILY BACKGROUND SUITABILITY SCREENING
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.household_screenings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID UNIQUE NOT NULL REFERENCES public.adoption_applications(id) ON DELETE CASCADE,
  applicant_id TEXT NOT NULL REFERENCES public.profiles(clerk_id) ON DELETE CASCADE,
  dog_id UUID NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  
  -- Household & Suitability Answers
  household_agreement BOOLEAN NOT NULL DEFAULT false,
  housing_type TEXT NOT NULL,
  landlord_permission BOOLEAN,
  has_children BOOLEAN NOT NULL DEFAULT false,
  children_details TEXT,
  household_members_details TEXT NOT NULL,
  existing_pets_details TEXT,
  pet_care_experience TEXT NOT NULL,
  daily_alone_hours INTEGER NOT NULL DEFAULT 0,
  daily_care_arrangements TEXT NOT NULL,
  emergency_vet_care_plan TEXT NOT NULL,
  screening_consent BOOLEAN NOT NULL DEFAULT false,
  
  -- Staff Review & Administrative Record
  reviewer_id TEXT REFERENCES public.profiles(clerk_id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_screenings_application_id ON public.household_screenings(application_id);
CREATE INDEX IF NOT EXISTS idx_screenings_applicant_id ON public.household_screenings(applicant_id);
CREATE INDEX IF NOT EXISTS idx_screenings_status ON public.household_screenings(status);
CREATE INDEX IF NOT EXISTS idx_screenings_dog_id ON public.household_screenings(dog_id);

CREATE OR REPLACE TRIGGER set_household_screenings_updated_at
  BEFORE UPDATE ON public.household_screenings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS for household_screenings
ALTER TABLE public.household_screenings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Applicants or admin can view screening records" ON public.household_screenings;
DROP POLICY IF EXISTS "Applicants can submit screening" ON public.household_screenings;
DROP POLICY IF EXISTS "Admins can update screening" ON public.household_screenings;

CREATE POLICY "Applicants or admin can view screening records"
  ON public.household_screenings FOR SELECT
  USING (
    applicant_id = public.current_user_clerk_id()
    OR public.is_admin()
  );

CREATE POLICY "Applicants can submit screening"
  ON public.household_screenings FOR INSERT
  WITH CHECK (
    applicant_id = public.current_user_clerk_id()
    OR public.is_admin()
  );

CREATE POLICY "Admins can update screening"
  ON public.household_screenings FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- 4. MONTHLY POST-ADOPTION MONITORING SCHEDULES & WELFARE REPORTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_adoption_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.adoption_applications(id) ON DELETE CASCADE,
  dog_id UUID NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  adopter_id TEXT NOT NULL REFERENCES public.profiles(clerk_id) ON DELETE CASCADE,
  month_number INTEGER NOT NULL CHECK (month_number >= 1),
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'due', 'submitted', 'reviewed', 'needs_follow_up')),
  
  -- Adopter Monthly Report Fields
  submitted_at TIMESTAMPTZ,
  general_health TEXT,
  eating_behavior_adjustment TEXT,
  veterinary_care TEXT,
  living_environment TEXT,
  problems_concerns TEXT,
  photo_url TEXT,
  photo_storage_path TEXT,
  
  -- Staff Review & Monitoring Actions
  reviewer_id TEXT REFERENCES public.profiles(clerk_id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  requires_additional_followup BOOLEAN DEFAULT false,
  additional_followup_instructions TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Prevent duplicate schedules for the same application and month
  CONSTRAINT unique_app_followup_month UNIQUE (application_id, month_number)
);

CREATE INDEX IF NOT EXISTS idx_followups_application_id ON public.post_adoption_followups(application_id);
CREATE INDEX IF NOT EXISTS idx_followups_adopter_id ON public.post_adoption_followups(adopter_id);
CREATE INDEX IF NOT EXISTS idx_followups_dog_id ON public.post_adoption_followups(dog_id);
CREATE INDEX IF NOT EXISTS idx_followups_status ON public.post_adoption_followups(status);
CREATE INDEX IF NOT EXISTS idx_followups_due_date ON public.post_adoption_followups(due_date);

CREATE OR REPLACE TRIGGER set_post_adoption_followups_updated_at
  BEFORE UPDATE ON public.post_adoption_followups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS for post_adoption_followups
ALTER TABLE public.post_adoption_followups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Adopters or admin can view followups" ON public.post_adoption_followups;
DROP POLICY IF EXISTS "Admin or system can create followups" ON public.post_adoption_followups;
DROP POLICY IF EXISTS "Adopters or admin can update followups" ON public.post_adoption_followups;

CREATE POLICY "Adopters or admin can view followups"
  ON public.post_adoption_followups FOR SELECT
  USING (
    adopter_id = public.current_user_clerk_id()
    OR public.is_admin()
  );

CREATE POLICY "Admin or system can create followups"
  ON public.post_adoption_followups FOR INSERT
  WITH CHECK (
    auth.jwt() IS NOT NULL
    OR public.is_admin()
  );

CREATE POLICY "Adopters or admin can update followups"
  ON public.post_adoption_followups FOR UPDATE
  USING (
    adopter_id = public.current_user_clerk_id()
    OR public.is_admin()
  )
  WITH CHECK (
    adopter_id = public.current_user_clerk_id()
    OR public.is_admin()
  );
