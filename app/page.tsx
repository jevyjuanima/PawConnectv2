import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Dog as DogIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DogCard } from "@/components/dogs/DogCard";
import { getAvailableDogsAction } from "@/app/actions/dogs";
import { formatAge } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "PawConnect — Ethical Pet Adoption & Responsible Rehoming",
  description:
    "Give a dog a second chance at home. PawConnect connects compassionate adopters with dogs that need loving forever homes through admin-reviewed listings.",
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
      <section className="relative border-b py-16 sm:py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Editorial Headline & Copy */}
            <div className="lg:col-span-7 flex flex-col items-start text-left max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">
                Ethical Pet Adoption &amp; Rehoming
              </p>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1] mb-6">
                Give a dog a second chance at home.
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
                PawConnect brings together compassionate families and caring dog
                owners. Every listing is reviewed by administrators to protect
                animal welfare and ensure peaceful, transparent transitions.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <Link
                  href="/dogs"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-12 px-8 text-base font-semibold shadow-xs"
                  )}
                >
                  Find a Pet
                </Link>
                <Link
                  href="/rehome"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "h-12 px-8 text-base font-medium"
                  )}
                >
                  Rehome a Dog
                </Link>
              </div>
            </div>

            {/* Right Column: Large Real Dog Photograph */}
            <div className="lg:col-span-5 w-full">
              {heroDogImage && heroDog ? (
                <div className="relative aspect-[4/5] sm:aspect-[3/4] w-full rounded-2xl overflow-hidden bg-muted border shadow-sm">
                  <Image
                    src={heroDogImage}
                    alt={heroDog.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover"
                    priority
                  />
                  {/* Subtle photo caption */}
                  <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-background/90 backdrop-blur-md border border-border/80 flex items-center justify-between shadow-xs">
                    <div>
                      <p className="font-serif text-base font-bold text-foreground">
                        {heroDog.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {heroDog.breed} · {formatAge(heroDog.age_years, heroDog.age_months)}
                      </p>
                    </div>
                    <Link
                      href={`/dogs/${heroDog.id}`}
                      className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <span>Meet {heroDog.name}</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="aspect-[4/5] sm:aspect-[3/4] w-full rounded-2xl bg-muted/40 border border-border flex flex-col items-center justify-center p-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-background border mb-4 text-primary">
                    <DogIcon className="h-8 w-8" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-foreground mb-2">
                    Every dog deserves a home.
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                    Explore dogs currently awaiting loving families across our platform.
                  </p>
                  <Link
                    href="/dogs"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-6 font-medium")}
                  >
                    Browse Dogs
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────── */}
      {/* 2. FEATURED DOGS                            */}
      {/* ─────────────────────────────────────────── */}
      <section className="py-20 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
                Available Now
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Dogs waiting for a family
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-lg">
                Recently reviewed dog listings ready for adoption into caring homes.
              </p>
            </div>

            <Link
              href="/dogs"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors self-start sm:self-auto group"
            >
              <span>View all available dogs</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>

          {dogs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {dogs.map((dog) => (
                <DogCard key={dog.id} dog={dog} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center border rounded-2xl bg-muted/20 p-8">
              <DogIcon className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-serif text-lg font-bold text-foreground mb-1">
                No dogs currently available
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                All dogs listed have found homes or are under review. Check back soon or help a dog in need.
              </p>
              <Link href="/rehome" className={cn(buttonVariants({ size: "sm" }), "font-medium")}>
                Rehome a Dog
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────── */}
      {/* 3. HOW IT WORKS                             */}
      {/* ─────────────────────────────────────────── */}
      <section id="how-it-works" className="border-t py-20 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
              The Adoption Journey
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              How adoption works
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              We make the adoption process clear, compassionate, and transparent from discovery to handoff.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12">
            <div>
              <span className="font-serif text-4xl sm:text-5xl font-light text-muted-foreground/40 block mb-4">
                01
              </span>
              <h3 className="text-lg font-bold text-foreground mb-2">Browse</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Explore verified dog profiles with honest descriptions of temperament, size, health status, and living preferences.
              </p>
            </div>

            <div>
              <span className="font-serif text-4xl sm:text-5xl font-light text-muted-foreground/40 block mb-4">
                02
              </span>
              <h3 className="text-lg font-bold text-foreground mb-2">Apply</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Submit a straightforward adoption questionnaire covering your home environment, daily routine, and experience with dogs.
              </p>
            </div>

            <div>
              <span className="font-serif text-4xl sm:text-5xl font-light text-muted-foreground/40 block mb-4">
                03
              </span>
              <h3 className="text-lg font-bold text-foreground mb-2">Meet &amp; Adopt</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Once reviewed by administrators, connect directly with the pet&apos;s current caregiver for a safe, unhurried handoff.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────── */}
      {/* 4. REHOMING                                 */}
      {/* ─────────────────────────────────────────── */}
      <section className="bg-muted/40 border-y py-20 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Left side: Context & Invitation */}
            <div className="lg:col-span-5 max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
                Responsible Rehoming
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-4">
                When circumstances change, we are here.
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
                Rehoming a pet is a difficult and emotional decision. PawConnect
                provides a respectful, cage-free alternative to municipal
                shelters, keeping dogs in home environments while helping you
                choose the right future family.
              </p>
              <Link
                href="/rehome"
                className={cn(buttonVariants(), "h-11 px-6 font-semibold shadow-xs")}
              >
                Rehome a Dog
              </Link>
            </div>

            {/* Right side: 3-step Rehome Process */}
            <div className="lg:col-span-7 space-y-8">
              <div className="border-b pb-6">
                <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-1">
                  Step 01
                </span>
                <h3 className="text-base font-bold text-foreground mb-1.5">
                  Submit details
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Provide clear photographs, vaccination history, behavioral traits, and daily routines so prospective families truly understand your dog.
                </p>
              </div>

              <div className="border-b pb-6">
                <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-1">
                  Step 02
                </span>
                <h3 className="text-base font-bold text-foreground mb-1.5">
                  Admin review
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Our moderation team evaluates every submission to verify information, maintain health transparency, and ensure animal welfare standards.
                </p>
              </div>

              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-1">
                  Step 03
                </span>
                <h3 className="text-base font-bold text-foreground mb-1.5">
                  Find a suitable adopter
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Review vetted adoption applications and select the family that feels right for your dog&apos;s personality and future happiness.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────── */}
      {/* 5. TRUST & SAFETY                           */}
      {/* ─────────────────────────────────────────── */}
      <section id="safety" className="py-20 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
              Trust &amp; Safety
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Built on verified procedures.
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              PawConnect operates with deliberate human oversight to protect dogs and the families who welcome them.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-foreground">
                Admin-reviewed listings
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every dog profile is inspected by administrators for medical transparency and welfare before appearing in the public catalog.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-foreground">
                Adoption questionnaire
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Prospective adopters complete structured questions about their housing, yard, daily schedule, and prior pet experience.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-foreground">
                Controlled workflow
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Applications progress through explicit stages—pending, under review, reserved, and adopted—preventing double matches.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-foreground">
                Secure accounts
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                User identity is verified through authenticated accounts with row-level database authorization protecting all personal data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────── */}
      {/* 6. FINAL CTA                                */}
      {/* ─────────────────────────────────────────── */}
      <section className="border-t py-20 sm:py-28 text-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
            Somewhere out there is a dog waiting for the right home.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-8 max-w-lg mx-auto">
            Whether you are welcoming a lifelong companion or finding a safe new chapter for your pet, we guide every step.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dogs"
              className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto h-12 px-8 text-base font-semibold shadow-xs")}
            >
              Find a Pet
            </Link>
            <Link
              href="/rehome"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto h-12 px-8 text-base font-medium")}
            >
              Rehome a Dog
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
