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
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DogStatusBadge, ApplicationStatusBadge } from "@/components/shared/StatusBadges";
import { getUserApplicationsAction } from "@/app/actions/applications";
import { getUserDogsAction } from "@/app/actions/dogs";
import { getCurrentUserProfile } from "@/lib/clerk/auth";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/dashboard");
  }

  const profile = await getCurrentUserProfile();
  const [appsRes, dogsRes] = await Promise.all([
    getUserApplicationsAction(),
    getUserDogsAction(),
  ]);

  const applications = appsRes.success && appsRes.data ? appsRes.data : [];
  const dogs = dogsRes.success && dogsRes.data ? dogsRes.data : [];

  const pendingApps = applications.filter((a) => a.status === "pending" || a.status === "under_review").length;
  const approvedApps = applications.filter((a) => a.status === "approved" || a.status === "completed").length;

  const pendingDogs = dogs.filter((d) => d.status === "pending").length;
  const liveDogs = dogs.filter((d) => d.status === "available" || d.status === "reserved").length;

  const displayName = profile?.first_name || "Pet Lover";

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 max-w-6xl">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-foreground">Dashboard</span>
      </nav>

      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs uppercase tracking-wider font-semibold">
              Member Dashboard
            </Badge>
            {profile?.role === "admin" && (
              <Badge variant="secondary" className="text-xs">
                Staff Account
              </Badge>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            Welcome back, {displayName}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your pet adoption applications, track listed dogs, and explore verified adoption matches.
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
            className={cn(buttonVariants({ size: "sm" }), "gap-1.5 shadow-sm")}
          >
            <PlusCircle className="h-4 w-4" />
            Rehome a Dog
          </Link>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Applications Summary Card */}
        <Card className="rounded-2xl border shadow-xs">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <HeartHandshake className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    Adoption Applications
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Track the status of dogs you have applied to adopt
                  </p>
                </div>
              </div>
              <span className="text-3xl font-extrabold text-foreground">
                {applications.length}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t">
              <div className="rounded-xl bg-muted/30 p-3 border">
                <span className="text-muted-foreground block text-[11px]">In Progress</span>
                <span className="font-bold text-foreground text-base">{pendingApps} active</span>
              </div>
              <div className="rounded-xl bg-muted/30 p-3 border">
                <span className="text-muted-foreground block text-[11px]">Approved / Adopted</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                  {approvedApps} approved
                </span>
              </div>
            </div>

            <Link
              href="/my-applications"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "w-full justify-between text-xs text-primary font-semibold pt-1"
              )}
            >
              <span>View all applications</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>

        {/* Listed Dogs Summary Card */}
        <Card className="rounded-2xl border shadow-xs">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <DogIcon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    My Listed Dogs
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Dogs you have submitted for responsible rehoming
                  </p>
                </div>
              </div>
              <span className="text-3xl font-extrabold text-foreground">
                {dogs.length}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t">
              <div className="rounded-xl bg-muted/30 p-3 border">
                <span className="text-muted-foreground block text-[11px]">Pending Verification</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 text-base">
                  {pendingDogs} pending
                </span>
              </div>
              <div className="rounded-xl bg-muted/30 p-3 border">
                <span className="text-muted-foreground block text-[11px]">Active Listings</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                  {liveDogs} active
                </span>
              </div>
            </div>

            <Link
              href="/my-dogs"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "w-full justify-between text-xs text-primary font-semibold pt-1"
              )}
            >
              <span>Manage your listed dogs</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Applications & Listed Dogs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Applications Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-primary" />
              Recent Applications
            </h3>
            <Link
              href="/my-applications"
              className="text-xs text-muted-foreground hover:text-foreground font-medium"
            >
              See all
            </Link>
          </div>

          {applications.length > 0 ? (
            <div className="space-y-3">
              {applications.slice(0, 3).map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between gap-3 p-4 rounded-xl border bg-card shadow-2xs hover:shadow-xs transition-shadow"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">
                      {app.dog.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
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
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
              >
                <Search className="h-3.5 w-3.5" />
                Browse Available Dogs
              </Link>
            </div>
          )}
        </div>

        {/* Recent Listed Dogs Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <DogIcon className="h-4 w-4 text-primary" />
              Recent Dog Listings
            </h3>
            <Link
              href="/my-dogs"
              className="text-xs text-muted-foreground hover:text-foreground font-medium"
            >
              See all
            </Link>
          </div>

          {dogs.length > 0 ? (
            <div className="space-y-3">
              {dogs.slice(0, 3).map((dog) => (
                <div
                  key={dog.id}
                  className="flex items-center justify-between gap-3 p-4 rounded-xl border bg-card shadow-2xs hover:shadow-xs transition-shadow"
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
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Submit a Rehoming Listing
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Safety Notice Footer */}
      <div className="rounded-2xl border bg-muted/20 p-5 flex items-center gap-3 text-xs text-muted-foreground">
        <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>
          PawConnect reviews all dog listings and adoption applications to ensure animal welfare and prevent commercial exploitation.
        </span>
      </div>
    </div>
  );
}
