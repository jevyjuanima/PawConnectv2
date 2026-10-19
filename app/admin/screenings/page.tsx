import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getAdminScreeningsAction } from "@/app/actions/admin";
import { AdminScreeningRow } from "@/components/admin/AdminScreeningRow";
import { SCREENING_STATUSES } from "@/lib/constants/statuses";
import { cn } from "@/lib/utils";
import { computeSuitabilityScore } from "@/lib/scoring/screening-score";

export const metadata: Metadata = {
  title: "Screening Management — PawConnect Admin",
  description: "Review and evaluate household suitability screenings for adoption applicants.",
};

interface AdminScreeningsPageProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
  }>;
}

export default async function AdminScreeningsPage(props: AdminScreeningsPageProps) {
  const searchParams = await props.searchParams;
  const currentStatus = searchParams.status || "all";
  const searchFilter = (searchParams.search || "").toLowerCase().trim();

  const res = await getAdminScreeningsAction(currentStatus);
  const allScreenings = res.success && res.data ? res.data : [];

  const filteredScreenings = searchFilter
    ? allScreenings.filter((s) => {
        const dogName = s.dog?.name?.toLowerCase() || "";
        const applicantName = `${s.applicant?.first_name || ""} ${s.applicant?.last_name || ""}`.toLowerCase();
        const email = s.applicant?.email?.toLowerCase() || "";
        return (
          dogName.includes(searchFilter) ||
          applicantName.includes(searchFilter) ||
          email.includes(searchFilter)
        );
      })
    : allScreenings;

  const statusTabs = [
    { id: "all", label: "All Screenings" },
    { id: SCREENING_STATUSES.PENDING, label: "Pending" },
    { id: SCREENING_STATUSES.UNDER_REVIEW, label: "In Review" },
    { id: SCREENING_STATUSES.APPROVED, label: "Approved" },
    { id: SCREENING_STATUSES.REJECTED, label: "Rejected" },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/70 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <ShieldCheck className="h-4 w-4" />
            <span>Adoption Pre-Screening</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Household Suitability Screenings
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
            Evaluate family suitability, housing arrangements, pet care experience, and daily routines before an adoption application can be approved.
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
                href={`/admin/screenings${tab.id !== "all" ? `?status=${tab.id}` : ""}`}
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

        {/* Search input (form submit on enter) */}
        <form method="GET" className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          {currentStatus !== "all" && (
            <input type="hidden" name="status" value={currentStatus} />
          )}
          <Input
            name="search"
            defaultValue={searchParams.search || ""}
            placeholder="Search dog, applicant..."
            className="pl-9 text-xs h-9"
          />
        </form>
      </div>

      {/* Screenings List */}
      {filteredScreenings.length > 0 ? (
        <div className="space-y-4">
          {filteredScreenings.map((screening) => {
            // Score is computed server-side here, serialized as a prop,
            // and rendered by the client component without re-computation.
            const scoreResult = computeSuitabilityScore({
              housing_type: screening.housing_type,
              landlord_permission: screening.landlord_permission,
              has_children: screening.has_children,
              children_details: screening.children_details,
              household_members_details: screening.household_members_details,
              existing_pets_details: screening.existing_pets_details,
              pet_care_experience: screening.pet_care_experience,
              daily_alone_hours: screening.daily_alone_hours,
              daily_care_arrangements: screening.daily_care_arrangements,
              emergency_vet_care_plan: screening.emergency_vet_care_plan,
              household_agreement: screening.household_agreement,
              screening_consent: screening.screening_consent,
            });
            return (
              <AdminScreeningRow
                key={screening.id}
                screening={screening}
                scoreResult={scoreResult}
              />
            );
          })}

        </div>
      ) : (
        <div className="rounded-2xl border border-border/80 bg-card p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-foreground text-base">
            No household screenings found
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchFilter || currentStatus !== "all"
              ? "No screening records matched your current search or status filter."
              : "When applicants submit adoption questionnaires, their household background screenings will appear here for staff review."}
          </p>
          {(searchFilter || currentStatus !== "all") && (
            <div className="pt-2">
              <Link
                href="/admin/screenings"
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
