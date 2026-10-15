"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  followupReportSchema,
  type FollowupReportInput,
} from "@/lib/validations/followup";
import { FOLLOWUP_STATUSES } from "@/lib/constants/statuses";
import type { ActionResponse, FollowupWithDetails } from "@/types";

/**
 * Retrieves all monthly post-adoption follow-ups scheduled for the current adopter.
 */
export async function getUserFollowupsAction(): Promise<
  ActionResponse<FollowupWithDetails[]>
> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    const supabase = createAdminSupabaseClient();

    let followups: FollowupWithDetails[] = [];
    try {
      const { data, error } = await supabase
        .from("post_adoption_followups")
        .select(`
          *,
          dogs (*, dog_images (*)),
          profiles!post_adoption_followups_adopter_id_fkey (*)
        `)
        .eq("adopter_id", userId)
        .order("due_date", { ascending: true });

      if (error) {
        // Table might not exist or empty
        console.warn("Followups query notice:", error.message);
        return { success: true, data: [] };
      }

      followups = (data || []).map((row) => {
        const dogData = row.dogs;
        const images = dogData?.dog_images || [];
        const primaryImg =
          images.find((i: { is_primary: boolean; public_url: string }) => i.is_primary)?.public_url ||
          images[0]?.public_url;

        // Dynamic status check: if status is upcoming and due_date <= today, show as due
        let computedStatus = row.status;
        if (row.status === FOLLOWUP_STATUSES.UPCOMING) {
          const today = new Date().toISOString().split("T")[0];
          if (row.due_date <= today) {
            computedStatus = FOLLOWUP_STATUSES.DUE;
          }
        }

        return {
          ...row,
          status: computedStatus,
          // Hide private admin notes from adopter
          admin_notes: null,
          dog: {
            ...dogData,
            images,
            primary_image: primaryImg,
          },
          adopter: row.profiles,
        };
      });
    } catch {
      return { success: true, data: [] };
    }

    return { success: true, data: followups };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load follow-up schedule";
    return { success: false, error: message };
  }
}

/**
 * Submits an adopter's monthly welfare report for an active or due follow-up.
 */
export async function submitFollowUpReportAction(
  rawInput: FollowupReportInput
): Promise<ActionResponse<void>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    const parsed = followupReportSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    const supabase = createAdminSupabaseClient();

    // Verify ownership and record status
    const { data: followup, error: fetchErr } = await supabase
      .from("post_adoption_followups")
      .select("*, dogs(id, name)")
      .eq("id", parsed.data.followup_id)
      .single();

    if (fetchErr || !followup) {
      return { success: false, error: "Follow-up record not found" };
    }

    if (followup.adopter_id !== userId) {
      return { success: false, error: "You can only submit reports for your own adopted dogs" };
    }

    if (followup.status === FOLLOWUP_STATUSES.REVIEWED) {
      return { success: false, error: "This monthly report has already been reviewed by staff" };
    }

    const updatePayload = {
      submitted_at: new Date().toISOString(),
      general_health: parsed.data.general_health,
      eating_behavior_adjustment: parsed.data.eating_behavior_adjustment,
      veterinary_care: parsed.data.veterinary_care,
      living_environment: parsed.data.living_environment,
      problems_concerns: parsed.data.problems_concerns || null,
      photo_url: parsed.data.photo_url || null,
      photo_storage_path: parsed.data.photo_storage_path || null,
      status: FOLLOWUP_STATUSES.SUBMITTED,
      updated_at: new Date().toISOString(),
    };

    const { error: updateErr } = await supabase
      .from("post_adoption_followups")
      .update(updatePayload)
      .eq("id", parsed.data.followup_id);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // In-app confirmation notification to adopter
    try {
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "Monthly Welfare Report Submitted",
        message: `Thank you for submitting the Month ${followup.month_number} report for ${followup.dogs?.name || "your dog"}. Our staff will review it shortly.`,
        type: "application_status",
        reference_id: followup.dog_id,
      });
    } catch {
      // Non-blocking
    }

    revalidatePath("/my-followups");
    revalidatePath("/admin/follow-ups");

    return { success: true, data: undefined };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to submit follow-up report";
    return { success: false, error: message };
  }
}
