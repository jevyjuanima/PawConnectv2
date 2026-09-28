import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { DogCardSkeleton } from "@/components/dogs/DogCardSkeleton";

export default function DogsLoading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b pb-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="flex justify-between items-center pt-2">
          <div className="flex gap-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
      </div>

      {/* Grid of Dog Card Skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <DogCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
