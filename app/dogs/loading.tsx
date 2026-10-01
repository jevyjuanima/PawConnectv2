import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { DogCardSkeleton } from "@/components/dogs/DogCardSkeleton";

export default function DogsLoading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10 max-w-7xl">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-border/70">
        <div className="space-y-3">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-10 w-72 sm:w-96" />
          <Skeleton className="h-4 w-80 sm:w-[480px] max-w-full" />
        </div>
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl hidden md:block" />
      </div>

      {/* 3-Column Grid of Dog Card Skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <DogCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
