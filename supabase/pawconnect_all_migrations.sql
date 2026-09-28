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
$$ LANGUAGE plpgsql;

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
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE clerk_id = (auth.jwt() ->> 'sub')
      AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Helper function to get current user's clerk ID
CREATE OR REPLACE FUNCTION public.current_user_clerk_id()
RETURNS TEXT AS $$
  SELECT COALESCE(auth.jwt() ->> 'sub', '');
$$ LANGUAGE sql STABLE;

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
    clerk_id = public.current_user_clerk_id()
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
