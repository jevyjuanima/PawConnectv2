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
