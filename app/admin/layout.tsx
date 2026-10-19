import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isCurrentUserAdmin, getCurrentUserProfile } from "@/lib/clerk/auth";
import { getAdminStatsAction } from "@/app/actions/admin";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Search, ArrowUpRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const isAdmin = await isCurrentUserAdmin();

  if (!isAdmin) {
    redirect("/");
  }

  const [profile, statsRes] = await Promise.all([
    getCurrentUserProfile(),
    getAdminStatsAction(),
  ]);

  const stats = statsRes.success && statsRes.data ? statsRes.data : null;
  const pendingCounts = stats
    ? {
        dogs: stats.pendingDogs,
        applications: stats.pendingApplications,
        screenings: stats.pendingScreenings,
        followups: stats.dueFollowups,
      }
    : undefined;

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-background/95 flex flex-col">
      {/* Sidebar (Fixed on desktop, drawer on mobile — Reference 1 Pawsy Pet Haven) */}
      <AdminSidebar profile={profile} pendingCounts={pendingCounts} />

      {/* Main Canvas Area (Pushed right on desktop by 64 = 256px) */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        {/* Top Utility Action Bar (Reference 1 & 2) */}
        <header className="sticky top-0 z-20 bg-card/90 backdrop-blur-md border-b border-border/70 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 shadow-2xs">
          {/* Left: Quick Search Bar or Breadcrumb Context */}
          <div className="hidden sm:flex items-center gap-3 flex-1 max-w-xs md:max-w-md min-w-0">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                readOnly
                placeholder="Staff search (records, dogs, applicants)..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-muted/40 border border-border/70 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
          </div>

          {/* Right: Quick Shortcuts & Actions */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <Link
              href="/admin/screenings"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "hidden xl:inline-flex text-xs font-semibold h-8.5 rounded-lg border-border/80 hover:bg-muted/50"
              )}
            >
              Screenings Queue
            </Link>

            {/* Welcome Message */}
            <span className="text-xs sm:text-sm font-semibold text-foreground tracking-tight select-none whitespace-nowrap">
              Welcome, Administrator!
            </span>

            <div className="pl-2 border-l border-border/60">
              <Link
                href="/"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "text-xs font-medium text-muted-foreground hover:text-foreground h-8.5 gap-1.5"
                )}
                title="View Public PawConnect Site"
              >
                <span className="hidden md:inline">Public Site</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </header>

        {/* Content Canvas (Reference 2 — Alpha Dashboard soft spacious layout) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
}
