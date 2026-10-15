-- ============================================================
-- PAWCONNECT MIGRATION: INSTRUCTOR-REQUESTED FEATURES (HARDENED)
-- Migration: 20261015000001_instructor_features.sql
--
-- Features implemented:
-- 1. Dog video upload columns & private dog-videos storage bucket
-- 2. Household & family background suitability screening tables (applicant & admin reviews separated)
-- 3. Monthly post-adoption monitoring schedules & welfare reports (adopter & admin reviews separated)
-- ============================================================

-- ------------------------------------------------------------
-- 0. PREREQUISITE FUNCTIONS (Clerk Third-Party Auth & Security Helpers)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_clerk_id()
RETURNS TEXT AS $$
  SELECT COALESCE(auth.jwt() ->> 'sub', '');
$$ LANGUAGE sql STABLE
SET search_path = public, pg_catalog;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE clerk_id = (auth.jwt() ->> 'sub')
      AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, pg_catalog;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_catalog;

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
  
  -- Staff Review Outcome (visible to applicant)
  reviewer_id TEXT REFERENCES public.profiles(clerk_id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_uq_screenings_application_id ON public.household_screenings(application_id);
CREATE INDEX IF NOT EXISTS idx_screenings_applicant_id ON public.household_screenings(applicant_id);
CREATE INDEX IF NOT EXISTS idx_screenings_status ON public.household_screenings(status);
CREATE INDEX IF NOT EXISTS idx_screenings_dog_id ON public.household_screenings(dog_id);

DROP TRIGGER IF EXISTS set_household_screenings_updated_at ON public.household_screenings;
CREATE TRIGGER set_household_screenings_updated_at
  BEFORE UPDATE ON public.household_screenings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS for household_screenings
ALTER TABLE public.household_screenings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Applicants or admin can view screening records" ON public.household_screenings;
DROP POLICY IF EXISTS "Applicants can submit screening" ON public.household_screenings;
DROP POLICY IF EXISTS "Applicants can submit pending screening" ON public.household_screenings;
DROP POLICY IF EXISTS "Admins can update screening" ON public.household_screenings;
DROP POLICY IF EXISTS "Only admins can update screening" ON public.household_screenings;
DROP POLICY IF EXISTS "Only admins can delete screening" ON public.household_screenings;

CREATE POLICY "Applicants or admin can view screening records"
  ON public.household_screenings FOR SELECT
  TO authenticated
  USING (
    applicant_id = public.current_user_clerk_id()
    OR public.is_admin()
  );

-- Hardened INSERT: Applicants can ONLY insert with status = 'pending' and NULL reviewer fields
CREATE POLICY "Applicants can submit pending screening"
  ON public.household_screenings FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      applicant_id = public.current_user_clerk_id()
      AND status = 'pending'
      AND reviewer_id IS NULL
      AND reviewed_at IS NULL
      AND rejection_reason IS NULL
    )
    OR public.is_admin()
  );

-- Only admins can update status or review decisions
CREATE POLICY "Only admins can update screening"
  ON public.household_screenings FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete screening"
  ON public.household_screenings FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Database-level immutability enforcement: Prevent non-admins from modifying decisions or identities
CREATE OR REPLACE FUNCTION protect_household_screening_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF NEW.status IS DISTINCT FROM OLD.status OR
       NEW.reviewer_id IS DISTINCT FROM OLD.reviewer_id OR
       NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at OR
       NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason OR
       NEW.applicant_id IS DISTINCT FROM OLD.applicant_id OR
       NEW.application_id IS DISTINCT FROM OLD.application_id OR
       NEW.dog_id IS DISTINCT FROM OLD.dog_id THEN
      RAISE EXCEPTION 'Applicants cannot modify screening review decisions or identity fields.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog;

DROP TRIGGER IF EXISTS trg_protect_household_screening_fields ON public.household_screenings;
CREATE TRIGGER trg_protect_household_screening_fields
  BEFORE UPDATE ON public.household_screenings
  FOR EACH ROW
  EXECUTE FUNCTION protect_household_screening_fields();

-- ------------------------------------------------------------
-- 4. PRIVATE HOUSEHOLD SCREENING ADMIN REVIEWS (Separated for column privacy)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.household_screening_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screening_id UUID UNIQUE NOT NULL REFERENCES public.household_screenings(id) ON DELETE CASCADE,
  reviewer_id TEXT NOT NULL REFERENCES public.profiles(clerk_id) ON DELETE CASCADE,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_uq_screening_reviews_screening_id ON public.household_screening_reviews(screening_id);

DROP TRIGGER IF EXISTS set_household_screening_reviews_updated_at ON public.household_screening_reviews;
CREATE TRIGGER set_household_screening_reviews_updated_at
  BEFORE UPDATE ON public.household_screening_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.household_screening_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can access screening reviews" ON public.household_screening_reviews;

-- Strict admin-only access: normal applicants cannot select, insert, update, or delete
CREATE POLICY "Only admins can access screening reviews"
  ON public.household_screening_reviews
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- 5. MONTHLY POST-ADOPTION MONITORING SCHEDULES & WELFARE REPORTS
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
  
  -- Staff Review Outcome (visible to adopter)
  reviewer_id TEXT REFERENCES public.profiles(clerk_id),
  reviewed_at TIMESTAMPTZ,
  requires_additional_followup BOOLEAN DEFAULT false,
  additional_followup_instructions TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_app_followup_month UNIQUE (application_id, month_number)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_uq_app_followup_month ON public.post_adoption_followups(application_id, month_number);
CREATE INDEX IF NOT EXISTS idx_followups_application_id ON public.post_adoption_followups(application_id);
CREATE INDEX IF NOT EXISTS idx_followups_adopter_id ON public.post_adoption_followups(adopter_id);
CREATE INDEX IF NOT EXISTS idx_followups_dog_id ON public.post_adoption_followups(dog_id);
CREATE INDEX IF NOT EXISTS idx_followups_status ON public.post_adoption_followups(status);
CREATE INDEX IF NOT EXISTS idx_followups_due_date ON public.post_adoption_followups(due_date);

DROP TRIGGER IF EXISTS set_post_adoption_followups_updated_at ON public.post_adoption_followups;
CREATE TRIGGER set_post_adoption_followups_updated_at
  BEFORE UPDATE ON public.post_adoption_followups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS for post_adoption_followups
ALTER TABLE public.post_adoption_followups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Adopters or admin can view followups" ON public.post_adoption_followups;
DROP POLICY IF EXISTS "Admin or system can create followups" ON public.post_adoption_followups;
DROP POLICY IF EXISTS "Only admin can create followups" ON public.post_adoption_followups;
DROP POLICY IF EXISTS "Adopters or admin can update followups" ON public.post_adoption_followups;
DROP POLICY IF EXISTS "Adopters can submit report for own scheduled followups" ON public.post_adoption_followups;
DROP POLICY IF EXISTS "Only admins can delete followups" ON public.post_adoption_followups;

CREATE POLICY "Adopters or admin can view followups"
  ON public.post_adoption_followups FOR SELECT
  TO authenticated
  USING (
    adopter_id = public.current_user_clerk_id()
    OR public.is_admin()
  );

-- Hardened INSERT: Normal users CANNOT create followups. Only admin workflow can create schedule.
CREATE POLICY "Only admin can create followups"
  ON public.post_adoption_followups FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Hardened UPDATE: Adopters can only submit reports for their own upcoming/due/needs_follow_up followups.
CREATE POLICY "Adopters can submit report for own scheduled followups"
  ON public.post_adoption_followups FOR UPDATE
  TO authenticated
  USING (
    (
      adopter_id = public.current_user_clerk_id()
      AND status IN ('upcoming', 'due', 'needs_follow_up')
    )
    OR public.is_admin()
  )
  WITH CHECK (
    (
      adopter_id = public.current_user_clerk_id()
      AND status = 'submitted'
      AND reviewer_id IS NULL
      AND reviewed_at IS NULL
    )
    OR public.is_admin()
  );

CREATE POLICY "Only admins can delete followups"
  ON public.post_adoption_followups FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Database-level immutability enforcement: Prevent non-admins from modifying schedule, identity, or review fields
CREATE OR REPLACE FUNCTION protect_post_adoption_followup_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF NEW.adopter_id IS DISTINCT FROM OLD.adopter_id OR
       NEW.application_id IS DISTINCT FROM OLD.application_id OR
       NEW.dog_id IS DISTINCT FROM OLD.dog_id OR
       NEW.month_number IS DISTINCT FROM OLD.month_number OR
       NEW.due_date IS DISTINCT FROM OLD.due_date OR
       NEW.reviewer_id IS DISTINCT FROM OLD.reviewer_id OR
       NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at OR
       NEW.requires_additional_followup IS DISTINCT FROM OLD.requires_additional_followup OR
       NEW.additional_followup_instructions IS DISTINCT FROM OLD.additional_followup_instructions THEN
      RAISE EXCEPTION 'Adopters cannot modify administrative, schedule, or identity fields.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog;

DROP TRIGGER IF EXISTS trg_protect_post_adoption_followup_fields ON public.post_adoption_followups;
CREATE TRIGGER trg_protect_post_adoption_followup_fields
  BEFORE UPDATE ON public.post_adoption_followups
  FOR EACH ROW
  EXECUTE FUNCTION protect_post_adoption_followup_fields();

-- ------------------------------------------------------------
-- 6. PRIVATE POST-ADOPTION FOLLOW-UP ADMIN REVIEWS (Separated for column privacy)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_adoption_followup_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  followup_id UUID UNIQUE NOT NULL REFERENCES public.post_adoption_followups(id) ON DELETE CASCADE,
  reviewer_id TEXT NOT NULL REFERENCES public.profiles(clerk_id) ON DELETE CASCADE,
  admin_notes TEXT,
  requires_additional_followup BOOLEAN DEFAULT false,
  additional_followup_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_uq_followup_reviews_followup_id ON public.post_adoption_followup_reviews(followup_id);

DROP TRIGGER IF EXISTS set_post_adoption_followup_reviews_updated_at ON public.post_adoption_followup_reviews;
CREATE TRIGGER set_post_adoption_followup_reviews_updated_at
  BEFORE UPDATE ON public.post_adoption_followup_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.post_adoption_followup_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can access followup reviews" ON public.post_adoption_followup_reviews;

-- Strict admin-only access: normal adopters cannot select, insert, update, or delete
CREATE POLICY "Only admins can access followup reviews"
  ON public.post_adoption_followup_reviews
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- 7. TABLE PERMISSIONS / GRANTS
-- ------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.household_screenings TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.household_screening_reviews TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_adoption_followups TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_adoption_followup_reviews TO authenticated, service_role;
