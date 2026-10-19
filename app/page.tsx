import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Dog as DogIcon,
  ShieldCheck,
  Search,
  PlusCircle,
  Heart,
  CheckCircle2,
  CalendarCheck,
  Home,
  FileCheck2,
  MapPin,
  Sparkles,
  Star,
  Users,
  Clock,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DogCard } from "@/components/dogs/DogCard";
import { getAvailableDogsAction } from "@/app/actions/dogs";
import { formatAge } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "PawConnect — Ethical Pet Adoption & Responsible Rehoming",
  description:
    "Looking for your new best furry friend? PawConnect connects compassionate adopters with dogs that need loving forever homes through admin-reviewed listings and transparent household screening.",
};

export default async function HomePage() {
  const result = await getAvailableDogsAction({ limit: 9 });
  const dogs = result.success && result.data ? result.data.dogs : [];
  const totalCount =
    result.success && result.data ? result.data.totalCount : dogs.length;

  // Pick up to 3 hero dogs with photos
  const heroDogsPool = dogs
    .filter(
      (d) =>
        Boolean(d.primary_image || (d.images && d.images.length > 0)) &&
        d.name &&
        d.name.length >= 3 &&
        !d.name.toLowerCase().includes("test") &&
        !d.name.toLowerCase().includes("fdfd")
    )
    .slice(0, 3);

  const heroDogs = heroDogsPool.length > 0 ? heroDogsPool : dogs.slice(0, 1);

  const getImg = (d: (typeof dogs)[0]) =>
    d.primary_image ||
    d.images?.find((img) => img.is_primary)?.public_url ||
    d.images?.[0]?.public_url ||
    null;

  return (
    <div className="flex flex-col">
      {/* ══════════════════════════════════════════════════ */}
      {/*  HERO — Pawmise Rescue style: full-width warmth   */}
      {/* ══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-background pt-14 pb-0">
        {/* Decorative organic blob top-right */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-[-12%] h-[520px] w-[520px] rounded-full opacity-30"
          style={{
            background:
              "radial-gradient(circle, oklch(0.80 0.10 60) 0%, transparent 70%)",
          }}
        />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {/* Eyebrow tag */}
          <div className="flex justify-center mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/12 text-primary text-xs font-semibold tracking-wide border border-primary/20">
              <Sparkles className="h-3.5 w-3.5" />
              Ethical Adoption &amp; Responsible Rehoming
            </span>
          </div>

          {/* Main headline — centered, large */}
          <div className="text-center max-w-4xl mx-auto mb-10">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.06] mb-6">
              Looking for your new{" "}
              <span className="text-primary">best furry friend?</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8">
              Many loving friends are waiting for a new home in our shelter. We
              help you find the best fit for you and your family — with
              admin-verified profiles, household screening, and 12 months of
              post-adoption support.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/dogs"
                id="hero-browse-dogs"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-12 px-9 text-base font-semibold rounded-full shadow-md gap-2"
                )}
              >
                <Search className="h-4 w-4" />
                Find Your Dog
              </Link>
              <Link
                href="/rehome"
                id="hero-rehome-dog"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-12 px-9 text-base font-medium rounded-full border-2 border-foreground/20 hover:border-primary/50 hover:bg-primary/5 gap-2"
                )}
              >
                <PlusCircle className="h-4 w-4" />
                Rehome a Dog
              </Link>
            </div>
          </div>
        </div>

        {/* ── Full-width dog photo strip ── */}
        <div className="w-full mt-2 relative">
          {heroDogs.length > 0 ? (
            <div
              className={cn(
                "grid gap-3 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto",
                heroDogs.length === 1
                  ? "grid-cols-1"
                  : heroDogs.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-3"
              )}
            >
              {heroDogs.map((dog, i) => {
                const img = getImg(dog);
                return img ? (
                  <Link
                    key={dog.id}
                    href={`/dogs/${dog.id}`}
                    id={`hero-dog-${dog.id}`}
                    aria-label={`View ${dog.name}'s profile`}
                    className={cn(
                      "group relative overflow-hidden bg-muted border border-border/60 shadow-sm",
                      // Middle card taller on desktop
                      heroDogs.length === 3 && i === 1
                        ? "rounded-3xl aspect-[3/4]"
                        : "rounded-3xl aspect-[4/5]",
                      // Side cards slightly offset on desktop
                      heroDogs.length === 3 && i !== 1 && "mt-6"
                    )}
                  >
                    <Image
                      src={img}
                      alt={dog.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                      priority={i === 0}
                    />
                    {/* Dog name overlay at bottom */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pt-10 pb-4 px-5">
                      <p className="text-white font-bold text-lg leading-tight">
                        {dog.name}
                      </p>
                      <p className="text-white/75 text-xs mt-0.5">
                        {dog.breed} · {formatAge(dog.age_years, dog.age_months)}
                        {dog.location && ` · ${dog.location}`}
                      </p>
                    </div>
                    {/* Available badge */}
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/95 backdrop-blur-sm text-emerald-700 border border-emerald-400/30 shadow-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Available
                      </span>
                    </div>
                  </Link>
                ) : null;
              })}
            </div>
          ) : (
            /* No images: friendly illustration panel */
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="w-full rounded-3xl bg-muted/50 border border-border flex flex-col items-center justify-center py-24 gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-card border shadow-sm text-primary">
                  <DogIcon className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Dogs are waiting for you
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs text-center">
                  Browse our full catalog to meet the dogs available for
                  adoption.
                </p>
                <Link
                  href="/dogs"
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "rounded-full font-semibold mt-2"
                  )}
                >
                  Browse Dogs
                </Link>
              </div>
            </div>
          )}

          {/* Bottom fade into next section */}
          <div
            aria-hidden
            className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, transparent, var(--background))",
            }}
          />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════ */}
      {/*  STATS STRIP — Pawsy Pet Haven style             */}
      {/* ══════════════════════════════════════════════════ */}
      <section className="border-y bg-card py-8 sm:py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              {
                value: totalCount > 0 ? `${totalCount}+` : "Live",
                label: "Dogs in Care",
                color: "text-primary",
              },
              { value: "100%", label: "Pre-Screened Applicants", color: "text-primary" },
              { value: "Zero", label: "Commercial Sales", color: "text-foreground" },
              { value: "12 mo", label: "Post-Adoption Follow-Up", color: "text-primary" },
            ].map((stat) => (
              <div key={stat.label} className="space-y-1">
                <p
                  className={cn(
                    "text-3xl sm:text-4xl font-extrabold tracking-tight",
                    stat.color
                  )}
                >
                  {stat.value}
                </p>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════ */}
      {/*  FEATURED DOGS                                    */}
      {/* ══════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-primary block mb-2">
                Available Now
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Dogs ready for a loving home
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-lg leading-relaxed">
                Every listing includes detailed health records, temperament
                notes, and daily care routines.
              </p>
            </div>
            <Link
              href="/dogs"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors self-start sm:self-auto group shrink-0"
            >
              <span>View all dogs</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>

          {dogs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {dogs.map((dog, index) => (
                <DogCard key={dog.id} dog={dog} priority={index < 3} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center border border-border/80 rounded-3xl bg-card p-8 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted border text-muted-foreground">
                <DogIcon className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-foreground">
                  No dogs currently available
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  All dogs listed have found homes or are under review. Check
                  back soon or consider rehoming a pet in need.
                </p>
              </div>
              <Link
                href="/rehome"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "font-semibold rounded-full mt-2"
                )}
              >
                Rehome a Dog
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════ */}
      {/*  HOW IT WORKS — 3 steps                          */}
      {/* ══════════════════════════════════════════════════ */}
      <section
        id="how-it-works"
        className="border-t bg-card py-20 sm:py-24"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="max-w-2xl mb-14">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary block mb-2">
              The Adoption Journey
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              How adoption works at PawConnect
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 leading-relaxed">
              We make the adoption process clear, compassionate, and transparent
              from discovery to handoff.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: <Search className="h-5 w-5" />,
                title: "Browse & Learn",
                desc: "Explore verified dog profiles with honest descriptions of temperament, size, vaccination history, and living preferences.",
              },
              {
                step: "02",
                icon: <FileCheck2 className="h-5 w-5" />,
                title: "Apply & Pre-Screen",
                desc: "Complete a structured household questionnaire evaluating housing permissions, daily schedule, and prior pet care experience.",
              },
              {
                step: "03",
                icon: <Heart className="h-5 w-5" />,
                title: "Transition & Monitor",
                desc: "Once approved, coordinate a calm handoff with the current owner and submit monthly welfare updates for 12 months.",
              },
            ].map((card) => (
              <div
                key={card.step}
                className="rounded-2xl border border-border/70 bg-background p-7 space-y-4 hover:border-primary/30 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-extrabold text-primary/30 leading-none">
                    {card.step}
                  </span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    {card.icon}
                  </div>
                </div>
                <h3 className="text-base font-bold text-foreground">
                  {card.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════ */}
      {/*  RESPONSIBLE REHOMING                             */}
      {/* ══════════════════════════════════════════════════ */}
      <section className="border-t py-20 sm:py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-5 max-w-xl space-y-5">
              <Badge
                variant="outline"
                className="text-[10px] font-semibold uppercase tracking-wider text-primary border-primary/25 bg-primary/8"
              >
                Responsible Rehoming
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                When circumstances change, we are here.
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Rehoming a pet is a difficult, emotional decision. PawConnect
                provides a respectful, cage-free alternative to municipal
                shelters, keeping dogs in home environments while helping you
                choose the right future family.
              </p>
              <Link
                href="/rehome"
                className={cn(
                  buttonVariants(),
                  "h-11 px-8 font-semibold rounded-full shadow-sm"
                )}
              >
                Rehome a Dog Safely
              </Link>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                {
                  n: "1",
                  title: "Create Dog Profile",
                  desc: "Provide honest health history, favorite habits, photos, and living requirements for admin review.",
                },
                {
                  n: "2",
                  title: "Select Match",
                  desc: "Review approved applicants and select the family that feels right for your dog's personality and lifelong welfare.",
                },
                {
                  n: "3",
                  title: "Safe Transition",
                  desc: "Transfer care directly to the adoptive family with platform check-ins supporting both sides during adjustment.",
                },
              ].map((item) => (
                <div
                  key={item.n}
                  className="p-6 rounded-2xl border border-border/70 bg-card space-y-3 hover:border-primary/25 hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-extrabold text-sm">
                    {item.n}
                  </div>
                  <h3 className="text-sm font-bold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════ */}
      {/*  TRUST & SAFETY                                   */}
      {/* ══════════════════════════════════════════════════ */}
      <section
        id="safety"
        className="border-t bg-card py-20 sm:py-24"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="max-w-xl mb-14 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary block">
              Trust &amp; Welfare Standards
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Built on verified procedures.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              PawConnect operates with deliberate human oversight to protect
              dogs and the families who welcome them.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <ShieldCheck className="h-5 w-5" />,
                title: "Admin-reviewed listings",
                desc: "Every dog profile is inspected for medical transparency and welfare before appearing in the public catalog.",
              },
              {
                icon: <Home className="h-5 w-5" />,
                title: "Household suitability check",
                desc: "Applicants describe their housing permissions, daily schedule, and care arrangements to ensure mutual fit.",
              },
              {
                icon: <CheckCircle2 className="h-5 w-5" />,
                title: "Controlled workflow",
                desc: "Applications progress through explicit stages—pending, under review, approved, and completed—preventing duplicate matches.",
              },
              {
                icon: <CalendarCheck className="h-5 w-5" />,
                title: "12-month post-adoption care",
                desc: "Structured monthly check-ins with photo and video verification keep our community accountable for lifelong pet welfare.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-border/70 bg-background p-6 space-y-3 hover:border-primary/25 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {card.icon}
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  {card.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════ */}
      {/*  FINAL CTA — warm, welcoming                      */}
      {/* ══════════════════════════════════════════════════ */}
      <section className="border-t py-20 sm:py-28 bg-background">
        {/* Warm background blob */}
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl text-center space-y-7">
          {/* Orange decorative blob */}
          <div
            aria-hidden
            className="absolute inset-0 -top-16 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 70% 55% at 50% 50%, oklch(0.88 0.08 65 / 0.45) 0%, transparent 70%)",
            }}
          />

          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/12 text-primary border border-primary/20">
            <Heart className="h-8 w-8" />
          </div>

          <h2 className="relative text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.08]">
            Welcome to PawConnect.
          </h2>

          <p className="relative text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto">
            Whether you are welcoming a lifelong companion or finding a safe new
            chapter for your pet — every step is guided with care, transparency,
            and heart.
          </p>

          <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/dogs"
              id="cta-browse-dogs"
              className={cn(
                buttonVariants({ size: "lg" }),
                "w-full sm:w-auto h-12 px-10 text-base font-semibold rounded-full shadow-md"
              )}
            >
              Browse Dogs
            </Link>
            <Link
              href="/rehome"
              id="cta-rehome-dog"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full sm:w-auto h-12 px-10 text-base font-medium rounded-full border-2 border-foreground/20 hover:border-primary/50 hover:bg-primary/5"
              )}
            >
              Rehome a Dog
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
