"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/clerk/auth";
import {
  DOG_STATUSES,
  APPLICATION_STATUSES,
  USER_ROLES,
  SCREENING_STATUSES,
  FOLLOWUP_STATUSES,
  type ScreeningStatus,
  type FollowupStatus,
} from "@/lib/constants/statuses";
import type {
  ActionResponse,
  DogWithImages,
  ApplicationWithDetails,
  ProfileRecord,
  DogRecord,
  DogImageRecord,
  HouseholdScreeningWithDetails,
  FollowupWithDetails,
} from "@/types";

export interface AdminStats {
  totalDogs: number;
  pendingDogs: number;
  availableDogs: number;
  adoptedDogs: number;
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  pendingScreenings: number;
  approvedScreenings: number;
  dueFollowups: number;
  submittedFollowups: number;
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

    // Resilient queries for new tables
    let pendingScreeningsCount = 0;
    let approvedScreeningsCount = 0;
    try {
      const [pendingScr, approvedScr] = await Promise.all([
        supabase
          .from("household_screenings")
          .select("id", { count: "exact", head: true })
          .in("status", [SCREENING_STATUSES.PENDING, SCREENING_STATUSES.UNDER_REVIEW]),
        supabase
          .from("household_screenings")
          .select("id", { count: "exact", head: true })
          .eq("status", SCREENING_STATUSES.APPROVED),
      ]);
      pendingScreeningsCount = pendingScr.count ?? 0;
      approvedScreeningsCount = approvedScr.count ?? 0;
    } catch {
      // Table fallback
    }

    let dueFollowupsCount = 0;
    let submittedFollowupsCount = 0;
    try {
      const [dueFoll, submittedFoll] = await Promise.all([
        supabase
          .from("post_adoption_followups")
          .select("id", { count: "exact", head: true })
          .in("status", [FOLLOWUP_STATUSES.DUE, FOLLOWUP_STATUSES.NEEDS_FOLLOW_UP]),
        supabase
          .from("post_adoption_followups")
          .select("id", { count: "exact", head: true })
          .eq("status", FOLLOWUP_STATUSES.SUBMITTED),
      ]);
      dueFollowupsCount = dueFoll.count ?? 0;
      submittedFollowupsCount = submittedFoll.count ?? 0;
    } catch {
      // Table fallback
    }

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
        pendingScreenings: pendingScreeningsCount,
        approvedScreenings: approvedScreeningsCount,
        dueFollowups: dueFollowupsCount,
        submittedFollowups: submittedFollowupsCount,
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

    const appIds = (data || []).map((r) => r.id);
    const screeningsByAppId: Record<string, HouseholdScreeningWithDetails> = {};
    if (appIds.length > 0) {
      try {
        const { data: scrData } = await supabase
          .from("household_screenings")
          .select("*")
          .in("application_id", appIds);
        if (scrData) {
          for (const s of scrData) {
            screeningsByAppId[s.application_id] = s as HouseholdScreeningWithDetails;
          }
        }
      } catch {
        // Fallback if table query fails
      }
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

      // CRITICAL SERVER-SIDE ENFORCEMENT:
      // An adoption application cannot be approved until its household screening has been approved.
      try {
        const { data: screening } = await supabase
          .from("household_screenings")
          .select("id, status")
          .eq("application_id", applicationId)
          .maybeSingle();

        if (screening && screening.status !== SCREENING_STATUSES.APPROVED) {
          return {
            success: false,
            error: "This adoption application cannot be approved because its family & household suitability screening has not been approved by staff.",
          };
        }
      } catch (scrErr) {
        console.error("Screening verification note:", scrErr);
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

      // Automatically create schedule of monthly follow-ups for the next 12 months
      await schedulePostAdoptionFollowups(
        supabase,
        applicationId,
        app.dog_id,
        app.applicant_id,
        currentDog?.name || "your adopted dog",
        12
      );

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

/**
 * Helper to automatically create a 12-month post-adoption monitoring schedule
 * when an adoption application is finalized (completed).
 * Prevents duplicates if the completion action is retried.
 */
async function schedulePostAdoptionFollowups(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  applicationId: string,
  dogId: string,
  adopterId: string,
  dogName: string,
  monthsCount: number = 12
) {
  try {
    // Check for existing records to prevent duplicates on retries
    const { data: existing } = await supabase
      .from("post_adoption_followups")
      .select("id")
      .eq("application_id", applicationId)
      .limit(1);

    if (existing && existing.length > 0) {
      return;
    }

    const today = new Date();
    const records = [];
    for (let month = 1; month <= monthsCount; month++) {
      const dueDate = new Date(today);
      dueDate.setMonth(dueDate.getMonth() + month);
      records.push({
        application_id: applicationId,
        dog_id: dogId,
        adopter_id: adopterId,
        month_number: month,
        due_date: dueDate.toISOString().split("T")[0],
        status: FOLLOWUP_STATUSES.UPCOMING,
      });
    }

    await supabase.from("post_adoption_followups").insert(records);

    // Notification to adopter
    await supabase.from("notifications").insert({
      user_id: adopterId,
      title: "Post-Adoption Monitoring Activated",
      message: `Congratulations on adopting ${dogName}! Your ${monthsCount}-month post-adoption welfare monitoring schedule is now active. You can track upcoming check-ins and submit reports at /my-followups.`,
      type: "application_status",
      reference_id: applicationId,
    });
  } catch (err) {
    console.error("Non-fatal follow-up schedule creation note:", err);
  }
}

/**
 * Retrieves all household & family background screenings for admin review.
 */
export async function getAdminScreeningsAction(
  statusFilter?: string
): Promise<ActionResponse<HouseholdScreeningWithDetails[]>> {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return { success: false, error: "Administrative privileges required" };
    }

    const supabase = createAdminSupabaseClient();

    let query = supabase
      .from("household_screenings")
      .select(`
        *,
        dogs (*, dog_images (*)),
        applicant:profiles!household_screenings_applicant_id_fkey (*),
        reviewer:profiles!household_screenings_reviewer_id_fkey (*)
      `)
      .order("created_at", { ascending: false });

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      return { success: true, data: [] };
    }

    const screenings: HouseholdScreeningWithDetails[] = (data || []).map((row) => {
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
        applicant: row.applicant,
        reviewer: row.reviewer,
      };
    });

    return { success: true, data: screenings };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load screenings";
    return { success: false, error: message };
  }
}

/**
 * Reviews a household suitability screening: approves, marks under review, or rejects with reason.
 */
export async function reviewScreeningAction(
  screeningId: string,
  status: ScreeningStatus,
  adminNotes?: string,
  rejectionReason?: string
): Promise<ActionResponse<void>> {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return { success: false, error: "Administrative privileges required" };
    }

    const { userId } = await auth();
    const supabase = createAdminSupabaseClient();

    const { data: screening, error: fetchErr } = await supabase
      .from("household_screenings")
      .select("*, dogs(id, name)")
      .eq("id", screeningId)
      .single();

    if (fetchErr || !screening) {
      return { success: false, error: "Screening record not found" };
    }

    if (status === SCREENING_STATUSES.REJECTED && (!rejectionReason || !rejectionReason.trim())) {
      return { success: false, error: "A rejection reason is required when rejecting a screening." };
    }

    const updatePayload: Record<string, unknown> = {
      status,
      reviewer_id: userId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (adminNotes !== undefined) updatePayload.admin_notes = adminNotes.trim() || null;
    if (rejectionReason !== undefined) updatePayload.rejection_reason = rejectionReason.trim() || null;

    const { error: updateErr } = await supabase
      .from("household_screenings")
      .update(updatePayload)
      .eq("id", screeningId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // Notify applicant
    const dogName = screening.dogs?.name || "the dog";
    const statusMessages: Record<ScreeningStatus, string> = {
      [SCREENING_STATUSES.APPROVED]: `Great news! Your family and household suitability screening for ${dogName} has been approved by staff.`,
      [SCREENING_STATUSES.UNDER_REVIEW]: `Your household suitability screening for ${dogName} is currently under staff review.`,
      [SCREENING_STATUSES.REJECTED]: `Your household suitability screening for ${dogName} was not approved.${rejectionReason ? ` Reason: ${rejectionReason}` : ""}`,
      [SCREENING_STATUSES.PENDING]: `Your screening status has been reset to pending.`,
    };

    try {
      await supabase.from("notifications").insert({
        user_id: screening.applicant_id,
        title: "Household Screening Status Update",
        message: statusMessages[status] || "Your household suitability screening status has been updated.",
        type: "application_status",
        reference_id: screening.application_id,
      });
    } catch {
      // Non-blocking
    }

    revalidatePath("/admin/screenings");
    revalidatePath("/admin/applications");
    revalidatePath("/my-applications");

    return { success: true, data: undefined };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to review screening";
    return { success: false, error: message };
  }
}

/**
 * Retrieves all post-adoption follow-up reports and schedules for admin monitoring.
 */
export async function getAdminFollowupsAction(
  statusFilter?: string
): Promise<ActionResponse<FollowupWithDetails[]>> {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return { success: false, error: "Administrative privileges required" };
    }

    const supabase = createAdminSupabaseClient();

    let query = supabase
      .from("post_adoption_followups")
      .select(`
        *,
        dogs (*, dog_images (*)),
        adopter:profiles!post_adoption_followups_adopter_id_fkey (*),
        reviewer:profiles!post_adoption_followups_reviewer_id_fkey (*)
      `)
      .order("due_date", { ascending: false });

    if (statusFilter && statusFilter !== "all") {
      if (statusFilter === "due_or_overdue") {
        query = query.in("status", [FOLLOWUP_STATUSES.DUE, FOLLOWUP_STATUSES.UPCOMING]);
      } else {
        query = query.eq("status", statusFilter);
      }
    }

    const { data, error } = await query;
    if (error) {
      return { success: true, data: [] };
    }

    const today = new Date().toISOString().split("T")[0];
    const followups: FollowupWithDetails[] = (data || []).map((row) => {
      const dogData = row.dogs;
      const images = dogData?.dog_images || [];
      const primaryImg =
        images.find((i: { is_primary: boolean; public_url: string }) => i.is_primary)?.public_url ||
        images[0]?.public_url;

      // If upcoming and due_date <= today, reflect due
      let displayStatus = row.status;
      if (row.status === FOLLOWUP_STATUSES.UPCOMING && row.due_date <= today) {
        displayStatus = FOLLOWUP_STATUSES.DUE;
      }

      return {
        ...row,
        status: displayStatus,
        dog: {
          ...dogData,
          images,
          primary_image: primaryImg,
        },
        adopter: row.adopter,
        reviewer: row.reviewer,
      };
    });

    return { success: true, data: followups };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load follow-up records";
    return { success: false, error: message };
  }
}

/**
 * Reviews a submitted monthly follow-up report: marks reviewed or requests additional follow-up.
 */
export async function reviewFollowupAction(
  followupId: string,
  status: typeof FOLLOWUP_STATUSES.REVIEWED | typeof FOLLOWUP_STATUSES.NEEDS_FOLLOW_UP,
  adminNotes?: string,
  requiresAdditional?: boolean,
  additionalInstructions?: string
): Promise<ActionResponse<void>> {
  try {
    const isAdmin = await isCurrentUserAdmin();
    if (!isAdmin) {
      return { success: false, error: "Administrative privileges required" };
    }

    const { userId } = await auth();
    const supabase = createAdminSupabaseClient();

    const { data: followup, error: fetchErr } = await supabase
      .from("post_adoption_followups")
      .select("*, dogs(id, name)")
      .eq("id", followupId)
      .single();

    if (fetchErr || !followup) {
      return { success: false, error: "Follow-up record not found" };
    }

    const updatePayload: Record<string, unknown> = {
      status,
      reviewer_id: userId,
      reviewed_at: new Date().toISOString(),
      requires_additional_followup: requiresAdditional ?? (status === FOLLOWUP_STATUSES.NEEDS_FOLLOW_UP),
      updated_at: new Date().toISOString(),
    };

    if (adminNotes !== undefined) updatePayload.admin_notes = adminNotes.trim() || null;
    if (additionalInstructions !== undefined) {
      updatePayload.additional_followup_instructions = additionalInstructions.trim() || null;
    }

    const { error: updateErr } = await supabase
      .from("post_adoption_followups")
      .update(updatePayload)
      .eq("id", followupId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // Notify adopter
    const dogName = followup.dogs?.name || "your dog";
    const notifMessage =
      status === FOLLOWUP_STATUSES.REVIEWED
        ? `Your Month ${followup.month_number} welfare monitoring report for ${dogName} was reviewed and approved.`
        : `Staff reviewed your Month ${followup.month_number} report for ${dogName} and requested additional follow-up.${additionalInstructions ? ` Note: ${additionalInstructions}` : ""}`;

    try {
      await supabase.from("notifications").insert({
        user_id: followup.adopter_id,
        title: status === FOLLOWUP_STATUSES.REVIEWED ? "Monthly Report Reviewed" : "Additional Follow-Up Requested",
        message: notifMessage,
        type: "application_status",
        reference_id: followup.dog_id,
      });
    } catch {
      // Non-blocking
    }

    revalidatePath("/admin/follow-ups");
    revalidatePath("/my-followups");

    return { success: true, data: undefined };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to review follow-up report";
    return { success: false, error: message };
  }
}
