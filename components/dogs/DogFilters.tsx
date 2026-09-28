"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

      // Reset to page 1 on filter changes unless page is explicitly updated
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
  };

  const hasActiveFilters = Boolean(
    currentSearch || (currentSize && currentSize !== "all") || (currentGender && currentGender !== "all")
  );

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
      {/* Search Input Row */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, breed, or location..."
            className="pl-10 h-10 rounded-xl bg-background"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                updateFilters({ search: "" });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button type="submit" className="h-10 px-5 rounded-xl font-medium">
          Search
        </Button>
      </form>

      {/* Filter Pills Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1 border-t">
        <div className="flex flex-wrap items-center gap-4">
          {/* Size Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Size:
            </span>
            <div className="flex items-center gap-1">
              {["all", "small", "medium", "large", "giant"].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => updateFilters({ size })}
                  className={`text-xs px-2.5 py-1 rounded-lg capitalize font-medium transition-all ${
                    currentSize === size
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Gender Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Gender:
            </span>
            <div className="flex items-center gap-1">
              {["all", "male", "female"].map((gender) => (
                <button
                  key={gender}
                  type="button"
                  onClick={() => updateFilters({ gender })}
                  className={`text-xs px-2.5 py-1 rounded-lg capitalize font-medium transition-all ${
                    currentGender === gender
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                >
                  {gender}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Clear Filters / Count */}
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-xs font-medium">
            {totalCount} {totalCount === 1 ? "dog available" : "dogs available"}
          </Badge>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs h-7 px-2 text-muted-foreground hover:text-destructive gap-1"
            >
              <Filter className="h-3 w-3" />
              Reset filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
