import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { UserDogCard } from "@/components/dogs/UserDogCard";
import { getUserDogsAction } from "@/app/actions/dogs";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { APPLICATION_STATUSES } from "@/lib/constants/statuses";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My Dogs | PawConnect",
  description:
    "Keep track of the dogs you've submitted for rehoming and follow each profile's progress.",
};

export default async function MyDogsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/my-dogs");
  }

  const result = await getUserDogsAction();
  const dogs = result.success && result.data ? result.data : [];

  // Query application counts per dog for adoption activity summary
  const appCountByDogId: Record<string, number> = {};
  if (dogs.length > 0) {
    try {
      const adminSupabase = createAdminSupabaseClient();
      const dogIds = dogs.map((d) => d.id);
      const { data: apps } = await adminSupabase
        .from("adoption_applications")
        .select("dog_id, status")
        .in("dog_id", dogIds)
        .neq("status", APPLICATION_STATUSES.CANCELLED);

      if (apps) {
        apps.forEach((app) => {
          appCountByDogId[app.dog_id] = (appCountByDogId[app.dog_id] || 0) + 1;
        });
      }
    } catch {
      // Non-fatal
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-4xl space-y-8 sm:space-y-10">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/70 pb-6">
        <div className="space-y-1.5">
          <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-foreground">
            My Dogs
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed">
            Keep track of the dogs you&apos;ve submitted for rehoming and follow each profile&apos;s progress.
          </p>
        </div>

        <Link
          href="/rehome"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4 self-start sm:self-auto shrink-0"
        >
          <span>Rehome a Dog</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Content */}
      {dogs.length > 0 ? (
        <div className="space-y-4">
          {dogs.map((dog) => (
            <UserDogCard
              key={dog.id}
              dog={dog}
              applicationCount={appCountByDogId[dog.id] || 0}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="py-16 sm:py-24 text-center max-w-md mx-auto space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Your dogs
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-foreground">
              Nothing here yet.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              When you need to find a new home for your dog, you can create a profile here.
            </p>
          </div>
          <div>
            <Link
              href="/rehome"
              className={cn(buttonVariants({ size: "default" }), "rounded-full px-6 font-medium")}
            >
              Rehome a Dog
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
