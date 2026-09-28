"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { ensureUserProfile } from "@/lib/clerk/auth";
import { dogSubmissionSchema, type DogSubmissionInput } from "@/lib/validations/dog";
import { DOG_STATUSES } from "@/lib/constants/statuses";
import type { ActionResponse, DogWithImages, DogRecord, DogImageRecord } from "@/types";

interface GetAvailableDogsParams {
  breed?: string;
  size?: string;
  gender?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetches available dogs with their images from Supabase.
 * Respects RLS: status = 'available' is publicly readable.
 */
export async function getAvailableDogsAction(
  params?: GetAvailableDogsParams
): Promise<ActionResponse<{ dogs: DogWithImages[]; totalCount: number }>> {
  try {
    const supabase = await createServerSupabaseClient();
    const limit = params?.limit ?? 12;
    const offset = params?.offset ?? 0;

    let query = supabase
      .from("dogs")
      .select("*, dog_images(*)", { count: "exact" })
      .eq("status", DOG_STATUSES.AVAILABLE)
      .order("created_at", { ascending: false });

    if (params?.breed && params.breed !== "all") {
      query = query.ilike("breed", `%${params.breed}%`);
    }

    if (params?.size && params.size !== "all") {
      query = query.eq("size", params.size);
    }

    if (params?.gender && params.gender !== "all") {
      query = query.eq("gender", params.gender);
    }

    if (params?.search) {
      const s = params.search.trim();
      query = query.or(`name.ilike.%${s}%,breed.ilike.%${s}%,location.ilike.%${s}%`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    const dogs: DogWithImages[] = (data || []).map((row: DogRecord & { dog_images?: DogImageRecord[] }) => {
      const images = row.dog_images || [];
      const primaryImg = images.find((i) => i.is_primary)?.public_url || images[0]?.public_url;
      return {
        ...row,
        images,
        primary_image: primaryImg,
      };
    });

    return {
      success: true,
      data: {
        dogs,
        totalCount: count ?? 0,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load dogs";
    return { success: false, error: message };
  }
}

/**
 * Fetches single dog with images and owner info.
 */
export async function getDogByIdAction(
  id: string
): Promise<ActionResponse<DogWithImages>> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("dogs")
      .select("*, dog_images(*), profiles!dogs_owner_id_fkey(clerk_id, first_name, last_name, avatar_url)")
      .eq("id", id)
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "Dog not found" };
    }

    const images = data.dog_images || [];
    const primaryImg = images.find((i: DogImageRecord) => i.is_primary)?.public_url || images[0]?.public_url;

    const dog: DogWithImages = {
      ...data,
      images,
      primary_image: primaryImg,
      owner: data.profiles || undefined,
    };

    return { success: true, data: dog };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch dog";
    return { success: false, error: message };
  }
}

/**
 * Fetches dogs listed by the current logged-in user.
 */
export async function getUserDogsAction(): Promise<ActionResponse<DogWithImages[]>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("dogs")
      .select("*, dog_images(*)")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    const dogs: DogWithImages[] = (data || []).map((row: DogRecord & { dog_images?: DogImageRecord[] }) => {
      const images = row.dog_images || [];
      const primaryImg = images.find((i) => i.is_primary)?.public_url || images[0]?.public_url;
      return {
        ...row,
        images,
        primary_image: primaryImg,
      };
    });

    return { success: true, data: dogs };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch your dogs";
    return { success: false, error: message };
  }
}

/**
 * Creates a new dog rehoming listing in 'pending' status.
 */
export async function createDogAction(
  rawInput: DogSubmissionInput,
  imageUrls: { path: string; url: string; isPrimary: boolean }[] = []
): Promise<ActionResponse<DogRecord>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "You must be signed in to submit a dog for rehoming" };
    }

    const parsed = dogSubmissionSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    // Use admin client for writes — identity verified by Clerk auth() above
    const adminSupabase = createAdminSupabaseClient();
    await ensureUserProfile();

    const dogPayload = {
      owner_id: userId,
      name: parsed.data.name,
      breed: parsed.data.breed,
      age_years: parsed.data.age_years,
      age_months: parsed.data.age_months,
      gender: parsed.data.gender,
      size: parsed.data.size,
      color: parsed.data.color || null,
      description: parsed.data.description,
      medical_history: parsed.data.medical_history || null,
      vaccinated: parsed.data.vaccinated,
      spayed_neutered: parsed.data.spayed_neutered,
      special_needs: parsed.data.special_needs || null,
      location: parsed.data.location,
      status: DOG_STATUSES.PENDING,
    };

    const { data: newDog, error: dogError } = await adminSupabase
      .from("dogs")
      .insert(dogPayload)
      .select()
      .single();

    if (dogError || !newDog) {
      return { success: false, error: dogError?.message || "Failed to create dog record" };
    }

    if (imageUrls.length > 0) {
      const imageRecords = imageUrls.map((img, index) => ({
        dog_id: newDog.id,
        storage_path: img.path,
        public_url: img.url,
        is_primary: img.isPrimary ?? index === 0,
        display_order: index,
      }));

      const { error: imgError } = await adminSupabase
        .from("dog_images")
        .insert(imageRecords);

      if (imgError) {
        console.error("Failed to associate images with dog:", imgError.message);
      }
    }

    revalidatePath("/dogs");
    revalidatePath("/my-dogs");
    revalidatePath("/admin/dogs");

    return { success: true, data: newDog as DogRecord };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create listing";
    return { success: false, error: message };
  }
}

/**
 * Updates a pending dog listing (only owner can update when pending).
 * Sanitizes input to strictly prevent privilege or status escalation.
 */
export async function updateDogAction(
  id: string,
  rawInput: Partial<DogSubmissionInput>
): Promise<ActionResponse<DogRecord>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    const parsed = dogSubmissionSchema.partial().safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    const adminSupabase = createAdminSupabaseClient();

    // Verify ownership + status before mutating (application-layer enforcement)
    const { data: current, error: checkError } = await adminSupabase
      .from("dogs")
      .select("status, owner_id")
      .eq("id", id)
      .single();

    if (checkError || !current) {
      return { success: false, error: "Dog listing not found" };
    }

    if (current.owner_id !== userId) {
      return { success: false, error: "You can only edit your own listings" };
    }

    if (current.status !== DOG_STATUSES.PENDING) {
      return { success: false, error: "Listing cannot be edited once reviewed by admin" };
    }

    // Explicitly construct update payload with only permitted fields (no status, owner_id, or rejection_reason)
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (parsed.data.name !== undefined) updatePayload.name = parsed.data.name;
    if (parsed.data.breed !== undefined) updatePayload.breed = parsed.data.breed;
    if (parsed.data.age_years !== undefined) updatePayload.age_years = parsed.data.age_years;
    if (parsed.data.age_months !== undefined) updatePayload.age_months = parsed.data.age_months;
    if (parsed.data.gender !== undefined) updatePayload.gender = parsed.data.gender;
    if (parsed.data.size !== undefined) updatePayload.size = parsed.data.size;
    if (parsed.data.color !== undefined) updatePayload.color = parsed.data.color || null;
    if (parsed.data.description !== undefined) updatePayload.description = parsed.data.description;
    if (parsed.data.medical_history !== undefined) updatePayload.medical_history = parsed.data.medical_history || null;
    if (parsed.data.vaccinated !== undefined) updatePayload.vaccinated = parsed.data.vaccinated;
    if (parsed.data.spayed_neutered !== undefined) updatePayload.spayed_neutered = parsed.data.spayed_neutered;
    if (parsed.data.special_needs !== undefined) updatePayload.special_needs = parsed.data.special_needs || null;
    if (parsed.data.location !== undefined) updatePayload.location = parsed.data.location;

    const { data: updatedDog, error: updateError } = await adminSupabase
      .from("dogs")
      .update(updatePayload)
      .eq("id", id)
      .eq("owner_id", userId) // Double-enforced ownership
      .select()
      .single();

    if (updateError || !updatedDog) {
      return { success: false, error: updateError?.message || "Failed to update dog" };
    }

    revalidatePath(`/dogs/${id}`);
    revalidatePath("/my-dogs");

    return { success: true, data: updatedDog as DogRecord };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update dog";
    return { success: false, error: message };
  }
}

/**
 * Deletes a pending dog listing (only owner can delete when pending).
 */
export async function deleteDogAction(id: string): Promise<ActionResponse<void>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    const adminSupabase = createAdminSupabaseClient();

    // Verify ownership + status before deleting (application-layer enforcement)
    const { data: current, error: checkError } = await adminSupabase
      .from("dogs")
      .select("status, owner_id")
      .eq("id", id)
      .single();

    if (checkError || !current) {
      return { success: false, error: "Dog listing not found" };
    }

    if (current.owner_id !== userId) {
      return { success: false, error: "You can only delete your own listings" };
    }

    if (current.status !== DOG_STATUSES.PENDING) {
      return { success: false, error: "Listing cannot be deleted once reviewed" };
    }

    const { error: delError } = await adminSupabase
      .from("dogs")
      .delete()
      .eq("id", id)
      .eq("owner_id", userId); // Double-enforced ownership

    if (delError) {
      return { success: false, error: delError.message };
    }

    revalidatePath("/my-dogs");
    revalidatePath("/dogs");

    return { success: true, data: undefined };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete dog";
    return { success: false, error: message };
  }
}
