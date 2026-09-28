import * as React from "react";
import Link from "next/link";
import {
  Dog,
  HeartHandshake,
  Users,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getAdminStatsAction } from "@/app/actions/admin";
import { cn } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const statsRes = await getAdminStatsAction();
  const stats = statsRes.success && statsRes.data
    ? statsRes.data
    : {
        totalDogs: 0,
        pendingDogs: 0,
        availableDogs: 0,
        adoptedDogs: 0,
        totalApplications: 0,
        pendingApplications: 0,
        approvedApplications: 0,
        totalUsers: 0,
      };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Platform Metrics &amp; Operations
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time status overview of dog listings, applicant review pipelines, and system accounts.
          </p>
        </div>
      </div>

      {/* Action Required Callout Banners if pending items exist */}
      {(stats.pendingDogs > 0 || stats.pendingApplications > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.pendingDogs > 0 && (
            <Card className="rounded-2xl border-amber-500/30 bg-amber-500/10 shadow-xs">
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {stats.pendingDogs} Pending Dog {stats.pendingDogs === 1 ? "Listing" : "Listings"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Review submitted profiles and veterinary info before publishing.
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/dogs"
                  className={cn(buttonVariants({ size: "sm" }), "shrink-0 gap-1 text-xs shadow-xs")}
                >
                  Review Dogs
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>
          )}

          {stats.pendingApplications > 0 && (
            <Card className="rounded-2xl border-primary/30 bg-primary/10 shadow-xs">
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
                    <HeartHandshake className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {stats.pendingApplications} Pending {stats.pendingApplications === 1 ? "Application" : "Applications"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Adoption questionnaires awaiting staff evaluation.
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/applications"
                  className={cn(buttonVariants({ size: "sm" }), "shrink-0 gap-1 text-xs shadow-xs")}
                >
                  Review Apps
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Dogs */}
        <Card className="rounded-2xl border bg-card p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Dogs
            </span>
            <Dog className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-extrabold tracking-tight text-foreground">
            {stats.totalDogs}
          </p>
          <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              {stats.availableDogs} Available
            </span>
            <span>•</span>
            <span>{stats.adoptedDogs} Adopted</span>
          </div>
        </Card>

        {/* Pending Dogs */}
        <Card className="rounded-2xl border bg-card p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pending Dogs
            </span>
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold tracking-tight text-foreground text-amber-600 dark:text-amber-400">
            {stats.pendingDogs}
          </p>
          <p className="text-[11px] text-muted-foreground pt-1">
            Awaiting verification &amp; publication
          </p>
        </Card>

        {/* Total Applications */}
        <Card className="rounded-2xl border bg-card p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Applications
            </span>
            <HeartHandshake className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-extrabold tracking-tight text-foreground">
            {stats.totalApplications}
          </p>
          <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
            <span className="text-primary font-semibold">
              {stats.pendingApplications} Pending
            </span>
            <span>•</span>
            <span>{stats.approvedApplications} Approved</span>
          </div>
        </Card>

        {/* Registered Users */}
        <Card className="rounded-2xl border bg-card p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Users
            </span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-extrabold tracking-tight text-foreground">
            {stats.totalUsers}
          </p>
          <p className="text-[11px] text-muted-foreground pt-1">
            Registered profiles in database
          </p>
        </Card>
      </div>

      {/* Quick Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <Link
          href="/admin/dogs"
          className="group block rounded-2xl border bg-card p-6 shadow-xs hover:border-primary/40 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Dog className="h-5 w-5" />
            </div>
            <Badge variant="outline" className="text-xs group-hover:border-primary">
              Manage
            </Badge>
          </div>
          <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
            Dog Listing Moderation
          </h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Review submitted dogs, inspect medical history, approve verified pets, or provide rejection feedback.
          </p>
        </Link>

        <Link
          href="/admin/applications"
          className="group block rounded-2xl border bg-card p-6 shadow-xs hover:border-primary/40 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <Badge variant="outline" className="text-xs group-hover:border-primary">
              Manage
            </Badge>
          </div>
          <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
            Adoption Review Workflow
          </h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Evaluate prospective adopters, advance statuses from review to match approval, and finalize handoffs.
          </p>
        </Link>

        <Link
          href="/admin/users"
          className="group block rounded-2xl border bg-card p-6 shadow-xs hover:border-primary/40 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <Badge variant="outline" className="text-xs group-hover:border-primary">
              Manage
            </Badge>
          </div>
          <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
            User Accounts &amp; Permissions
          </h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            View registered user profiles, monitor account activity, and manage administrator access flags.
          </p>
        </Link>
      </div>
    </div>
  );
}
