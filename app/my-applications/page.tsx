import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight } from "lucide-react";
import { UserApplicationList } from "@/components/applications/UserApplicationList";
import { getUserApplicationsAction } from "@/app/actions/applications";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "My Applications | PawConnect",
  description: "Keep track of the dogs you've applied to adopt and follow each application's progress on PawConnect.",
};

export default async function MyApplicationsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/my-applications");
  }

  const result = await getUserApplicationsAction();
  const applications = result.success && result.data ? result.data : [];

  // Check unread notifications referencing applications
  const unreadApplicationIds: string[] = [];
  try {
    const adminSupabase = createAdminSupabaseClient();
    const { data: unreadNotifs } = await adminSupabase
      .from("notifications")
      .select("reference_id")
      .eq("user_id", userId)
      .eq("is_read", false);

    if (unreadNotifs) {
      unreadNotifs.forEach((n) => {
        if (n.reference_id) unreadApplicationIds.push(n.reference_id);
      });
    }
  } catch {
    // Non-fatal
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-4xl space-y-8 sm:space-y-10">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/70 pb-6">
        <div className="space-y-1.5">
          <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-foreground">
            My Applications
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed">
            Keep track of the dogs you&apos;ve applied to adopt and follow each application&apos;s progress.
          </p>
        </div>

        <Link
          href="/dogs"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4 self-start sm:self-auto shrink-0"
        >
          <span>Browse Dogs</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Applications List / Empty State */}
      <UserApplicationList
        applications={applications}
        unreadApplicationIds={unreadApplicationIds}
      />
    </div>
  );
}
