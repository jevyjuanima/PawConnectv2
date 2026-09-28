import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export function DogCardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-2xl border bg-card flex flex-col justify-between">
      <div>
        <Skeleton className="aspect-[4/3] w-full rounded-none" />
        <CardContent className="p-5 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-3.5 w-3/4" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </CardContent>
      </div>
      <CardFooter className="px-5 pb-5 pt-0">
        <Skeleton className="h-10 w-full rounded-lg" />
      </CardFooter>
    </Card>
  );
}
