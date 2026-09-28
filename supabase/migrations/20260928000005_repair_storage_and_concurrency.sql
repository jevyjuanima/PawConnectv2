-- PawConnect: Storage Policy Repair + State Machine Migration
-- This migration repairs the partial migration 3 and applies migration 4.
-- Migrations 1 & 2 were already applied successfully.
-- Migration 3 failed mid-way (bucket + SELECT policy may exist, UPDATE/DELETE policies did not apply).

-- ============================================================
-- REPAIR: Migration 3 remainder (storage policies)
-- ============================================================

-- Drop any policies that may have partially applied (IF EXISTS so safe to re-run)
DROP POLICY IF EXISTS "Public read dog photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload dog photos" ON storage.objects;
DROP POLICY IF EXISTS "Owners or admin can update dog photos" ON storage.objects;
DROP POLICY IF EXISTS "Owners or admin can delete dog photos" ON storage.objects;

-- Re-ensure the bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dog-photos',
  'dog-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Recreate all storage policies correctly (owner is UUID type)
CREATE POLICY "Public read dog photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'dog-photos');

CREATE POLICY "Authenticated users can upload dog photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'dog-photos'
    AND (LOWER(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp'))
  );

CREATE POLICY "Owners or admin can update dog photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'dog-photos'
    AND (owner = auth.uid() OR public.is_admin())
  );

CREATE POLICY "Owners or admin can delete dog photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'dog-photos'
    AND (owner = auth.uid() OR public.is_admin())
  );

-- ============================================================
-- MIGRATION 4: State Machine & Concurrency
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_approved_app_per_dog
  ON public.adoption_applications (dog_id)
  WHERE (status = 'approved');

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_completed_app_per_dog
  ON public.adoption_applications (dog_id)
  WHERE (status = 'completed');

DROP POLICY IF EXISTS "System or admin can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users or admin can create notifications" ON public.notifications;

CREATE POLICY "Authenticated users or admin can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    auth.jwt() IS NOT NULL
    OR public.is_admin()
  );

CREATE INDEX IF NOT EXISTS idx_profiles_clerk_id_lookup ON public.profiles (clerk_id, role);
