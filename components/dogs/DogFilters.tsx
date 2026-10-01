"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, SlidersHorizontal, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface DogFiltersProps {
  totalCount: number;
}

export function DogFilters({ totalCount }: DogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("search") || "";
  const currentSize = searchParams.get("size") || "all";
  const currentGender = searchParams.get("gender") || "all";

  const [searchTerm, setSearchTerm] = React.useState(currentSearch);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Sync state if URL changes externally
  React.useEffect(() => {
    setSearchTerm(currentSearch);
  }, [currentSearch]);

  const updateFilters = React.useCallback(
    (updates: { search?: string; size?: string; gender?: string; page?: string }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (updates.search !== undefined) {
        if (updates.search.trim()) {
          params.set("search", updates.search.trim());
        } else {
          params.delete("search");
        }
      }

      if (updates.size !== undefined) {
        if (updates.size !== "all") {
          params.set("size", updates.size);
        } else {
          params.delete("size");
        }
      }

      if (updates.gender !== undefined) {
        if (updates.gender !== "all") {
          params.set("gender", updates.gender);
        } else {
          params.delete("gender");
        }
      }

      // Reset to page 1 on filter changes
      if (updates.page !== undefined) {
        params.set("page", updates.page);
      } else {
        params.delete("page");
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchTerm });
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    router.push(pathname);
    setMobileOpen(false);
  };

  const activeFiltersCount =
    (currentSearch ? 1 : 0) +
    (currentSize !== "all" ? 1 : 0) +
    (currentGender !== "all" ? 1 : 0);

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <div className="space-y-4">
      {/* ── Search Bar & Mobile Trigger Row ── */}
      <div className="flex items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, breed, or location..."
            className="pl-10 pr-9 h-11 rounded-xl bg-card border-border/80 text-sm focus-visible:ring-primary/40"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                updateFilters({ search: "" });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        <Button
          type="button"
          onClick={handleSearchSubmit}
          className="h-11 px-5 rounded-xl text-sm font-semibold shadow-xs hidden sm:inline-flex"
        >
          Search
        </Button>

        {/* Mobile Filter Sheet Trigger (< md) */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            className={cn(
              "md:hidden inline-flex items-center justify-center gap-1.5 h-11 px-3.5 rounded-xl border border-border/80 bg-card text-xs font-semibold shrink-0 transition-colors cursor-pointer",
              hasActiveFilters ? "border-primary text-primary" : "text-foreground"
            )}
            aria-label="Open filter options"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {activeFiltersCount}
              </span>
            )}
          </SheetTrigger>

          <SheetContent side="bottom" className="rounded-t-2xl p-6 space-y-6 max-h-[85vh] overflow-y-auto">
            <SheetHeader className="text-left pb-2 border-b border-border/70">
              <SheetTitle className="font-serif text-lg font-bold text-foreground">
                Filter Available Dogs
              </SheetTitle>
            </SheetHeader>

            {/* Sex in Mobile Sheet */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sex
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "all", label: "All" },
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => updateFilters({ gender: item.value })}
                    className={cn(
                      "py-2 px-3 rounded-lg text-xs font-medium border text-center transition-colors",
                      currentGender === item.value
                        ? "bg-primary text-primary-foreground border-primary font-semibold"
                        : "bg-card text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Size in Mobile Sheet */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "all", label: "All" },
                  { value: "small", label: "Small" },
                  { value: "medium", label: "Medium" },
                  { value: "large", label: "Large" },
                  { value: "giant", label: "Giant" },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => updateFilters({ size: item.value })}
                    className={cn(
                      "py-2 px-3 rounded-lg text-xs font-medium border text-center transition-colors capitalize",
                      currentSize === item.value
                        ? "bg-primary text-primary-foreground border-primary font-semibold"
                        : "bg-card text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-border/70">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="flex-1 rounded-xl text-xs gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => setMobileOpen(false)}
                className="flex-1 rounded-xl text-xs font-semibold"
              >
                View Results ({totalCount})
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* ── Desktop Inline Filter Controls (>= md) ── */}
      <div className="hidden md:flex flex-wrap items-center justify-between gap-4 py-3 px-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-2xs">
        <div className="flex flex-wrap items-center gap-6">
          {/* Sex filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sex:
            </span>
            <div className="flex items-center gap-1">
              {[
                { value: "all", label: "All" },
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => updateFilters({ gender: item.value })}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-md transition-colors font-medium",
                    currentGender === item.value
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-4 w-px bg-border/80" />

          {/* Size filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Size:
            </span>
            <div className="flex items-center gap-1">
              {[
                { value: "all", label: "All" },
                { value: "small", label: "Small" },
                { value: "medium", label: "Medium" },
                { value: "large", label: "Large" },
                { value: "giant", label: "Giant" },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => updateFilters({ size: item.value })}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-md capitalize transition-colors font-medium",
                    currentSize === item.value
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right side: Real count + Reset button */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {totalCount} {totalCount === 1 ? "dog available" : "dogs available"}
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors underline-offset-4 hover:underline"
            >
              <RotateCcw className="h-3 w-3" />
              Reset filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
