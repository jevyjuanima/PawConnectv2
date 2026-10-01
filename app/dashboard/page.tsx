import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import {
  Search,
  PlusCircle,
  ArrowRight,
  Shield,
  Calendar,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
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
  description: "Your adoption and rehoming activity.",
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
  const activeDogs = dogs.filter(
    (d) => d.status === "available" || d.status === "reserved" || d.status === "pending"
  ).length;
  const unreadNotifs = notifications.filter((n) => !n.is_read).length;
  const displayName = profile?.first_name || "Pet Lover";

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 max-w-5xl">
      {/* ── 1. GREETING & PRIMARY ACTIONS ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Welcome back, {displayName}
            </h1>
            {profile?.role === "admin" && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium px-2 py-0.5 rounded border border-border/80 bg-muted/30 ml-2 transition-colors"
              >
                <Shield className="h-3 w-3" />
                Admin
              </Link>
            )}
          </div>
          <p className="text-base text-muted-foreground">
            Your adoption and rehoming activity
          </p>
        </div>

        {/* Primary Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/dogs"
            className={cn(buttonVariants({ size: "default" }), "gap-2 shadow-xs")}
          >
            <Search className="h-4 w-4" />
            Find a Dog
          </Link>
          <Link
            href="/rehome"
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "gap-2"
            )}
          >
            <PlusCircle className="h-4 w-4" />
            Rehome a Dog
          </Link>
        </div>
      </div>

      {/* ── 2. COMPACT ACTIVITY SUMMARY ── */}
      <section aria-labelledby="activity-summary-heading">
        <h2 id="activity-summary-heading" className="sr-only">
          Activity Summary
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 rounded-xl border bg-card divide-y md:divide-y-0 md:divide-x divide-border">
          <div className="p-4 sm:p-5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
              Applications
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {applications.length}
              </span>
              <span className="text-xs text-muted-foreground">
                {pendingApps} in progress
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
              My Dog Listings
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {dogs.length}
              </span>
              <span className="text-xs text-muted-foreground">
                {activeDogs} active / pending
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
              Adoptions
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {adoptionsCount}
              </span>
              <span className="text-xs text-muted-foreground">
                approved / finalized
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
              Notifications
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {notifications.length}
              </span>
              <span className="text-xs text-muted-foreground">
                {unreadNotifs} unread
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 & 4. RECENT APPLICATIONS & MY DOG LISTINGS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Recent Applications */}
        <section aria-labelledby="applications-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="applications-heading" className="text-base font-semibold text-foreground">
              Recent Applications
            </h2>
            {applications.length > 0 && (
              <Link
                href="/my-applications"
                className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
              >
                View all ({applications.length})
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          <div className="rounded-xl border bg-card overflow-hidden">
            {applications.length > 0 ? (
              <ul className="divide-y divide-border">
                {applications.slice(0, 4).map((app) => (
                  <li
                    key={app.id}
                    className="flex items-center justify-between gap-4 p-4 hover:bg-muted/40 transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {app.dog?.name || "Dog"}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 shrink-0" />
                        Applied {formatDate(app.created_at)}
                      </p>
                    </div>
                    <ApplicationStatusBadge status={app.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center space-y-2">
                <p className="text-sm font-medium text-foreground">
                  No applications yet
                </p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  When you apply to adopt a dog, your application progress will appear here.
                </p>
                <div className="pt-2">
                  <Link
                    href="/dogs"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "text-xs"
                    )}
                  >
                    Find a Dog
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* My Dog Listings */}
        <section aria-labelledby="dog-listings-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="dog-listings-heading" className="text-base font-semibold text-foreground">
              My Dog Listings
            </h2>
            {dogs.length > 0 && (
              <Link
                href="/my-dogs"
                className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
              >
                View all ({dogs.length})
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          <div className="rounded-xl border bg-card overflow-hidden">
            {dogs.length > 0 ? (
              <ul className="divide-y divide-border">
                {dogs.slice(0, 4).map((dog) => (
                  <li
                    key={dog.id}
                    className="flex items-center justify-between gap-4 p-4 hover:bg-muted/40 transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {dog.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {dog.breed} · Listed {formatDate(dog.created_at)}
                      </p>
                    </div>
                    <DogStatusBadge status={dog.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center space-y-2">
                <p className="text-sm font-medium text-foreground">
                  No dogs listed
                </p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  If you need to rehome a dog, you can submit a listing for review.
                </p>
                <div className="pt-2">
                  <Link
                    href="/rehome"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "text-xs"
                    )}
                  >
                    Rehome a Dog
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ── 5. RECENT NOTIFICATIONS ── */}
      <section id="notifications" aria-labelledby="notifications-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 id="notifications-heading" className="text-base font-semibold text-foreground">
              Recent Notifications
            </h2>
            {unreadNotifs > 0 && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {unreadNotifs} unread
              </span>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden">
          {notifications.length > 0 ? (
            <ul className="divide-y divide-border">
              {notifications.slice(0, 5).map((notif) => (
                <li
                  key={notif.id}
                  className={cn(
                    "flex items-start justify-between gap-4 p-4 transition-colors",
                    !notif.is_read ? "bg-muted/30" : "hover:bg-muted/20"
                  )}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!notif.is_read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      )}
                      <p className="text-sm font-medium text-foreground">
                        {notif.title}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {notif.message}
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0 whitespace-nowrap">
                    {formatDate(notif.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center space-y-1">
              <p className="text-sm font-medium text-foreground">
                No notifications yet
              </p>
              <p className="text-xs text-muted-foreground">
                You will receive updates here when your applications or listings are reviewed.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
