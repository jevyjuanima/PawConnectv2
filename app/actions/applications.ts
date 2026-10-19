"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { ensureUserProfile } from "@/lib/clerk/auth";
import {
  adoptionApplicationSchema,
  type AdoptionApplicationInput,
} from "@/lib/validations/application";
import {
  householdScreeningSchema,
  type HouseholdScreeningInput,
} from "@/lib/validations/screening";
import { APPLICATION_STATUSES, DOG_STATUSES, SCREENING_STATUSES } from "@/lib/constants/statuses";
import type {
  ActionResponse,
  AdoptionApplicationRecord,
  ApplicationWithDetails,
  HouseholdScreeningRecord,
} from "@/types";

/**
 * Creates an adoption application with family & household suitability screening.
 *
 * Security model: Identity is verified by Clerk auth() server-side.
 * Uses admin client for DB ops. All ownership and state checks enforced.
 */
export async function createApplicationAction(
  rawInput: AdoptionApplicationInput,
  rawScreeningInput?: HouseholdScreeningInput
): Promise<ActionResponse<AdoptionApplicationRecord>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "You must be signed in to submit an adoption application" };
    }

    const parsedApp = adoptionApplicationSchema.safeParse(rawInput);
    if (!parsedApp.success) {
      return {
        success: false,
        error: parsedApp.error.issues.map((i) => i.message).join(", "),
      };
    }

    let parsedScreening: HouseholdScreeningInput | null = null;
    if (rawScreeningInput) {
      const screeningResult = householdScreeningSchema.safeParse(rawScreeningInput);
      if (!screeningResult.success) {
        return {
          success: false,
          error: `Screening error: ${screeningResult.error.issues.map((i) => i.message).join(", ")}`,
        };
      }
      parsedScreening = screeningResult.data;
    }

    const adminSupabase = createAdminSupabaseClient();
    await ensureUserProfile();

    // 1. Check dog status and ownership (application-layer RLS enforcement)
    const { data: dog, error: dogError } = await adminSupabase
      .from("dogs")
      .select("id, name, owner_id, status")
      .eq("id", parsedApp.data.dog_id)
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

    // 2. Check for existing application
    const { data: existingApp } = await adminSupabase
      .from("adoption_applications")
      .select("id, status")
      .eq("dog_id", parsedApp.data.dog_id)
      .eq("applicant_id", userId)
      .maybeSingle();

    if (existingApp) {
      if (
        existingApp.status === APPLICATION_STATUSES.PENDING ||
        existingApp.status === APPLICATION_STATUSES.UNDER_REVIEW
      ) {
        return {
          success: false,
          error: "You already have an active application in review for this dog.",
        };
      }
      if (existingApp.status === APPLICATION_STATUSES.APPROVED) {
        return {
          success: false,
          error: "You already have an approved application for this dog.",
        };
      }
      if (existingApp.status === APPLICATION_STATUSES.COMPLETED) {
        return {
          success: false,
          error: "You have already completed the adoption process for this dog.",
        };
      }
      if (existingApp.status === APPLICATION_STATUSES.REJECTED) {
        return {
          success: false,
          error:
            "An application for this dog was previously submitted and reviewed. Only one application per dog listing is permitted.",
        };
      }
      if (existingApp.status === APPLICATION_STATUSES.CANCELLED) {
        return {
          success: false,
          error:
            "An application for this dog was previously submitted and withdrawn. Please contact shelter staff if you wish to reopen your application.",
        };
      }
      return {
        success: false,
        error: "An application for this dog has already been submitted by your account.",
      };
    }

    // 3. Insert application
    const appPayload = {
      dog_id: parsedApp.data.dog_id,
      applicant_id: userId,
      housing_type: parsedApp.data.housing_type,
      has_yard: parsedApp.data.has_yard,
      has_other_pets: parsedApp.data.has_other_pets,
      other_pets_details: parsedApp.data.other_pets_details || null,
      household_members_count: parsedApp.data.household_members_count,
      experience_level: parsedApp.data.experience_level,
      reason_for_adopting: parsedApp.data.reason_for_adopting,
      status: APPLICATION_STATUSES.PENDING,
    };

    const { data: newApplication, error: appError } = await adminSupabase
      .from("adoption_applications")
      .insert(appPayload)
      .select()
      .single();

    if (appError || !newApplication) {
      if (
        appError?.code === "23505" ||
        appError?.message?.toLowerCase().includes("unique_applicant_dog_active") ||
        appError?.message?.toLowerCase().includes("duplicate key")
      ) {
        return {
          success: false,
          error: "An application for this dog has already been submitted by your account.",
        };
      }
      return { success: false, error: appError?.message || "Failed to create adoption application" };
    }

    // 4. Insert linked household screening record
    if (parsedScreening) {
      try {
        await adminSupabase.from("household_screenings").insert({
          application_id: newApplication.id,
          applicant_id: userId,
          dog_id: parsedApp.data.dog_id,
          status: SCREENING_STATUSES.PENDING,
          household_agreement: parsedScreening.household_agreement,
          housing_type: parsedScreening.housing_type,
          landlord_permission: parsedScreening.landlord_permission ?? null,
          has_children: parsedScreening.has_children,
          children_details: parsedScreening.children_details || null,
          household_members_details: parsedScreening.household_members_details,
          existing_pets_details: parsedScreening.existing_pets_details || null,
          pet_care_experience: parsedScreening.pet_care_experience,
          daily_alone_hours: parsedScreening.daily_alone_hours,
          daily_care_arrangements: parsedScreening.daily_care_arrangements,
          emergency_vet_care_plan: parsedScreening.emergency_vet_care_plan,
          screening_consent: parsedScreening.screening_consent,
        });
      } catch (screeningErr) {
        console.error("Non-fatal: screening insert error (table may need migration):", screeningErr);
      }
    }

    // 5. Notify dog owner
    try {
      await adminSupabase.from("notifications").insert({
        user_id: dog.owner_id,
        title: "New Adoption Application",
        message: `An applicant has submitted an adoption application with household suitability screening for ${dog.name}.`,
        type: "application_status",
        reference_id: newApplication.id,
      });
    } catch {
      // Non-blocking notification
    }

    revalidatePath(`/dogs/${parsedApp.data.dog_id}`);
    revalidatePath("/my-applications");
    revalidatePath("/admin/applications");
    revalidatePath("/admin/screenings");

    return { success: true, data: newApplication as AdoptionApplicationRecord };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to submit application";
    return { success: false, error: message };
  }
}

/**
 * Retrieves all adoption applications submitted by the current user.
 * Strips private admin notes from linked household screening for privacy.
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

    // Retrieve associated screenings
    const appIds = (data || []).map((row) => row.id);
    let screeningsByAppId: Record<string, HouseholdScreeningRecord> = {};

    if (appIds.length > 0) {
      try {
        const { data: screeningRows } = await adminSupabase
          .from("household_screenings")
          .select("*")
          .in("application_id", appIds);

        if (screeningRows) {
          screeningsByAppId = screeningRows.reduce((acc, row) => {
            // Strip private admin notes before returning to applicant
            const safeRow: HouseholdScreeningRecord = {
              ...row,
              admin_notes: null,
            };
            acc[row.application_id] = safeRow;
            return acc;
          }, {} as Record<string, HouseholdScreeningRecord>);
        }
      } catch {
        // Fallback if table not queried
      }
    }

    const applications: ApplicationWithDetails[] = (data || []).map((row) => {
      const dogData = row.dogs;
      const images = dogData?.dog_images || [];
      const primaryImg =
        images.find((i: { is_primary: boolean; public_url: string }) => i.is_primary)?.public_url ||
        images[0]?.public_url;

      return {
        ...row,
        dog: {
          ...dogData,
          images,
          primary_image: primaryImg,
        },
        applicant: row.profiles,
        screening: screeningsByAppId[row.id] || null,
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
