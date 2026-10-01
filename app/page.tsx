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
  Sparkles,
  ArrowRight,
  Dog,
  Users,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DogCard } from "@/components/dogs/DogCard";
import { getAvailableDogsAction } from "@/app/actions/dogs";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const result = await getAvailableDogsAction({ limit: 6 });
  const dogs = result.success && result.data ? result.data.dogs : [];

  return (
    <div className="flex flex-col gap-16 md:gap-24 pb-16">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-16 md:py-24 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3.5 py-1 text-xs font-semibold text-primary shadow-xs backdrop-blur-xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Ethical Pet Adoption &amp; Responsible Rehoming</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            Every dog deserves a <br />
            <span className="text-primary">loving forever home.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            PawConnect connects compassionate adopters with pet parents needing to responsibly rehome their dogs. Every listing is reviewed by administrators for veterinary health, transparent history, and animal safety.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/dogs"
              className={cn(
                buttonVariants({ size: "lg" }),
                "w-full sm:w-auto gap-2 px-6 h-12 text-base font-semibold shadow-sm"
              )}
            >
              <Search className="h-4 w-4" />
              Browse Available Dogs
            </Link>
            <Link
              href="/rehome"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full sm:w-auto gap-2 px-6 h-12 text-base font-semibold"
              )}
            >
              <PlusCircle className="h-4 w-4" />
              Rehome a Dog
            </Link>
          </div>

          {/* Trust Highlights */}
          <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border/60 max-w-3xl mx-auto text-left">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-card/50 border sm:border-transparent">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">100% Vetted Listings</p>
                <p className="text-[11px] text-muted-foreground">Admin-approved before publishing</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2 rounded-xl bg-card/50 border sm:border-transparent">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Direct Screening</p>
                <p className="text-[11px] text-muted-foreground">In-depth adopter questionnaires</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2 rounded-xl bg-card/50 border sm:border-transparent">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <PawPrint className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Zero Exploitation</p>
                <p className="text-[11px] text-muted-foreground">Rescue-first, strict no-breeding</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED DOGS SECTION */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <Badge variant="secondary" className="mb-2 font-medium">
              Featured Dogs
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Ready for a Lifelong Family
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Browse dogs recently verified and available for adoption.
            </p>
          </div>

          <Link
            href="/dogs"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "gap-1.5 self-start sm:self-auto group text-primary font-medium"
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
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
              <Dog className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No Available Dogs Right Now</h3>
            <p className="text-sm text-muted-foreground max-w-md mt-1 mb-6">
              All dogs currently listed have found homes or are under review. Check back soon or list a dog that needs a loving family.
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
      </section>

      {/* HOW PAWCONNECT WORKS */}
      <section id="how-it-works" className="bg-muted/30 py-16 border-y">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <Badge variant="outline" className="text-xs uppercase font-semibold tracking-wider">
              Transparent Process
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              How PawConnect Works
            </h2>
            <p className="text-muted-foreground text-sm">
              Whether you are welcoming a new companion or making the difficult choice to rehome, we are with you every step of the journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* For Adopters */}
            <Card className="rounded-2xl border shadow-xs">
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-3 border-b pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-xs">
                    <Heart className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Adopting a Dog</h3>
                    <p className="text-xs text-muted-foreground">Find and welcome your next companion</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted font-bold text-xs text-foreground">
                      1
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">1. Find Your Match</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Filter by breed, size, medical status, and location to find the right companion for your home.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted font-bold text-xs text-foreground">
                      2
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">2. Submit Questionnaire</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Complete a thorough questionnaire detailing your home environment, yard security, and experience.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted font-bold text-xs text-foreground">
                      3
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">3. Verified Handoff</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Admins review your application, approve the match, and facilitate a safe, verified pet handoff.
                      </p>
                    </div>
                  </div>
                </div>

                <Link
                  href="/dogs"
                  className={cn(buttonVariants({ variant: "outline" }), "w-full")}
                >
                  Browse Available Dogs
                </Link>
              </CardContent>
            </Card>

            {/* For Rehomers */}
            <Card className="rounded-2xl border shadow-xs">
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-3 border-b pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-xs">
                    <PlusCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Rehoming Responsibly</h3>
                    <p className="text-xs text-muted-foreground">Give your pet the safest possible transition</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted font-bold text-xs text-foreground">
                      1
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">1. Create Dog Profile</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Share personality details, veterinary records, vaccination status, and clear photos.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted font-bold text-xs text-foreground">
                      2
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">2. Administrative Review</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        PawConnect staff inspect each listing to ensure health transparency and welfare standards.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted font-bold text-xs text-foreground">
                      3
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">3. Select Verified Adopter</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Review vetted applications and choose the loving forever family that best suits your pet.
                      </p>
                    </div>
                  </div>
                </div>

                <Link
                  href="/rehome"
                  className={cn(buttonVariants({ variant: "outline" }), "w-full")}
                >
                  Start Rehoming Form
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* TRUST & SAFETY SECTION */}
      <section id="safety" className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <Badge variant="outline" className="text-xs uppercase font-semibold tracking-wider">
            Our Standard
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Built on Safety &amp; Animal Welfare
          </h2>
          <p className="text-muted-foreground text-sm">
            We hold ourselves to strict standards to protect animals from mistreatment, commercial exploitation, and fraud.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-2xl border p-6 space-y-3 shadow-xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Strict Screening</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every adoption applicant completes a detailed questionnaire covering housing, yard security, household members, and pet experience.
            </p>
          </Card>

          <Card className="rounded-2xl border p-6 space-y-3 shadow-xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No Commercial Breeding</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              PawConnect explicitly prohibits puppy mills, commercial sales, and breeding advertisements. Our focus is strictly rescue and ethical rehoming.
            </p>
          </Card>

          <Card className="rounded-2xl border p-6 space-y-3 shadow-xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HomeIcon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Direct Lifelong Handoff</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We facilitate transparent communication between current pet parents and prospective adopters for seamless pet transitions.
            </p>
          </Card>
        </div>
      </section>

      {/* CALL TO ACTION BANNER */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-8 sm:p-12 md:p-14 text-center shadow-lg">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to find your four-legged best friend?
            </h2>
            <p className="text-primary-foreground/90 text-sm sm:text-base leading-relaxed">
              Join thousands of pet lovers creating positive outcomes for rescue dogs every day.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                href="/dogs"
                className={cn(
                  buttonVariants({ size: "lg", variant: "secondary" }),
                  "w-full sm:w-auto h-12 px-6 font-semibold shadow-sm"
                )}
              >
                Browse Dogs Now
              </Link>
              <Link
                href="/rehome"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "w-full sm:w-auto h-12 px-6 font-semibold bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground border-primary-foreground/20"
                )}
              >
                Rehome a Dog
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
