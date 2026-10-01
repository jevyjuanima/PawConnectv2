import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function DogCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card flex flex-col justify-between shadow-2xs">
      <div>
        <Skeleton className="aspect-[4/3] w-full rounded-none" />
        <div className="p-5 space-y-3">
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-3.5 w-24" />
          </div>
          <div className="space-y-1.5 pt-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      </div>
      <div className="px-5 pb-5 pt-1">
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}
