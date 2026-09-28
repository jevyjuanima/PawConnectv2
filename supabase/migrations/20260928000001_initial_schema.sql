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
