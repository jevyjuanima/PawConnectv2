import * as React from "react";
import Link from "next/link";
import {
  Dog,
  HeartHandshake,
  Users,
  Clock,
  ArrowRight,
  ShieldAlert,
  Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  getAdminStatsAction,
  getAdminDogsAction,
  getAdminApplicationsAction,
} from "@/app/actions/admin";
import { formatDate } from "@/lib/utils/format";
import { DogStatusBadge, ApplicationStatusBadge } from "@/components/shared/StatusBadges";
import { cn } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const [statsRes, pendingDogsRes, pendingAppsRes] = await Promise.all([
    getAdminStatsAction(),
    getAdminDogsAction("pending"),
    getAdminApplicationsAction("pending"),
  ]);

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

  const pendingDogsList = pendingDogsRes.success && pendingDogsRes.data ? pendingDogsRes.data : [];
  const pendingAppsList = pendingAppsRes.success && pendingAppsRes.data ? pendingAppsRes.data : [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs uppercase tracking-wider font-semibold">
              Admin Console
            </Badge>
            <Badge variant="secondary" className="text-xs font-semibold">
              System Overview
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <ShieldAlert className="h-7 w-7 text-primary" />
            Operations Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time status overview of pending dog verification, applicant review pipelines, and registered accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/dogs"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <Dog className="h-4 w-4" />
            Dogs ({stats.pendingDogs})
          </Link>
          <Link
            href="/admin/applications"
            className={cn(buttonVariants({ size: "sm" }), "gap-1.5 shadow-xs")}
          >
            <HeartHandshake className="h-4 w-4" />
            Applications ({stats.pendingApplications})
          </Link>
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
                    <h2 className="text-sm font-bold text-foreground">
                      {stats.pendingDogs} Pending Dog {stats.pendingDogs === 1 ? "Listing" : "Listings"}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Awaiting administrative inspection and veterinary verification.
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/dogs?status=pending"
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
                    <h2 className="text-sm font-bold text-foreground">
                      {stats.pendingApplications} Pending {stats.pendingApplications === 1 ? "Application" : "Applications"}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Adoption questionnaires awaiting staff review and applicant vetting.
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/applications?status=pending"
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

      {/* Important Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            Need verification &amp; approval
          </p>
        </Card>

        {/* Pending Applications */}
        <Card className="rounded-2xl border bg-card p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pending Apps
            </span>
            <HeartHandshake className="h-4 w-4 text-primary" />
          </div>
          <p className="text-3xl font-extrabold tracking-tight text-foreground text-primary">
            {stats.pendingApplications}
          </p>
          <p className="text-[11px] text-muted-foreground pt-1">
            Questionnaires awaiting evaluation
          </p>
        </Card>

        {/* Available Dogs */}
        <Card className="rounded-2xl border bg-card p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Available Dogs
            </span>
            <Dog className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold tracking-tight text-foreground text-emerald-600 dark:text-emerald-400">
            {stats.availableDogs}
          </p>
          <p className="text-[11px] text-muted-foreground pt-1">
            {stats.totalDogs} total in catalog
          </p>
        </Card>

        {/* Registered Users */}
        <Card className="rounded-2xl border bg-card p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Users
            </span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-extrabold tracking-tight text-foreground">
            {stats.totalUsers}
          </p>
          <p className="text-[11px] text-muted-foreground pt-1">
            Profiles in database
          </p>
        </Card>
      </div>

      {/* Prioritized Queues (Recent Pending Submissions & Applications) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Dog Listings Queue */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Dog className="h-4 w-4 text-primary" />
              Pending Dog Submissions
            </h2>
            <Link
              href="/admin/dogs?status=pending"
              className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
            >
              <span>Manage all ({pendingDogsList.length})</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {pendingDogsList.length > 0 ? (
            <div className="space-y-3">
              {pendingDogsList.slice(0, 3).map((dog) => (
                <div
                  key={dog.id}
                  className="flex items-center justify-between gap-3 p-4 rounded-xl border bg-card shadow-2xs hover:border-primary/30 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-foreground truncate">
                        {dog.name}
                      </p>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {dog.breed}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 shrink-0" />
                      Submitted {formatDate(dog.created_at)} • {dog.location}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <DogStatusBadge status={dog.status} />
                    <Link
                      href="/admin/dogs"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 px-2.5 text-xs")}
                    >
                      Inspect
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed bg-muted/20 p-8 text-center space-y-2">
              <Dog className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="text-xs text-muted-foreground">
                All dog submissions have been reviewed and processed.
              </p>
            </div>
          )}
        </div>

        {/* Pending Applications Queue */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-primary" />
              Pending Adoption Questionnaires
            </h2>
            <Link
              href="/admin/applications?status=pending"
              className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
            >
              <span>Manage all ({pendingAppsList.length})</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {pendingAppsList.length > 0 ? (
            <div className="space-y-3">
              {pendingAppsList.slice(0, 3).map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between gap-3 p-4 rounded-xl border bg-card shadow-2xs hover:border-primary/30 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-foreground truncate">
                        {app.dog?.name || "Dog"}
                      </p>
                      <span className="text-xs text-muted-foreground truncate">
                        by {app.applicant?.first_name || "Applicant"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 shrink-0" />
                      Applied {formatDate(app.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ApplicationStatusBadge status={app.status} />
                    <Link
                      href="/admin/applications"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 px-2.5 text-xs")}
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed bg-muted/20 p-8 text-center space-y-2">
              <HeartHandshake className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="text-xs text-muted-foreground">
                No adoption questionnaires currently awaiting evaluation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <Link
          href="/admin/dogs"
          className="group block rounded-2xl border bg-card p-6 shadow-xs hover:border-primary/40 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Dog className="h-5 w-5" />
            </div>
            <Badge variant="outline" className="text-xs group-hover:border-primary">
              Manage Dogs
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
              Manage Applications
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
              Manage Users
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
