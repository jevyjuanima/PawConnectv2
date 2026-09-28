import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function RehomeLoading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 max-w-3xl">
      <Skeleton className="h-4 w-32" />

      <div className="border-b pb-6 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-full" />
      </div>

      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="rounded-2xl border p-6 space-y-4">
            <Skeleton className="h-6 w-44" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
            <Skeleton className="h-20 w-full rounded-xl" />
          </Card>
        ))}
      </div>
    </div>
  );
}
