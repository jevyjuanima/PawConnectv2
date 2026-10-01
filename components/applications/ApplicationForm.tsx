"use client";

import * as React from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Loader2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Edit2,
  Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  adoptionApplicationSchema,
  HOUSING_TYPES,
  EXPERIENCE_LEVELS,
  type AdoptionApplicationInput,
} from "@/lib/validations/application";
import { createApplicationAction } from "@/app/actions/applications";
import type { DogWithImages } from "@/types";
import type { UserProfile } from "@/lib/clerk/auth";
import { cn } from "@/lib/utils";

interface ApplicationFormProps {
  dog: DogWithImages;
  applicant?: UserProfile | null;
}

type FormStep = "about" | "home" | "experience" | "plans" | "review" | "submitted";

const STEPS: { id: FormStep; label: string; number: number }[] = [
  { id: "about", label: "About you", number: 1 },
  { id: "home", label: "Your home", number: 2 },
  { id: "experience", label: "Experience & care", number: 3 },
  { id: "plans", label: "Your plans", number: 4 },
  { id: "review", label: "Review", number: 5 },
];

const HOUSING_OPTIONS = [
  { value: HOUSING_TYPES.OWN_HOUSE, label: "Own House", desc: "Single family home with yard access" },
  { value: HOUSING_TYPES.RENT_HOUSE, label: "Rent House", desc: "Rented house or townhouse" },
  { value: HOUSING_TYPES.APARTMENT, label: "Apartment", desc: "Multi-unit apartment building" },
  { value: HOUSING_TYPES.CONDO, label: "Condo", desc: "Condominium community" },
  { value: HOUSING_TYPES.OTHER, label: "Other", desc: "Farm, rural, or other dwelling" },
] as const;

const EXPERIENCE_OPTIONS = [
  {
    value: EXPERIENCE_LEVELS.FIRST_TIME,
    label: "First-Time Dog Parent",
    desc: "First dog as an independent adult",
  },
  {
    value: EXPERIENCE_LEVELS.EXPERIENCED,
    label: "Experienced Pet Owner",
    desc: "Have raised, trained, or lived with dogs before",
  },
  {
    value: EXPERIENCE_LEVELS.EXPERT,
    label: "Expert or Trainer",
    desc: "Extensive background with working or rescue dogs",
  },
] as const;

export function ApplicationForm({ dog, applicant }: ApplicationFormProps) {
  const [currentStep, setCurrentStep] = React.useState<FormStep>("about");
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<{ title: string; description: string } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    trigger,
    formState: { errors },
  } = useForm<AdoptionApplicationInput>({
    resolver: zodResolver(adoptionApplicationSchema),
    mode: "onTouched",
    defaultValues: {
      dog_id: dog.id,
      housing_type: HOUSING_TYPES.OWN_HOUSE,
      has_yard: false,
      has_other_pets: false,
      other_pets_details: "",
      household_members_count: 1,
      experience_level: EXPERIENCE_LEVELS.EXPERIENCED,
      reason_for_adopting: "",
    },
  });

  const formValues = watch();
  const watchHasOtherPets = watch("has_other_pets");
  const reasonText = watch("reason_for_adopting") || "";

  // Step transitions with field validation
  const goToNextStep = async () => {
    setFormError(null);

    if (currentStep === "about") {
      const isValid = await trigger(["household_members_count"]);
      if (isValid) setCurrentStep("home");
    } else if (currentStep === "home") {
      const isValid = await trigger(["housing_type", "has_yard"]);
      if (isValid) setCurrentStep("experience");
    } else if (currentStep === "experience") {
      const isValid = await trigger(["experience_level", "has_other_pets", "other_pets_details"]);
      if (isValid) setCurrentStep("plans");
    } else if (currentStep === "plans") {
      const isValid = await trigger(["reason_for_adopting"]);
      if (isValid) setCurrentStep("review");
    }
  };

  const goToPreviousStep = () => {
    setFormError(null);
    if (currentStep === "home") setCurrentStep("about");
    else if (currentStep === "experience") setCurrentStep("home");
    else if (currentStep === "plans") setCurrentStep("experience");
    else if (currentStep === "review") setCurrentStep("plans");
  };

  const onSubmit = async (values: AdoptionApplicationInput) => {
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await createApplicationAction(values);

      if (!res.success) {
        setFormError({
          title: "We couldn't submit your application.",
          description: res.error || "Please try again. Your answers have been kept so you don't have to start over.",
        });
        toast.error("We couldn't submit your application. Please check your information and try again.");
        setSubmitting(false);
        return;
      }

      toast.success(`Application submitted for ${dog.name}.`);
      setCurrentStep("submitted");
    } catch {
      setFormError({
        title: "We couldn't submit your application.",
        description: "An unexpected network error occurred. Please try again. Your answers have been preserved.",
      });
      toast.error("Network error while submitting. Please try again.");
      setSubmitting(false);
    }
  };

  // 1. SUCCESS / SUBMITTED STATE
  if (currentStep === "submitted") {
    return (
      <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-10 space-y-6 animate-in fade-in-50 duration-300">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
          <Check className="h-6 w-6 stroke-[2.5]" />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
            Adoption Questionnaire Received
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl font-normal text-foreground">
            Application submitted.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Your application for {dog.name} has been submitted successfully. You can follow its review progress from My Applications.
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-xs sm:text-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Dog Applied For</span>
            <span className="font-medium text-foreground">{dog.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Initial Status</span>
            <span className="font-medium text-emerald-700 dark:text-emerald-300">
              Pending Review
            </span>
          </div>
        </div>

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
            Browse More Dogs
          </Link>
        </div>
      </div>
    );
  }

  const currentStepNumber = STEPS.find((s) => s.id === currentStep)?.number || 1;

  // Helper text lookups for review
  const housingLabel = HOUSING_OPTIONS.find((h) => h.value === formValues.housing_type)?.label || formValues.housing_type;
  const experienceLabel = EXPERIENCE_OPTIONS.find((e) => e.value === formValues.experience_level)?.label || formValues.experience_level;

  return (
    <div className="space-y-8">
      {/* Subtle Progress Indicator */}
      <div className="space-y-2">
        {/* Desktop Progress Sequence */}
        <div className="hidden sm:grid grid-cols-5 gap-2 text-xs border-b border-border/70 pb-3" role="tablist">
          {STEPS.map((s) => {
            const isCurrent = s.id === currentStep;
            const isCompleted = s.number < currentStepNumber;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={isCurrent}
                disabled={s.number > currentStepNumber}
                onClick={() => {
                  if (s.number < currentStepNumber) setCurrentStep(s.id);
                }}
                className={cn(
                  "text-left transition-colors font-medium flex items-center gap-1.5",
                  isCurrent
                    ? "text-primary font-semibold"
                    : isCompleted
                    ? "text-foreground hover:text-primary cursor-pointer"
                    : "text-muted-foreground/60 cursor-not-allowed"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[11px]",
                    isCurrent
                      ? "bg-primary text-primary-foreground font-bold"
                      : isCompleted
                      ? "bg-muted text-foreground"
                      : "bg-muted/40 text-muted-foreground/60"
                  )}
                >
                  {isCompleted ? <Check className="h-3 w-3" /> : s.number}
                </span>
                <span className="truncate">{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile Progress Bar */}
        <div className="sm:hidden flex items-center justify-between text-xs text-muted-foreground pb-1">
          <span className="font-medium text-foreground">
            Step {currentStepNumber} of 5: {STEPS[currentStepNumber - 1]?.label}
          </span>
          <span>{Math.round((currentStepNumber / 5) * 100)}%</span>
        </div>
        <div className="sm:hidden h-1 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(currentStepNumber / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Global Submission Error Alert */}
      {formError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-xs font-bold">{formError.title}</AlertTitle>
          <AlertDescription className="text-xs leading-relaxed">
            {formError.description}
          </AlertDescription>
        </Alert>
      )}

      {/* FORM BODY */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* STEP 1: ABOUT YOU */}
        {currentStep === "about" && (
          <section className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="space-y-1">
              <h2 className="font-serif text-2xl font-normal text-foreground">
                About you
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Please verify your household details so we can understand your living arrangements.
              </p>
            </div>

            {/* Applicant Profile Summary */}
            <div className="rounded-xl border border-border/80 bg-muted/20 p-4 text-xs sm:text-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Applicant</span>
                <span className="font-medium text-foreground">
                  {applicant?.first_name || applicant?.last_name
                    ? `${applicant.first_name || ""} ${applicant.last_name || ""}`.trim()
                    : "Signed-in Member"}
                </span>
              </div>
              {applicant?.email && (
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Email address</span>
                  <span className="font-mono text-xs text-foreground truncate max-w-[200px]">
                    {applicant.email}
                  </span>
                </div>
              )}
            </div>

            {/* Household Members Field */}
            <div className="space-y-2">
              <Label htmlFor="household_members_count" className="text-sm font-medium text-foreground">
                How many people live in your home? <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Include yourself and all adults and children residing in your household.
              </p>
              <Input
                id="household_members_count"
                type="number"
                min={1}
                max={20}
                className="max-w-[140px] text-sm"
                {...register("household_members_count", { valueAsNumber: true })}
                aria-invalid={Boolean(errors.household_members_count)}
              />
              {errors.household_members_count && (
                <p className="text-xs text-destructive">
                  {errors.household_members_count.message || "Please provide the number of household members."}
                </p>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                type="button"
                size="lg"
                onClick={goToNextStep}
                className="gap-2 font-medium w-full sm:w-auto"
              >
                <span>Continue to your home</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
        )}

        {/* STEP 2: YOUR HOME */}
        {currentStep === "home" && (
          <section className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="space-y-1">
              <h2 className="font-serif text-2xl font-normal text-foreground">
                Your home
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                We ask this because different dogs have specific space, exercise, and housing requirements.
              </p>
            </div>

            {/* Residence Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">
                Where do you live? <span className="text-destructive">*</span>
              </Label>
              <Controller
                control={control}
                name="housing_type"
                render={({ field }) => (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {HOUSING_OPTIONS.map((opt) => {
                      const isSelected = field.value === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => field.onChange(opt.value)}
                          className={cn(
                            "p-3.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between",
                            isSelected
                              ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/30"
                              : "border-border/80 bg-card hover:bg-muted/30 text-foreground"
                          )}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="text-sm font-semibold">{opt.label}</span>
                            {isSelected && <Check className="h-4 w-4 text-primary" />}
                          </div>
                          <span className="text-xs text-muted-foreground">{opt.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              />
              {errors.housing_type && (
                <p className="text-xs text-destructive">
                  {errors.housing_type.message || "Please select an option."}
                </p>
              )}
            </div>

            {/* Enclosed Yard Checkbox */}
            <Controller
              control={control}
              name="has_yard"
              render={({ field }) => (
                <div
                  onClick={() => field.onChange(!field.value)}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-xl border cursor-pointer select-none transition-all",
                    field.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border/80 bg-card hover:bg-muted/20"
                  )}
                >
                  <Checkbox
                    id="has_yard"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <Label htmlFor="has_yard" className="text-sm font-medium cursor-pointer">
                      I have an enclosed or secure yard
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      A safely fenced perimeter or secure private outdoor area suitable for off-leash time.
                    </p>
                  </div>
                </div>
              )}
            />

            <div className="pt-4 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={goToPreviousStep}
                className="gap-2 font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <Button
                type="button"
                size="lg"
                onClick={goToNextStep}
                className="gap-2 font-medium"
              >
                <span>Continue to experience</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
        )}

        {/* STEP 3: EXPERIENCE & CARE */}
        {currentStep === "experience" && (
          <section className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="space-y-1">
              <h2 className="font-serif text-2xl font-normal text-foreground">
                Experience &amp; care
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Help us understand your familiarity with dogs and other animals currently in your household.
              </p>
            </div>

            {/* Pet Ownership Experience */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">
                Your experience with dogs <span className="text-destructive">*</span>
              </Label>
              <Controller
                control={control}
                name="experience_level"
                render={({ field }) => (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {EXPERIENCE_OPTIONS.map((opt) => {
                      const isSelected = field.value === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => field.onChange(opt.value)}
                          className={cn(
                            "p-3.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between",
                            isSelected
                              ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/30"
                              : "border-border/80 bg-card hover:bg-muted/30 text-foreground"
                          )}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="text-sm font-semibold">{opt.label}</span>
                            {isSelected && <Check className="h-4 w-4 text-primary" />}
                          </div>
                          <span className="text-xs text-muted-foreground">{opt.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              />
              {errors.experience_level && (
                <p className="text-xs text-destructive">
                  {errors.experience_level.message || "Please select your experience level."}
                </p>
              )}
            </div>

            {/* Other Pets Checkbox */}
            <Controller
              control={control}
              name="has_other_pets"
              render={({ field }) => (
                <div
                  onClick={() => field.onChange(!field.value)}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-xl border cursor-pointer select-none transition-all",
                    field.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border/80 bg-card hover:bg-muted/20"
                  )}
                >
                  <Checkbox
                    id="has_other_pets"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <Label htmlFor="has_other_pets" className="text-sm font-medium cursor-pointer">
                      Do you currently have other pets living in the home?
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Cats, dogs, or other animals who would share space with {dog.name}.
                    </p>
                  </div>
                </div>
              )}
            />

            {/* Other Pets Details (Conditionally Displayed) */}
            {watchHasOtherPets && (
              <div className="space-y-2 animate-in fade-in-50 duration-200">
                <Label htmlFor="other_pets_details" className="text-sm font-medium text-foreground">
                  Details of other pets
                </Label>
                <p className="text-xs text-muted-foreground">
                  Please mention species, breed, age, and typical temperament around other dogs.
                </p>
                <Textarea
                  id="other_pets_details"
                  placeholder="e.g. 1 female domestic shorthair cat (5 yrs, calm indoors), 1 friendly male Golden Retriever (3 yrs, neutered)..."
                  rows={3}
                  className="text-sm leading-relaxed"
                  {...register("other_pets_details")}
                />
              </div>
            )}

            <div className="pt-4 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={goToPreviousStep}
                className="gap-2 font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <Button
                type="button"
                size="lg"
                onClick={goToNextStep}
                className="gap-2 font-medium"
              >
                <span>Continue to your plans</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
        )}

        {/* STEP 4: YOUR PLANS FOR THIS DOG */}
        {currentStep === "plans" && (
          <section className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="space-y-1">
              <h2 className="font-serif text-2xl font-normal text-foreground">
                Your plans for {dog.name}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Share what life would look like for {dog.name} in your home.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="reason_for_adopting" className="text-sm font-medium text-foreground">
                  Why would you like to adopt {dog.name}? <span className="text-destructive">*</span>
                </Label>
                <span className={cn(
                  "text-[11px]",
                  reasonText.length >= 30 ? "text-emerald-700 dark:text-emerald-400 font-medium" : "text-muted-foreground"
                )}>
                  {reasonText.length} / 30 min characters
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Tell us what drew you to {dog.name}, your typical daily schedule, exercise routines, and the life you hope to provide.
              </p>
              <Textarea
                id="reason_for_adopting"
                placeholder={`Tell us what drew you to ${dog.name} and what kind of home, routine, and care you're hoping to provide...`}
                rows={6}
                className="text-sm leading-relaxed"
                {...register("reason_for_adopting")}
                aria-invalid={Boolean(errors.reason_for_adopting)}
              />
              {errors.reason_for_adopting && (
                <p className="text-xs text-destructive">
                  {errors.reason_for_adopting.message || "Please provide at least 30 characters explaining your plans."}
                </p>
              )}
            </div>

            <div className="pt-4 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={goToPreviousStep}
                className="gap-2 font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <Button
                type="button"
                size="lg"
                onClick={goToNextStep}
                className="gap-2 font-medium"
              >
                <span>Review application</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
        )}

        {/* STEP 5: REVIEW BEFORE SUBMIT */}
        {currentStep === "review" && (
          <section className="space-y-8 animate-in fade-in-50 duration-200">
            <div className="space-y-1">
              <h2 className="font-serif text-2xl font-normal text-foreground">
                Review your application
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Please confirm your answers before final submission. You can edit any section if needed.
              </p>
            </div>

            {/* Review Sections */}
            <div className="divide-y divide-border/70 border-y border-border/70">
              {/* Section 1: About You */}
              <div className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    About you
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCurrentStep("about")}
                    className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Edit</span>
                  </button>
                </div>
                <div className="text-sm space-y-1">
                  <p className="text-foreground">
                    <span className="text-muted-foreground">Applicant: </span>
                    {applicant?.first_name || applicant?.last_name
                      ? `${applicant.first_name || ""} ${applicant.last_name || ""}`.trim()
                      : "Signed-in Member"}
                    {applicant?.email && ` (${applicant.email})`}
                  </p>
                  <p className="text-foreground">
                    <span className="text-muted-foreground">Household members: </span>
                    {formValues.household_members_count}{" "}
                    {formValues.household_members_count === 1 ? "person" : "people"}
                  </p>
                </div>
              </div>

              {/* Section 2: Your Home */}
              <div className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Your home
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCurrentStep("home")}
                    className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Edit</span>
                  </button>
                </div>
                <div className="text-sm space-y-1">
                  <p className="text-foreground">
                    <span className="text-muted-foreground">Residence: </span>
                    {housingLabel}
                  </p>
                  <p className="text-foreground">
                    <span className="text-muted-foreground">Enclosed yard: </span>
                    {formValues.has_yard ? "Yes, secure enclosed yard" : "No enclosed yard"}
                  </p>
                </div>
              </div>

              {/* Section 3: Experience & Care */}
              <div className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Experience &amp; care
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCurrentStep("experience")}
                    className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Edit</span>
                  </button>
                </div>
                <div className="text-sm space-y-1">
                  <p className="text-foreground">
                    <span className="text-muted-foreground">Experience level: </span>
                    {experienceLabel}
                  </p>
                  <p className="text-foreground">
                    <span className="text-muted-foreground">Other pets in home: </span>
                    {formValues.has_other_pets
                      ? formValues.other_pets_details || "Yes"
                      : "None"}
                  </p>
                </div>
              </div>

              {/* Section 4: Your Plans */}
              <div className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Your plans for {dog.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCurrentStep("plans")}
                    className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Edit</span>
                  </button>
                </div>
                <div className="text-sm text-foreground whitespace-pre-line leading-relaxed bg-muted/20 p-3.5 rounded-xl">
                  {formValues.reason_for_adopting}
                </div>
              </div>
            </div>

            {/* Submission Commitment Note */}
            <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-1.5 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">
                Ready to submit?
              </p>
              <p className="leading-relaxed">
                Your application will be submitted for review by PawConnect administrators and {dog.name}&apos;s caretaker.
              </p>
            </div>

            {/* Final Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setCurrentStep("plans")}
                disabled={submitting}
                className="gap-2 font-medium w-full sm:w-auto order-2 sm:order-1"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to editing</span>
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="gap-2 font-semibold w-full sm:w-auto order-1 sm:order-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Submit Application</span>
                  </>
                )}
              </Button>
            </div>
          </section>
        )}
      </form>
    </div>
  );
}
