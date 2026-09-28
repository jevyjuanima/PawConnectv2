import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function DogDetailLoading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb skeleton */}
      <Skeleton className="h-4 w-48" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column Skeleton */}
        <div className="lg:col-span-8 space-y-8">
          <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
          <div className="space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-48" />
            <div className="grid grid-cols-4 gap-4 py-4 border-y">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
            <Skeleton className="h-32 w-full" />
          </div>
        </div>

        {/* Right Column Skeleton */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-2xl border p-6 space-y-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-20 w-full" />
          </Card>
        </div>
      </div>
    </div>
  );
}
