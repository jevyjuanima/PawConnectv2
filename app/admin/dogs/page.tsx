import * as React from "react";
import Link from "next/link";
import { Dog, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdminDogRow } from "@/components/admin/AdminDogRow";
import { getAdminDogsAction } from "@/app/actions/admin";

interface AdminDogsPageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function AdminDogsPage({ searchParams }: AdminDogsPageProps) {
  const { status } = await searchParams;
  const currentStatus = status || "all";

  const res = await getAdminDogsAction(currentStatus);
  const dogs = res.success && res.data ? res.data : [];

  const filterTabs = [
    { label: "All Dogs", val: "all" },
    { label: "Pending Review", val: "pending" },
    { label: "Available", val: "available" },
    { label: "Reserved", val: "reserved" },
    { label: "Adopted", val: "adopted" },
    { label: "Rejected", val: "rejected" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Dog className="h-5 w-5 text-primary" />
              Dog Listings Moderation
            </h2>
            <Badge variant="secondary" className="text-xs">
              {dogs.length} Total
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Verify submitted dog profiles, check vaccination status, and manage platform listings.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-4">
        {filterTabs.map((tab) => (
          <Link
            key={tab.val}
            href={`/admin/dogs?status=${tab.val}`}
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

      {/* Dog Rows List */}
      {dogs.length > 0 ? (
        <div className="space-y-3">
          {dogs.map((dog) => (
            <AdminDogRow key={dog.id} dog={dog} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 p-12 text-center">
          <Filter className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="text-base font-bold text-foreground">No Dogs Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1">
            There are no dog listings matching the &ldquo;{currentStatus}&rdquo; status filter.
          </p>
        </div>
      )}
    </div>
  );
}
