import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  PawPrint,
  Heart,
  PlusCircle,
  ShieldCheck,
  Search,
  Home as HomeIcon,
  ArrowRight,
  Dog,
  Users,
  CheckCircle2,
  ClipboardList,
  Handshake,
  MapPin,
  FileText,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DogCard } from "@/components/dogs/DogCard";
import { getAvailableDogsAction } from "@/app/actions/dogs";
import { formatAge, formatCapitalize } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "PawConnect — Ethical Pet Adoption & Responsible Rehoming",
  description:
    "PawConnect connects compassionate adopters with dogs that need loving forever homes. Every listing is admin-verified for animal safety and welfare.",
};

export default async function HomePage() {
  const result = await getAvailableDogsAction({ limit: 6 });
  const dogs = result.success && result.data ? result.data.dogs : [];
  const heroDog = dogs.length > 0 ? dogs[0] : null;

  const heroDogImage = heroDog
    ? heroDog.primary_image ||
      heroDog.images?.find((img) => img.is_primary)?.public_url ||
      heroDog.images?.[0]?.public_url
    : null;

  return (
    <div className="flex flex-col">
      {/* ─────────────────────────────────────────── */}
      {/* 1. HERO SECTION                             */}
      {/* ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/[0.05] via-background to-background">
        {/* Subtle decorative paw pattern overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-paw-pattern opacity-40 pointer-events-none"
        />

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Headlines & Actions */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3.5 py-1.5 text-xs font-semibold text-primary shadow-2xs backdrop-blur-xs mb-5">
                <PawPrint className="h-3.5 w-3.5" />
                <span>Ethical Pet Adoption &amp; Responsible Rehoming</span>
              </div>

              {/* H1 Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight text-foreground leading-[1.14] mb-5">
                Connecting loving homes with{" "}
                <span className="text-primary">dogs in need.</span>
              </h1>

              {/* Sub-copy */}
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mb-8">
                PawConnect is a community-driven adoption platform where every
                dog listing is personally verified by animal welfare staff.
                Whether adopting or rehoming, we make every transition safe,
                humane, and transparent.
              </p>

              {/* Primary & Secondary CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mb-8">
                <Link
                  href="/dogs"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "gap-2 h-12 px-7 text-base font-semibold shadow-sm w-full sm:w-auto"
                  )}
                >
                  <Search className="h-4 w-4" />
                  Find a Pet
                </Link>
                <Link
                  href="/rehome"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "gap-2 h-12 px-7 text-base font-semibold w-full sm:w-auto"
                  )}
                >
                  <PlusCircle className="h-4 w-4" />
                  Rehome a Pet
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-y-2.5 gap-x-6 text-xs text-muted-foreground font-medium pt-2 border-t w-full">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Admin-Moderated Listings</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-primary shrink-0" />
                  <span>Structured Applications</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Heart className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>Ethical Rehoming Platform</span>
                </div>
              </div>
            </div>

            {/* Right Column: Pet Visual Treatment */}
            <div className="lg:col-span-5 w-full">
              {heroDog ? (
                <div className="relative rounded-2xl border bg-card p-3 shadow-md hover:shadow-xl hover:border-primary/40 transition-all duration-300">
                  {/* Photo container */}
                  <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-muted group">
                    {heroDogImage ? (
                      <Image
                        src={heroDogImage}
                        alt={heroDog.name}
                        fill
                        sizes="(max-width: 1024px) 100vw, 40vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        priority
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 text-muted-foreground p-6 text-center">
                        <Dog className="h-12 w-12 text-primary/40 mb-2" />
                        <span className="text-xs font-medium">Verified listing profile</span>
                      </div>
                    )}

                    {/* Status badge */}
                    <div className="absolute top-3 left-3 z-10">
                      <Badge className="bg-emerald-600 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        Available for Adoption
                      </Badge>
                    </div>

                    {/* Location badge */}
                    <div className="absolute top-3 right-3 z-10">
                      <Badge
                        variant="secondary"
                        className="backdrop-blur-md bg-background/90 text-xs font-medium shadow-xs"
                      >
                        <MapPin className="h-3 w-3 mr-1 text-primary" />
                        {heroDog.location}
                      </Badge>
                    </div>
                  </div>

                  {/* Pet snapshot metadata */}
                  <div className="pt-3.5 pb-1 px-1">
                    <div className="flex items-baseline justify-between mb-1.5">
                      <h3 className="text-xl font-bold tracking-tight text-foreground">
                        {heroDog.name}
                      </h3>
                      <span className="text-xs text-muted-foreground font-medium">
                        {heroDog.breed}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-3.5">
                      <Badge variant="outline" className="text-[11px] font-medium">
                        {formatAge(heroDog.age_years, heroDog.age_months)}
                      </Badge>
                      <Badge variant="outline" className="text-[11px] font-medium capitalize">
                        {heroDog.gender}
                      </Badge>
                      <Badge variant="outline" className="text-[11px] font-medium capitalize">
                        {formatCapitalize(heroDog.size)}
                      </Badge>
                    </div>

                    <Link
                      href={`/dogs/${heroDog.id}`}
                      className={cn(
                        buttonVariants({ size: "sm" }),
                        "w-full gap-2 font-semibold shadow-2xs"
                      )}
                    >
                      <span>Meet {heroDog.name}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>

                    <p className="text-[11px] text-center text-muted-foreground mt-2">
                      Verified health details · Guided adoption process
                    </p>
                  </div>
                </div>
              ) : (
                /* Fallback Hero Card if no dog is currently available */
                <Card className="rounded-2xl border bg-card p-6 shadow-md text-left">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                    <Dog className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    Ethical Dog Adoption Network
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    Every dog listed through PawConnect receives individualized
                    screening to ensure animal health, humane treatment, and
                    secure family matching.
                  </p>
                  <div className="space-y-2 border-t pt-4 text-xs font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Direct home-to-home transitions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Zero shelter cages or commercial brokers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Verified questionnaire review by staff</span>
                    </div>
                  </div>
                  <Link
                    href="/dogs"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "w-full gap-2 mt-5 font-semibold"
                    )}
                  >
                    <span>Explore Available Dogs</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────── */}
      {/* 2. PLATFORM PRINCIPLES                      */}
      {/* ─────────────────────────────────────────── */}
      <section className="border-b bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border text-center">
            {[
              {
                value: "Admin-Reviewed",
                label: "Moderated Listings",
                desc: "Every dog profile is inspected before approval",
              },
              {
                value: "Zero Platform Fees",
                label: "Community Adoption",
                desc: "No platform fees for rehoming or applying",
              },
              {
                value: "Detailed Forms",
                label: "Adopter Questionnaires",
                desc: "Housing, lifestyle, and pet history collected",
              },
              {
                value: "Direct Handoff",
                label: "Home-to-Home",
                desc: "Calm transitions directly between caregiver and adopter",
              },
            ].map(({ value, label, desc }, idx) => (
              <div
                key={label}
                className={cn(
                  "px-4 py-3 space-y-0.5",
                  idx > 1 ? "pt-4 md:pt-3" : ""
                )}
              >
                <p className="text-lg sm:text-xl font-extrabold tracking-tight text-primary">
                  {value}
                </p>
                <p className="text-xs font-semibold text-foreground">
                  {label}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────── */}
      {/* 3. FEATURED DOGS                            */}
      {/* ─────────────────────────────────────────── */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <Badge variant="secondary" className="mb-2 font-medium text-xs">
                <Dog className="h-3 w-3 mr-1" />
                Available Now
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Dogs Ready for a Lifelong Family
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-md">
                Browse recently verified dogs waiting for a caring, permanent
                home.
              </p>
            </div>

            <Link
              href="/dogs"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "gap-1.5 self-start sm:self-auto group text-primary font-semibold"
              )}
            >
              Browse all dogs
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {dogs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {dogs.map((dog) => (
                <DogCard key={dog.id} dog={dog} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 p-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <Dog className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">
                No Available Dogs Right Now
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                All dogs listed have found homes or are currently under review.
                Check back soon or help a dog in need by submitting a rehoming listing.
              </p>
              <Link
                href="/rehome"
                className={cn(buttonVariants(), "gap-2 shadow-xs")}
              >
                <PlusCircle className="h-4 w-4" />
                Submit a Rehoming Listing
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────── */}
      {/* 4. ADOPTION & REHOMING BENEFITS             */}
      {/* ─────────────────────────────────────────── */}
      <section className="bg-muted/30 border-y py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge
              variant="outline"
              className="mb-3 text-xs uppercase font-semibold tracking-wider"
            >
              Why PawConnect
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              A Thoughtful Approach to Pet Care
            </h2>
            <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
              We believe every pet transition should be conducted with
              transparency, dignity, and personal care.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Benefit 1: Adopters */}
            <Card className="rounded-2xl border bg-card p-6 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    For Compassionate Adopters
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Adopt with complete transparency, safety, and confidence.
                  </p>
                </div>
                <ul className="space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>Clear medical history &amp; vaccination disclosure fields</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>Direct insight into habits, temperament, and routines</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>Platform focused on ethical rehoming and welfare</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 border-t mt-6">
                <Link
                  href="/dogs"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "w-full justify-between text-primary font-semibold px-2"
                  )}
                >
                  <span>Explore available dogs</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Card>

            {/* Benefit 2: Rehoming Parents */}
            <Card className="rounded-2xl border bg-card p-6 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <HomeIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    For Responsible Dog Parents
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Protect your pet with a caring, dignified transition.
                  </p>
                </div>
                <ul className="space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>Peaceful alternative to overcrowded municipal shelters</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>Complete control to review and select the adopter</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>No listing or rehoming fees charged to you</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 border-t mt-6">
                <Link
                  href="/rehome"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "w-full justify-between text-primary font-semibold px-2"
                  )}
                >
                  <span>Learn about rehoming</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Card>

            {/* Benefit 3: Dog Welfare */}
            <Card className="rounded-2xl border bg-card p-6 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    For Animal Welfare &amp; Safety
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Centered entirely on the health and happiness of the animal.
                  </p>
                </div>
                <ul className="space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>Direct home-to-home coordination helps reduce kennel stress</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>Application review helps avoid impulsive decisions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>Administrative records maintained for accountability</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 border-t mt-6">
                <Link
                  href="/#safety"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "w-full justify-between text-primary font-semibold px-2"
                  )}
                >
                  <span>Read our safety standards</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────── */}
      {/* 5. HOW PAWCONNECT WORKS                     */}
      {/* ─────────────────────────────────────────── */}
      <section id="how-it-works" className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge
              variant="outline"
              className="mb-3 text-xs uppercase font-semibold tracking-wider"
            >
              Simple &amp; Guided
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              How PawConnect Works
            </h2>
            <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
              Step-by-step guidance whether you are welcoming a new pet or
              finding a loving new home for yours.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* Adopting */}
            <Card className="rounded-2xl border shadow-xs">
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-3 border-b pb-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs shrink-0">
                    <Heart className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      Adopting a Dog
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Find and welcome your perfect companion
                    </p>
                  </div>
                </div>

                <ol className="space-y-5">
                  {[
                    {
                      icon: Search,
                      title: "1. Find Your Match",
                      desc: "Filter by breed, size, age, and location to discover dogs that suit your home and lifestyle.",
                    },
                    {
                      icon: ClipboardList,
                      title: "2. Submit Questionnaire",
                      desc: "Complete a structured application covering your home environment, yard, and experience.",
                    },
                    {
                      icon: Handshake,
                      title: "3. Verified Handoff",
                      desc: "Staff approve the match and facilitate a safe, documented, and loving transition.",
                    },
                  ].map(({ icon: Icon, title, desc }) => (
                    <li key={title} className="flex items-start gap-3.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-0.5">
                          {title}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>

                <Link
                  href="/dogs"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full gap-2 font-semibold"
                  )}
                >
                  <Search className="h-4 w-4" />
                  Find a Pet
                </Link>
              </CardContent>
            </Card>

            {/* Rehoming */}
            <Card className="rounded-2xl border shadow-xs">
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-3 border-b pb-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs shrink-0">
                    <HomeIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      Rehoming Responsibly
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Give your dog the safest possible transition
                    </p>
                  </div>
                </div>

                <ol className="space-y-5">
                  {[
                    {
                      icon: Dog,
                      title: "1. Create Dog Profile",
                      desc: "Share personality details, health records, and clear photos so adopters understand your dog.",
                    },
                    {
                      icon: ShieldCheck,
                      title: "2. Administrative Review",
                      desc: "PawConnect moderators inspect every submission for animal welfare and medical transparency.",
                    },
                    {
                      icon: CheckCircle2,
                      title: "3. Choose Verified Adopter",
                      desc: "Review vetted applications and choose the loving forever family that best fits your dog.",
                    },
                  ].map(({ icon: Icon, title, desc }) => (
                    <li key={title} className="flex items-start gap-3.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-0.5">
                          {title}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>

                <Link
                  href="/rehome"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full gap-2 font-semibold"
                  )}
                >
                  <PlusCircle className="h-4 w-4" />
                  Rehome a Pet
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────── */}
      {/* 6. TRUST & SAFETY STANDARDS                 */}
      {/* ─────────────────────────────────────────── */}
      <section id="safety" className="border-t bg-muted/30 py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge
              variant="outline"
              className="mb-3 text-xs uppercase font-semibold tracking-wider"
            >
              Our Welfare Standard
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Built on Safety &amp; Animal Welfare
            </h2>
            <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
              We hold our platform to strict guidelines to protect animals from
              exploitation, mistreatment, and commercial breeding.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: FileText,
                title: "Strict Adopter Screening",
                desc: "Every applicant completes an in-depth questionnaire covering home environment, yard enclosure, other household pets, and past dog care experience.",
              },
              {
                icon: ShieldCheck,
                title: "Zero Commercial Breeding",
                desc: "PawConnect strictly bans puppy mills, commercial sales, and breeding advertisements. Our mission is exclusively ethical rehoming and rescue.",
              },
              {
                icon: Handshake,
                title: "Safe, Guided Handoff",
                desc: "We coordinate direct contact between caring owners and prospective adopters to ensure a calm, transparent, and fully agreed-upon handoff.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <Card
                key={title}
                className="rounded-2xl border bg-card p-6 space-y-3 shadow-2xs hover:border-primary/30 hover:shadow-md transition-all"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-foreground">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────── */}
      {/* 7. CALL TO ACTION BANNER                    */}
      {/* ─────────────────────────────────────────── */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground px-8 py-12 sm:py-16 text-center shadow-lg">
            {/* Subtle inner radial gradient */}
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 40%)",
              }}
            />

            <div className="relative z-10 max-w-2xl mx-auto space-y-4">
              <PawPrint className="h-10 w-10 mx-auto opacity-90 mb-2" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                Ready to find your four-legged best friend?
              </h2>
              <p className="text-primary-foreground/90 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
                Join our community of compassionate pet lovers creating positive,
                lifelong outcomes for dogs in need every day.
              </p>

              <Separator className="bg-primary-foreground/20 my-6" />

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/dogs"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "secondary" }),
                    "w-full sm:w-auto h-12 px-8 font-semibold shadow-sm gap-2"
                  )}
                >
                  <Search className="h-4 w-4" />
                  Find a Pet
                </Link>
                <Link
                  href="/rehome"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "w-full sm:w-auto h-12 px-8 font-semibold gap-2 bg-transparent text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10"
                  )}
                >
                  <PlusCircle className="h-4 w-4" />
                  Rehome a Pet
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
