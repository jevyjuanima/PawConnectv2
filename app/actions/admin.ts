"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/clerk/auth";
import { DOG_STATUSES, APPLICATION_STATUSES, USER_ROLES } from "@/lib/constants/statuses";
import type {
  ActionResponse,
  DogWithImages,
  ApplicationWithDetails,
  ProfileRecord,
  DogRecord,
  DogImageRecord,
} from "@/types";

export interface AdminStats {
  totalDogs: number;
  pendingDogs: number;
  availableDogs: number;
  adoptedDogs: number;
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  totalUsers: number;
}

/**
 * Retrieves aggregate platform metrics for admin dashboard.
 */
export async function getAdminStatsAction(): Promise<ActionResponse<AdminStats>> {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return { success: false, error: "Administrative privileges required" };
    }

    const supabase = createAdminSupabaseClient();

    const [
      dogsRes,
      pendingDogsRes,
      availDogsRes,
      adoptedDogsRes,
      appsRes,
      pendingAppsRes,
      approvedAppsRes,
      usersRes,
    ] = await Promise.all([
      supabase.from("dogs").select("id", { count: "exact", head: true }),
      supabase.from("dogs").select("id", { count: "exact", head: true }).eq("status", DOG_STATUSES.PENDING),
      supabase.from("dogs").select("id", { count: "exact", head: true }).eq("status", DOG_STATUSES.AVAILABLE),
      supabase.from("dogs").select("id", { count: "exact", head: true }).eq("status", DOG_STATUSES.ADOPTED),
      supabase.from("adoption_applications").select("id", { count: "exact", head: true }),
      supabase.from("adoption_applications").select("id", { count: "exact", head: true }).eq("status", APPLICATION_STATUSES.PENDING),
      supabase.from("adoption_applications").select("id", { count: "exact", head: true }).eq("status", APPLICATION_STATUSES.APPROVED),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]);

    return {
      success: true,
      data: {
        totalDogs: dogsRes.count ?? 0,
        pendingDogs: pendingDogsRes.count ?? 0,
        availableDogs: availDogsRes.count ?? 0,
        adoptedDogs: adoptedDogsRes.count ?? 0,
        totalApplications: appsRes.count ?? 0,
        pendingApplications: pendingAppsRes.count ?? 0,
        approvedApplications: approvedAppsRes.count ?? 0,
        totalUsers: usersRes.count ?? 0,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load admin stats";
    return { success: false, error: message };
  }
}

/**
 * Retrieves all dogs across all statuses with owner info.
 */
export async function getAdminDogsAction(
  statusFilter?: string
): Promise<ActionResponse<DogWithImages[]>> {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return { success: false, error: "Administrative privileges required" };
    }

    const supabase = createAdminSupabaseClient();

    let query = supabase
      .from("dogs")
      .select("*, dog_images(*), profiles!dogs_owner_id_fkey(*)")
      .order("created_at", { ascending: false });

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      return { success: false, error: error.message };
    }

    const dogs: DogWithImages[] = (data || []).map((row: DogRecord & { dog_images?: DogImageRecord[]; profiles?: Partial<ProfileRecord> }) => {
      const images = row.dog_images || [];
      const primaryImg = images.find((i) => i.is_primary)?.public_url || images[0]?.public_url;
      return {
        ...row,
        images,
        primary_image: primaryImg,
        owner: row.profiles,
      };
    });

    return { success: true, data: dogs };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load admin dogs";
    return { success: false, error: message };
  }
}

/**
 * Reviews a submitted dog listing: approves (available) or rejects with reason.
 */
export async function reviewDogAction(
  dogId: string,
  status: typeof DOG_STATUSES.AVAILABLE | typeof DOG_STATUSES.REJECTED,
  reason?: string
): Promise<ActionResponse<void>> {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return { success: false, error: "Administrative privileges required" };
    }

    const supabase = createAdminSupabaseClient();

    const { data: dog, error: fetchErr } = await supabase
      .from("dogs")
      .select("id, name, owner_id, status")
      .eq("id", dogId)
      .single();

    if (fetchErr || !dog) {
      return { success: false, error: "Dog record not found" };
    }

    if (dog.status !== DOG_STATUSES.PENDING) {
      return {
        success: false,
        error: `Only dog listings in 'pending' status can be reviewed. Current status is '${dog.status}'.`,
      };
    }

    if (status === DOG_STATUSES.REJECTED && (!reason || !reason.trim())) {
      return {
        success: false,
        error: "A rejection reason is required when rejecting a dog listing.",
      };
    }

    const { error: updateErr } = await supabase
      .from("dogs")
      .update({
        status,
        rejection_reason: status === DOG_STATUSES.REJECTED ? reason?.trim() || null : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", dogId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // Notify owner
    try {
      await supabase.from("notifications").insert({
        user_id: dog.owner_id,
        title: status === DOG_STATUSES.AVAILABLE ? "Dog Listing Approved!" : "Dog Listing Update",
        message:
          status === DOG_STATUSES.AVAILABLE
            ? `Great news! Your listing for ${dog.name} has been approved and is now live.`
            : `Your listing for ${dog.name} was not approved.${reason ? ` Reason: ${reason}` : ""}`,
        type: "rehome_status",
        reference_id: dog.id,
      });
    } catch {
      // Non-blocking notification
    }

    revalidatePath("/admin/dogs");
    revalidatePath("/dogs");
    revalidatePath(`/dogs/${dogId}`);
    revalidatePath("/my-dogs");

    return { success: true, data: undefined };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to review dog";
    return { success: false, error: message };
  }
}

/**
 * Retrieves all applications for admin review.
 */
export async function getAdminApplicationsAction(
  statusFilter?: string
): Promise<ActionResponse<ApplicationWithDetails[]>> {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return { success: false, error: "Administrative privileges required" };
    }

    const supabase = createAdminSupabaseClient();

    let query = supabase
      .from("adoption_applications")
      .select(`
        *,
        dogs (*, dog_images (*)),
        profiles!adoption_applications_applicant_id_fkey (*)
      `)
      .order("created_at", { ascending: false });

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      return { success: false, error: error.message };
    }

    const applications: ApplicationWithDetails[] = (data || []).map((row) => {
      const dogData = row.dogs;
      const images = dogData?.dog_images || [];
      const primaryImg = images.find((i: DogImageRecord) => i.is_primary)?.public_url || images[0]?.public_url;

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
 * Advances application state and manages dog status sync.
 * Enforces strict state transitions and concurrency checks.
 */
export async function reviewApplicationAction(
  applicationId: string,
  newStatus:
    | typeof APPLICATION_STATUSES.UNDER_REVIEW
    | typeof APPLICATION_STATUSES.APPROVED
    | typeof APPLICATION_STATUSES.REJECTED
    | typeof APPLICATION_STATUSES.COMPLETED,
  adminNotes?: string,
  rejectionReason?: string
): Promise<ActionResponse<void>> {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return { success: false, error: "Administrative privileges required" };
    }

    const supabase = createAdminSupabaseClient();

    const { data: app, error: fetchErr } = await supabase
      .from("adoption_applications")
      .select("*, dogs(id, name, owner_id, status)")
      .eq("id", applicationId)
      .single();

    if (fetchErr || !app) {
      return { success: false, error: "Application not found" };
    }

    const currentDog = app.dogs;

    // Validate state machine transitions
    if (newStatus === APPLICATION_STATUSES.UNDER_REVIEW) {
      if (app.status !== APPLICATION_STATUSES.PENDING) {
        return {
          success: false,
          error: `Application must be in 'pending' status to begin review. Current status is '${app.status}'.`,
        };
      }
    } else if (newStatus === APPLICATION_STATUSES.APPROVED) {
      if (app.status !== APPLICATION_STATUSES.UNDER_REVIEW) {
        return {
          success: false,
          error: `Application must be in 'under_review' status before approval. Current status is '${app.status}'.`,
        };
      }
      if (currentDog?.status === DOG_STATUSES.ADOPTED) {
        return {
          success: false,
          error: "This dog has already been adopted by another applicant.",
        };
      }
      if (currentDog?.status === DOG_STATUSES.RESERVED) {
        return {
          success: false,
          error: "This dog is already reserved for an approved application.",
        };
      }
    } else if (newStatus === APPLICATION_STATUSES.REJECTED) {
      if (
        app.status !== APPLICATION_STATUSES.PENDING &&
        app.status !== APPLICATION_STATUSES.UNDER_REVIEW &&
        app.status !== APPLICATION_STATUSES.APPROVED
      ) {
        return {
          success: false,
          error: `Cannot reject an application with status '${app.status}'.`,
        };
      }
      if (!rejectionReason || !rejectionReason.trim()) {
        return {
          success: false,
          error: "A rejection reason is required when rejecting an application.",
        };
      }
    } else if (newStatus === APPLICATION_STATUSES.COMPLETED) {
      if (app.status !== APPLICATION_STATUSES.APPROVED) {
        return {
          success: false,
          error: `Application must be in 'approved' status before completing adoption. Current status is '${app.status}'.`,
        };
      }
      if (currentDog?.status === DOG_STATUSES.ADOPTED) {
        return {
          success: false,
          error: "This dog has already been marked as adopted.",
        };
      }
    }

    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (adminNotes !== undefined) updatePayload.admin_notes = adminNotes.trim() || null;
    if (rejectionReason !== undefined) updatePayload.rejection_reason = rejectionReason.trim() || null;

    const { error: updateErr } = await supabase
      .from("adoption_applications")
      .update(updatePayload)
      .eq("id", applicationId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // Sync dog status
    if (newStatus === APPLICATION_STATUSES.APPROVED) {
      await supabase
        .from("dogs")
        .update({ status: DOG_STATUSES.RESERVED, updated_at: new Date().toISOString() })
        .eq("id", app.dog_id);
    } else if (newStatus === APPLICATION_STATUSES.COMPLETED) {
      // Finalize dog adoption
      await supabase
        .from("dogs")
        .update({ status: DOG_STATUSES.ADOPTED, updated_at: new Date().toISOString() })
        .eq("id", app.dog_id);

      // Auto-cancel remaining applications for this dog to prevent race conditions
      await supabase
        .from("adoption_applications")
        .update({
          status: APPLICATION_STATUSES.REJECTED,
          rejection_reason: "This dog has been adopted by another applicant.",
          updated_at: new Date().toISOString(),
        })
        .eq("dog_id", app.dog_id)
        .neq("id", applicationId)
        .in("status", [APPLICATION_STATUSES.PENDING, APPLICATION_STATUSES.UNDER_REVIEW]);
    } else if (newStatus === APPLICATION_STATUSES.REJECTED && app.status === APPLICATION_STATUSES.APPROVED) {
      // Revert dog to available if previously approved application was rejected
      await supabase
        .from("dogs")
        .update({ status: DOG_STATUSES.AVAILABLE, updated_at: new Date().toISOString() })
        .eq("id", app.dog_id);
    }

    // Notify applicant
    try {
      const messages: Record<string, string> = {
        [APPLICATION_STATUSES.UNDER_REVIEW]: `Your application for ${app.dogs?.name} is now under review.`,
        [APPLICATION_STATUSES.APPROVED]: `Congratulations! Your adoption application for ${app.dogs?.name} has been approved!`,
        [APPLICATION_STATUSES.REJECTED]: `Your application for ${app.dogs?.name} was not approved.${rejectionReason ? ` Reason: ${rejectionReason}` : ""}`,
        [APPLICATION_STATUSES.COMPLETED]: `Adoption finalized! Welcome ${app.dogs?.name} to your family!`,
      };

      await supabase.from("notifications").insert({
        user_id: app.applicant_id,
        title: "Application Status Update",
        message: messages[newStatus] || "Your application status has been updated.",
        type: "application_status",
        reference_id: app.id,
      });
    } catch {
      // Non-blocking
    }

    revalidatePath("/admin/applications");
    revalidatePath("/admin/dogs");
    revalidatePath("/dogs");
    revalidatePath(`/dogs/${app.dog_id}`);
    revalidatePath("/my-applications");

    return { success: true, data: undefined };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update application";
    return { success: false, error: message };
  }
}

/**
 * Retrieves all user profiles for admin user management table.
 */
export async function getAdminUsersAction(): Promise<ActionResponse<ProfileRecord[]>> {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return { success: false, error: "Administrative privileges required" };
    }

    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: (data || []) as ProfileRecord[] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load users";
    return { success: false, error: message };
  }
}

/**
 * Updates a user's role (admin privilege only).
 */
export async function updateUserRoleAction(
  targetClerkId: string,
  role: typeof USER_ROLES.USER | typeof USER_ROLES.ADMIN
): Promise<ActionResponse<void>> {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return { success: false, error: "Administrative privileges required" };
    }

    const { userId } = await auth();
    if (userId === targetClerkId && role !== USER_ROLES.ADMIN) {
      return { success: false, error: "You cannot revoke your own administrator privileges" };
    }

    const supabase = createAdminSupabaseClient();

    const { error } = await supabase
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("clerk_id", targetClerkId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/users");
    return { success: true, data: undefined };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update user role";
    return { success: false, error: message };
  }
}
