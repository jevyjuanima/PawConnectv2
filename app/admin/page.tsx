import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Dog,
  HeartHandshake,
  Users,
  Clock,
  ArrowRight,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Heart,
  FileCheck,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  getAdminStatsAction,
  getAdminDogsAction,
  getAdminApplicationsAction,
  getAdminScreeningsAction,
  getAdminFollowupsAction,
} from "@/app/actions/admin";
import { formatDate } from "@/lib/utils/format";
import {
  DogStatusBadge,
  ApplicationStatusBadge,
  ScreeningStatusBadge,
  FollowupStatusBadge,
} from "@/components/shared/StatusBadges";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin Dashboard — PawConnect",
  description: "Operations console for listings, applications, household screenings, and welfare monitoring.",
};

export default async function AdminDashboardPage() {
  const [
    statsRes,
    pendingDogsRes,
    pendingAppsRes,
    pendingScreeningsRes,
    dueFollowupsRes,
  ] = await Promise.all([
    getAdminStatsAction(),
    getAdminDogsAction("pending"),
    getAdminApplicationsAction("pending"),
    getAdminScreeningsAction("pending"),
    getAdminFollowupsAction("due"),
  ]);

  const stats =
    statsRes.success && statsRes.data
      ? statsRes.data
      : {
          totalDogs: 0,
          pendingDogs: 0,
          availableDogs: 0,
          adoptedDogs: 0,
          totalApplications: 0,
          pendingApplications: 0,
          approvedApplications: 0,
          pendingScreenings: 0,
          approvedScreenings: 0,
          dueFollowups: 0,
          submittedFollowups: 0,
          totalUsers: 0,
        };

  const pendingDogsList =
    pendingDogsRes.success && pendingDogsRes.data ? pendingDogsRes.data : [];
  const pendingAppsList =
    pendingAppsRes.success && pendingAppsRes.data ? pendingAppsRes.data : [];
  const pendingScreeningsList =
    pendingScreeningsRes.success && pendingScreeningsRes.data ? pendingScreeningsRes.data : [];
  const dueFollowupsList =
    dueFollowupsRes.success && dueFollowupsRes.data ? dueFollowupsRes.data : [];

  const actionableCards = [
    {
      title: "Pending Dog Submissions",
      count: stats.pendingDogs,
      sub: "Awaiting listing verification",
      href: "/admin/dogs?status=pending",
      icon: Dog,
      isUrgent: stats.pendingDogs > 0,
    },
    {
      title: "Applications Awaiting Review",
      count: stats.pendingApplications,
      sub: "Questionnaires queued for evaluation",
      href: "/admin/applications?status=pending",
      icon: HeartHandshake,
      isUrgent: stats.pendingApplications > 0,
    },
    {
      title: "Screenings Awaiting Review",
      count: stats.pendingScreenings,
      sub: "Household suitability checks",
      href: "/admin/screenings?status=pending",
      icon: ShieldCheck,
      isUrgent: stats.pendingScreenings > 0,
    },
    {
      title: "Due Monitoring Reports",
      count: stats.dueFollowups,
      sub: "Post-adoption monthly welfare",
      href: "/admin/follow-ups?status=due",
      icon: Heart,
      isUrgent: stats.dueFollowups > 0,
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 pb-6 border-b border-border/70">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold">
              Admin Workspace
            </Badge>
            <Badge variant="secondary" className="text-[10px] font-semibold">
              Staff Portal
            </Badge>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-foreground">
            Management Workspace
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
            Operational queues for dog verification, adoption questionnaires, family background screening, and post-adoption welfare monitoring.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/dogs"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs font-medium")}
          >
            Manage Dogs
          </Link>
          <Link
            href="/admin/screenings"
            className={cn(buttonVariants({ size: "sm" }), "text-xs font-medium")}
          >
            Review Screenings
          </Link>
        </div>
      </div>

      {/* 4 Actionable Operational Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actionableCards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.title}
              href={c.href}
              className={cn(
                "group rounded-2xl border p-5 transition-all flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-xs",
                c.isUrgent
                  ? "border-primary/30 bg-primary/[0.03] hover:border-primary/60"
                  : "border-border/80 bg-card hover:border-border"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground tracking-wide">
                  {c.title}
                </span>
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                    c.isUrgent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div>
                <p className={cn("text-3xl font-extrabold tracking-tight", c.isUrgent ? "text-primary" : "text-foreground")}>
                  {c.count}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.sub}</p>
              </div>

              <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs text-primary font-medium group-hover:underline">
                <span>Open queue</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Secondary Platform Metrics Strip */}
      <div className="rounded-xl border border-border/70 bg-muted/20 p-4 sm:p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Platform Aggregate Summary
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
          <div>
            <span className="text-muted-foreground">Available Dogs</span>
            <p className="text-lg font-bold text-foreground mt-0.5">{stats.availableDogs}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Adopted Dogs</span>
            <p className="text-lg font-bold text-foreground mt-0.5">{stats.adoptedDogs}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Total Listings</span>
            <p className="text-lg font-bold text-foreground mt-0.5">{stats.totalDogs}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Approved Screenings</span>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">{stats.approvedScreenings}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Reports Awaiting Review</span>
            <p className="text-lg font-bold text-primary mt-0.5">{stats.submittedFollowups}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Registered Users</span>
            <p className="text-lg font-bold text-foreground mt-0.5">{stats.totalUsers}</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Operational Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Queue 1: Screenings Awaiting Review */}
        <Card className="rounded-2xl border border-border/80 shadow-xs">
          <CardHeader className="px-5 py-4 border-b border-border/70 flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                Household Screenings Needing Review
              </h2>
            </div>
            <Link
              href="/admin/screenings?status=pending"
              className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
            >
              <span>View all ({stats.pendingScreenings})</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {pendingScreeningsList.length > 0 ? (
              <ul className="divide-y divide-border/60">
                {pendingScreeningsList.slice(0, 4).map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {s.applicant?.first_name} {s.applicant?.last_name} for {s.dog?.name}
                      </p>
                      <p className="text-muted-foreground text-[11px]">
                        Housing: {s.housing_type.replace("_", " ")} · Alone: {s.daily_alone_hours} hrs/day
                      </p>
                    </div>
                    <Link
                      href="/admin/screenings"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs h-7 px-2.5")}
                    >
                      Review
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center space-y-2">
                <CheckCircle2 className="h-7 w-7 text-emerald-600/70 mx-auto" />
                <p className="text-xs text-muted-foreground">
                  All household screenings have been evaluated. Queue clear.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Queue 2: Applications Awaiting Review */}
        <Card className="rounded-2xl border border-border/80 shadow-xs">
          <CardHeader className="px-5 py-4 border-b border-border/70 flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                Adoption Applications Needing Review
              </h2>
            </div>
            <Link
              href="/admin/applications?status=pending"
              className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
            >
              <span>View all ({stats.pendingApplications})</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {pendingAppsList.length > 0 ? (
              <ul className="divide-y divide-border/60">
                {pendingAppsList.slice(0, 4).map((app) => (
                  <li
                    key={app.id}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {app.applicant?.first_name} {app.applicant?.last_name} for {app.dog?.name}
                      </p>
                      <p className="text-muted-foreground text-[11px]">
                        Submitted {formatDate(app.created_at)}
                      </p>
                    </div>
                    <Link
                      href="/admin/applications"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs h-7 px-2.5")}
                    >
                      Evaluate
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center space-y-2">
                <CheckCircle2 className="h-7 w-7 text-emerald-600/70 mx-auto" />
                <p className="text-xs text-muted-foreground">
                  No applications currently pending evaluation.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Queue 3: Pending Dog Submissions */}
        <Card className="rounded-2xl border border-border/80 shadow-xs">
          <CardHeader className="px-5 py-4 border-b border-border/70 flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <Dog className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                Pending Dog Listings
              </h2>
            </div>
            <Link
              href="/admin/dogs?status=pending"
              className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
            >
              <span>View all ({stats.pendingDogs})</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {pendingDogsList.length > 0 ? (
              <ul className="divide-y divide-border/60">
                {pendingDogsList.slice(0, 4).map((dog) => (
                  <li
                    key={dog.id}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-foreground truncate">{dog.name}</p>
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5">{dog.breed}</Badge>
                      </div>
                      <p className="text-muted-foreground text-[11px]">
                        {dog.location} · Submitted {formatDate(dog.created_at)}
                      </p>
                    </div>
                    <Link
                      href="/admin/dogs"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs h-7 px-2.5")}
                    >
                      Inspect
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center space-y-2">
                <CheckCircle2 className="h-7 w-7 text-emerald-600/70 mx-auto" />
                <p className="text-xs text-muted-foreground">
                  All dog listings have been verified.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Queue 4: Due Post-Adoption Follow-ups */}
        <Card className="rounded-2xl border border-border/80 shadow-xs">
          <CardHeader className="px-5 py-4 border-b border-border/70 flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                Due Post-Adoption Follow-ups
              </h2>
            </div>
            <Link
              href="/admin/follow-ups?status=due"
              className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
            >
              <span>View all ({stats.dueFollowups})</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {dueFollowupsList.length > 0 ? (
              <ul className="divide-y divide-border/60">
                {dueFollowupsList.slice(0, 4).map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        Month {f.month_number} · {f.dog?.name} ({f.adopter?.first_name} {f.adopter?.last_name})
                      </p>
                      <p className="text-muted-foreground text-[11px]">
                        Due date: {formatDate(f.due_date)}
                      </p>
                    </div>
                    <Link
                      href="/admin/follow-ups"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs h-7 px-2.5")}
                    >
                      Inspect
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center space-y-2">
                <CheckCircle2 className="h-7 w-7 text-emerald-600/70 mx-auto" />
                <p className="text-xs text-muted-foreground">
                  No post-adoption reports currently overdue.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
