import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Dog,
  HeartHandshake,
  Users,
  Clock,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ShieldCheck,
  Heart,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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
      iconBg: "bg-amber-500/10 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
      isUrgent: stats.pendingDogs > 0,
    },
    {
      title: "Applications in Queue",
      count: stats.pendingApplications,
      sub: "Questionnaires awaiting review",
      href: "/admin/applications?status=pending",
      icon: HeartHandshake,
      iconBg: "bg-rose-500/10 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
      isUrgent: stats.pendingApplications > 0,
    },
    {
      title: "Screenings to Evaluate",
      count: stats.pendingScreenings,
      sub: "Household suitability checks",
      href: "/admin/screenings?status=pending",
      icon: ShieldCheck,
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
      isUrgent: stats.pendingScreenings > 0,
    },
    {
      title: "Due Welfare Check-ins",
      count: stats.dueFollowups,
      sub: "Post-adoption monthly care",
      href: "/admin/follow-ups?status=due",
      icon: CalendarCheck,
      iconBg: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400",
      isUrgent: stats.dueFollowups > 0,
    },
  ];

  return (
    <div className="space-y-8">
      {/* ── 1. DASHBOARD HEADING & QUICK ACTIONS (Reference 2 — Alpha Dashboard) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/70">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
              Operations Center
            </Badge>
            <span className="text-xs text-muted-foreground font-medium">
              Live Data Overview
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Admin Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
            Operational queues for dog verification, adoption questionnaires, family background screening, and post-adoption welfare monitoring.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/admin/dogs"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs font-semibold h-9 rounded-xl border-border/80")}
          >
            Manage Dogs
          </Link>
          <Link
            href="/admin/screenings"
            className={cn(buttonVariants({ size: "sm" }), "text-xs font-semibold h-9 rounded-xl shadow-xs gap-1.5 bg-rose-600 hover:bg-rose-700 text-white")}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Review Screenings</span>
          </Link>
        </div>
      </div>

      {/* ── 2. HORIZONTAL STATISTICS PANEL (Reference 1 — Pawsy Pet Haven) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {actionableCards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.title}
              href={c.href}
              className={cn(
                "group rounded-2xl border p-5 transition-all flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-xs bg-card",
                c.isUrgent
                  ? "border-rose-300/70 hover:border-rose-400 dark:border-rose-900/60"
                  : "border-border/80 hover:border-border"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground tracking-wide">
                  {c.title}
                </span>
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                    c.iconBg
                  )}
                >
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </div>

              <div>
                <p className={cn("text-3xl font-extrabold tracking-tight", c.isUrgent ? "text-rose-600 dark:text-rose-400" : "text-foreground")}>
                  {c.count}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.sub}</p>
              </div>

              <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs text-primary font-semibold group-hover:underline">
                <span>Open queue</span>
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── 3. SECONDARY PLATFORM METRICS CANVAS (Reference 2 — Alpha Dashboard) ── */}
      <div className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Platform Aggregate Summary
          </h2>
          <span className="text-[11px] text-muted-foreground">
            Synchronized with Supabase DB
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
            <span className="text-muted-foreground block text-[11px]">Available Dogs</span>
            <p className="text-xl font-bold text-foreground mt-0.5">{stats.availableDogs}</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
            <span className="text-muted-foreground block text-[11px]">Adopted Dogs</span>
            <p className="text-xl font-bold text-foreground mt-0.5">{stats.adoptedDogs}</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
            <span className="text-muted-foreground block text-[11px]">Total Listings</span>
            <p className="text-xl font-bold text-foreground mt-0.5">{stats.totalDogs}</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
            <span className="text-muted-foreground block text-[11px]">Approved Screenings</span>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">{stats.approvedScreenings}</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
            <span className="text-muted-foreground block text-[11px]">Reports in Review</span>
            <p className="text-xl font-bold text-primary mt-0.5">{stats.submittedFollowups}</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
            <span className="text-muted-foreground block text-[11px]">Registered Users</span>
            <p className="text-xl font-bold text-foreground mt-0.5">{stats.totalUsers}</p>
          </div>
        </div>
      </div>

      {/* ── 4. OPERATIONAL QUEUES WITH CLEAN DATA TABLES (Reference 1 & Reference 3) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Queue 1: Screenings Awaiting Review */}
        <Card className="rounded-2xl border border-border/80 shadow-2xs overflow-hidden">
          <CardHeader className="px-5 py-4 border-b border-border/70 flex-row items-center justify-between space-y-0 bg-muted/20">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-foreground">
                Household Screenings Needing Review
              </h2>
            </div>
            <Link
              href="/admin/screenings?status=pending"
              className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
            >
              <span>View all ({stats.pendingScreenings})</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {pendingScreeningsList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/60">
                    <tr>
                      <th className="px-4 py-2.5">Applicant &amp; Dog</th>
                      <th className="px-3 py-2.5">Housing</th>
                      <th className="px-3 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {pendingScreeningsList.slice(0, 5).map((s) => (
                      <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {s.applicant?.first_name} {s.applicant?.last_name}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            For dog: <span className="font-medium text-foreground">{s.dog?.name || "Dog"}</span>
                          </p>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                          <span className="capitalize">{s.housing_type.replace("_", " ")}</span>
                          <span className="block text-[10px] text-muted-foreground/75">
                            {s.daily_alone_hours}h alone
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <Link
                            href="/admin/screenings"
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs h-7 px-2.5 rounded-lg font-semibold")}
                          >
                            Evaluate
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
        <Card className="rounded-2xl border border-border/80 shadow-2xs overflow-hidden">
          <CardHeader className="px-5 py-4 border-b border-border/70 flex-row items-center justify-between space-y-0 bg-muted/20">
            <div className="flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <h2 className="text-sm font-bold text-foreground">
                Adoption Questionnaires in Queue
              </h2>
            </div>
            <Link
              href="/admin/applications?status=pending"
              className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
            >
              <span>View all ({stats.pendingApplications})</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {pendingAppsList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/60">
                    <tr>
                      <th className="px-4 py-2.5">Applicant &amp; Dog</th>
                      <th className="px-3 py-2.5">Submitted</th>
                      <th className="px-3 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {pendingAppsList.slice(0, 5).map((app) => (
                      <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {app.applicant?.first_name} {app.applicant?.last_name}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            Dog: <span className="font-medium text-foreground">{app.dog?.name || "Dog"}</span>
                          </p>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground whitespace-nowrap text-[11px]">
                          {formatDate(app.created_at)}
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <Link
                            href="/admin/applications"
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs h-7 px-2.5 rounded-lg font-semibold")}
                          >
                            Review
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
        <Card className="rounded-2xl border border-border/80 shadow-2xs overflow-hidden">
          <CardHeader className="px-5 py-4 border-b border-border/70 flex-row items-center justify-between space-y-0 bg-muted/20">
            <div className="flex items-center gap-2">
              <Dog className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h2 className="text-sm font-bold text-foreground">
                Dog Listings Pending Verification
              </h2>
            </div>
            <Link
              href="/admin/dogs?status=pending"
              className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
            >
              <span>View all ({stats.pendingDogs})</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {pendingDogsList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/60">
                    <tr>
                      <th className="px-4 py-2.5">Dog</th>
                      <th className="px-3 py-2.5">Breed</th>
                      <th className="px-3 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {pendingDogsList.slice(0, 5).map((dog) => (
                      <tr key={dog.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 min-w-0">
                          <p className="font-semibold text-foreground truncate">{dog.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            Caregiver ID: {dog.owner_id.slice(0, 10)}...
                          </p>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                          {dog.breed}
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <Link
                            href="/admin/dogs"
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs h-7 px-2.5 rounded-lg font-semibold")}
                          >
                            Inspect
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center space-y-2">
                <CheckCircle2 className="h-7 w-7 text-emerald-600/70 mx-auto" />
                <p className="text-xs text-muted-foreground">
                  All dog rehoming submissions have been verified.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Queue 4: Due Post-Adoption Follow-ups */}
        <Card className="rounded-2xl border border-border/80 shadow-2xs overflow-hidden">
          <CardHeader className="px-5 py-4 border-b border-border/70 flex-row items-center justify-between space-y-0 bg-muted/20">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-foreground">
                Due Post-Adoption Follow-ups
              </h2>
            </div>
            <Link
              href="/admin/follow-ups?status=due"
              className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
            >
              <span>View all ({stats.dueFollowups})</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {dueFollowupsList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/60">
                    <tr>
                      <th className="px-4 py-2.5">Adoption Target</th>
                      <th className="px-3 py-2.5">Milestone</th>
                      <th className="px-3 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {dueFollowupsList.slice(0, 5).map((f) => (
                      <tr key={f.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {f.dog?.name || `Dog #${f.dog_id?.slice(0, 6)}`}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            Due: {formatDate(f.due_date)}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                          <Badge variant="outline" className="text-[10px] font-semibold">
                            Month {f.month_number}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <Link
                            href="/admin/follow-ups"
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs h-7 px-2.5 rounded-lg font-semibold")}
                          >
                            Monitor
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
