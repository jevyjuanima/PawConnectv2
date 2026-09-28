import * as React from "react";
import Link from "next/link";
import { PlusCircle, Dog, ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DogCard } from "@/components/dogs/DogCard";
import { DogFilters } from "@/components/dogs/DogFilters";
import { getAvailableDogsAction } from "@/app/actions/dogs";
import { cn } from "@/lib/utils";

interface DogsPageProps {
  searchParams: Promise<{
    search?: string;
    breed?: string;
    size?: string;
    gender?: string;
    page?: string;
  }>;
}

export default async function DogsPage({ searchParams }: DogsPageProps) {
  const resolvedParams = await searchParams;
  const pageNumber = Math.max(1, parseInt(resolvedParams.page || "1", 10));
  const limit = 12;
  const offset = (pageNumber - 1) * limit;

  const result = await getAvailableDogsAction({
    search: resolvedParams.search,
    breed: resolvedParams.breed,
    size: resolvedParams.size,
    gender: resolvedParams.gender,
    limit,
    offset,
  });

  const dogs = result.success && result.data ? result.data.dogs : [];
  const totalCount = result.success && result.data ? result.data.totalCount : 0;
  const totalPages = Math.ceil(totalCount / limit);

  // Helper to construct pagination URLs
  const createPageUrl = (targetPage: number) => {
    const params = new URLSearchParams();
    if (resolvedParams.search) params.set("search", resolvedParams.search);
    if (resolvedParams.breed) params.set("breed", resolvedParams.breed);
    if (resolvedParams.size) params.set("size", resolvedParams.size);
    if (resolvedParams.gender) params.set("gender", resolvedParams.gender);
    params.set("page", targetPage.toString());
    return `/dogs?${params.toString()}`;
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs uppercase tracking-wider font-semibold">
              Adoption Gallery
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Available Dogs
          </h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-xl">
            Meet loving dogs ready to be adopted into permanent homes. All dogs have been inspected and verified by PawConnect.
          </p>
        </div>

        <Link
          href="/rehome"
          className={cn(buttonVariants({ variant: "outline" }), "gap-2 self-start sm:self-auto shrink-0")}
        >
          <PlusCircle className="h-4 w-4" />
          Rehome a Dog
        </Link>
      </div>

      {/* Interactive Filter Bar */}
      <DogFilters totalCount={totalCount} />

      {/* Results Grid */}
      {dogs.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {dogs.map((dog) => (
              <DogCard key={dog.id} dog={dog} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-6">
              <p className="text-xs text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{offset + 1}</span>–
                <span className="font-semibold text-foreground">
                  {Math.min(offset + limit, totalCount)}
                </span>{" "}
                of <span className="font-semibold text-foreground">{totalCount}</span> dogs
              </p>

              <div className="flex items-center gap-2">
                {pageNumber > 1 ? (
                  <Link
                    href={createPageUrl(pageNumber - 1)}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Link>
                ) : (
                  <button
                    disabled
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "gap-1 opacity-50 cursor-not-allowed"
                    )}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                )}

                <span className="text-xs font-medium px-2">
                  Page {pageNumber} of {totalPages}
                </span>

                {pageNumber < totalPages ? (
                  <Link
                    href={createPageUrl(pageNumber + 1)}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <button
                    disabled
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "gap-1 opacity-50 cursor-not-allowed"
                    )}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 p-12 text-center my-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <Dog className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-foreground">No Dogs Found</h3>
          <p className="text-sm text-muted-foreground max-w-md mt-1 mb-6">
            We couldn&apos;t find any available dogs matching your current search or filters. Try adjusting your parameters or check back soon.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/dogs" className={cn(buttonVariants({ variant: "outline" }))}>
              Reset All Filters
            </Link>
            <Link href="/rehome" className={cn(buttonVariants(), "gap-2")}>
              <PlusCircle className="h-4 w-4" />
              List a Dog for Rehoming
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
