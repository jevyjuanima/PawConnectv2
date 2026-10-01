import * as React from "react";
import Link from "next/link";
import { PlusCircle, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DogCard } from "@/components/dogs/DogCard";
import { DogFilters } from "@/components/dogs/DogFilters";
import { getAvailableDogsAction } from "@/app/actions/dogs";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Dogs Looking for Homes — PawConnect",
  description:
    "Browse dogs currently available for adoption and learn more about each one before you apply.",
};

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

  const hasFilters = Boolean(
    resolvedParams.search ||
      (resolvedParams.size && resolvedParams.size !== "all") ||
      (resolvedParams.gender && resolvedParams.gender !== "all") ||
      resolvedParams.breed
  );

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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10 max-w-7xl">
      {/* ── 1. EDITORIAL HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-border/70">
        <div className="max-w-2xl">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-2">
            Adoption Directory
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-foreground leading-[1.15]">
            Dogs looking for homes
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-3 leading-relaxed">
            Browse dogs currently available for adoption and learn more about each
            one before you apply.
          </p>
        </div>

        {/* Quiet Rehome Secondary Action to reinforce the dual-path model */}
        <Link
          href="/rehome"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-2 self-start sm:self-auto shrink-0 border-border/80 text-xs font-semibold hover:bg-muted/40"
          )}
        >
          <PlusCircle className="h-3.5 w-3.5" />
          Rehome a Dog
        </Link>
      </div>

      {/* ── 2. DISCOVERY & FILTER CONTROLS ── */}
      <DogFilters totalCount={totalCount} />

      {/* ── 3. RESULTS GRID (3-Column Desktop, 2-Column Tablet, 1-Column Mobile) ── */}
      {dogs.length > 0 ? (
        <div className="space-y-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {dogs.map((dog) => (
              <DogCard key={dog.id} dog={dog} />
            ))}
          </div>

          {/* ── 4. PAGINATION CONTROLS ── */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/70 pt-8 text-xs text-muted-foreground">
              <p>
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
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "gap-1 h-9 rounded-lg text-xs font-medium"
                    )}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Previous
                  </Link>
                ) : (
                  <button
                    disabled
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "gap-1 h-9 rounded-lg text-xs font-medium opacity-40 cursor-not-allowed"
                    )}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Previous
                  </button>
                )}

                <span className="px-3 text-xs font-medium">
                  Page {pageNumber} of {totalPages}
                </span>

                {pageNumber < totalPages ? (
                  <Link
                    href={createPageUrl(pageNumber + 1)}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "gap-1 h-9 rounded-lg text-xs font-medium"
                    )}
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <button
                    disabled
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "gap-1 h-9 rounded-lg text-xs font-medium opacity-40 cursor-not-allowed"
                    )}
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── 5. CALM EMPTY STATE ── */
        <div className="rounded-3xl border border-dashed border-border/80 bg-muted/20 p-12 sm:p-16 text-center max-w-lg mx-auto my-8 space-y-4">
          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-normal text-foreground">
              {hasFilters ? "No dogs match those filters." : "No dogs currently available."}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {hasFilters
                ? "Try broadening your search to see more dogs looking for homes."
                : "Check back shortly, or submit a rehoming listing if you are a caregiver seeking a loving family for your dog."}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            {hasFilters && (
              <Link
                href="/dogs"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5 rounded-xl text-xs font-medium")}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset all filters
              </Link>
            )}
            <Link
              href="/rehome"
              className={cn(buttonVariants({ size: "sm" }), "gap-1.5 rounded-xl text-xs font-semibold shadow-xs")}
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Rehome a Dog
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
