import * as React from "react";
import Link from "next/link";
import { HeartHandshake, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdminApplicationRow } from "@/components/admin/AdminApplicationRow";
import { getAdminApplicationsAction } from "@/app/actions/admin";

interface AdminApplicationsPageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function AdminApplicationsPage({
  searchParams,
}: AdminApplicationsPageProps) {
  const { status } = await searchParams;
  const currentStatus = status || "all";

  const res = await getAdminApplicationsAction(currentStatus);
  const applications = res.success && res.data ? res.data : [];

  const filterTabs = [
    { label: "All Applications", val: "all" },
    { label: "Pending", val: "pending" },
    { label: "Under Review", val: "under_review" },
    { label: "Approved", val: "approved" },
    { label: "Completed", val: "completed" },
    { label: "Rejected", val: "rejected" },
    { label: "Cancelled", val: "cancelled" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <HeartHandshake className="h-5 w-5 text-primary" />
              Adoption Applications Queue
            </h2>
            <Badge variant="secondary" className="text-xs">
              {applications.length} Total
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Review prospective adopter questionnaires, manage application lifecycle, and finalize adoptions.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-4">
        {filterTabs.map((tab) => (
          <Link
            key={tab.val}
            href={`/admin/applications?status=${tab.val}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentStatus === tab.val
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "bg-background border hover:bg-muted text-muted-foreground"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Application Rows List */}
      {applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((app) => (
            <AdminApplicationRow key={app.id} application={app} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 p-12 text-center">
          <Filter className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="text-base font-bold text-foreground">No Applications Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1">
            There are no adoption applications matching the &ldquo;{currentStatus}&rdquo; status filter.
          </p>
        </div>
      )}
    </div>
  );
}
