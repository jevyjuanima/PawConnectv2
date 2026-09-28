import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import {
  MapPin,
  ShieldCheck,
  Heart,
  Calendar,
  AlertCircle,
  FileCheck,
  ChevronRight,
  Info,
  CheckCircle2,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DogImageGallery } from "@/components/dogs/DogImageGallery";
import { getDogByIdAction } from "@/app/actions/dogs";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  formatAge,
  formatCapitalize,
  formatDate,
} from "@/lib/utils/format";
import { DogStatusBadge } from "@/components/shared/StatusBadges";
import { cn } from "@/lib/utils";

interface DogDetailPageProps {
  params: Promise<{
    id: string;
  }>;
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

  // Check if current user has an existing application for this dog
  let existingApplicationId: string | null = null;
  if (userId) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: existingApp } = await supabase
        .from("adoption_applications")
        .select("id, status")
        .eq("dog_id", dog.id)
        .eq("applicant_id", userId)
        .not("status", "eq", "cancelled")
        .maybeSingle();

      if (existingApp) {
        existingApplicationId = existingApp.id;
      }
    } catch {
      // Non-fatal check
    }
  }

  const isAvailable = dog.status === "available";

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/dogs" className="hover:text-foreground transition-colors">
          Browse Dogs
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-foreground truncate max-w-[200px]">
          {dog.name}
        </span>
      </nav>

      {/* Main Grid: Left Gallery & Story, Right Sidebar Action */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Gallery */}
          <DogImageGallery
            dogName={dog.name}
            images={dog.images}
            primaryImageUrl={dog.primary_image}
          />

          {/* Dog Details & Story */}
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <DogStatusBadge status={dog.status} />
                <Badge variant="outline" className="text-xs">
                  {formatCapitalize(dog.size)} Size
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {formatCapitalize(dog.gender)}
                </Badge>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {dog.name}
              </h1>
              <p className="text-base text-muted-foreground mt-1 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{dog.location}</span>
                <span className="text-border mx-1">•</span>
                <span>{dog.breed}</span>
              </p>
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-y">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Age
                </span>
                <p className="text-sm font-bold text-foreground">
                  {formatAge(dog.age_years, dog.age_months)}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Gender
                </span>
                <p className="text-sm font-bold text-foreground capitalize">
                  {dog.gender}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Size
                </span>
                <p className="text-sm font-bold text-foreground capitalize">
                  {dog.size}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Color
                </span>
                <p className="text-sm font-bold text-foreground">
                  {dog.color || "Not specified"}
                </p>
              </div>
            </div>

            {/* Description / Story */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                About {dog.name}
              </h2>
              <div className="prose dark:prose-invert max-w-none text-muted-foreground text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {dog.description}
              </div>
            </div>

            {/* Medical & Health Records */}
            <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-xs">
              <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Health &amp; Medical Transparency
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background shadow-2xs">
                    {dog.vaccinated ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Info className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Vaccinations</p>
                    <p className="text-xs text-muted-foreground">
                      {dog.vaccinated ? "Up to date" : "Pending or not recorded"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background shadow-2xs">
                    {dog.spayed_neutered ? (
                      <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Info className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Spayed / Neutered</p>
                    <p className="text-xs text-muted-foreground">
                      {dog.spayed_neutered ? "Completed" : "Not spayed/neutered"}
                    </p>
                  </div>
                </div>
              </div>

              {dog.medical_history && (
                <div className="space-y-1 pt-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Medical Background
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {dog.medical_history}
                  </p>
                </div>
              )}

              {dog.special_needs && (
                <Alert className="mt-2 border-amber-500/30 bg-amber-500/10 text-foreground">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertTitle className="text-xs font-bold">Special Needs or Behavioral Notes</AlertTitle>
                  <AlertDescription className="text-xs text-muted-foreground">
                    {dog.special_needs}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Action Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="sticky top-24 rounded-2xl border shadow-sm overflow-hidden">
            <CardContent className="p-6 space-y-6">
              <div className="border-b pb-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Adoption Status
                </span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-2xl font-bold tracking-tight text-foreground capitalize">
                    {dog.status}
                  </span>
                  <DogStatusBadge status={dog.status} />
                </div>
              </div>

              {/* Action Buttons based on status & role */}
              {isOwner ? (
                <div className="space-y-3">
                  <Alert className="bg-primary/5 border-primary/20">
                    <Info className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-xs font-bold">Your Listing</AlertTitle>
                    <AlertDescription className="text-xs text-muted-foreground">
                      You listed this dog. You can track status and applications from your dashboard.
                    </AlertDescription>
                  </Alert>
                  <Link
                    href="/my-dogs"
                    className={cn(buttonVariants({ variant: "outline" }), "w-full")}
                  >
                    View in My Dogs
                  </Link>
                </div>
              ) : existingApplicationId ? (
                <div className="space-y-3">
                  <Alert className="bg-emerald-500/10 border-emerald-500/30">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <AlertTitle className="text-xs font-bold">Application Submitted</AlertTitle>
                    <AlertDescription className="text-xs text-muted-foreground">
                      You have an active application submitted for {dog.name}.
                    </AlertDescription>
                  </Alert>
                  <Link
                    href="/my-applications"
                    className={cn(buttonVariants({ variant: "default" }), "w-full shadow-sm")}
                  >
                    Track My Application
                  </Link>
                </div>
              ) : isAvailable ? (
                <div className="space-y-4">
                  <Link
                    href={`/dogs/${dog.id}/apply`}
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "w-full h-12 font-bold text-base shadow-md gap-2"
                    )}
                  >
                    <Heart className="h-5 w-5 fill-primary-foreground/20" />
                    Apply to Adopt {dog.name}
                  </Link>

                  <div className="space-y-2 pt-2 text-xs text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <FileCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Standard questionnaire on home, yard, and pet experience.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Admin-verified process ensures ethical pet placement.</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle className="text-xs font-bold">Adoptions Unavailable</AlertTitle>
                    <AlertDescription className="text-xs text-muted-foreground">
                      {dog.status === "reserved"
                        ? "This dog has an approved adoption application in progress."
                        : "This listing is no longer open for new adoption applications."}
                    </AlertDescription>
                  </Alert>
                  <Link
                    href="/dogs"
                    className={cn(buttonVariants({ variant: "outline" }), "w-full")}
                  >
                    Browse Other Dogs
                  </Link>
                </div>
              )}

              {/* Listing Metadata */}
              <div className="border-t pt-4 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Listed On
                  </span>
                  <span className="font-medium text-foreground">
                    {formatDate(dog.created_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Listing ID</span>
                  <span className="font-mono text-[10px] truncate max-w-[120px]">
                    {dog.id}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
