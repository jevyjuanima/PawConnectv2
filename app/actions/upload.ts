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
