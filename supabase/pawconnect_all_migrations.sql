-- ============================================================
-- PAWCONNECT COMPLETE MIGRATION SCRIPT
-- Apply this entire file in Supabase SQL Editor in one run.
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- MIGRATION 1: Initial Schema
-- PawConnect: Initial Relational Database Schema
-- Follows SKILLS.md architectural specification

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to automatically update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_catalog;

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_clerk_id ON public.profiles(clerk_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 2. DOGS TABLE
CREATE TABLE IF NOT EXISTS public.dogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id TEXT NOT NULL REFERENCES public.profiles(clerk_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  breed TEXT NOT NULL,
  age_years INTEGER NOT NULL CHECK (age_years >= 0),
  age_months INTEGER NOT NULL DEFAULT 0 CHECK (age_months >= 0 AND age_months < 12),
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  size TEXT NOT NULL CHECK (size IN ('small', 'medium', 'large', 'giant')),
  color TEXT,
  description TEXT NOT NULL,
  medical_history TEXT,
  vaccinated BOOLEAN NOT NULL DEFAULT false,
  spayed_neutered BOOLEAN NOT NULL DEFAULT false,
  special_needs TEXT,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'reserved', 'adopted', 'rejected', 'archived')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dogs_owner_id ON public.dogs(owner_id);
CREATE INDEX IF NOT EXISTS idx_dogs_status ON public.dogs(status);
CREATE INDEX IF NOT EXISTS idx_dogs_size ON public.dogs(size);
CREATE INDEX IF NOT EXISTS idx_dogs_breed ON public.dogs(breed);
CREATE INDEX IF NOT EXISTS idx_dogs_created_at ON public.dogs(created_at DESC);

CREATE TRIGGER set_dogs_updated_at
  BEFORE UPDATE ON public.dogs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3. DOG IMAGES TABLE
CREATE TABLE IF NOT EXISTS public.dog_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id UUID NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dog_images_dog_id ON public.dog_images(dog_id);
CREATE INDEX IF NOT EXISTS idx_dog_images_is_primary ON public.dog_images(dog_id, is_primary);

-- 4. ADOPTION APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.adoption_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id UUID NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  applicant_id TEXT NOT NULL REFERENCES public.profiles(clerk_id) ON DELETE CASCADE,
  housing_type TEXT NOT NULL CHECK (housing_type IN ('own_house', 'rent_house', 'apartment', 'condo', 'other')),
  has_yard BOOLEAN NOT NULL DEFAULT false,
  has_other_pets BOOLEAN NOT NULL DEFAULT false,
  other_pets_details TEXT,
  household_members_count INTEGER NOT NULL CHECK (household_members_count > 0),
  experience_level TEXT NOT NULL CHECK (experience_level IN ('first_time', 'experienced', 'expert')),
  reason_for_adopting TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'completed', 'cancelled')),
  admin_notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Prevent multiple active applications from the same applicant on the same dog
  CONSTRAINT unique_applicant_dog_active UNIQUE (dog_id, applicant_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_dog_id ON public.adoption_applications(dog_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON public.adoption_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.adoption_applications(status);

CREATE TRIGGER set_applications_updated_at
  BEFORE UPDATE ON public.adoption_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(clerk_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('application_status', 'rehome_status', 'system')),
  reference_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(user_id, is_read);


-- MIGRATION 2: Row Level Security
-- PawConnect: Row Level Security (RLS) Policies
-- Follows SKILLS.md Section 9 & 14

-- 1. Helper function to check if requesting user has 'admin' role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- 1. Trusted Supabase service_role connection (used exclusively by trusted server-side admin client)
  IF (
    current_setting('role', true) = 'service_role'
    OR current_user = 'service_role'
    OR (auth.role() = 'service_role' AND (auth.jwt() ->> 'iss') = 'supabase')
  ) THEN
    RETURN TRUE;
  END IF;

  -- 2. Authenticated Clerk user: verify administrator role in profiles table
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.clerk_id = (auth.jwt() ->> 'sub')
      AND profiles.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, pg_catalog;

-- 2. Helper function to get current user's clerk ID
CREATE OR REPLACE FUNCTION public.current_user_clerk_id()
RETURNS TEXT AS $$
  SELECT COALESCE(auth.jwt() ->> 'sub', '');
$$ LANGUAGE sql STABLE
SET search_path = public, pg_catalog;

---------------------------------------------------------
-- PROFILES RLS
---------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated or anonymous can view basic profiles (needed for dog owner details)
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- User can insert their own profile upon registration (or via webhook/server action)
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (
    (clerk_id = public.current_user_clerk_id() AND role = 'user')
    OR public.is_admin()
  );

-- Users can update their own profile; normal users cannot elevate role to admin
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (
    clerk_id = public.current_user_clerk_id()
    OR public.is_admin()
  )
  WITH CHECK (
    (clerk_id = public.current_user_clerk_id() AND role = (SELECT role FROM public.profiles WHERE clerk_id = public.current_user_clerk_id()))
    OR public.is_admin()
  );

---------------------------------------------------------
-- DOGS RLS
---------------------------------------------------------
ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;

-- Public can view dogs that are available or reserved.
-- Owners can view their own dogs regardless of status.
-- Admins can view all dogs regardless of status.
CREATE POLICY "Dogs are viewable based on status and ownership"
  ON public.dogs FOR SELECT
  USING (
    status IN ('available', 'reserved', 'adopted')
    OR owner_id = public.current_user_clerk_id()
    OR public.is_admin()
  );

-- Authenticated users can insert dogs where owner_id is themselves and status is 'pending'
CREATE POLICY "Users can submit dogs for rehoming"
  ON public.dogs FOR INSERT
  WITH CHECK (
    owner_id = public.current_user_clerk_id()
    AND status = 'pending'
  );

-- Owners can update their dog details ONLY while status is 'pending'.
-- Admins can update any dog at any time (including status transitions).
CREATE POLICY "Owners can update pending dogs or admins can update any dog"
  ON public.dogs FOR UPDATE
  USING (
    (owner_id = public.current_user_clerk_id() AND status = 'pending')
    OR public.is_admin()
  )
  WITH CHECK (
    (owner_id = public.current_user_clerk_id() AND status = 'pending')
    OR public.is_admin()
  );

-- Owners can delete their dog ONLY while status is 'pending'.
-- Admins can delete or archive any dog.
CREATE POLICY "Owners can delete pending dogs or admins can delete any dog"
  ON public.dogs FOR DELETE
  USING (
    (owner_id = public.current_user_clerk_id() AND status = 'pending')
    OR public.is_admin()
  );

---------------------------------------------------------
-- DOG IMAGES RLS
---------------------------------------------------------
ALTER TABLE public.dog_images ENABLE ROW LEVEL SECURITY;

-- Images are viewable if the parent dog is viewable
CREATE POLICY "Dog images viewable if dog is viewable"
  ON public.dog_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.dogs
      WHERE dogs.id = dog_images.dog_id
        AND (
          dogs.status IN ('available', 'reserved', 'adopted')
          OR dogs.owner_id = public.current_user_clerk_id()
          OR public.is_admin()
        )
    )
  );

-- Owners can add images to their dog while pending; admin can add to any
CREATE POLICY "Owners can add images to pending dogs"
  ON public.dog_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dogs
      WHERE dogs.id = dog_images.dog_id
        AND (
          (dogs.owner_id = public.current_user_clerk_id() AND dogs.status = 'pending')
          OR public.is_admin()
        )
    )
  );

-- Owners can delete images from their dog while pending; admin can delete any
CREATE POLICY "Owners can delete images from pending dogs"
  ON public.dog_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.dogs
      WHERE dogs.id = dog_images.dog_id
        AND (
          (dogs.owner_id = public.current_user_clerk_id() AND dogs.status = 'pending')
          OR public.is_admin()
        )
    )
  );

---------------------------------------------------------
-- ADOPTION APPLICATIONS RLS
---------------------------------------------------------
ALTER TABLE public.adoption_applications ENABLE ROW LEVEL SECURITY;

-- Applicants can view their own applications.
-- Dog owners can view applications for their dogs.
-- Admins can view all applications.
CREATE POLICY "Applications viewable by applicant, dog owner, or admin"
  ON public.adoption_applications FOR SELECT
  USING (
    applicant_id = public.current_user_clerk_id()
    OR EXISTS (
      SELECT 1 FROM public.dogs
      WHERE dogs.id = adoption_applications.dog_id
        AND dogs.owner_id = public.current_user_clerk_id()
    )
    OR public.is_admin()
  );

-- Authenticated users can submit applications for available dogs (and cannot apply to adopt their own dog)
CREATE POLICY "Users can apply for available dogs"
  ON public.adoption_applications FOR INSERT
  WITH CHECK (
    applicant_id = public.current_user_clerk_id()
    AND status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.dogs
      WHERE dogs.id = adoption_applications.dog_id
        AND dogs.status = 'available'
        AND dogs.owner_id != public.current_user_clerk_id()
    )
  );

-- Applicants can withdraw/cancel their application.
-- Admins can update status, admin_notes, and rejection_reason.
CREATE POLICY "Applicants can cancel or admins can update applications"
  ON public.adoption_applications FOR UPDATE
  USING (
    (applicant_id = public.current_user_clerk_id() AND status IN ('pending', 'under_review'))
    OR public.is_admin()
  )
  WITH CHECK (
    (applicant_id = public.current_user_clerk_id() AND status = 'cancelled')
    OR public.is_admin()
  );

---------------------------------------------------------
-- NOTIFICATIONS RLS
---------------------------------------------------------
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (
    user_id = public.current_user_clerk_id()
    OR public.is_admin()
  );

-- Notifications can be inserted by service role or system actions
CREATE POLICY "System or admin can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Users can mark their own notifications as read
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = public.current_user_clerk_id())
  WITH CHECK (user_id = public.current_user_clerk_id());

-- Users can dismiss/delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (user_id = public.current_user_clerk_id());


-- MIGRATION 3: Storage Setup
-- PawConnect: Supabase Storage Configuration for Dog Photos
-- Follows SKILLS.md Section 10 & 15

-- 1. Create the dog-photos storage bucket (public read enabled for CDN access)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dog-photos',
  'dog-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 2. Storage Policies on storage.objects

-- Allow public read access to all objects in the dog-photos bucket
CREATE POLICY "Public read dog photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'dog-photos');

-- Allow authenticated users to upload dog photos into dog-photos bucket
CREATE POLICY "Authenticated users can upload dog photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'dog-photos'
    AND (LOWER(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp'))
  );

-- Allow users to update their own uploads or admins to update any
CREATE POLICY "Owners or admin can update dog photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'dog-photos'
    AND (owner = auth.uid()::text OR public.is_admin())
  );

-- Allow users to delete their own uploads or admins to delete any
CREATE POLICY "Owners or admin can delete dog photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'dog-photos'
    AND (owner = auth.uid()::text OR public.is_admin())
  );


-- MIGRATION 4: State Machine & Concurrency
-- PawConnect: State Machine Integrity, Concurrency Locks, and Security Hardening
-- Migration: 20260928000004_state_machine_and_concurrency.sql

-- 1. Partial Unique Indexes to prevent multiple approved or completed adoptions for the same dog
-- This prevents race conditions at the database level even under concurrent admin operations.
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_approved_app_per_dog 
  ON public.adoption_applications (dog_id) 
  WHERE (status = 'approved');

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_completed_app_per_dog 
  ON public.adoption_applications (dog_id) 
  WHERE (status = 'completed');

-- 2. Notification Security Hardening
-- Disallow anonymous clients from inserting notifications
DROP POLICY IF EXISTS "System or admin can create notifications" ON public.notifications;

CREATE POLICY "Authenticated users or admin can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    auth.jwt() IS NOT NULL
    OR public.is_admin()
  );

-- 3. Ensure profiles table index on clerk_id is optimal
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_id_lookup ON public.profiles (clerk_id, role);


-- ============================================================


-- ============================================================


-- ============================================================


-- ============================================================


-- ============================================================


-- ============================================================


-- ============================================================


-- ============================================================
-- MIGRATION 6: INSTRUCTOR-REQUESTED FEATURES (HARDENED)
-- ============================================================

-- ============================================================
-- PAWCONNECT MIGRATION: INSTRUCTOR-REQUESTED FEATURES (HARDENED)
-- Migration: 20261015000001_instructor_features.sql
--
-- Features implemented:
-- 1. Dog video upload columns & private dog-videos storage bucket
-- 2. Household & family background suitability screening tables (applicant & admin reviews separated)
-- 3. Monthly post-adoption monitoring schedules & welfare reports (adopter & admin reviews separated)
-- 4. Database-level role protection, storage ownership repair (Clerk-aware), and relational ownership guards
-- ============================================================

-- ------------------------------------------------------------
-- 0. PREREQUISITE FUNCTIONS & SECURITY CONTROLS (Clerk Third-Party Auth & Security Helpers)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_clerk_id()
RETURNS TEXT AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'sub',
    auth.uid()::text
  );
$$ LANGUAGE sql STABLE
SET search_path = public, pg_catalog;

-- Hardened administrator check:
-- Trusted service-role connections (server-side admin operations) cannot be forged by client JWTs.
-- Authenticated users are verified against the profiles table.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- 1. Trusted Supabase service_role connection (used exclusively by trusted server-side admin client)
  IF (
    current_setting('role', true) = 'service_role'
    OR current_user = 'service_role'
    OR (auth.role() = 'service_role' AND (auth.jwt() ->> 'iss') = 'supabase')
  ) THEN
    RETURN TRUE;
  END IF;

  -- 2. Authenticated Clerk user: verify administrator role in profiles table
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.clerk_id = (auth.jwt() ->> 'sub')
      AND profiles.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, pg_catalog;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_catalog;

-- Protect profiles role from privilege escalation:
-- 1. Only admins can assign or update role = 'admin'.
-- 2. Non-admins cannot alter their own or others' clerk_id or profile id.
-- 3. Non-admins cannot update an administrator's profile record.
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    -- Non-admins cannot modify another user's identity, clerk_id, or primary key
    IF TG_OP = 'UPDATE' AND (NEW.clerk_id IS DISTINCT FROM OLD.clerk_id OR NEW.id IS DISTINCT FROM OLD.id) THEN
      RAISE EXCEPTION 'Cannot modify identity fields on profile.';
    END IF;

    -- Non-admins cannot assign or elevate role to 'admin'
    IF NEW.role = 'admin' AND (TG_OP = 'INSERT' OR OLD.role IS DISTINCT FROM NEW.role) THEN
      RAISE EXCEPTION 'Non-admin users cannot assign or elevate administrative role.';
    END IF;

    -- Non-admins cannot edit an existing admin profile
    IF TG_OP = 'UPDATE' AND OLD.role = 'admin' THEN
      RAISE EXCEPTION 'Only administrators can modify an administrator profile.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

-- ------------------------------------------------------------
-- 1. EXTEND DOGS TABLE FOR VIDEO INTRODUCTION
-- ------------------------------------------------------------
ALTER TABLE public.dogs
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS video_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS video_duration_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS video_uploaded_at TIMESTAMPTZ;

-- Database Trigger: Ensure video_storage_path matches the owner's authorized path
CREATE OR REPLACE FUNCTION public.protect_dog_video_path()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.video_storage_path IS NOT NULL AND NEW.video_storage_path != '' THEN
    IF NOT (NEW.video_storage_path LIKE 'dogs/' || NEW.owner_id || '/%') AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'video_storage_path must reside within the owner''s authorized folder.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog;

DROP TRIGGER IF EXISTS trg_protect_dog_video_path ON public.dogs;
CREATE TRIGGER trg_protect_dog_video_path
  BEFORE INSERT OR UPDATE OF video_storage_path ON public.dogs
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_dog_video_path();

-- ------------------------------------------------------------
-- 2. STORAGE CONFIGURATION & POLICIES (Clerk-Aware Identity Matching)
-- ------------------------------------------------------------

-- A. Dog Videos Bucket (50MB, MP4 & WebM, Private)
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

-- Storage Policies for dog-videos: Drop all potential existing / conflicting policies
DROP POLICY IF EXISTS "Public read dog videos" ON storage.objects;
DROP POLICY IF EXISTS "Authorized users can read dog videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload dog videos" ON storage.objects;
DROP POLICY IF EXISTS "Owners or admin can update dog videos" ON storage.objects;
DROP POLICY IF EXISTS "Owners or admin can delete dog videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to dog-videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner or admin updates to dog-videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner or admin deletes to dog-videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authorized read of dog-videos" ON storage.objects;

-- Only authenticated users who own the video path, or admins can read directly from the bucket.
-- Public/adopter viewing is performed exclusively through authorized, time-limited signed URLs generated by the server.
CREATE POLICY "Authorized users can read dog videos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'dog-videos'
    AND (
      public.is_admin()
      OR storage.objects.name LIKE 'dogs/' || public.current_user_clerk_id() || '/%'
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
  )
  WITH CHECK (
    bucket_id = 'dog-videos'
    AND (LOWER(storage.extension(name)) IN ('mp4', 'webm'))
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

-- B. Dog Photos Bucket (Clerk-Aware Storage Policies: repairs auth.uid() UUID mismatch)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dog-photos',
  'dog-photos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage Policies for dog-photos: Drop all potential existing / conflicting policies
DROP POLICY IF EXISTS "Public read dog photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload dog photos" ON storage.objects;
DROP POLICY IF EXISTS "Owners or admin can update dog photos" ON storage.objects;
DROP POLICY IF EXISTS "Owners or admin can delete dog photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to dog-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read of dog-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner or admin updates to dog-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner or admin deletes to dog-photos" ON storage.objects;

CREATE POLICY "Public read dog photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'dog-photos');

CREATE POLICY "Authenticated users can upload dog photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'dog-photos'
    AND (LOWER(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp'))
    AND (
      public.is_admin()
      OR storage.objects.name LIKE 'dogs/' || public.current_user_clerk_id() || '/%'
      OR storage.objects.name LIKE 'followups/' || public.current_user_clerk_id() || '/%'
    )
  );

CREATE POLICY "Owners or admin can update dog photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'dog-photos'
    AND (
      public.is_admin()
      OR storage.objects.name LIKE 'dogs/' || public.current_user_clerk_id() || '/%'
      OR storage.objects.name LIKE 'followups/' || public.current_user_clerk_id() || '/%'
    )
  )
  WITH CHECK (
    bucket_id = 'dog-photos'
    AND (LOWER(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp'))
    AND (
      public.is_admin()
      OR storage.objects.name LIKE 'dogs/' || public.current_user_clerk_id() || '/%'
      OR storage.objects.name LIKE 'followups/' || public.current_user_clerk_id() || '/%'
    )
  );

CREATE POLICY "Owners or admin can delete dog photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'dog-photos'
    AND (
      public.is_admin()
      OR storage.objects.name LIKE 'dogs/' || public.current_user_clerk_id() || '/%'
      OR storage.objects.name LIKE 'followups/' || public.current_user_clerk_id() || '/%'
    )
  );

-- ------------------------------------------------------------
-- 3. HOUSEHOLD & FAMILY BACKGROUND SUITABILITY SCREENING
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.household_screenings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.adoption_applications(id) ON DELETE CASCADE,
  -- applicant_id and reviewer_id FK constraints are created explicitly below with named constraints
  -- so that PostgREST can embed using profiles!household_screenings_applicant_id_fkey etc.
  applicant_id TEXT NOT NULL,
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
  -- reviewer_id FK is also created explicitly below with ON DELETE SET NULL
  reviewer_id TEXT,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure explicit foreign key constraint names for PostgREST resource embedding
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    JOIN pg_class ft ON ft.oid = c.confrelid
    JOIN pg_namespace fn ON fn.oid = ft.relnamespace
    JOIN pg_attribute fa ON fa.attrelid = c.confrelid AND fa.attnum = ANY(c.confkey)
    WHERE n.nspname = 'public'
      AND t.relname = 'household_screenings'
      AND c.conname = 'household_screenings_applicant_id_fkey'
      AND a.attname = 'applicant_id'
      AND fn.nspname = 'public'
      AND ft.relname = 'profiles'
      AND fa.attname = 'clerk_id'
      AND c.confdeltype = 'c'
  ) THEN
    ALTER TABLE public.household_screenings
      DROP CONSTRAINT IF EXISTS household_screenings_applicant_id_fkey;
    ALTER TABLE public.household_screenings
      ADD CONSTRAINT household_screenings_applicant_id_fkey
      FOREIGN KEY (applicant_id) REFERENCES public.profiles(clerk_id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    JOIN pg_class ft ON ft.oid = c.confrelid
    JOIN pg_namespace fn ON fn.oid = ft.relnamespace
    JOIN pg_attribute fa ON fa.attrelid = c.confrelid AND fa.attnum = ANY(c.confkey)
    WHERE n.nspname = 'public'
      AND t.relname = 'household_screenings'
      AND c.conname = 'household_screenings_reviewer_id_fkey'
      AND a.attname = 'reviewer_id'
      AND fn.nspname = 'public'
      AND ft.relname = 'profiles'
      AND fa.attname = 'clerk_id'
      AND c.confdeltype = 'n'
  ) THEN
    ALTER TABLE public.household_screenings
      DROP CONSTRAINT IF EXISTS household_screenings_reviewer_id_fkey;
    ALTER TABLE public.household_screenings
      ADD CONSTRAINT household_screenings_reviewer_id_fkey
      FOREIGN KEY (reviewer_id) REFERENCES public.profiles(clerk_id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_uq_screenings_application_id ON public.household_screenings(application_id);
CREATE INDEX IF NOT EXISTS idx_screenings_applicant_id ON public.household_screenings(applicant_id);
CREATE INDEX IF NOT EXISTS idx_screenings_dog_id ON public.household_screenings(dog_id);
CREATE INDEX IF NOT EXISTS idx_screenings_status ON public.household_screenings(status);

DROP TRIGGER IF EXISTS set_household_screenings_updated_at ON public.household_screenings;
CREATE TRIGGER set_household_screenings_updated_at
  BEFORE UPDATE ON public.household_screenings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Verify household screening ownership matches the referenced adoption application
CREATE OR REPLACE FUNCTION public.validate_household_screening_ownership()
RETURNS TRIGGER AS $$
DECLARE
  v_app_applicant_id TEXT;
  v_app_dog_id UUID;
BEGIN
  SELECT applicant_id, dog_id INTO v_app_applicant_id, v_app_dog_id
  FROM public.adoption_applications
  WHERE id = NEW.application_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Referenced adoption application does not exist.';
  END IF;

  IF NEW.applicant_id != v_app_applicant_id THEN
    RAISE EXCEPTION 'Screening applicant_id must match the applicant on the adoption application.';
  END IF;

  IF NEW.dog_id != v_app_dog_id THEN
    RAISE EXCEPTION 'Screening dog_id must match the dog on the adoption application.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog;

DROP TRIGGER IF EXISTS trg_validate_household_screening_ownership ON public.household_screenings;
CREATE TRIGGER trg_validate_household_screening_ownership
  BEFORE INSERT OR UPDATE ON public.household_screenings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_household_screening_ownership();

-- RLS for household_screenings
ALTER TABLE public.household_screenings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Applicants or admin can view screening records" ON public.household_screenings;
DROP POLICY IF EXISTS "Admins can view all screenings" ON public.household_screenings;
DROP POLICY IF EXISTS "Applicants can view own screening" ON public.household_screenings;
DROP POLICY IF EXISTS "Applicants can submit screening" ON public.household_screenings;
DROP POLICY IF EXISTS "Applicants can submit pending screening" ON public.household_screenings;
DROP POLICY IF EXISTS "Applicants can update own pending screening" ON public.household_screenings;
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

-- Applicants can update their own screening answers while pending; cannot change review decisions
CREATE POLICY "Applicants can update own pending screening"
  ON public.household_screenings FOR UPDATE
  TO authenticated
  USING (
    (
      applicant_id = public.current_user_clerk_id()
      AND status = 'pending'
    )
    OR public.is_admin()
  )
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

-- Database-level immutability enforcement: Prevent non-admins from modifying decisions or identities on INSERT or UPDATE
CREATE OR REPLACE FUNCTION public.protect_household_screening_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.status != 'pending' THEN
        RAISE EXCEPTION 'New screenings must start with status pending.';
      END IF;
      IF NEW.reviewer_id IS NOT NULL OR NEW.reviewed_at IS NOT NULL OR NEW.rejection_reason IS NOT NULL THEN
        RAISE EXCEPTION 'Applicants cannot populate review outcome fields on submission.';
      END IF;
    ELSIF TG_OP = 'UPDATE' THEN
      IF NEW.id IS DISTINCT FROM OLD.id OR
         NEW.status IS DISTINCT FROM OLD.status OR
         NEW.reviewer_id IS DISTINCT FROM OLD.reviewer_id OR
         NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at OR
         NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason OR
         NEW.applicant_id IS DISTINCT FROM OLD.applicant_id OR
         NEW.application_id IS DISTINCT FROM OLD.application_id OR
         NEW.dog_id IS DISTINCT FROM OLD.dog_id OR
         NEW.created_at IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION 'Applicants cannot modify screening review decisions or identity fields.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog;

DROP TRIGGER IF EXISTS trg_protect_household_screening_fields ON public.household_screenings;
CREATE TRIGGER trg_protect_household_screening_fields
  BEFORE INSERT OR UPDATE ON public.household_screenings
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_household_screening_fields();

-- ------------------------------------------------------------
-- 4. PRIVATE HOUSEHOLD SCREENING ADMIN REVIEWS (Separated for column privacy)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.household_screening_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screening_id UUID NOT NULL REFERENCES public.household_screenings(id) ON DELETE CASCADE,
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
  EXECUTE FUNCTION public.update_updated_at_column();

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
  -- adopter_id and reviewer_id FK constraints are created explicitly below with named constraints
  -- so that PostgREST can embed using profiles!post_adoption_followups_adopter_id_fkey etc.
  adopter_id TEXT NOT NULL,
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
  -- reviewer_id FK is also created explicitly below with ON DELETE SET NULL
  reviewer_id TEXT,
  reviewed_at TIMESTAMPTZ,
  requires_additional_followup BOOLEAN DEFAULT false,
  additional_followup_instructions TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure explicit foreign key constraint names for PostgREST resource embedding
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    JOIN pg_class ft ON ft.oid = c.confrelid
    JOIN pg_namespace fn ON fn.oid = ft.relnamespace
    JOIN pg_attribute fa ON fa.attrelid = c.confrelid AND fa.attnum = ANY(c.confkey)
    WHERE n.nspname = 'public'
      AND t.relname = 'post_adoption_followups'
      AND c.conname = 'post_adoption_followups_adopter_id_fkey'
      AND a.attname = 'adopter_id'
      AND fn.nspname = 'public'
      AND ft.relname = 'profiles'
      AND fa.attname = 'clerk_id'
      AND c.confdeltype = 'c'
  ) THEN
    ALTER TABLE public.post_adoption_followups
      DROP CONSTRAINT IF EXISTS post_adoption_followups_adopter_id_fkey;
    ALTER TABLE public.post_adoption_followups
      ADD CONSTRAINT post_adoption_followups_adopter_id_fkey
      FOREIGN KEY (adopter_id) REFERENCES public.profiles(clerk_id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    JOIN pg_class ft ON ft.oid = c.confrelid
    JOIN pg_namespace fn ON fn.oid = ft.relnamespace
    JOIN pg_attribute fa ON fa.attrelid = c.confrelid AND fa.attnum = ANY(c.confkey)
    WHERE n.nspname = 'public'
      AND t.relname = 'post_adoption_followups'
      AND c.conname = 'post_adoption_followups_reviewer_id_fkey'
      AND a.attname = 'reviewer_id'
      AND fn.nspname = 'public'
      AND ft.relname = 'profiles'
      AND fa.attname = 'clerk_id'
      AND c.confdeltype = 'n'
  ) THEN
    ALTER TABLE public.post_adoption_followups
      DROP CONSTRAINT IF EXISTS post_adoption_followups_reviewer_id_fkey;
    ALTER TABLE public.post_adoption_followups
      ADD CONSTRAINT post_adoption_followups_reviewer_id_fkey
      FOREIGN KEY (reviewer_id) REFERENCES public.profiles(clerk_id) ON DELETE SET NULL;
  END IF;
END $$;

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
  EXECUTE FUNCTION public.update_updated_at_column();

-- Verify follow-up ownership and application completion status
CREATE OR REPLACE FUNCTION public.validate_post_adoption_followup_ownership()
RETURNS TRIGGER AS $$
DECLARE
  v_app_applicant_id TEXT;
  v_app_dog_id UUID;
  v_app_status TEXT;
BEGIN
  SELECT applicant_id, dog_id, status INTO v_app_applicant_id, v_app_dog_id, v_app_status
  FROM public.adoption_applications
  WHERE id = NEW.application_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Referenced adoption application does not exist.';
  END IF;

  IF NEW.adopter_id != v_app_applicant_id THEN
    RAISE EXCEPTION 'Follow-up adopter_id must match the applicant on the adoption application.';
  END IF;

  IF NEW.dog_id != v_app_dog_id THEN
    RAISE EXCEPTION 'Follow-up dog_id must match the dog on the adoption application.';
  END IF;

  IF v_app_status NOT IN ('approved', 'completed') AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Follow-up schedules can only be established for approved or completed adoption applications.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog;

DROP TRIGGER IF EXISTS trg_validate_post_adoption_followup_ownership ON public.post_adoption_followups;
CREATE TRIGGER trg_validate_post_adoption_followup_ownership
  BEFORE INSERT OR UPDATE ON public.post_adoption_followups
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_post_adoption_followup_ownership();

-- RLS for post_adoption_followups
ALTER TABLE public.post_adoption_followups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Adopters or admin can view followups" ON public.post_adoption_followups;
DROP POLICY IF EXISTS "Admins can view all followups" ON public.post_adoption_followups;
DROP POLICY IF EXISTS "Adopters can view own followups" ON public.post_adoption_followups;
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

CREATE POLICY "Admin or system can create followups"
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
    )
    OR public.is_admin()
  );

CREATE POLICY "Only admins can delete followups"
  ON public.post_adoption_followups FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Database-level report tampering protection & status transition enforcement
CREATE OR REPLACE FUNCTION public.protect_post_adoption_followup_fields()
RETURNS TRIGGER AS $$
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

      -- 6. Prevent tampering with photo_storage_path outside the adopter's folder
      IF NEW.photo_storage_path IS NOT NULL AND length(trim(NEW.photo_storage_path)) > 0 THEN
        IF NOT (NEW.photo_storage_path LIKE 'dogs/' || NEW.adopter_id || '/%' OR NEW.photo_storage_path LIKE 'followups/' || NEW.adopter_id || '/%') THEN
          RAISE EXCEPTION 'photo_storage_path must belong to the adopter folder.';
        END IF;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog;

DROP TRIGGER IF EXISTS trg_protect_post_adoption_followup_fields ON public.post_adoption_followups;
CREATE TRIGGER trg_protect_post_adoption_followup_fields
  BEFORE INSERT OR UPDATE ON public.post_adoption_followups
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_post_adoption_followup_fields();

-- ------------------------------------------------------------
-- 6. PRIVATE POST-ADOPTION FOLLOW-UP ADMIN REVIEWS (Separated for column privacy)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_adoption_followup_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  followup_id UUID NOT NULL REFERENCES public.post_adoption_followups(id) ON DELETE CASCADE,
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
  EXECUTE FUNCTION public.update_updated_at_column();

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
