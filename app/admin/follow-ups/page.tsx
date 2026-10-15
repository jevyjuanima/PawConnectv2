import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Search, Calendar, FileCheck, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getAdminFollowupsAction } from "@/app/actions/admin";
import { AdminFollowupRow } from "@/components/admin/AdminFollowupRow";
import { FOLLOWUP_STATUSES } from "@/lib/constants/statuses";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Post-Adoption Follow-ups — PawConnect Admin",
  description: "Monitor monthly post-adoption welfare reports and adopter adjustments for 12 months.",
};

interface AdminFollowupsPageProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
  }>;
}

export default async function AdminFollowupsPage(props: AdminFollowupsPageProps) {
  const searchParams = await props.searchParams;
  const currentStatus = searchParams.status || "all";
  const searchFilter = (searchParams.search || "").toLowerCase().trim();

  const res = await getAdminFollowupsAction(currentStatus);
  const allFollowups = res.success && res.data ? res.data : [];

  const filteredFollowups = searchFilter
    ? allFollowups.filter((f) => {
        const dogName = f.dog?.name?.toLowerCase() || "";
        const adopterName = `${f.adopter?.first_name || ""} ${f.adopter?.last_name || ""}`.toLowerCase();
        const email = f.adopter?.email?.toLowerCase() || "";
        return (
          dogName.includes(searchFilter) ||
          adopterName.includes(searchFilter) ||
          email.includes(searchFilter)
        );
      })
    : allFollowups;

  const statusTabs = [
    { id: "all", label: "All Follow-ups" },
    { id: FOLLOWUP_STATUSES.DUE, label: "Due / Overdue" },
    { id: FOLLOWUP_STATUSES.SUBMITTED, label: "Submitted" },
    { id: FOLLOWUP_STATUSES.REVIEWED, label: "Reviewed" },
    { id: FOLLOWUP_STATUSES.NEEDS_FOLLOW_UP, label: "Needs Follow-up" },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/70 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Heart className="h-4 w-4" />
            <span>Post-Adoption Welfare Program</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-foreground">
            Monthly Post-Adoption Monitoring
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
            Monitor the physical welfare, eating habits, behavior, and living environment of adopted dogs throughout their first 12 months.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          {statusTabs.map((tab) => {
            const isActive = currentStatus === tab.id;
            return (
              <Link
                key={tab.id}
                href={`/admin/follow-ups${tab.id !== "all" ? `?status=${tab.id}` : ""}`}
                className={cn(
                  "px-3 py-1.5 rounded-lg border transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                    : "bg-card text-muted-foreground hover:text-foreground border-border"
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Search Input */}
        <form method="GET" className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          {currentStatus !== "all" && (
            <input type="hidden" name="status" value={currentStatus} />
          )}
          <Input
            name="search"
            defaultValue={searchParams.search || ""}
            placeholder="Search dog, adopter..."
            className="pl-9 text-xs h-9"
          />
        </form>
      </div>

      {/* Followups List */}
      {filteredFollowups.length > 0 ? (
        <div className="space-y-4">
          {filteredFollowups.map((followup) => (
            <AdminFollowupRow key={followup.id} followup={followup} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border/80 bg-card p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Heart className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-foreground text-base">
            No post-adoption follow-ups found
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchFilter || currentStatus !== "all"
              ? "No follow-up records matched your current search or status filter."
              : "When an adoption is finalized and completed, 12 monthly welfare monitoring checkpoints are automatically generated here."}
          </p>
          {(searchFilter || currentStatus !== "all") && (
            <div className="pt-2">
              <Link
                href="/admin/follow-ups"
                className="text-xs text-primary font-medium hover:underline"
              >
                Clear all filters
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
