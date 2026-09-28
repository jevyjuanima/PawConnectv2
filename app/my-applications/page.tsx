import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { HeartHandshake, ChevronRight, Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserApplicationCard } from "@/components/applications/UserApplicationCard";
import { getUserApplicationsAction } from "@/app/actions/applications";
import { cn } from "@/lib/utils";

export default async function MyApplicationsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/my-applications");
  }

  const result = await getUserApplicationsAction();
  const applications = result.success && result.data ? result.data : [];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-foreground">My Applications</span>
      </nav>

      {/* Header */}
      <div className="border-b pb-6 max-w-4xl">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider font-semibold">
            Adoption Tracker
          </Badge>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
          <HeartHandshake className="h-8 w-8 text-primary" />
          My Adoption Applications
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Monitor review progress, administrative feedback, and adoption status for every dog application you have submitted.
        </p>
      </div>

      {/* Content */}
      {applications.length > 0 ? (
        <div className="space-y-4 max-w-4xl">
          {applications.map((app) => (
            <UserApplicationCard key={app.id} application={app} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 p-12 text-center max-w-2xl mx-auto my-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <HeartHandshake className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground">No Applications Yet</h2>
          <p className="text-sm text-muted-foreground max-w-md mt-1 mb-6">
            You haven&apos;t submitted any adoption applications yet. Explore our verified listings of dogs looking for lifelong homes.
          </p>
          <Link
            href="/dogs"
            className={cn(buttonVariants(), "gap-2 shadow-sm")}
          >
            <Search className="h-4 w-4" />
            Browse Available Dogs
          </Link>
        </div>
      )}
    </div>
  );
}
