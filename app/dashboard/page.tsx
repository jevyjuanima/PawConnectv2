import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import {
  HeartHandshake,
  Dog as DogIcon,
  PlusCircle,
  Search,
  ArrowRight,
  ShieldCheck,
  Bell,
  Heart,
  Calendar,
  LayoutDashboard,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DogStatusBadge,
  ApplicationStatusBadge,
} from "@/components/shared/StatusBadges";
import { getUserApplicationsAction } from "@/app/actions/applications";
import { getUserDogsAction } from "@/app/actions/dogs";
import { getNotificationsAction } from "@/app/actions/notifications";
import { getCurrentUserProfile } from "@/lib/clerk/auth";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Dashboard — PawConnect",
  description: "Your personal adoption and rehoming control center.",
};

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/dashboard");
  }

  const profile = await getCurrentUserProfile();
  const [appsRes, dogsRes, notifsRes] = await Promise.all([
    getUserApplicationsAction(),
    getUserDogsAction(),
    getNotificationsAction(),
  ]);

  const applications = appsRes.success && appsRes.data ? appsRes.data : [];
  const dogs = dogsRes.success && dogsRes.data ? dogsRes.data : [];
  const notifications =
    notifsRes.success && notifsRes.data ? notifsRes.data : [];

  const pendingApps = applications.filter(
    (a) => a.status === "pending" || a.status === "under_review"
  ).length;
  const adoptionsCount = applications.filter(
    (a) => a.status === "approved" || a.status === "completed"
  ).length;
  const liveDogs = dogs.filter(
    (d) => d.status === "available" || d.status === "reserved"
  ).length;
  const unreadNotifs = notifications.filter((n) => !n.is_read).length;
  const displayName = profile?.first_name || "Pet Lover";

  const summaryCards = [
    {
      label: "Applications",
      value: applications.length,
      sub: `${pendingApps} in progress`,
      icon: HeartHandshake,
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
    },
    {
      label: "My Dogs",
      value: dogs.length,
      sub: `${liveDogs} active listings`,
      icon: DogIcon,
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
    },
    {
      label: "Adoptions",
      value: adoptionsCount,
      sub: "approved / finalized",
      icon: Heart,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-500/10",
    },
    {
      label: "Notifications",
      value: notifications.length,
      sub: `${unreadNotifs} unread`,
      icon: Bell,
      iconColor: unreadNotifs > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground",
      iconBg: "bg-amber-500/10",
    },
  ];

  const quickActions = [
    {
      href: "/dogs",
      label: "Browse Dogs",
      icon: Search,
      desc: "Find available dogs",
    },
    {
      href: "/rehome",
      label: "Rehome a Dog",
      icon: PlusCircle,
      desc: "Submit a new listing",
    },
    {
      href: "/my-applications",
      label: "My Applications",
      icon: HeartHandshake,
      desc: "Track your applications",
    },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8 max-w-6xl">
      {/* ── 1. WELCOME HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 pb-6 border-b">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-[10px] uppercase tracking-widest font-semibold"
            >
              Member Dashboard
            </Badge>
            {profile?.role === "admin" && (
              <Badge variant="secondary" className="text-[10px] font-semibold">
                Staff Account
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground leading-tight">
                Welcome back, {displayName}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Manage your applications, listed dogs, and review updates.
              </p>
            </div>
          </div>
        </div>

        {/* Header actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/dogs"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5 font-medium"
            )}
          >
            <Search className="h-3.5 w-3.5" />
            Browse
          </Link>
          <Link
            href="/rehome"
            className={cn(
              buttonVariants({ size: "sm" }),
              "gap-1.5 shadow-xs font-medium"
            )}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Rehome a Dog
          </Link>
        </div>
      </div>

      {/* ── 2. SUMMARY KPI CARDS ── */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Your Activity at a Glance
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map(
            ({ label, value, sub, icon: Icon, iconColor, iconBg }) => (
              <Card
                key={label}
                className="rounded-2xl border shadow-xs hover:border-primary/20 hover:shadow-md transition-all"
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
                    <p className="text-3xl font-extrabold tracking-tight text-foreground">
                      {value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>
      </div>

      {/* ── 3. QUICK ACTIONS ── */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Quick Actions
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickActions.map(({ href, label, icon: Icon, desc }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl border bg-card shadow-2xs",
                "hover:border-primary/30 hover:shadow-sm hover:bg-primary/[0.02] transition-all group"
              )}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground truncate">{desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>
      </div>

      <Separator />

      {/* ── 4 & 5. RECENT APPLICATIONS & RECENT DOGS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Applications */}
        <Card className="rounded-2xl border shadow-xs">
          <CardHeader className="px-5 py-4 border-b flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">
                Recent Applications
              </h2>
            </div>
            <Link
              href="/my-applications"
              className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
            >
              View all ({applications.length})
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {applications.length > 0 ? (
              <ul className="divide-y">
                {applications.slice(0, 4).map((app) => (
                  <li
                    key={app.id}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {app.dog?.name || "Dog"}
                      </p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3 shrink-0" />
                        Applied {formatDate(app.created_at)}
                      </p>
                    </div>
                    <ApplicationStatusBadge status={app.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center p-10 text-center space-y-3">
                <HeartHandshake className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground max-w-xs">
                  No adoption applications yet. Find a dog and start your
                  journey.
                </p>
                <Link
                  href="/dogs"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "gap-1.5 mt-1"
                  )}
                >
                  <Search className="h-3.5 w-3.5" />
                  Browse Available Dogs
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Dog Submissions */}
        <Card className="rounded-2xl border shadow-xs">
          <CardHeader className="px-5 py-4 border-b flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <DogIcon className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">
                My Dog Listings
              </h2>
            </div>
            <Link
              href="/my-dogs"
              className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
            >
              View all ({dogs.length})
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {dogs.length > 0 ? (
              <ul className="divide-y">
                {dogs.slice(0, 4).map((dog) => (
                  <li
                    key={dog.id}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {dog.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {dog.breed} · Listed {formatDate(dog.created_at)}
                      </p>
                    </div>
                    <DogStatusBadge status={dog.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center p-10 text-center space-y-3">
                <DogIcon className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground max-w-xs">
                  No rehoming listings yet. Help a dog find a loving home.
                </p>
                <Link
                  href="/rehome"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "gap-1.5 mt-1"
                  )}
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Submit a Listing
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── 6. RECENT NOTIFICATIONS ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">
              Recent Notifications
            </h2>
          </div>
          {unreadNotifs > 0 && (
            <Badge
              variant="secondary"
              className="text-[10px] font-semibold"
            >
              {unreadNotifs} Unread
            </Badge>
          )}
        </div>

        {notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.slice(0, 5).map((notif) => (
              <div
                key={notif.id}
                className={cn(
                  "flex items-start justify-between gap-4 rounded-xl border px-4 py-3 transition-colors",
                  notif.is_read
                    ? "bg-card"
                    : "bg-primary/[0.04] border-primary/20 shadow-2xs"
                )}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  {!notif.is_read && (
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {notif.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {notif.message}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0 whitespace-nowrap mt-0.5">
                  {formatDate(notif.created_at)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed bg-muted/20 flex flex-col items-center justify-center p-10 text-center space-y-2">
            <Bell className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground max-w-xs">
              No notifications yet. You&apos;ll receive updates when your
              applications or listings are reviewed.
            </p>
          </div>
        )}
      </div>

      {/* ── SAFETY NOTICE ── */}
      <div className="rounded-2xl border bg-muted/20 p-4 flex items-center gap-3 text-xs text-muted-foreground">
        <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>
          PawConnect administrators manually review each dog listing and adoption
          questionnaire to ensure animal welfare and prevent unauthorized
          commercial exploitation.
        </span>
      </div>
    </div>
  );
}
