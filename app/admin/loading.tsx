import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function AdminLoading() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* KPI 4-grid Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="rounded-2xl border p-5 space-y-2">
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-4" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-28" />
          </Card>
        ))}
      </div>

      {/* Panels 3-grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="rounded-2xl border p-6 space-y-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-12 w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}
