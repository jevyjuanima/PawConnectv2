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
  ChevronRight,
  LayoutDashboard,
  Bell,
  Heart,
  Calendar,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DogStatusBadge, ApplicationStatusBadge } from "@/components/shared/StatusBadges";
import { getUserApplicationsAction } from "@/app/actions/applications";
import { getUserDogsAction } from "@/app/actions/dogs";
import { getNotificationsAction } from "@/app/actions/notifications";
import { getCurrentUserProfile } from "@/lib/clerk/auth";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

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
  const notifications = notifsRes.success && notifsRes.data ? notifsRes.data : [];

  const pendingApps = applications.filter(
    (a) => a.status === "pending" || a.status === "under_review"
  ).length;
  const adoptionsCount = applications.filter(
    (a) => a.status === "approved" || a.status === "completed"
  ).length;

  const liveDogs = dogs.filter((d) => d.status === "available" || d.status === "reserved").length;

  const unreadNotifs = notifications.filter((n) => !n.is_read).length;
  const displayName = profile?.first_name || "Pet Lover";

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 max-w-6xl">
      {/* 1. BREADCRUMB & WELCOME */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-foreground">Dashboard</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs uppercase tracking-wider font-semibold">
              Member Dashboard
            </Badge>
            {profile?.role === "admin" && (
              <Badge variant="secondary" className="text-xs font-semibold">
                Staff Account
              </Badge>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-primary shrink-0" />
            Welcome back, {displayName}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your pet adoption applications, track listed dogs, and stay updated on review outcomes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dogs"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <Search className="h-4 w-4" />
            Browse Dogs
          </Link>
          <Link
            href="/rehome"
            className={cn(buttonVariants({ size: "sm" }), "gap-1.5 shadow-xs")}
          >
            <PlusCircle className="h-4 w-4" />
            Rehome a Dog
          </Link>
        </div>
      </div>

      {/* 2. SUMMARY CARDS (Applications, My Dogs, Adoptions, Notifications) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Applications */}
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Applications
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HeartHandshake className="h-4 w-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold tracking-tight text-foreground">
              {applications.length}
            </p>
            <p className="text-xs text-muted-foreground pt-1 flex items-center gap-1">
              <span className="font-semibold text-foreground">{pendingApps}</span> in progress
            </p>
          </CardContent>
        </Card>

        {/* Card 2: My Dogs */}
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                My Dogs
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <DogIcon className="h-4 w-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold tracking-tight text-foreground">
              {dogs.length}
            </p>
            <p className="text-xs text-muted-foreground pt-1 flex items-center gap-1">
              <span className="font-semibold text-foreground">{liveDogs}</span> active listings
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Adoptions */}
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Adoptions
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Heart className="h-4 w-4 fill-current" />
              </div>
            </div>
            <p className="text-3xl font-extrabold tracking-tight text-foreground">
              {adoptionsCount}
            </p>
            <p className="text-xs text-muted-foreground pt-1 flex items-center gap-1">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {adoptionsCount}
              </span> approved / finalized
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Notifications */}
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Notifications
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Bell className="h-4 w-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold tracking-tight text-foreground">
              {notifications.length}
            </p>
            <p className="text-xs text-muted-foreground pt-1 flex items-center gap-1">
              <span className={cn("font-semibold", unreadNotifs > 0 && "text-amber-600 dark:text-amber-400")}>
                {unreadNotifs}
              </span> unread updates
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. QUICK ACTIONS */}
      <div className="rounded-2xl border bg-muted/30 p-5 space-y-3 shadow-2xs">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
          Quick Actions
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/dogs"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-11 justify-start gap-2.5 bg-card hover:bg-card/80 text-foreground font-semibold rounded-xl border shadow-2xs"
            )}
          >
            <Search className="h-4 w-4 text-primary" />
            <span>Browse Dogs</span>
          </Link>
          <Link
            href="/rehome"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-11 justify-start gap-2.5 bg-card hover:bg-card/80 text-foreground font-semibold rounded-xl border shadow-2xs"
            )}
          >
            <PlusCircle className="h-4 w-4 text-primary" />
            <span>Rehome a Dog</span>
          </Link>
          <Link
            href="/my-applications"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-11 justify-start gap-2.5 bg-card hover:bg-card/80 text-foreground font-semibold rounded-xl border shadow-2xs"
            )}
          >
            <HeartHandshake className="h-4 w-4 text-primary" />
            <span>View Applications</span>
          </Link>
        </div>
      </div>

      {/* 4 & 5. RECENT APPLICATIONS & RECENT DOG SUBMISSIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Applications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-primary" />
              Recent Applications
            </h2>
            <Link
              href="/my-applications"
              className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
            >
              <span>View all ({applications.length})</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {applications.length > 0 ? (
            <div className="space-y-3">
              {applications.slice(0, 3).map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between gap-3 p-4 rounded-xl border bg-card shadow-2xs hover:border-primary/30 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">
                      {app.dog?.name || "Dog"}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 shrink-0" />
                      Applied {formatDate(app.created_at)}
                    </p>
                  </div>
                  <ApplicationStatusBadge status={app.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed bg-muted/20 p-8 text-center space-y-3">
              <HeartHandshake className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="text-xs text-muted-foreground">
                You haven&apos;t submitted any adoption applications yet.
              </p>
              <Link
                href="/dogs"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5 shadow-2xs")}
              >
                <Search className="h-3.5 w-3.5" />
                Browse Available Dogs
              </Link>
            </div>
          )}
        </div>

        {/* Recent Dog Submissions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <DogIcon className="h-4 w-4 text-primary" />
              Recent Dog Submissions
            </h2>
            <Link
              href="/my-dogs"
              className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
            >
              <span>View all ({dogs.length})</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {dogs.length > 0 ? (
            <div className="space-y-3">
              {dogs.slice(0, 3).map((dog) => (
                <div
                  key={dog.id}
                  className="flex items-center justify-between gap-3 p-4 rounded-xl border bg-card shadow-2xs hover:border-primary/30 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">
                      {dog.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {dog.breed} • Listed {formatDate(dog.created_at)}
                    </p>
                  </div>
                  <DogStatusBadge status={dog.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed bg-muted/20 p-8 text-center space-y-3">
              <DogIcon className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="text-xs text-muted-foreground">
                You haven&apos;t listed any dogs for rehoming yet.
              </p>
              <Link
                href="/rehome"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5 shadow-2xs")}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Submit a Rehoming Listing
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 6. RECENT NOTIFICATIONS */}
      <section id="notifications" className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Recent Notifications
          </h2>
          {unreadNotifs > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadNotifs} Unread
            </Badge>
          )}
        </div>

        {notifications.length > 0 ? (
          <div className="space-y-2.5">
            {notifications.slice(0, 4).map((notif) => (
              <div
                key={notif.id}
                className={cn(
                  "p-4 rounded-xl border transition-colors flex items-start justify-between gap-4",
                  notif.is_read
                    ? "bg-card/70 border-border text-muted-foreground"
                    : "bg-primary/5 border-primary/20 text-foreground shadow-2xs"
                )}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {!notif.is_read && (
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                    <h3 className="text-sm font-bold text-foreground truncate">
                      {notif.title}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notif.message}
                  </p>
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0 whitespace-nowrap">
                  {formatDate(notif.created_at)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed bg-muted/20 p-8 text-center space-y-2">
            <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <p className="text-xs text-muted-foreground">
              No notifications yet. You will receive updates when your applications or listings are reviewed.
            </p>
          </div>
        )}
      </section>

      {/* SAFETY & AUDIT NOTICE */}
      <div className="rounded-2xl border bg-muted/20 p-5 flex items-center gap-3 text-xs text-muted-foreground">
        <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>
          PawConnect administrators manually review each dog listing and adoption questionnaire to ensure animal welfare and prevent unauthorized commercial exploitation.
        </span>
      </div>
    </div>
  );
}
