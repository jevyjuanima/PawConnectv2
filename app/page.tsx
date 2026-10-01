import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  PlusCircle,
  ArrowRight,
  Check,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DogCard } from "@/components/dogs/DogCard";
import { getAvailableDogsAction } from "@/app/actions/dogs";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "PawConnect — Ethical Pet Adoption & Responsible Rehoming",
  description:
    "Second chances change lives. PawConnect connects people with dogs available for adoption and provides a structured rehoming process for pet parents.",
};

const FALLBACK_HERO_IMAGE =
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1200&q=80";
const ADOPT_PATH_IMAGE =
  "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80";
const REHOME_PATH_IMAGE =
  "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=800&q=80";
const FINAL_CTA_IMAGE =
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1200&q=80";

export default async function HomePage() {
  const result = await getAvailableDogsAction({ limit: 6 });
  const dogs = result.success && result.data ? result.data.dogs : [];
  const heroDog = dogs.length > 0 ? dogs[0] : null;

  const heroDogImage = heroDog
    ? heroDog.primary_image ||
      heroDog.images?.find((img) => img.is_primary)?.public_url ||
      heroDog.images?.[0]?.public_url ||
      FALLBACK_HERO_IMAGE
    : FALLBACK_HERO_IMAGE;

  return (
    <div className="flex flex-col">
      {/* ─────────────────────────────────────────── */}
      {/* 1. HERO SECTION                             */}
      {/* ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border/70 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-28 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left: Headline & Story */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4 block">
                Ethical Adoption &amp; Thoughtful Rehoming
              </span>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.75rem] font-normal tracking-tight text-foreground leading-[1.14]">
                <span className="relative inline-block">
                  Second chances
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 240 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute -bottom-1.5 left-0 w-full text-primary/40 stroke-current pointer-events-none"
                  >
                    <path
                      d="M3 8.5C55 2.5 145 2.5 237 9"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>{" "}
                change lives.
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mt-6 max-w-xl">
                PawConnect connects people ready to adopt with dogs available for
                a new home, and provides a structured, caring rehoming process for
                pet parents when circumstances change.
              </p>

              {/* Primary & Secondary Dual CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mt-8">
                <Link
                  href="/dogs"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-12 px-7 text-sm font-semibold shadow-xs gap-2"
                  )}
                >
                  <Search className="h-4 w-4" />
                  Find a Pet
                </Link>
                <Link
                  href="/rehome"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "h-12 px-7 text-sm font-semibold gap-2 border-border/90 hover:bg-muted/40"
                  )}
                >
                  <PlusCircle className="h-4 w-4" />
                  Rehome a Dog
                </Link>
              </div>

              {/* Quiet Truthful Trust Signals */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-muted-foreground pt-8 mt-10 border-t border-border/60 w-full">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>Admin-reviewed listings</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>Structured adoption questionnaires</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>Direct home-to-home transitions</span>
                </div>
              </div>
            </div>

            {/* Right: Dominant Dog Photograph with Organic Asymmetric Crop */}
            <div className="lg:col-span-5 w-full">
              <div className="relative aspect-[4/3] sm:aspect-[16/13] w-full rounded-[2.5rem_1.25rem_3rem_1.25rem] overflow-hidden border border-border/80 bg-muted shadow-xs">
                <Image
                  src={heroDogImage}
                  alt={heroDog ? heroDog.name : "Dog looking for a loving home"}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover"
                />

                {heroDog ? (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-5 text-white flex items-end justify-between">
                    <div>
                      <p className="font-serif text-lg font-bold leading-tight">
                        {heroDog.name}
                      </p>
                      <p className="text-xs text-white/80 mt-0.5">
                        {heroDog.breed} · {heroDog.location}
                      </p>
                    </div>
                    <Link
                      href={`/dogs/${heroDog.id}`}
                      className="text-xs font-semibold bg-white/20 hover:bg-white/30 backdrop-blur-xs text-white px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                    >
                      Meet {heroDog.name}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                ) : (
                  <div className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur-xs rounded-xl p-3 text-xs text-muted-foreground border border-border/80">
                    <p className="font-serif font-bold text-foreground text-sm">
                      Every dog deserves a caring home.
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Explore available listings or help your pet transition safely.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────── */}
      {/* 2. FEATURED DOGS SECTION                    */}
      {/* ─────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 border-b border-border/70">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-1">
                Recent Listings
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-foreground">
                Dogs looking for homes
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Browse dogs waiting for compassionate, permanent families.
              </p>
            </div>

            <Link
              href="/dogs"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "gap-1.5 self-start sm:self-auto text-primary font-semibold px-0 sm:px-3 hover:bg-transparent sm:hover:bg-muted/50"
              )}
            >
              Browse all dogs
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {dogs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {dogs.map((dog) => (
                <DogCard key={dog.id} dog={dog} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3 bg-muted/20 max-w-md mx-auto">
              <p className="font-serif text-base font-bold text-foreground">
                No dogs listed right now
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Check back shortly or submit a rehoming listing if you need to
                find a caring home for your dog.
              </p>
              <div className="pt-2">
                <Link
                  href="/rehome"
                  className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Rehome a Dog
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────── */}
      {/* 3. SIGNATURE TWO-PATH SECTION               */}
      {/* ─────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 border-b border-border/70 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="max-w-2xl mb-12 sm:mb-16">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-1">
              One Account · Two Meaningful Paths
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-[2.25rem] font-normal tracking-tight text-foreground">
              Designed for both adopters and pet parents.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-3 leading-relaxed">
              Every signed-in member can browse dogs to adopt or submit a dog for
              responsible rehoming using the exact same account.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-stretch">
            {/* Path 1: ADOPT (Warm Ivory Surface) */}
            <article className="rounded-3xl border border-border/80 bg-card p-6 sm:p-10 flex flex-col justify-between space-y-8 shadow-2xs">
              <div className="space-y-6">
                <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-muted border border-border/70">
                  <Image
                    src={ADOPT_PATH_IMAGE}
                    alt="Happy dog resting peacefully with human companion"
                    fill
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-background/95 backdrop-blur-xs text-[11px] font-semibold px-2.5 py-1 rounded-md border border-border/70 text-foreground">
                    Adoption Journey
                  </div>
                </div>

                <div>
                  <h3 className="font-serif text-2xl font-normal tracking-tight text-foreground">
                    Find your next companion.
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Open your home to a rescue or rehomed dog with transparent
                    background notes, behavioral observations, and direct caregiver communication.
                  </p>
                </div>

                {/* Workflow sequence */}
                <ul className="space-y-3 pt-2 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Browse dogs filtered by breed, size, age, and location</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Read honest profiles with temperament and routine details</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Submit a structured application with your home and pet experience</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Track application status directly in your dashboard</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-border/70">
                <Link
                  href="/dogs"
                  className={cn(
                    buttonVariants({ size: "default" }),
                    "w-full sm:w-auto font-semibold gap-2"
                  )}
                >
                  <span>Find a Pet</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>

            {/* Path 2: REHOME (Grounded Muted Olive/Beige Surface) */}
            <article className="rounded-3xl border border-border/80 bg-secondary/35 p-6 sm:p-10 flex flex-col justify-between space-y-8 shadow-2xs">
              <div className="space-y-6">
                <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-muted border border-border/70">
                  <Image
                    src={REHOME_PATH_IMAGE}
                    alt="Dog in a comfortable home setting"
                    fill
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-background/95 backdrop-blur-xs text-[11px] font-semibold px-2.5 py-1 rounded-md border border-border/70 text-foreground">
                    Rehoming Journey
                  </div>
                </div>

                <div>
                  <h3 className="font-serif text-2xl font-normal tracking-tight text-foreground">
                    Help your dog find a new home.
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    When keeping your dog is no longer possible, ensure a safe and
                    dignified transition directly to an approved family who meets your dog&apos;s needs.
                  </p>
                </div>

                {/* Workflow sequence */}
                <ul className="space-y-3 pt-2 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Create a comprehensive dog profile with photos and habits</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Listing is reviewed by administrators before going public</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Review adopter questionnaires to choose the right match</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Coordinate a direct, unhurried handoff on your schedule</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-border/70">
                <Link
                  href="/rehome"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "default" }),
                    "w-full sm:w-auto font-semibold gap-2 border-border/90 bg-background/60 hover:bg-background"
                  )}
                >
                  <span>Rehome a Dog</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────── */}
      {/* 4. HOW IT WORKS (Open Editorial Sequence)   */}
      {/* ─────────────────────────────────────────── */}
      <section id="how-it-works" className="py-16 sm:py-24 border-b border-border/70">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="max-w-2xl mb-12 sm:mb-16">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-1">
              Process
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-foreground">
              How PawConnect Works
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 leading-relaxed">
              A structured, transparent workflow designed to support responsible matches.
            </p>
          </div>

          {/* Open Horizontal Process Line (Zero decorative cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 pt-4 border-t border-border/70">
            {/* Step 01 */}
            <div className="space-y-3 pt-4 sm:pt-6">
              <span className="font-mono text-xs font-semibold text-primary block">
                01
              </span>
              <h3 className="font-serif text-xl font-normal text-foreground">
                Discover or List
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Adopters search dogs by breed, size, and location. Caregivers
                submit dog profiles with photos, medical notes, and behavioral habits.
              </p>
            </div>

            {/* Step 02 */}
            <div className="space-y-3 pt-4 sm:pt-6">
              <span className="font-mono text-xs font-semibold text-primary block">
                02
              </span>
              <h3 className="font-serif text-xl font-normal text-foreground">
                Apply or Review
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Adopters complete a structured questionnaire detailing home environment,
                yard fencing, and pet history. Listings and applications undergo administrative review.
              </p>
            </div>

            {/* Step 03 */}
            <div className="space-y-3 pt-4 sm:pt-6">
              <span className="font-mono text-xs font-semibold text-primary block">
                03
              </span>
              <h3 className="font-serif text-xl font-normal text-foreground">
                Connect and Transition
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Caregivers and approved adopters coordinate directly for an unhurried,
                home-to-home handoff focused on the dog&apos;s comfort.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────── */}
      {/* 5. TRUST & SAFETY (Factual, Quiet Overview) */}
      {/* ─────────────────────────────────────────── */}
      <section id="safety" className="py-16 sm:py-24 border-b border-border/70 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="max-w-2xl mb-12">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-1">
              Safety &amp; Accountability
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-foreground">
              Built on practical safeguards.
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              PawConnect incorporates real verification steps to protect animals and
              support honest communication between caregivers and adopters.
            </p>
          </div>

          {/* Factual 4-column divider layout (Zero generic cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/70 border-y border-border/70 py-6 sm:py-8">
            <div className="py-5 sm:py-0 sm:px-6 first:pl-0 space-y-2">
              <h3 className="font-serif text-base font-normal text-foreground">
                Admin-Reviewed Listings
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Dog submissions are reviewed by platform administrators prior to public
                display to verify profile completeness and prevent commercial breeding.
              </p>
            </div>

            <div className="py-5 sm:py-0 sm:px-6 space-y-2">
              <h3 className="font-serif text-base font-normal text-foreground">
                Structured Applications
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Questionnaires collect housing arrangements, yard fencing, existing household
                pets, and dog experience to guide informed matching.
              </p>
            </div>

            <div className="py-5 sm:py-0 sm:px-6 space-y-2">
              <h3 className="font-serif text-base font-normal text-foreground">
                Direct Transitions
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Dogs move directly between their current home and their new family,
                minimizing disruption and kennel stress.
              </p>
            </div>

            <div className="py-5 sm:py-0 sm:px-6 last:pr-0 space-y-2">
              <h3 className="font-serif text-base font-normal text-foreground">
                Status Tracking
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every stage from application submission to review and final decision is
                tracked in real time through the member dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────── */}
      {/* 6. FINAL CTA (Scenic Editorial Layout)      */}
      {/* ─────────────────────────────────────────── */}
      <section className="py-16 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
              {/* Left Column: Emotional Call to Action */}
              <div className="lg:col-span-7 p-8 sm:p-14 lg:p-16 space-y-6">
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground block">
                  Join the Community
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] font-normal tracking-tight text-foreground leading-[1.18]">
                  Be part of brighter tomorrows.
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground max-w-lg leading-relaxed">
                  Find a dog who needs a home, or help your own dog find the right family
                  through a respectful, structured community.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <Link
                    href="/dogs"
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "h-12 px-7 text-sm font-semibold shadow-xs gap-2"
                    )}
                  >
                    <Search className="h-4 w-4" />
                    Find a Pet
                  </Link>
                  <Link
                    href="/rehome"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "h-12 px-7 text-sm font-semibold gap-2 border-border/90 hover:bg-muted/40"
                    )}
                  >
                    <PlusCircle className="h-4 w-4" />
                    Rehome a Dog
                  </Link>
                </div>
              </div>

              {/* Right Column: Scenic Dog Photograph */}
              <div className="lg:col-span-5 relative h-64 sm:h-80 lg:h-full min-h-[300px] w-full bg-muted border-t lg:border-t-0 lg:border-l border-border/70">
                <Image
                  src={FINAL_CTA_IMAGE}
                  alt="Dogs running joyfully outdoors in the open green grass"
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
