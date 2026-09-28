import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function MyDogsLoading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 max-w-4xl">
      {/* Breadcrumb Skeleton */}
      <Skeleton className="h-4 w-32" />

      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b pb-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Card Skeletons */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden rounded-2xl border">
            <CardContent className="p-0">
              <div className="flex flex-col sm:flex-row">
                <Skeleton className="h-40 sm:w-56 shrink-0 rounded-none" />
                <div className="flex-1 p-6 space-y-4">
                  <div className="flex justify-between items-start border-b pb-4">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-52" />
                    </div>
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <div className="flex justify-between pt-2">
                    <Skeleton className="h-8 w-28" />
                    <Skeleton className="h-8 w-28" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
