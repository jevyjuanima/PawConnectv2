import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft, Clock, Dog as DogIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ApplicationStatusBadge } from "@/components/shared/StatusBadges";
import { ApplicationForm } from "@/components/applications/ApplicationForm";
import { getDogByIdAction } from "@/app/actions/dogs";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/clerk/auth";
import { DOG_STATUSES } from "@/lib/constants/statuses";
import { formatAge, formatCapitalize, formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface ApplyPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: ApplyPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getDogByIdAction(id);

  if (!result.success || !result.data) {
    return {
      title: "Adoption Application | PawConnect",
    };
  }

  const dog = result.data;
  return {
    title: `Apply to Adopt ${dog.name} | PawConnect`,
    description: `Complete your adoption questionnaire for ${dog.name}, a ${dog.breed} on PawConnect.`,
  };
}

export default async function ApplyPage({ params }: ApplyPageProps) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect(`/sign-in?redirect_url=/dogs/${id}/apply`);
  }

  const result = await getDogByIdAction(id);
  if (!result.success || !result.data) {
    notFound();
  }

  const dog = result.data;
  const userProfile = await ensureUserProfile();

  const primaryImg =
    dog.primary_image ||
    dog.images?.find((img) => img.is_primary)?.public_url ||
    dog.images?.[0]?.public_url;

  // 1. OWNER PROTECTION: Cannot adopt own dog
  if (dog.owner_id === userId) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 max-w-2xl">
        <nav className="mb-6" aria-label="Breadcrumb">
          <Link
            href={`/dogs/${dog.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to {dog.name}</span>
          </Link>
        </nav>

        {/* Compact Dog Banner */}
        <div className="flex items-center gap-4 p-4 rounded-2xl border border-border/80 bg-muted/20 mb-8">
          <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
            {primaryImg ? (
              <Image
                src={primaryImg}
                alt={dog.name}
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                <DogIcon className="h-8 w-8" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="font-serif text-xl sm:text-2xl font-normal text-foreground truncate">
              {dog.name}
            </h2>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {dog.breed} · {formatAge(dog.age_years, dog.age_months)}
              {dog.gender && ` · ${formatCapitalize(dog.gender)}`}
            </p>
          </div>
        </div>

        {/* Notice */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 space-y-4 text-center sm:text-left">
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-foreground">
            This is your dog listing
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            You listed {dog.name} for rehoming. You cannot submit an adoption application for your own listing. You can review incoming applications from prospective adopters in your dashboard.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <Link
              href="/my-dogs"
              className={cn(buttonVariants({ size: "lg" }), "font-medium")}
            >
              Manage in My Dogs
            </Link>
            <Link
              href={`/dogs/${dog.id}`}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "font-medium")}
            >
              View Public Listing
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. UNAVAILABLE DOG: Dog not accepting applications
  if (dog.status !== DOG_STATUSES.AVAILABLE) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 max-w-2xl">
        <nav className="mb-6" aria-label="Breadcrumb">
          <Link
            href={`/dogs/${dog.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to {dog.name}</span>
          </Link>
        </nav>

        {/* Compact Dog Banner */}
        <div className="flex items-center gap-4 p-4 rounded-2xl border border-border/80 bg-muted/20 mb-8">
          <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
            {primaryImg ? (
              <Image
                src={primaryImg}
                alt={dog.name}
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                <DogIcon className="h-8 w-8" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="font-serif text-xl sm:text-2xl font-normal text-foreground truncate">
              {dog.name}
            </h2>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {dog.breed} · {formatAge(dog.age_years, dog.age_months)}
              {dog.gender && ` · ${formatCapitalize(dog.gender)}`}
            </p>
          </div>
        </div>

        {/* Notice */}
        <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 space-y-4 text-center sm:text-left">
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-foreground">
            This dog is not currently accepting applications.
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {dog.status === "reserved"
              ? `An application for ${dog.name} has been approved and is currently in progress.`
              : dog.status === "adopted"
              ? `${dog.name} has already found a loving home and is no longer available for adoption.`
              : `${dog.name} is currently not available for new applications.`}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <Link
              href="/dogs"
              className={cn(buttonVariants({ size: "lg" }), "font-medium")}
            >
              Browse Available Dogs
            </Link>
            <Link
              href={`/dogs/${dog.id}`}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "font-medium")}
            >
              Back to {dog.name}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. ALREADY APPLIED: Check if existing active application is already submitted
  try {
    const supabase = await createServerSupabaseClient();
    const { data: existingApp } = await supabase
      .from("adoption_applications")
      .select("id, status, created_at")
      .eq("dog_id", dog.id)
      .eq("applicant_id", userId)
      .not("status", "in", '("cancelled","rejected")')
      .maybeSingle();

    if (existingApp) {
      return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 max-w-2xl">
          <nav className="mb-6" aria-label="Breadcrumb">
            <Link
              href={`/dogs/${dog.id}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to {dog.name}</span>
            </Link>
          </nav>

          {/* Compact Dog Banner */}
          <div className="flex items-center gap-4 p-4 rounded-2xl border border-border/80 bg-muted/20 mb-8">
            <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
              {primaryImg ? (
                <Image
                  src={primaryImg}
                  alt={dog.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                  <DogIcon className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-serif text-xl sm:text-2xl font-normal text-foreground truncate">
                {dog.name}
              </h2>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {dog.breed} · {formatAge(dog.age_years, dog.age_months)}
                {dog.gender && ` · ${formatCapitalize(dog.gender)}`}
              </p>
            </div>
          </div>

          {/* Notice */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 space-y-5">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Existing Application
              </p>
              <h1 className="font-serif text-2xl sm:text-3xl font-normal text-foreground">
                You&apos;ve already applied for {dog.name}.
              </h1>
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Application Status</span>
                <ApplicationStatusBadge status={existingApp.status} />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/60">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Submitted on
                </span>
                <span className="font-medium text-foreground">
                  {formatDate(existingApp.created_at)}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Your questionnaire is safely stored in our system. You can review updates, track administrator review, and follow next steps from your applications dashboard.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link
                href="/my-applications"
                className={cn(buttonVariants({ size: "lg" }), "font-medium")}
              >
                View Application
              </Link>
              <Link
                href="/dogs"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "font-medium")}
              >
                Browse Other Dogs
              </Link>
            </div>
          </div>
        </div>
      );
    }
  } catch {
    // Non-fatal: if lookup fails, let application form proceed
  }

  // 4. ACTIVE APPLICATION FLOW
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-3xl">
      {/* Back to dog link */}
      <nav className="mb-6 sm:mb-8" aria-label="Breadcrumb">
        <Link
          href={`/dogs/${dog.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to {dog.name}</span>
        </Link>
      </nav>

      {/* Header */}
      <div className="space-y-2 mb-6 sm:mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-foreground">
          Apply to adopt {dog.name}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Tell us a little about yourself, your home, and how you would care for {dog.name}.
        </p>
      </div>

      {/* Compact Dog Context Area */}
      <div className="flex items-center gap-4 p-3.5 sm:p-4 rounded-2xl border border-border/80 bg-muted/20 mb-8 sm:mb-10">
        <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl bg-muted/40">
          {primaryImg ? (
            <Image
              src={primaryImg}
              alt={dog.name}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
              <DogIcon className="h-8 w-8" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Applying for
          </p>
          <h2 className="font-serif text-xl sm:text-2xl font-normal text-foreground truncate">
            {dog.name}
          </h2>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {dog.breed} · {formatAge(dog.age_years, dog.age_months)}
            {dog.gender && ` · ${formatCapitalize(dog.gender)}`}
          </p>
        </div>
      </div>

      {/* Structured Application Form Component */}
      <ApplicationForm dog={dog} applicant={userProfile} />
    </div>
  );
}
