import * as React from "react";
import Link from "next/link";
import {
  PawPrint,
  Heart,
  PlusCircle,
  ShieldCheck,
  Search,
  FileCheck,
  Home as HomeIcon,
  ArrowRight,
  Dog,
  Users,
  CheckCircle2,
  ClipboardList,
  Handshake,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DogCard } from "@/components/dogs/DogCard";
import { getAvailableDogsAction } from "@/app/actions/dogs";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "PawConnect — Ethical Pet Adoption & Responsible Rehoming",
  description:
    "PawConnect connects compassionate adopters with dogs that need loving forever homes. Every listing is admin-verified for animal safety and welfare.",
};

export default async function HomePage() {
  const result = await getAvailableDogsAction({ limit: 6 });
  const dogs = result.success && result.data ? result.data.dogs : [];

  return (
    <div className="flex flex-col">
      {/* ─────────────────────────────────────────── */}
      {/* 1. HERO SECTION                             */}
      {/* ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/[0.06] via-background to-background">
        {/* Decorative paw dot grid */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-paw-pattern opacity-60 pointer-events-none"
        />

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-28 text-center max-w-4xl">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3.5 py-1.5 text-xs font-semibold text-primary shadow-xs mb-6">
            <PawPrint className="h-3.5 w-3.5" />
            <span>Ethical Adoption · Responsible Rehoming</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] font-extrabold tracking-tight text-foreground leading-[1.12] mb-5">
            Every dog deserves a{" "}
            <span className="text-primary">loving forever home.</span>
          </h1>

          {/* Sub-copy */}
          <p className="mx-auto max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed mb-8">
            PawConnect bridges compassionate adopters with responsible pet
            parents. Every listing is personally reviewed by our team before it
            goes live.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Link
              href="/dogs"
              className={cn(
                buttonVariants({ size: "lg" }),
                "w-full sm:w-auto gap-2 px-7 h-12 text-base font-semibold shadow-sm"
              )}
            >
              <Search className="h-4 w-4" />
              Browse Available Dogs
            </Link>
            <Link
              href="/rehome"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full sm:w-auto gap-2 px-7 h-12 text-base font-semibold"
              )}
            >
              <PlusCircle className="h-4 w-4" />
              Rehome a Dog
            </Link>
          </div>

          {/* Trust Pills */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs text-muted-foreground">
            {[
              { icon: ShieldCheck, label: "100% Vetted Listings" },
              { icon: Users, label: "Thorough Adopter Screening" },
              { icon: Heart, label: "Zero Commercial Exploitation" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <Icon className="h-4 w-4 text-primary" />
                <span className="font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────── */}
      {/* 2. STATS BAR                                */}
      {/* ─────────────────────────────────────────── */}
      <section className="border-b bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-3 divide-x divide-border text-center">
            {[
              { value: "100%", label: "Admin-Verified Listings" },
              { value: "Free", label: "No Rehoming Fees" },
              { value: "Safe", label: "Screened Adopters Only" },
            ].map(({ value, label }) => (
              <div key={label} className="px-4 py-2 space-y-0.5">
                <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-primary">
                  {value}
                </p>
                <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">
                  {label}
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
                Ready for a Lifelong Family
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-md">
                Recently verified dogs waiting for a caring, permanent home.
              </p>
            </div>

            <Link
              href="/dogs"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "gap-1.5 self-start sm:self-auto group text-primary font-semibold"
              )}
            >
              View all dogs
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
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 p-14 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <Dog className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">
                No Available Dogs Right Now
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                All dogs listed have found homes or are under review. Check back
                soon — or help a dog in need.
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
      {/* 4. HOW PAWCONNECT WORKS                     */}
      {/* ─────────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="bg-muted/30 border-y py-16 md:py-20"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge
              variant="outline"
              className="mb-3 text-xs uppercase font-semibold tracking-wider"
            >
              Transparent Process
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              How PawConnect Works
            </h2>
            <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
              Whether you are welcoming a new companion or responsibly rehoming
              a dog you love, we guide every step.
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
                      title: "Find Your Match",
                      desc: "Filter by breed, size, age, and location to discover dogs that suit your home and lifestyle.",
                    },
                    {
                      icon: ClipboardList,
                      title: "Submit Questionnaire",
                      desc: "Complete a detailed form covering your home environment, household, and experience with dogs.",
                    },
                    {
                      icon: Handshake,
                      title: "Verified Handoff",
                      desc: "Admins review your application and facilitate a safe, confirmed pet transfer.",
                    },
                  ].map(({ icon: Icon, title, desc }, i) => (
                    <li key={title} className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Icon className="h-3.5 w-3.5 text-primary" />
                          <h4 className="text-sm font-semibold text-foreground">
                            {title}
                          </h4>
                        </div>
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
                    "w-full gap-2"
                  )}
                >
                  <Search className="h-4 w-4" />
                  Browse Available Dogs
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
                      title: "Create Dog Profile",
                      desc: "Share personality details, vaccination records, and clear photos so adopters understand your dog.",
                    },
                    {
                      icon: ShieldCheck,
                      title: "Administrative Review",
                      desc: "PawConnect staff inspect each submission for health transparency and animal welfare standards.",
                    },
                    {
                      icon: CheckCircle2,
                      title: "Select Verified Adopter",
                      desc: "Review vetted applications and choose the loving forever family that best fits your pet.",
                    },
                  ].map(({ icon: Icon, title, desc }, i) => (
                    <li key={title} className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Icon className="h-3.5 w-3.5 text-primary" />
                          <h4 className="text-sm font-semibold text-foreground">
                            {title}
                          </h4>
                        </div>
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
                    "w-full gap-2"
                  )}
                >
                  <PlusCircle className="h-4 w-4" />
                  Start Rehoming Form
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────── */}
      {/* 5. TRUST & SAFETY                           */}
      {/* ─────────────────────────────────────────── */}
      <section id="safety" className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge
              variant="outline"
              className="mb-3 text-xs uppercase font-semibold tracking-wider"
            >
              Our Standard
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Built on Safety &amp; Animal Welfare
            </h2>
            <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
              We hold ourselves to strict principles to protect every animal
              from exploitation, mistreatment, and fraud.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: FileCheck,
                title: "Strict Adopter Screening",
                desc: "Every applicant completes a thorough questionnaire covering housing, yard security, household members, and prior pet experience.",
              },
              {
                icon: ShieldCheck,
                title: "No Commercial Breeding",
                desc: "PawConnect explicitly prohibits puppy mills, commercial sales, and breeding advertisements. Our platform is rescue and ethical rehoming only.",
              },
              {
                icon: HomeIcon,
                title: "Transparent Handoff",
                desc: "We facilitate clear communication between current owners and prospective adopters for a safe, well-documented pet transition.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <Card
                key={title}
                className="rounded-2xl border p-6 space-y-3 shadow-xs hover:border-primary/30 hover:shadow-md transition-all"
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
      {/* 6. CALL TO ACTION BANNER                    */}
      {/* ─────────────────────────────────────────── */}
      <section className="pb-16 md:pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-primary text-primary-foreground px-8 py-12 sm:py-16 text-center shadow-lg">
            {/* Subtle inner pattern */}
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 40%)",
              }}
            />

            <div className="relative z-10 max-w-2xl mx-auto space-y-4">
              <PawPrint className="h-10 w-10 mx-auto opacity-80 mb-2" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                Ready to find your four-legged best friend?
              </h2>
              <p className="text-primary-foreground/85 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
                Join a community of compassionate pet lovers creating positive
                outcomes for rescue dogs every day.
              </p>

              <Separator className="bg-primary-foreground/20 my-6" />

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/dogs"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "secondary" }),
                    "w-full sm:w-auto h-12 px-7 font-semibold shadow-sm gap-2"
                  )}
                >
                  <Search className="h-4 w-4" />
                  Browse Dogs Now
                </Link>
                <Link
                  href="/sign-up"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "w-full sm:w-auto h-12 px-7 font-semibold gap-2 bg-transparent text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10"
                  )}
                >
                  <Users className="h-4 w-4" />
                  Create a Free Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
