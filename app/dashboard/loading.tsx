import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 max-w-6xl">
      {/* Breadcrumb Skeleton */}
      <Skeleton className="h-4 w-32" />

      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-2xl border p-6 space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-12" />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
          <Skeleton className="h-4 w-36 pt-2" />
        </Card>

        <Card className="rounded-2xl border p-6 space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-12" />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
          <Skeleton className="h-4 w-36 pt-2" />
        </Card>
      </div>

      {/* Recent items grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
