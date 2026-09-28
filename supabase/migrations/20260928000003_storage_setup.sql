-- PawConnect: Supabase Storage Configuration for Dog Photos
-- Follows SKILLS.md Section 10 & 15
-- Fixed: storage.objects.owner is UUID type, compare with auth.uid() directly (not ::text)

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
-- owner column is UUID, compare with auth.uid() directly
CREATE POLICY "Owners or admin can update dog photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'dog-photos'
    AND (owner = auth.uid() OR public.is_admin())
  );

-- Allow users to delete their own uploads or admins to delete any
CREATE POLICY "Owners or admin can delete dog photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'dog-photos'
    AND (owner = auth.uid() OR public.is_admin())
  );
