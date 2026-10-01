import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function RehomeLoading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-3xl space-y-8">
      {/* Back Link Skeleton */}
      <Skeleton className="h-4 w-32" />

      {/* Header Skeleton */}
      <div className="space-y-2 border-b border-border/70 pb-6">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>

      {/* Stepper Skeleton */}
      <div className="space-y-3">
        <div className="hidden sm:grid grid-cols-5 gap-2 border-b border-border/70 pb-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-4 w-24" />
          ))}
        </div>
        <div className="sm:hidden h-1 w-full bg-muted rounded-full" />
      </div>

      {/* Form Fields Skeleton */}
      <div className="space-y-5 pt-2">
        <Skeleton className="h-7 w-40" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
