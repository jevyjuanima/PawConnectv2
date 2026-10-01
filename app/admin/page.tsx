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
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  getAdminStatsAction,
  getAdminDogsAction,
  getAdminApplicationsAction,
} from "@/app/actions/admin";
import { formatDate } from "@/lib/utils/format";
import {
  DogStatusBadge,
  ApplicationStatusBadge,
} from "@/components/shared/StatusBadges";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Admin Overview — PawConnect",
  description: "Platform operations overview for PawConnect administrators.",
};

export default async function AdminDashboardPage() {
  const [statsRes, pendingDogsRes, pendingAppsRes] = await Promise.all([
    getAdminStatsAction(),
    getAdminDogsAction("pending"),
    getAdminApplicationsAction("pending"),
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
          totalUsers: 0,
        };

  const pendingDogsList =
    pendingDogsRes.success && pendingDogsRes.data ? pendingDogsRes.data : [];
  const pendingAppsList =
    pendingAppsRes.success && pendingAppsRes.data ? pendingAppsRes.data : [];

  const metricsCards = [
    {
      label: "Pending Dogs",
      value: stats.pendingDogs,
      sub: "Need verification & approval",
      icon: Clock,
      iconColor:
        stats.pendingDogs > 0
          ? "text-amber-600 dark:text-amber-400"
          : "text-muted-foreground",
      iconBg:
        stats.pendingDogs > 0 ? "bg-amber-500/10" : "bg-muted",
      valueColor:
        stats.pendingDogs > 0
          ? "text-amber-600 dark:text-amber-400"
          : "text-foreground",
    },
    {
      label: "Pending Applications",
      value: stats.pendingApplications,
      sub: "Questionnaires awaiting evaluation",
      icon: HeartHandshake,
      iconColor:
        stats.pendingApplications > 0 ? "text-primary" : "text-muted-foreground",
      iconBg:
        stats.pendingApplications > 0 ? "bg-primary/10" : "bg-muted",
      valueColor:
        stats.pendingApplications > 0 ? "text-primary" : "text-foreground",
    },
    {
      label: "Available Dogs",
      value: stats.availableDogs,
      sub: `${stats.totalDogs} total in catalog`,
      icon: Dog,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-500/10",
      valueColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Registered Users",
      value: stats.totalUsers,
      sub: "Profiles in database",
      icon: Users,
      iconColor: "text-muted-foreground",
      iconBg: "bg-muted",
      valueColor: "text-foreground",
    },
  ];

  return (
    <div className="space-y-8">
      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 pb-6 border-b">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-[10px] uppercase tracking-widest font-semibold"
            >
              Admin Console
            </Badge>
            <Badge variant="secondary" className="text-[10px] font-semibold">
              System Overview
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-tight">
                Operations Overview
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Pending reviews, metrics, and platform management shortcuts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin/dogs?status=pending"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5 font-medium"
            )}
          >
            <Dog className="h-3.5 w-3.5" />
            Dogs ({stats.pendingDogs})
          </Link>
          <Link
            href="/admin/applications?status=pending"
            className={cn(
              buttonVariants({ size: "sm" }),
              "gap-1.5 shadow-xs font-medium"
            )}
          >
            <HeartHandshake className="h-3.5 w-3.5" />
            Apps ({stats.pendingApplications})
          </Link>
        </div>
      </div>

      {/* ── ACTION REQUIRED BANNERS ── */}
      {(stats.pendingDogs > 0 || stats.pendingApplications > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.pendingDogs > 0 && (
            <Card className="rounded-2xl border-amber-500/30 bg-amber-500/[0.07] shadow-xs">
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">
                      {stats.pendingDogs}{" "}
                      {stats.pendingDogs === 1 ? "Listing" : "Listings"} Awaiting Review
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Submitted dog profiles need veterinary & welfare verification.
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/dogs?status=pending"
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "shrink-0 gap-1.5 text-xs shadow-xs"
                  )}
                >
                  Review Dogs
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>
          )}

          {stats.pendingApplications > 0 && (
            <Card className="rounded-2xl border-primary/30 bg-primary/[0.05] shadow-xs">
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <HeartHandshake className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">
                      {stats.pendingApplications}{" "}
                      {stats.pendingApplications === 1
                        ? "Application"
                        : "Applications"}{" "}
                      Pending
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Adoption questionnaires awaiting staff review and vetting.
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/applications?status=pending"
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "shrink-0 gap-1.5 text-xs shadow-xs"
                  )}
                >
                  Review Apps
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── KEY METRICS ── */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Platform Metrics
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metricsCards.map(
            ({ label, value, sub, icon: Icon, iconColor, iconBg, valueColor }) => (
              <Card
                key={label}
                className="rounded-2xl border shadow-xs hover:border-primary/20 hover:shadow-sm transition-all"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {label}
                    </span>
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg",
                        iconBg
                      )}
                    >
                      <Icon className={cn("h-4 w-4", iconColor)} />
                    </div>
                  </div>
                  <div>
                    <p
                      className={cn(
                        "text-3xl font-extrabold tracking-tight",
                        valueColor
                      )}
                    >
                      {value}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {sub}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>
      </div>

      <Separator />

      {/* ── PENDING QUEUES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Dog Submissions */}
        <Card className="rounded-2xl border shadow-xs">
          <CardHeader className="px-5 py-4 border-b flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <Dog className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">
                Pending Dog Submissions
              </h2>
            </div>
            <Link
              href="/admin/dogs?status=pending"
              className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
            >
              Manage all ({pendingDogsList.length})
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {pendingDogsList.length > 0 ? (
              <ul className="divide-y">
                {pendingDogsList.slice(0, 4).map((dog) => (
                  <li
                    key={dog.id}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {dog.name}
                        </p>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 shrink-0"
                        >
                          {dog.breed}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3 shrink-0" />
                        {formatDate(dog.created_at)} · {dog.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <DogStatusBadge status={dog.status} />
                      <Link
                        href="/admin/dogs"
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "h-7 px-2.5 text-xs"
                        )}
                      >
                        Inspect
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center p-10 text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-500/60" />
                <p className="text-xs text-muted-foreground">
                  All dog submissions have been reviewed. Queue is clear.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Applications */}
        <Card className="rounded-2xl border shadow-xs">
          <CardHeader className="px-5 py-4 border-b flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">
                Pending Applications
              </h2>
            </div>
            <Link
              href="/admin/applications?status=pending"
              className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
            >
              Manage all ({pendingAppsList.length})
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {pendingAppsList.length > 0 ? (
              <ul className="divide-y">
                {pendingAppsList.slice(0, 4).map((app) => (
                  <li
                    key={app.id}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {app.dog?.name || "Dog"}
                        </p>
                        <span className="text-xs text-muted-foreground truncate">
                          · {app.applicant?.first_name || "Applicant"}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3 shrink-0" />
                        Applied {formatDate(app.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <ApplicationStatusBadge status={app.status} />
                      <Link
                        href="/admin/applications"
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "h-7 px-2.5 text-xs"
                        )}
                      >
                        Review
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center p-10 text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-500/60" />
                <p className="text-xs text-muted-foreground">
                  No adoption questionnaires currently awaiting evaluation.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── QUICK NAVIGATION PANELS ── */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Management Sections
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              href: "/admin/dogs",
              icon: Dog,
              badge: "Dog Moderation",
              title: "Dog Listing Review",
              desc: "Inspect submitted dogs, verify medical records, approve listings, or provide rejection feedback.",
            },
            {
              href: "/admin/applications",
              icon: HeartHandshake,
              badge: "Applications",
              title: "Adoption Workflow",
              desc: "Evaluate prospective adopters, advance application statuses, and finalize adoption handoffs.",
            },
            {
              href: "/admin/users",
              icon: Users,
              badge: "User Management",
              title: "Accounts & Permissions",
              desc: "View registered profiles, monitor account activity, and manage administrator access flags.",
            },
          ].map(({ href, icon: Icon, badge, title, desc }) => (
            <Link
              key={href}
              href={href}
              className="group block rounded-2xl border bg-card p-6 shadow-xs hover:border-primary/40 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Icon className="h-5 w-5" />
                </div>
                <Badge
                  variant="outline"
                  className="text-xs group-hover:border-primary transition-colors"
                >
                  {badge}
                </Badge>
              </div>
              <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors mb-1">
                {title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {desc}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
