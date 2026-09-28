import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function MyApplicationsLoading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 max-w-4xl">
      {/* Breadcrumb Skeleton */}
      <Skeleton className="h-4 w-36" />

      {/* Header Skeleton */}
      <div className="border-b pb-6 space-y-2">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* Card Skeletons */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden rounded-2xl border">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                <Skeleton className="h-44 md:w-64 shrink-0 rounded-none" />
                <div className="flex-1 p-6 space-y-4">
                  <div className="flex justify-between items-start border-b pb-4">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-36" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                  <div className="flex justify-between pt-2">
                    <Skeleton className="h-8 w-28" />
                    <Skeleton className="h-8 w-32" />
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
