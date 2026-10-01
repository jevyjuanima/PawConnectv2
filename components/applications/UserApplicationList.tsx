"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { UserApplicationCard } from "@/components/applications/UserApplicationCard";
import { APPLICATION_STATUSES } from "@/lib/constants/statuses";
import type { ApplicationWithDetails } from "@/types";
import { cn } from "@/lib/utils";

interface UserApplicationListProps {
  applications: ApplicationWithDetails[];
  unreadApplicationIds?: string[];
}

type FilterTab = "all" | "active" | "past";

function isPastStatus(status: string): boolean {
  return (
    status === APPLICATION_STATUSES.COMPLETED ||
    status === APPLICATION_STATUSES.REJECTED ||
    status === APPLICATION_STATUSES.CANCELLED
  );
}

export function UserApplicationList({
  applications,
  unreadApplicationIds = [],
}: UserApplicationListProps) {
  const [filter, setFilter] = React.useState<FilterTab>("all");
  const unreadSet = React.useMemo(
    () => new Set(unreadApplicationIds),
    [unreadApplicationIds]
  );

  // 1. EMPTY STATE
  if (applications.length === 0) {
    return (
      <div className="py-16 sm:py-24 text-center max-w-md mx-auto space-y-4 animate-in fade-in-50 duration-300">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Your applications
        </p>

        <h2 className="font-serif text-3xl sm:text-4xl font-normal text-foreground">
          Nothing here yet.
        </h2>

        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          When you apply to adopt a dog, you&apos;ll be able to follow its progress here.
        </p>

        <div className="pt-2">
          <Link
            href="/dogs"
            className={cn(buttonVariants({ size: "lg" }), "font-medium gap-2")}
          >
            <Search className="h-4 w-4" />
            <span>Browse Dogs</span>
          </Link>
        </div>
      </div>
    );
  }

  const activeApps = applications.filter((a) => !isPastStatus(a.status));
  const pastApps = applications.filter((a) => isPastStatus(a.status));

  // Determine which to show based on filter
  const displayedApps =
    filter === "active"
      ? activeApps
      : filter === "past"
      ? pastApps
      : applications;

  const showFilterTabs = applications.length >= 3;

  return (
    <div className="space-y-8">
      {/* Optional Subtle Filter Tabs */}
      {showFilterTabs && (
        <div className="flex items-center gap-2 border-b border-border/70 pb-3 text-xs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={filter === "all"}
            onClick={() => setFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer",
              filter === "all"
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            All ({applications.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === "active"}
            onClick={() => setFilter("active")}
            className={cn(
              "px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer",
              filter === "active"
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            Active ({activeApps.length})
          </button>
          {pastApps.length > 0 && (
            <button
              type="button"
              role="tab"
              aria-selected={filter === "past"}
              onClick={() => setFilter("past")}
              className={cn(
                "px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer",
                filter === "past"
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              Past ({pastApps.length})
            </button>
          )}
        </div>
      )}

      {/* When filtering is ALL and there are both active and past applications, present them with clear visual rhythm */}
      {filter === "all" && activeApps.length > 0 && pastApps.length > 0 ? (
        <div className="space-y-10">
          {/* Active Section */}
          <div className="space-y-4">
            {activeApps.map((app) => (
              <UserApplicationCard
                key={app.id}
                application={app}
                hasUnreadNotification={unreadSet.has(app.id)}
              />
            ))}
          </div>

          {/* Past Section */}
          <div className="space-y-4 pt-6 border-t border-border/70">
            <h2 className="font-serif text-xl sm:text-2xl font-normal text-muted-foreground">
              Past applications
            </h2>
            <div className="space-y-4">
              {pastApps.map((app) => (
                <UserApplicationCard
                  key={app.id}
                  application={app}
                  hasUnreadNotification={unreadSet.has(app.id)}
                  isPast
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedApps.map((app) => (
            <UserApplicationCard
              key={app.id}
              application={app}
              hasUnreadNotification={unreadSet.has(app.id)}
              isPast={isPastStatus(app.status)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
