import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyDogsLoading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-4xl space-y-8 sm:space-y-10">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/70 pb-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-80 sm:w-96" />
        </div>
        <Skeleton className="h-5 w-32" />
      </div>

      {/* Card Skeletons */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-border/70 bg-card p-0 flex flex-col sm:flex-row"
          >
            <Skeleton className="sm:w-52 md:w-60 aspect-[16/10] sm:aspect-auto shrink-0 rounded-none h-44 sm:h-auto" />
            <div className="flex-1 p-5 sm:p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-3.5 w-48" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-4 w-72 max-w-full" />
                </div>
              </div>
              <div className="pt-2 border-t border-border/60 flex justify-between items-center">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
