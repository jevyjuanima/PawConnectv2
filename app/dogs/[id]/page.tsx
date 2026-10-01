import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft, Check, Minus, MapPin, Calendar, Heart } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DogImageGallery } from "@/components/dogs/DogImageGallery";
import { DogCard } from "@/components/dogs/DogCard";
import { getDogByIdAction, getAvailableDogsAction } from "@/app/actions/dogs";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  formatAge,
  formatCapitalize,
  formatDate,
} from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface DogDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: DogDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getDogByIdAction(id);

  if (!result.success || !result.data) {
    return {
      title: "Dog Not Found | PawConnect",
    };
  }

  const dog = result.data;
  const age = formatAge(dog.age_years, dog.age_months);

  return {
    title: `${dog.name} — ${dog.breed} | PawConnect`,
    description: `Meet ${dog.name}, a ${age} ${dog.breed} in ${dog.location}. Learn about their personality, care background, and how to apply for adoption.`,
  };
}

export default async function DogDetailPage({ params }: DogDetailPageProps) {
  const { id } = await params;
  const result = await getDogByIdAction(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const dog = result.data;
  const { userId } = await auth();
  const isOwner = Boolean(userId && dog.owner_id === userId);

  // Check if current user has an active application for this dog
  let existingApplicationId: string | null = null;
  if (userId) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: existingApp } = await supabase
        .from("adoption_applications")
        .select("id, status")
        .eq("dog_id", dog.id)
        .eq("applicant_id", userId)
        .not("status", "in", '("cancelled","rejected")')
        .maybeSingle();

      if (existingApp) {
        existingApplicationId = existingApp.id;
      }
    } catch {
      // Non-fatal check
    }
  }

  const isAvailable = dog.status === "available";

  // Fetch up to 3 other real available dogs for the optional "More dogs looking for homes" section
  let relatedDogs: typeof dog[] = [];
  try {
    const relatedResult = await getAvailableDogsAction({ limit: 4 });
    if (relatedResult.success && relatedResult.data?.dogs) {
      relatedDogs = relatedResult.data.dogs
        .filter((d) => d.id !== dog.id)
        .slice(0, 3);
    }
  } catch {
    // Non-fatal
  }

  // Construct subtitle tokens gracefully (only existing fields)
  const subtitleParts: string[] = [];
  if (dog.breed) subtitleParts.push(dog.breed);
  const ageStr = formatAge(dog.age_years, dog.age_months);
  if (ageStr) subtitleParts.push(ageStr);
  if (dog.gender) subtitleParts.push(formatCapitalize(dog.gender));
  const subtitle = subtitleParts.join(" · ");

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-6xl">
      {/* Back link */}
      <nav className="mb-6 sm:mb-8" aria-label="Breadcrumb">
        <Link
          href="/dogs"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to dogs</span>
        </Link>
      </nav>

      {/* Main Showcase: Large Photo (Left) + Dog Summary & CTA (Right) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Dog Photography */}
        <div className="lg:col-span-7">
          <DogImageGallery
            dogName={dog.name}
            images={dog.images}
            primaryImageUrl={dog.primary_image}
          />
        </div>

        {/* Right Column: Key Summary & Primary Action */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
          {/* Header Info */}
          <div className="space-y-2">
            {/* Status indicator */}
            <div className="flex items-center gap-2">
              {isAvailable ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                  Available for adoption
                </span>
              ) : dog.status === "reserved" ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-800 dark:text-blue-300">
                  <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                  Application in progress (Reserved)
                </span>
              ) : dog.status === "adopted" ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/60" />
                  Adopted
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/60" />
                  {formatCapitalize(dog.status)}
                </span>
              )}
            </div>

            {/* Dog Name */}
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-foreground">
              {dog.name}
            </h1>

            {/* Subtitle: Breed · Age · Gender */}
            {subtitle && (
              <p className="text-base text-muted-foreground font-normal">
                {subtitle}
              </p>
            )}
          </div>

          {/* Key Attributes Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 border-y border-border/70 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Size</p>
              <p className="font-medium text-foreground capitalize mt-0.5">
                {dog.size ? `${formatCapitalize(dog.size)} size` : "Not specified"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="font-medium text-foreground mt-0.5 truncate">
                {dog.location || "Not specified"}
              </p>
            </div>
            {dog.color && (
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs text-muted-foreground">Coat color</p>
                <p className="font-medium text-foreground mt-0.5 capitalize">
                  {dog.color}
                </p>
              </div>
            )}
          </div>

          {/* Action Box based on role & status */}
          <div className="space-y-3 pt-1">
            {isOwner ? (
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Your Listing
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You listed this dog. You can monitor status and incoming applications from your dashboard.
                  </p>
                </div>
                <Link
                  href="/my-dogs"
                  className={cn(buttonVariants({ variant: "outline" }), "w-full text-sm font-medium")}
                >
                  View in My Dogs
                </Link>
              </div>
            ) : existingApplicationId ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    Application Submitted
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You have an active application in review for {dog.name}.
                  </p>
                </div>
                <Link
                  href="/my-applications"
                  className={cn(buttonVariants(), "w-full text-sm font-medium shadow-xs")}
                >
                  Track My Application
                </Link>
              </div>
            ) : isAvailable ? (
              <div className="space-y-3">
                <Link
                  href={`/dogs/${dog.id}/apply`}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "w-full h-12 text-base font-semibold shadow-xs gap-2"
                  )}
                >
                  <Heart className="h-4 w-4" />
                  Apply to Adopt {dog.name}
                </Link>
                <p className="text-xs text-muted-foreground leading-relaxed px-0.5">
                  Ready to adopt? Complete a short application so the adoption process can begin.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Adoptions Unavailable
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dog.status === "reserved"
                      ? "This dog is currently reserved while an approved application is completed."
                      : dog.status === "adopted"
                      ? "This dog has already been adopted and is settled with their new family."
                      : "This dog is not currently accepting applications."}
                  </p>
                </div>
                <Link
                  href="/dogs"
                  className={cn(buttonVariants({ variant: "outline" }), "w-full text-sm font-medium")}
                >
                  Browse Available Dogs
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Editorial Content Divider */}
      <hr className="my-12 sm:my-16 border-border/70" />

      {/* Editorial Details Sections */}
      <div className="max-w-3xl space-y-12 sm:space-y-14">
        {/* About Section */}
        {dog.description && (
          <section aria-labelledby="about-heading" className="space-y-4">
            <h2
              id="about-heading"
              className="font-serif text-2xl sm:text-3xl font-normal text-foreground"
            >
              About {dog.name}
            </h2>
            <div className="text-base sm:text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
              {dog.description}
            </div>
          </section>
        )}

        {/* Temperament & Habits (Only displayed if data exists) */}
        {dog.special_needs && (
          <section aria-labelledby="temperament-heading" className="space-y-4 pt-2">
            <h2
              id="temperament-heading"
              className="font-serif text-2xl font-normal text-foreground"
            >
              Temperament &amp; Home Needs
            </h2>
            <div className="rounded-xl border border-border/80 bg-muted/20 p-5 text-sm sm:text-base leading-relaxed text-muted-foreground">
              {dog.special_needs}
            </div>
          </section>
        )}

        {/* Care & Health Section */}
        <section aria-labelledby="care-heading" className="space-y-4 pt-2">
          <h2
            id="care-heading"
            className="font-serif text-2xl font-normal text-foreground"
          >
            Care &amp; Health Background
          </h2>

          <div className="divide-y divide-border/60 border-y border-border/60 text-sm">
            <div className="py-3 flex items-center justify-between">
              <span className="text-muted-foreground">Vaccinations</span>
              <span className="font-medium text-foreground inline-flex items-center gap-1.5">
                {dog.vaccinated ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Up to date
                  </>
                ) : (
                  <>
                    <Minus className="h-4 w-4 text-muted-foreground/60" />
                    Pending or not recorded
                  </>
                )}
              </span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <span className="text-muted-foreground">Spayed / Neutered</span>
              <span className="font-medium text-foreground inline-flex items-center gap-1.5">
                {dog.spayed_neutered ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Completed
                  </>
                ) : (
                  <>
                    <Minus className="h-4 w-4 text-muted-foreground/60" />
                    No
                  </>
                )}
              </span>
            </div>

            {dog.medical_history && (
              <div className="py-3 space-y-1">
                <span className="text-muted-foreground block">Medical History</span>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed pt-0.5">
                  {dog.medical_history}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Location & Listing Information */}
        <section aria-labelledby="listing-heading" className="space-y-4 pt-2">
          <h2
            id="listing-heading"
            className="font-serif text-2xl font-normal text-foreground"
          >
            Location &amp; Additional Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2.5 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground/70" />
              <div>
                <p className="text-xs text-muted-foreground">Current Location</p>
                <p className="font-medium text-foreground mt-0.5">{dog.location}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground/70" />
              <div>
                <p className="text-xs text-muted-foreground">Listed On</p>
                <p className="font-medium text-foreground mt-0.5">
                  {formatDate(dog.created_at)}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Optional: Related Dogs ("More dogs looking for homes") */}
      {relatedDogs.length > 0 && (
        <section className="mt-16 sm:mt-24 pt-12 border-t border-border/70 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Explore More
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-foreground">
                More dogs looking for homes
              </h2>
            </div>
            <Link
              href="/dogs"
              className="text-sm font-medium text-primary hover:underline underline-offset-4 inline-flex items-center gap-1 self-start sm:self-auto"
            >
              View all dogs
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedDogs.map((relDog) => (
              <DogCard key={relDog.id} dog={relDog} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
