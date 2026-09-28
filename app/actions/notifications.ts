"use server";

import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { ActionResponse, NotificationRecord } from "@/types";

export async function getNotificationsAction(): Promise<
  ActionResponse<NotificationRecord[]>
> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Authentication required" };
  }

  try {
    const adminSupabase = createAdminSupabaseClient();
    // Filter by userId ensures users only see their own notifications (application-layer ownership)
    const { data, error } = await adminSupabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: (data as NotificationRecord[]) ?? [] };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load notifications",
    };
  }
}

export async function markNotificationAsReadAction(
  notificationId: string
): Promise<ActionResponse<void>> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Authentication required" };
  }

  try {
    const adminSupabase = createAdminSupabaseClient();
    // .eq("user_id", userId) enforces ownership — user can only mark their own notifications
    const { error } = await adminSupabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("user_id", userId); // Application-layer ownership enforcement

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update notification",
    };
  }
}
