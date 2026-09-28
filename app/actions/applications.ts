"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { ensureUserProfile } from "@/lib/clerk/auth";
import {
  adoptionApplicationSchema,
  type AdoptionApplicationInput,
} from "@/lib/validations/application";
import { APPLICATION_STATUSES, DOG_STATUSES } from "@/lib/constants/statuses";
import type { ActionResponse, AdoptionApplicationRecord, ApplicationWithDetails } from "@/types";

/**
 * Creates an adoption application in 'pending' status.
 *
 * Security model: Identity is verified by Clerk auth() server-side.
 * Uses admin client for DB ops since Supabase Third-Party Auth (JWKS) is
 * handled at the application layer via Clerk, not at the PostgREST layer.
 * All ownership checks are enforced in application code before any mutation.
 */
export async function createApplicationAction(
  rawInput: AdoptionApplicationInput
): Promise<ActionResponse<AdoptionApplicationRecord>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "You must be signed in to submit an adoption application" };
    }

    const parsed = adoptionApplicationSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    const adminSupabase = createAdminSupabaseClient();
    await ensureUserProfile();

    // 1. Check dog status and ownership (application-layer RLS enforcement)
    const { data: dog, error: dogError } = await adminSupabase
      .from("dogs")
      .select("id, name, owner_id, status")
      .eq("id", parsed.data.dog_id)
      .single();

    if (dogError || !dog) {
      return { success: false, error: "Selected dog listing was not found" };
    }

    if (dog.owner_id === userId) {
      return { success: false, error: "You cannot submit an adoption application for your own listed dog" };
    }

    if (dog.status !== DOG_STATUSES.AVAILABLE) {
      return { success: false, error: `This dog is currently ${dog.status} and not open for applications` };
    }

    // 2. Check for duplicate active application
    const { data: existingApp } = await adminSupabase
      .from("adoption_applications")
      .select("id, status")
      .eq("dog_id", parsed.data.dog_id)
      .eq("applicant_id", userId)
      .not("status", "in", `("${APPLICATION_STATUSES.CANCELLED}","${APPLICATION_STATUSES.REJECTED}")`)
      .maybeSingle();

    if (existingApp) {
      return {
        success: false,
        error: "You already have an active application in review for this dog",
      };
    }

    // 3. Insert application
    const appPayload = {
      dog_id: parsed.data.dog_id,
      applicant_id: userId,
      housing_type: parsed.data.housing_type,
      has_yard: parsed.data.has_yard,
      has_other_pets: parsed.data.has_other_pets,
      other_pets_details: parsed.data.other_pets_details || null,
      household_members_count: parsed.data.household_members_count,
      experience_level: parsed.data.experience_level,
      reason_for_adopting: parsed.data.reason_for_adopting,
      status: APPLICATION_STATUSES.PENDING,
    };

    const { data: newApplication, error: appError } = await adminSupabase
      .from("adoption_applications")
      .insert(appPayload)
      .select()
      .single();

    if (appError || !newApplication) {
      return { success: false, error: appError?.message || "Failed to create adoption application" };
    }

    // 4. Notify dog owner
    try {
      await adminSupabase.from("notifications").insert({
        user_id: dog.owner_id,
        title: "New Adoption Application",
        message: `An applicant has submitted an adoption questionnaire for ${dog.name}.`,
        type: "application_status",
        reference_id: newApplication.id,
      });
    } catch {
      // Non-blocking notification
    }

    revalidatePath(`/dogs/${parsed.data.dog_id}`);
    revalidatePath("/my-applications");
    revalidatePath("/admin/applications");

    return { success: true, data: newApplication as AdoptionApplicationRecord };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to submit application";
    return { success: false, error: message };
  }
}

/**
 * Retrieves all adoption applications submitted by the current user.
 */
export async function getUserApplicationsAction(): Promise<
  ActionResponse<ApplicationWithDetails[]>
> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    const adminSupabase = createAdminSupabaseClient();

    const { data, error } = await adminSupabase
      .from("adoption_applications")
      .select(`
        *,
        dogs (*, dog_images (*)),
        profiles!adoption_applications_applicant_id_fkey (*)
      `)
      .eq("applicant_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    const applications: ApplicationWithDetails[] = (data || []).map((row) => {
      const dogData = row.dogs;
      const images = dogData?.dog_images || [];
      const primaryImg = images.find((i: { is_primary: boolean; public_url: string }) => i.is_primary)?.public_url || images[0]?.public_url;

      return {
        ...row,
        dog: {
          ...dogData,
          images,
          primary_image: primaryImg,
        },
        applicant: row.profiles,
      };
    });

    return { success: true, data: applications };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load applications";
    return { success: false, error: message };
  }
}

/**
 * Cancels an application (applicant self-withdrawal).
 * Identity and ownership verified via Clerk auth() before any mutation.
 */
export async function cancelApplicationAction(
  applicationId: string
): Promise<ActionResponse<void>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    const adminSupabase = createAdminSupabaseClient();

    // Verify ownership before mutating
    const { data: current, error: checkError } = await adminSupabase
      .from("adoption_applications")
      .select("id, status, applicant_id")
      .eq("id", applicationId)
      .single();

    if (checkError || !current) {
      return { success: false, error: "Application not found" };
    }

    // Application-layer ownership enforcement (equivalent to RLS)
    if (current.applicant_id !== userId) {
      return { success: false, error: "You can only cancel your own application" };
    }

    if (
      current.status !== APPLICATION_STATUSES.PENDING &&
      current.status !== APPLICATION_STATUSES.UNDER_REVIEW
    ) {
      return {
        success: false,
        error: `Applications in ${current.status} state cannot be cancelled`,
      };
    }

    const { error: updateError } = await adminSupabase
      .from("adoption_applications")
      .update({
        status: APPLICATION_STATUSES.CANCELLED,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)
      .eq("applicant_id", userId); // Double-enforced ownership

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath("/my-applications");

    return { success: true, data: undefined };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to cancel application";
    return { success: false, error: message };
  }
}
