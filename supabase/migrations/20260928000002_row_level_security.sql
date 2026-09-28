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
