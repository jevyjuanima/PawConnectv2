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
  ShieldCheck,
  Home,
  Users,
  Heart,
  Stethoscope,
  Info,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  adoptionWithScreeningSchema,
  HOUSING_TYPES,
  EXPERIENCE_LEVELS,
  type AdoptionWithScreeningInput,
  type AdoptionApplicationInput,
} from "@/lib/validations/application";
import type { HouseholdScreeningInput } from "@/lib/validations/screening";
import { createApplicationAction } from "@/app/actions/applications";
import type { DogWithImages } from "@/types";
import type { UserProfile } from "@/lib/clerk/auth";
import { cn } from "@/lib/utils";

interface ApplicationFormProps {
  dog: DogWithImages;
  applicant?: UserProfile | null;
}

type FormStep = "about" | "home" | "experience" | "plans" | "review" | "submitted";

const STEPS: { id: FormStep; label: string; number: number; icon: React.ElementType }[] = [
  { id: "about", label: "Household & family", number: 1, icon: Users },
  { id: "home", label: "Housing suitability", number: 2, icon: Home },
  { id: "experience", label: "Pet experience", number: 3, icon: Heart },
  { id: "plans", label: "Daily care & vet plan", number: 4, icon: Stethoscope },
  { id: "review", label: "Review & submit", number: 5, icon: ShieldCheck },
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
  } = useForm<AdoptionWithScreeningInput>({
    resolver: zodResolver(adoptionWithScreeningSchema),
    mode: "onTouched",
    defaultValues: {
      dog_id: dog.id,
      household_members_count: 1,
      household_members_details: "",
      has_children: false,
      children_details: "",
      household_agreement: false,
      housing_type: HOUSING_TYPES.OWN_HOUSE,
      has_yard: false,
      landlord_permission: null,
      experience_level: EXPERIENCE_LEVELS.EXPERIENCED,
      pet_care_experience: "",
      has_other_pets: false,
      other_pets_details: "",
      daily_alone_hours: 4,
      daily_care_arrangements: "",
      emergency_vet_care_plan: "",
      reason_for_adopting: "",
      screening_consent: false,
    },
  });

  const formValues = watch();
  const watchHasOtherPets = watch("has_other_pets");
  const watchHasChildren = watch("has_children");
  const watchHousingType = watch("housing_type");
  const isRenting =
    watchHousingType === HOUSING_TYPES.RENT_HOUSE ||
    watchHousingType === HOUSING_TYPES.APARTMENT ||
    watchHousingType === HOUSING_TYPES.CONDO;
  const reasonText = watch("reason_for_adopting") || "";

  // Step transitions with comprehensive field validation
  const goToNextStep = async () => {
    setFormError(null);

    if (currentStep === "about") {
      const fieldsToValidate: (keyof AdoptionWithScreeningInput)[] = [
        "household_members_count",
        "household_members_details",
        "has_children",
        "household_agreement",
      ];
      if (watchHasChildren) {
        fieldsToValidate.push("children_details");
      }
      const isValid = await trigger(fieldsToValidate);
      if (isValid) setCurrentStep("home");
    } else if (currentStep === "home") {
      const fieldsToValidate: (keyof AdoptionWithScreeningInput)[] = ["housing_type", "has_yard"];
      const isValid = await trigger(fieldsToValidate);
      if (isValid) setCurrentStep("experience");
    } else if (currentStep === "experience") {
      const fieldsToValidate: (keyof AdoptionWithScreeningInput)[] = [
        "experience_level",
        "pet_care_experience",
        "has_other_pets",
      ];
      if (watchHasOtherPets) {
        fieldsToValidate.push("other_pets_details");
      }
      const isValid = await trigger(fieldsToValidate);
      if (isValid) setCurrentStep("plans");
    } else if (currentStep === "plans") {
      const isValid = await trigger([
        "daily_alone_hours",
        "daily_care_arrangements",
        "emergency_vet_care_plan",
        "reason_for_adopting",
        "screening_consent",
      ]);
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

  const onSubmit = async (values: AdoptionWithScreeningInput) => {
    setFormError(null);
    setSubmitting(true);

    const applicationInput: AdoptionApplicationInput = {
      dog_id: values.dog_id,
      housing_type: values.housing_type,
      has_yard: values.has_yard,
      has_other_pets: values.has_other_pets,
      other_pets_details: values.has_other_pets ? values.other_pets_details : undefined,
      household_members_count: values.household_members_count,
      experience_level: values.experience_level,
      reason_for_adopting: values.reason_for_adopting,
    };

    const screeningInput: HouseholdScreeningInput = {
      household_agreement: values.household_agreement,
      housing_type: values.housing_type,
      landlord_permission: isRenting ? values.landlord_permission : null,
      has_children: values.has_children,
      children_details: values.has_children ? values.children_details : null,
      household_members_details: values.household_members_details,
      existing_pets_details: values.has_other_pets ? values.other_pets_details : null,
      pet_care_experience: values.pet_care_experience,
      daily_alone_hours: values.daily_alone_hours,
      daily_care_arrangements: values.daily_care_arrangements,
      emergency_vet_care_plan: values.emergency_vet_care_plan,
      screening_consent: values.screening_consent,
    };

    try {
      const res = await createApplicationAction(applicationInput, screeningInput);

      if (!res.success) {
        setFormError({
          title: "We couldn't submit your application.",
          description:
            res.error ||
            "Please check the information provided and try again. Your answers have been preserved.",
        });
        toast.error("Submission could not be completed. Please review your answers.");
        setSubmitting(false);
        return;
      }

      toast.success(`Application and household screening submitted for ${dog.name}.`);
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

  // SUCCESS / SUBMITTED STATE
  if (currentStep === "submitted") {
    return (
      <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-10 space-y-6 animate-in fade-in-50 duration-300">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
          <Check className="h-6 w-6 stroke-[2.5]" />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
            Adoption Application &amp; Household Screening Received
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl font-normal text-foreground">
            Application submitted.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Your application and household suitability screening for {dog.name} have been received. An administrator will review your household screening prior to application approval.
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-xs sm:text-sm space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Dog Applied For</span>
            <span className="font-medium text-foreground">{dog.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Household Screening</span>
            <span className="font-medium text-amber-700 dark:text-amber-400">
              Pending Review
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Adoption Application</span>
            <span className="font-medium text-muted-foreground">
              Queued (Awaiting Screening Approval)
            </span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link
            href="/my-applications"
            className={cn(buttonVariants({ size: "lg" }), "font-medium")}
          >
            View My Applications
          </Link>
          <Link
            href={`/dogs/${dog.id}`}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "font-medium")}
          >
            Back to {dog.name}&apos;s Profile
          </Link>
        </div>
      </div>
    );
  }

  const currentStepNumber = STEPS.find((s) => s.id === currentStep)?.number || 1;
  const housingLabel =
    HOUSING_OPTIONS.find((h) => h.value === formValues.housing_type)?.label ||
    formValues.housing_type;
  const experienceLabel =
    EXPERIENCE_OPTIONS.find((e) => e.value === formValues.experience_level)?.label ||
    formValues.experience_level;

  return (
    <div className="space-y-8">
      {/* Step Tracker Header */}
      <div className="space-y-4">
        <div className="hidden sm:grid grid-cols-5 gap-2 border-b border-border/70 pb-4">
          {STEPS.map((s) => {
            const isCompleted = s.number < currentStepNumber;
            const isCurrent = s.id === currentStep;

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  if (s.number < currentStepNumber) {
                    setCurrentStep(s.id);
                  }
                }}
                disabled={s.number > currentStepNumber}
                className={cn(
                  "flex items-center gap-2 text-left text-xs transition-colors py-1 cursor-pointer disabled:cursor-not-allowed",
                  isCurrent
                    ? "font-semibold text-primary"
                    : isCompleted
                    ? "font-medium text-foreground hover:text-primary"
                    : "text-muted-foreground/60"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : isCompleted
                      ? "bg-primary/15 text-primary"
                      : "bg-muted/50 text-muted-foreground/60"
                  )}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : s.number}
                </span>
                <span className="truncate">{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile Progress Bar */}
        <div className="sm:hidden space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">
              Step {currentStepNumber} of 5
            </span>
            <span className="text-muted-foreground">{STEPS[currentStepNumber - 1]?.label}</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${(currentStepNumber / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Global Submission Error Alert */}
      {formError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-xs font-bold">{formError.title}</AlertTitle>
          <AlertDescription className="text-xs leading-relaxed space-y-2">
            <p>{formError.description}</p>
            {(formError.description.toLowerCase().includes("already") ||
              formError.description.toLowerCase().includes("existing") ||
              formError.description.toLowerCase().includes("submitted")) && (
              <div className="pt-1.5">
                <Link
                  href="/my-applications"
                  className="inline-flex items-center gap-1.5 font-semibold text-destructive underline underline-offset-4 hover:opacity-80 transition-opacity"
                >
                  <span>Go to My Applications</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* FORM BODY */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* STEP 1: HOUSEHOLD & FAMILY */}
        {currentStep === "about" && (
          <section className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                Household &amp; Family
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Tell us about the people who live in your home and confirm everyone agrees to welcome {dog.name}.
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

            {/* Household Members Count */}
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

            {/* Household Members Description */}
            <div className="space-y-2">
              <Label htmlFor="household_members_details" className="text-sm font-medium text-foreground">
                Describe the household members and daily routine <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Who lives in the home (e.g., adults, roommates, schedules, activity level of home)?
              </p>
              <Textarea
                id="household_members_details"
                placeholder="e.g. 2 adults (working hybrid schedules), quiet household with regular daily exercise routine..."
                rows={3}
                className="text-sm leading-relaxed"
                {...register("household_members_details")}
                aria-invalid={Boolean(errors.household_members_details)}
              />
              {errors.household_members_details && (
                <p className="text-xs text-destructive">{errors.household_members_details.message}</p>
              )}
            </div>

            {/* Children in Household */}
            <div className="space-y-3">
              <Controller
                control={control}
                name="has_children"
                render={({ field }) => (
                  <div
                    onClick={() => field.onChange(!field.value)}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer select-none transition-all",
                      field.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border bg-card hover:border-foreground/40"
                    )}
                  >
                    <Checkbox
                      id="has_children"
                      checked={field.value}
                      className="mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <Label htmlFor="has_children" className="text-sm font-medium cursor-pointer">
                        Children live in or frequently visit the home
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Select if children under 18 reside in the home or visit regularly.
                      </p>
                    </div>
                  </div>
                )}
              />

              {watchHasChildren && (
                <div className="space-y-2 pl-2 border-l-2 border-primary/30 animate-in fade-in-50 duration-200">
                  <Label htmlFor="children_details" className="text-sm font-medium text-foreground">
                    Ages of children &amp; familiarity with dogs
                  </Label>
                  <Textarea
                    id="children_details"
                    placeholder="e.g. 2 children aged 7 and 10; both are gentle and accustomed to family dogs..."
                    rows={2}
                    className="text-sm leading-relaxed"
                    {...register("children_details")}
                  />
                  {errors.children_details && (
                    <p className="text-xs text-destructive">{errors.children_details.message}</p>
                  )}
                </div>
              )}
            </div>

            {/* Household Agreement Checkbox */}
            <div className="space-y-2">
              <Controller
                control={control}
                name="household_agreement"
                render={({ field }) => (
                  <div
                    onClick={() => field.onChange(!field.value)}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer select-none transition-all",
                      field.value
                        ? "border-emerald-600 bg-emerald-500/5 ring-1 ring-emerald-500/30"
                        : "border-border bg-card hover:border-foreground/40"
                    )}
                  >
                    <Checkbox
                      id="household_agreement"
                      checked={field.value}
                      className="mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <Label htmlFor="household_agreement" className="text-sm font-medium cursor-pointer">
                        All household members agree to adopting this dog <span className="text-destructive">*</span>
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Every adult in the home is fully aware of and supports this adoption application.
                      </p>
                    </div>
                  </div>
                )}
              />
              {errors.household_agreement && (
                <p className="text-xs text-destructive">{errors.household_agreement.message}</p>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                type="button"
                size="lg"
                onClick={goToNextStep}
                className="gap-2 font-medium w-full sm:w-auto"
              >
                <span>Continue to housing suitability</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
        )}

        {/* STEP 2: HOUSING SUITABILITY */}
        {currentStep === "home" && (
          <section className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                Your Housing
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Help us confirm {dog.name} will have a safe, comfortable space and that pets are permitted where you live.
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
                            "p-3.5 rounded-xl border-2 text-left transition-all duration-150 flex flex-col justify-between",
                            isSelected
                              ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/30"
                              : "border-border bg-card hover:border-foreground/40 text-foreground"
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
                    "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer select-none transition-all",
                    field.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border bg-card hover:border-foreground/40"
                  )}
                >
                  <Checkbox
                    id="has_yard"
                    checked={field.value}
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

            {/* Landlord Permission (if renting/condo) */}
            {isRenting && (
              <div className="space-y-2 animate-in fade-in-50 duration-200">
                <Controller
                  control={control}
                  name="landlord_permission"
                  render={({ field }) => (
                    <div
                      onClick={() => field.onChange(!field.value)}
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer select-none transition-all",
                        field.value
                          ? "border-emerald-600 bg-emerald-500/5 ring-1 ring-emerald-500/30"
                          : "border-border bg-card hover:border-foreground/40"
                      )}
                    >
                      <Checkbox
                        id="landlord_permission"
                        checked={Boolean(field.value)}
                        className="mt-0.5"
                      />
                      <div className="space-y-0.5">
                        <Label htmlFor="landlord_permission" className="text-sm font-medium cursor-pointer">
                          I have landlord / HOA permission to have a dog
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Pets are allowed under my lease or community bylaws, including breed or weight guidelines.
                        </p>
                      </div>
                    </div>
                  )}
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
                <span>Continue to experience</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
        )}

        {/* STEP 3: EXPERIENCE & CARE */}
        {currentStep === "experience" && (
          <section className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                Pet Experience &amp; Current Animals
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Tell us how experienced you are with dogs and whether you have any other animals at home.
              </p>
            </div>

            {/* Pet Ownership Experience Level */}
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
                            "p-3.5 rounded-xl border-2 text-left transition-all duration-150 flex flex-col justify-between",
                            isSelected
                              ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/30"
                              : "border-border bg-card hover:border-foreground/40 text-foreground"
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

            {/* Detailed Pet Care Experience Description */}
            <div className="space-y-2">
              <Label htmlFor="pet_care_experience" className="text-sm font-medium text-foreground">
                Previous pet-care background &amp; experience <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Describe dogs or other pets you have owned, fostered, or cared for in the past.
              </p>
              <Textarea
                id="pet_care_experience"
                placeholder="e.g. Raised a Labrador for 11 years from puppyhood through senior care; experienced with basic obedience, leash training, and monthly grooming..."
                rows={3}
                className="text-sm leading-relaxed"
                {...register("pet_care_experience")}
                aria-invalid={Boolean(errors.pet_care_experience)}
              />
              {errors.pet_care_experience && (
                <p className="text-xs text-destructive">{errors.pet_care_experience.message}</p>
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
                    "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer select-none transition-all",
                    field.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border bg-card hover:border-foreground/40"
                  )}
                >
                  <Checkbox
                    id="has_other_pets"
                    checked={field.value}
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

            {/* Other Pets Details */}
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
                  placeholder="e.g. 1 female cat (4 yrs, indoor-only), 1 neutered male beagle (6 yrs, dog-friendly)..."
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
                <span>Continue to daily care &amp; plans</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
        )}

        {/* STEP 4: DAILY CARE & VET PLAN */}
        {currentStep === "plans" && (
          <section className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                Daily Care &amp; Vet Plan
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Describe {dog.name}'s daily schedule, who cares for them during the day, and how you plan to handle vet visits and emergencies.
              </p>
            </div>

            {/* Daily Alone Hours */}
            <div className="space-y-2">
              <Label htmlFor="daily_alone_hours" className="text-sm font-medium text-foreground">
                Hours the dog may be left alone on typical weekdays <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Approximate consecutive hours per day without human company.
              </p>
              <div className="flex items-center gap-3">
                <Input
                  id="daily_alone_hours"
                  type="number"
                  min={0}
                  max={24}
                  className="max-w-[120px] text-sm"
                  {...register("daily_alone_hours", { valueAsNumber: true })}
                  aria-invalid={Boolean(errors.daily_alone_hours)}
                />
                <span className="text-sm text-muted-foreground">hours / day</span>
              </div>
              {errors.daily_alone_hours && (
                <p className="text-xs text-destructive">{errors.daily_alone_hours.message}</p>
              )}
            </div>

            {/* Daily Care Arrangements */}
            <div className="space-y-2">
              <Label htmlFor="daily_care_arrangements" className="text-sm font-medium text-foreground">
                Daily care arrangements &amp; exercise routine <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Outline feeding schedule, walks, potty breaks, exercise, and who cares for the dog during work hours.
              </p>
              <Textarea
                id="daily_care_arrangements"
                placeholder="e.g. Morning walk for 30 mins, breakfast at 7:30 AM, lunch break garden access via family member, evening park exercise for 45 mins, dinner at 6:30 PM..."
                rows={3}
                className="text-sm leading-relaxed"
                {...register("daily_care_arrangements")}
                aria-invalid={Boolean(errors.daily_care_arrangements)}
              />
              {errors.daily_care_arrangements && (
                <p className="text-xs text-destructive">{errors.daily_care_arrangements.message}</p>
              )}
            </div>

            {/* Emergency Vet Care Plan */}
            <div className="space-y-2">
              <Label htmlFor="emergency_vet_care_plan" className="text-sm font-medium text-foreground">
                Veterinary care &amp; emergency arrangements <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Your plan for annual vaccinations, parasite prevention, and financing unexpected veterinary emergencies (savings, pet insurance, or local vet clinic).
              </p>
              <Textarea
                id="emergency_vet_care_plan"
                placeholder="e.g. Registered with our local vet clinic (Westside Animal Hospital), pet insurance policy planned, emergency savings fund maintained for unexpected illness..."
                rows={3}
                className="text-sm leading-relaxed"
                {...register("emergency_vet_care_plan")}
                aria-invalid={Boolean(errors.emergency_vet_care_plan)}
              />
              {errors.emergency_vet_care_plan && (
                <p className="text-xs text-destructive">{errors.emergency_vet_care_plan.message}</p>
              )}
            </div>

            {/* Reason for Adopting */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="reason_for_adopting" className="text-sm font-medium text-foreground">
                  Why would you like to adopt {dog.name}? <span className="text-destructive">*</span>
                </Label>
                <span
                  className={cn(
                    "text-[11px]",
                    reasonText.length >= 30
                      ? "text-emerald-700 dark:text-emerald-400 font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  {reasonText.length} / 30 min characters
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Tell us what drew you to {dog.name} and the life you hope to provide.
              </p>
              <Textarea
                id="reason_for_adopting"
                placeholder={`Tell us what drew you to ${dog.name} and what kind of home, routine, and care you're hoping to provide...`}
                rows={4}
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

            {/* Screening Consent Checkbox */}
            <div className="space-y-2 pt-2">
              <Controller
                control={control}
                name="screening_consent"
                render={({ field }) => (
                  <div
                    onClick={() => field.onChange(!field.value)}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer select-none transition-all",
                      field.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border bg-card hover:border-foreground/40"
                    )}
                  >
                    <Checkbox
                      id="screening_consent"
                      checked={field.value}
                      className="mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <Label htmlFor="screening_consent" className="text-sm font-medium cursor-pointer">
                        Consent to household suitability review <span className="text-destructive">*</span>
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        I consent to the collection and administrative review of these household suitability answers. I confirm all statements are truthful and accurate.
                      </p>
                    </div>
                  </div>
                )}
              />
              {errors.screening_consent && (
                <p className="text-xs text-destructive">{errors.screening_consent.message}</p>
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
                <span>Review application &amp; screening</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
        )}

        {/* STEP 5: REVIEW BEFORE SUBMIT */}
        {currentStep === "review" && (
          <section className="space-y-8 animate-in fade-in-50 duration-200">
            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                Review before submitting
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Check your answers below. You can click <strong>Edit</strong> on any section to make changes before you submit.
              </p>
            </div>

            <div className="divide-y divide-border/70 border-y border-border/70">
              {/* Section 1: Household & Family */}
              <div className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Household &amp; Family
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCurrentStep("about")}
                    className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline cursor-pointer"
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
                    <span className="text-muted-foreground">Members count: </span>
                    {formValues.household_members_count}{" "}
                    {formValues.household_members_count === 1 ? "person" : "people"}
                  </p>
                  <p className="text-foreground text-xs text-muted-foreground">
                    Routine: {formValues.household_members_details}
                  </p>
                  <p className="text-foreground">
                    <span className="text-muted-foreground">Children in home: </span>
                    {formValues.has_children
                      ? formValues.children_details || "Yes"
                      : "No children residing or regularly visiting"}
                  </p>
                  <p className="text-emerald-700 dark:text-emerald-400 font-medium text-xs flex items-center gap-1.5 pt-0.5">
                    <Check className="h-3.5 w-3.5" />
                    All household members agree to the adoption
                  </p>
                </div>
              </div>

              {/* Section 2: Housing Suitability */}
              <div className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Housing Suitability
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCurrentStep("home")}
                    className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline cursor-pointer"
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
                  {isRenting && (
                    <p className="text-foreground">
                      <span className="text-muted-foreground">Landlord / HOA permission: </span>
                      {formValues.landlord_permission ? "Confirmed permission" : "Pending confirmation"}
                    </p>
                  )}
                </div>
              </div>

              {/* Section 3: Experience & Pets */}
              <div className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Pet Experience &amp; Current Animals
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCurrentStep("experience")}
                    className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline cursor-pointer"
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
                  <p className="text-xs text-muted-foreground">
                    {formValues.pet_care_experience}
                  </p>
                  <p className="text-foreground">
                    <span className="text-muted-foreground">Other pets in home: </span>
                    {formValues.has_other_pets
                      ? formValues.other_pets_details || "Yes"
                      : "None"}
                  </p>
                </div>
              </div>

              {/* Section 4: Daily Care & Vet Plan */}
              <div className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Daily Care &amp; Veterinary Plan
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCurrentStep("plans")}
                    className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline cursor-pointer"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Edit</span>
                  </button>
                </div>
                <div className="text-sm space-y-1">
                  <p className="text-foreground">
                    <span className="text-muted-foreground">Daily alone hours: </span>
                    {formValues.daily_alone_hours} hours / day
                  </p>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground">Care routine:</span>
                    <p className="text-xs text-foreground bg-muted/20 p-2.5 rounded-lg mt-0.5">
                      {formValues.daily_care_arrangements}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground">Veterinary plan:</span>
                    <p className="text-xs text-foreground bg-muted/20 p-2.5 rounded-lg mt-0.5">
                      {formValues.emergency_vet_care_plan}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 5: Why Adopt */}
              <div className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Why adopt {dog.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCurrentStep("plans")}
                    className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline cursor-pointer"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Edit</span>
                  </button>
                </div>
                <div className="text-xs sm:text-sm text-foreground whitespace-pre-line leading-relaxed bg-muted/20 p-3 rounded-xl">
                  {formValues.reason_for_adopting}
                </div>
              </div>
            </div>

            {/* Verification & Suitability Note */}
            <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Household Suitability Assessment</span>
              </div>
              <p className="leading-relaxed">
                By submitting, your household background will undergo an administrative suitability review. An adoption application cannot be approved until screening is complete and approved.
              </p>
            </div>

            {/* Actions */}
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
                    <span>Submit Application &amp; Screening</span>
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
