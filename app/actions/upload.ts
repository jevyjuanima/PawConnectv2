"use server";

import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { validateDogImageFile } from "@/lib/validations/upload";
import type { ActionResponse } from "@/types";

// ---------------------------------------------------------------------------
// Dog Photo Upload — Direct Browser-to-Supabase signed URL pattern
// ---------------------------------------------------------------------------
//
// Why not buffer through the Server Action?
//   The old uploadDogPhotoAction read the full File into a Buffer and sent it
//   through the Next.js Server Action request body.  Vercel Functions enforce a
//   hard 4.5 MB request-body limit that cannot be overridden with bodySizeLimit,
//   so any photo between 1 MB and 5 MB would silently fail with 413.
//
// New pattern (matches the existing dog-video upload):
//   1. Client calls createDogPhotoUploadUrlAction with file metadata only (~bytes).
//   2. Server validates auth + file metadata, then issues a short-lived signed
//      upload URL scoped to dogs/{userId}/{filename} in the dog-photos bucket.
//   3. Client PUTs the file directly to Supabase Storage via the signed URL —
//      no bytes pass through Next.js or Vercel.
//   4. Supabase enforces the 5 MB file_size_limit and extension whitelist at the
//      storage layer, independent of any client-side validation.
//   5. After the XHR upload succeeds the client derives the public URL from the
//      storage path (public bucket, no signing needed for read).
//
// Security controls preserved:
//   • Authentication: userId from server-side auth() — never client-supplied.
//   • File validation: size, MIME type, extension checked before issuing URL.
//   • Path scoping: storagePath locked to dogs/{userId}/ — client cannot choose
//     an arbitrary path.
//   • No secret exposure: admin client used only on the server to call
//     createSignedUploadUrl(); the signed URL is short-lived (5 min) and
//     bucket-scoped.
//   • RLS / bucket policies: Supabase INSERT policy enforces
//     current_user_clerk_id() path prefix and extension whitelist at DB level.
// ---------------------------------------------------------------------------

export interface PhotoUploadUrlResponse {
  /** Short-lived (5-minute) PUT URL — client uploads directly here. */
  signedUrl: string;
  /** Storage object path — use with getPublicUrl() after upload. */
  storagePath: string;
  /** Derived public URL for the photo (dog-photos bucket is public). */
  publicUrl: string;
  /** Supabase upload token (required for the PUT request). */
  token: string;
}

/**
 * Issues a signed upload URL for a dog photo.
 *
 * Only file metadata (name, size, type) is sent to the server.
 * The actual file bytes travel directly from the browser to Supabase Storage.
 */
export async function createDogPhotoUploadUrlAction(fileInfo: {
  name: string;
  size: number;
  type: string;
}): Promise<ActionResponse<PhotoUploadUrlResponse>> {
  try {
    // 1. Authentication — identity from Clerk server-side, never client-supplied
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Authentication required to upload photos" };
    }

    // 2. Server-side file metadata validation (size, MIME type, extension)
    //    This runs before any URL is issued so invalid files are rejected early.
    //    Supabase Storage also enforces these limits independently at the
    //    bucket/policy level (5 MB file_size_limit, extension whitelist).
    const validation = validateDogImageFile(fileInfo);
    if (!validation.valid) {
      return { success: false, error: validation.error || "Invalid file" };
    }

    // 3. Build a server-controlled storage path — client cannot influence this
    const ext = fileInfo.name.split(".").pop()?.toLowerCase() || "jpg";
    const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const storagePath = `dogs/${userId}/${cleanFileName}`;

    // 4. Issue a signed upload URL (5-minute expiry) via the admin client
    //    so the secret key is never sent to the browser
    const supabase = createAdminSupabaseClient();
    const { data: signData, error: signError } = await supabase.storage
      .from("dog-photos")
      .createSignedUploadUrl(storagePath);

    if (signError || !signData) {
      return {
        success: false,
        error: signError?.message || "Failed to generate photo upload destination",
      };
    }

    // 5. Derive the permanent public URL for this path
    //    dog-photos is a public bucket — public URL is immediately usable after upload
    const { data: publicUrlData } = supabase.storage
      .from("dog-photos")
      .getPublicUrl(storagePath);

    return {
      success: true,
      data: {
        signedUrl: signData.signedUrl,
        storagePath,
        publicUrl: publicUrlData.publicUrl,
        token: signData.token,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to prepare photo upload";
    return { success: false, error: message };
  }
}

const ALLOWED_PHOTO_STORAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;
const ALLOWED_VIDEO_STORAGE_EXTENSIONS = ["mp4", "webm"] as const;

/**
 * Validates that a photo storage path matches the canonical structure:
 * `dogs/{ownerId}/{filename}.{jpg|jpeg|png|webp}` with no path traversal,
 * backslashes, null bytes, duplicate slashes, or malformed segments.
 */
function isValidPhotoStoragePath(path: unknown): path is string {
  if (!path || typeof path !== "string") {
    return false;
  }

  const trimmed = path.trim();
  if (trimmed !== path || trimmed.length === 0) {
    return false;
  }

  // Reject null bytes, backslashes, directory traversal, and duplicate slashes
  if (
    trimmed.includes("\0") ||
    trimmed.includes("\\") ||
    trimmed.includes("..") ||
    trimmed.includes("//")
  ) {
    return false;
  }

  // Canonical structure: dogs/<ownerId>/<fileName>.<ext>
  const segments = trimmed.split("/");
  if (segments.length !== 3) {
    return false;
  }

  const [prefix, ownerId, fileName] = segments;
  if (prefix !== "dogs" || !ownerId || !fileName) {
    return false;
  }

  if (!/^[a-zA-Z0-9_.-]+$/.test(ownerId)) {
    return false;
  }

  const ext = fileName.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_PHOTO_STORAGE_EXTENSIONS.includes(ext as (typeof ALLOWED_PHOTO_STORAGE_EXTENSIONS)[number])) {
    return false;
  }

  if (!/^[a-zA-Z0-9_.-]+$/.test(fileName)) {
    return false;
  }

  return true;
}

/**
 * Validates that a video storage path matches the canonical structure:
 * `dogs/{ownerId}/{filename}.{mp4|webm}` with no path traversal,
 * backslashes, null bytes, duplicate slashes, or malformed segments.
 */
function isValidVideoStoragePath(path: unknown): path is string {
  if (!path || typeof path !== "string") {
    return false;
  }

  const trimmed = path.trim();
  if (trimmed !== path || trimmed.length === 0) {
    return false;
  }

  // Reject null bytes, backslashes, directory traversal, and duplicate slashes
  if (
    trimmed.includes("\0") ||
    trimmed.includes("\\") ||
    trimmed.includes("..") ||
    trimmed.includes("//")
  ) {
    return false;
  }

  // Canonical structure: dogs/<ownerId>/<fileName>.<ext>
  const segments = trimmed.split("/");
  if (segments.length !== 3) {
    return false;
  }

  const [prefix, ownerId, fileName] = segments;
  if (prefix !== "dogs" || !ownerId || !fileName) {
    return false;
  }

  if (!/^[a-zA-Z0-9_.-]+$/.test(ownerId)) {
    return false;
  }

  const ext = fileName.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_VIDEO_STORAGE_EXTENSIONS.includes(ext as (typeof ALLOWED_VIDEO_STORAGE_EXTENSIONS)[number])) {
    return false;
  }

  if (!/^[a-zA-Z0-9_.-]+$/.test(fileName)) {
    return false;
  }

  return true;
}

/**
 * Removes a previously uploaded photo from the dog-photos bucket.
 * Only the file owner or an admin may delete a photo.
 */
export async function deleteDogPhotoAction(
  storagePath: string
): Promise<ActionResponse<void>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    if (!isValidPhotoStoragePath(storagePath)) {
      return { success: false, error: "Invalid storage path" };
    }

    // Ownership check: path must be in the authenticated user's folder or caller is admin
    const { isCurrentUserAdmin } = await import("@/lib/clerk/auth");
    const isAdmin = await isCurrentUserAdmin();
    const isOwner = storagePath.startsWith(`dogs/${userId}/`);

    if (!isOwner && !isAdmin) {
      return { success: false, error: "Unauthorized to delete this photo" };
    }

    const supabase = createAdminSupabaseClient();
    const { error: delError } = await supabase.storage
      .from("dog-photos")
      .remove([storagePath]);

    if (delError) {
      return { success: false, error: delError.message };
    }

    return { success: true, data: undefined };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete photo";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Video Upload — existing signed URL pattern (unchanged)
// ---------------------------------------------------------------------------

export interface VideoUploadUrlResponse {
  signedUrl: string;
  storagePath: string;
  publicUrl: string;
  token?: string;
}

/**
 * Generates a signed upload URL for dog introduction video (up to 50MB).
 * Upload is performed directly from the browser to Supabase Storage via this URL,
 * avoiding Next.js/Vercel payload limits and enabling accurate real-time upload progress.
 */
export async function createDogVideoUploadUrlAction(fileInfo: {
  name: string;
  size: number;
  type: string;
}): Promise<ActionResponse<VideoUploadUrlResponse>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Authentication required to upload videos" };
    }

    const { validateDogVideoFile } = await import("@/lib/validations/upload");
    const validation = validateDogVideoFile(fileInfo);
    if (!validation.valid) {
      return { success: false, error: validation.error || "Invalid video file" };
    }

    const ext = fileInfo.name.split(".").pop()?.toLowerCase() || "mp4";
    const cleanFileName = `video_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const storagePath = `dogs/${userId}/${cleanFileName}`;

    const supabase = createAdminSupabaseClient();
    const { data: signData, error: signError } = await supabase.storage
      .from("dog-videos")
      .createSignedUploadUrl(storagePath);

    if (signError || !signData) {
      return {
        success: false,
        error: signError?.message || "Failed to generate video upload destination",
      };
    }

    // Generate an authorized signed playback URL (1 hour) for secure preview from private bucket
    const { data: signPreviewData } = await supabase.storage
      .from("dog-videos")
      .createSignedUrl(storagePath, 3600);

    return {
      success: true,
      data: {
        signedUrl: signData.signedUrl,
        storagePath: storagePath,
        publicUrl: signPreviewData?.signedUrl || "",
        token: signData.token,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to prepare video upload";
    return { success: false, error: message };
  }
}

/**
 * Removes a staged or uploaded video from dog-videos bucket (only owner or admin).
 */
export async function deleteDogVideoAction(
  storagePath: string
): Promise<ActionResponse<void>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    if (!isValidVideoStoragePath(storagePath)) {
      return { success: false, error: "Invalid storage path" };
    }

    // Ownership check: storage path starts with `dogs/${userId}/` or user is admin
    const { isCurrentUserAdmin } = await import("@/lib/clerk/auth");
    const isAdmin = await isCurrentUserAdmin();
    const isOwner = storagePath.startsWith(`dogs/${userId}/`);

    if (!isOwner && !isAdmin) {
      return { success: false, error: "Unauthorized to delete this video" };
    }

    const supabase = createAdminSupabaseClient();
    const { error: delError } = await supabase.storage
      .from("dog-videos")
      .remove([storagePath]);

    if (delError) {
      return { success: false, error: delError.message };
    }

    return { success: true, data: undefined };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete video";
    return { success: false, error: message };
  }
}

/**
 * Generates a short-lived signed playback URL for a follow-up video in the
 * private dog-videos bucket.  Can be called by the video owner or an admin.
 * Returns a 1-hour signed URL — never a permanent public URL.
 */
export async function createFollowupVideoSignedUrlAction(
  storagePath: string
): Promise<ActionResponse<{ signedUrl: string }>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    if (!isValidVideoStoragePath(storagePath)) {
      return { success: false, error: "Invalid storage path" };
    }

    // Ownership check: only the path owner or an admin may request a signed URL
    const { isCurrentUserAdmin } = await import("@/lib/clerk/auth");
    const isAdmin = await isCurrentUserAdmin();
    const isOwner = storagePath.startsWith(`dogs/${userId}/`);

    if (!isOwner && !isAdmin) {
      return { success: false, error: "Unauthorized: you may only access your own follow-up videos" };
    }

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase.storage
      .from("dog-videos")
      .createSignedUrl(storagePath, 3600); // 1-hour expiry

    if (error || !data?.signedUrl) {
      return { success: false, error: error?.message || "Failed to generate signed video URL" };
    }

    return { success: true, data: { signedUrl: data.signedUrl } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate video URL";
    return { success: false, error: message };
  }
}
