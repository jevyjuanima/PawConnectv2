"use server";

import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { validateDogImageFile } from "@/lib/validations/upload";
import type { ActionResponse } from "@/types";

export interface UploadPhotoResponse {
  path: string;
  url: string;
}

export async function uploadDogPhotoAction(
  formData: FormData
): Promise<ActionResponse<UploadPhotoResponse>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Authentication required to upload photos" };
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "No image file provided" };
    }

    const validation = validateDogImageFile({
      name: file.name,
      size: file.size,
      type: file.type,
    });

    if (!validation.valid) {
      return { success: false, error: validation.error || "Invalid file" };
    }

    const supabase = await createServerSupabaseClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const storagePath = `dogs/${userId}/${cleanFileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("dog-photos")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from("dog-photos")
      .getPublicUrl(storagePath);

    return {
      success: true,
      data: {
        path: storagePath,
        url: publicUrlData.publicUrl,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to upload image";
    return { success: false, error: message };
  }
}

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

    const { createAdminSupabaseClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminSupabaseClient();

    const ext = fileInfo.name.split(".").pop()?.toLowerCase() || "mp4";
    const cleanFileName = `video_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const storagePath = `dogs/${userId}/${cleanFileName}`;

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

    // Ownership check: storage path starts with `dogs/${userId}/` or user is admin
    const { isCurrentUserAdmin } = await import("@/lib/clerk/auth");
    const isAdmin = await isCurrentUserAdmin();
    const isOwner = storagePath.startsWith(`dogs/${userId}/`);

    if (!isOwner && !isAdmin) {
      return { success: false, error: "Unauthorized to delete this video" };
    }

    const { createAdminSupabaseClient } = await import("@/lib/supabase/admin");
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

    if (!storagePath || !storagePath.startsWith("dogs/")) {
      return { success: false, error: "Invalid storage path" };
    }

    // Ownership check: only the path owner or an admin may request a signed URL
    const { isCurrentUserAdmin } = await import("@/lib/clerk/auth");
    const isAdmin = await isCurrentUserAdmin();
    const isOwner = storagePath.startsWith(`dogs/${userId}/`);

    if (!isOwner && !isAdmin) {
      return { success: false, error: "Unauthorized: you may only access your own follow-up videos" };
    }

    const { createAdminSupabaseClient } = await import("@/lib/supabase/admin");
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
