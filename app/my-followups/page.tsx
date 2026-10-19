import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Heart, ArrowRight, ShieldCheck, Calendar } from "lucide-react";
import { getUserFollowupsAction } from "@/app/actions/followup";
import { UserFollowupList } from "@/components/followups/UserFollowupList";

export const metadata: Metadata = {
  title: "Monthly Post-Adoption Follow-ups | PawConnect",
  description:
    "Track your 12-month post-adoption welfare schedule, submit monthly updates, and share photos of your adopted dog.",
};

export default async function MyFollowupsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/my-followups");
  }

  const result = await getUserFollowupsAction();
  const followups = result.success && result.data ? result.data : [];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-5xl space-y-8 sm:space-y-10">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/70 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Heart className="h-4 w-4" />
            <span>Adoption Welfare Program</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Monthly Post-Adoption Monitoring
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
            PawConnect stays connected with adopters throughout the first year. Share monthly reports on health, adjustment, routine, and photos to support your dog&apos;s journey.
          </p>
        </div>

        <Link
          href="/my-applications"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4 self-start sm:self-auto shrink-0"
        >
          <span>My Applications</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Advisory Banner */}
      <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 sm:p-5 flex items-start gap-3.5">
        <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm space-y-1.5">
          <p className="font-bold text-foreground">
            12-Month Post-Adoption Welfare Follow-ups
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Submit a quick monthly check-in covering your dog&apos;s health, routine, and adjustment. Our welfare team reviews each report to support you both.
          </p>
        </div>
      </div>

      {/* Schedule / Followup List */}
      <UserFollowupList followups={followups} />
    </div>
  );
}
