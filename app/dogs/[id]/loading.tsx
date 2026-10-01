import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DogDetailLoading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-6xl">
      {/* Back link skeleton */}
      <div className="mb-6 sm:mb-8">
        <Skeleton className="h-4 w-28" />
      </div>

      {/* Main Showcase Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Gallery Skeleton */}
        <div className="lg:col-span-7 space-y-3">
          <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
          <div className="flex gap-2.5">
            <Skeleton className="h-18 w-22 rounded-xl" />
            <Skeleton className="h-18 w-22 rounded-xl" />
          </div>
        </div>

        {/* Right Column: Dog Summary Skeleton */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-56" />
            <Skeleton className="h-5 w-44" />
          </div>

          <div className="grid grid-cols-3 gap-4 py-4 border-y border-border/60">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>

          <div className="space-y-3 pt-1">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      </div>

      {/* Divider */}
      <hr className="my-12 sm:my-16 border-border/60" />

      {/* Editorial Details Skeletons */}
      <div className="max-w-3xl space-y-12">
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>

        <div className="space-y-4">
          <Skeleton className="h-7 w-48" />
          <div className="space-y-3 border-y border-border/60 py-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
