import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft, Info } from "lucide-react";
import { RehomeForm } from "@/components/rehome/RehomeForm";
import { getUserDogsAction } from "@/app/actions/dogs";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Rehome Your Dog | PawConnect",
  description: "Help your dog find a suitable new home. Tell us about your dog so we can help their next home understand who they are and what they need.",
};

export default async function RehomePage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/rehome");
  }

  // Check if user already has listings
  let activeDogName: string | null = null;
  try {
    const dogsResult = await getUserDogsAction();
    if (dogsResult.success && dogsResult.data) {
      const activeDog = dogsResult.data.find(
        (d) => d.status === "pending" || d.status === "available"
      );
      if (activeDog) {
        activeDogName = activeDog.name;
      }
    }
  } catch {
    // Non-fatal
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-3xl space-y-8">
      {/* Back Link */}
      <nav aria-label="Breadcrumb">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to dashboard</span>
        </Link>
      </nav>

      {/* Header */}
      <div className="space-y-2 border-b border-border/70 pb-6">
        <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-foreground">
          Rehome your dog
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
          Tell us about your dog so we can help their next home understand who they are and what they need.
        </p>
      </div>

      {/* Existing Listing In Progress Notice */}
      {activeDogName && (
        <div className="rounded-xl border border-border/80 bg-muted/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">
                You have a profile currently in progress for {activeDogName}
              </p>
              <p className="text-muted-foreground mt-0.5">
                If you need to update that listing or check applications, you can manage it from My Dogs.
              </p>
            </div>
          </div>
          <Link
            href="/my-dogs"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "text-xs font-medium shrink-0 self-start sm:self-auto"
            )}
          >
            Manage in My Dogs
          </Link>
        </div>
      )}

      {/* Rehome Stepped Form */}
      <RehomeForm />
    </div>
  );
}
