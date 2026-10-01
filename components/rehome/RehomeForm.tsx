"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Upload,
  X,
  Star,
  Check,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Edit2,
  ShieldCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  dogSubmissionSchema,
  type DogSubmissionInput,
} from "@/lib/validations/dog";
import { DOG_GENDERS, DOG_SIZES } from "@/lib/constants/statuses";
import { createDogAction } from "@/app/actions/dogs";
import { uploadDogPhotoAction } from "@/app/actions/upload";
import { validateDogImageFile } from "@/lib/validations/upload";
import { formatAge, formatCapitalize } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface UploadedPhoto {
  path: string;
  url: string;
  isPrimary: boolean;
}

type RehomeStep = "basics" | "photos" | "temperament" | "background" | "review" | "submitted";

const STEPS: { id: RehomeStep; label: string; number: number }[] = [
  { id: "basics", label: "About your dog", number: 1 },
  { id: "photos", label: "Photos", number: 2 },
  { id: "temperament", label: "Temperament & care", number: 3 },
  { id: "background", label: "Background", number: 4 },
  { id: "review", label: "Review", number: 5 },
];

const SIZE_OPTIONS = [
  { value: DOG_SIZES.SMALL, label: "Small", desc: "Under 25 lbs" },
  { value: DOG_SIZES.MEDIUM, label: "Medium", desc: "25–55 lbs" },
  { value: DOG_SIZES.LARGE, label: "Large", desc: "55–90 lbs" },
  { value: DOG_SIZES.GIANT, label: "Giant", desc: "Over 90 lbs" },
] as const;

export function RehomeForm() {
  const [currentStep, setCurrentStep] = React.useState<RehomeStep>("basics");
  const [submitting, setSubmitting] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [photos, setPhotos] = React.useState<UploadedPhoto[]>([]);
  const [submittedDogName, setSubmittedDogName] = React.useState<string>("");
  const [formError, setFormError] = React.useState<{ title: string; description: string } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    trigger,
    formState: { errors },
  } = useForm<DogSubmissionInput>({
    resolver: zodResolver(dogSubmissionSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      breed: "",
      age_years: 2,
      age_months: 0,
      gender: DOG_GENDERS.MALE,
      size: DOG_SIZES.MEDIUM,
      color: "",
      description: "",
      medical_history: "",
      vaccinated: false,
      spayed_neutered: false,
      special_needs: "",
      location: "",
    },
  });

  const formValues = watch();
  const descriptionText = watch("description") || "";

  // Step transitions with validation
  const goToNextStep = async () => {
    setFormError(null);

    if (currentStep === "basics") {
      const isValid = await trigger([
        "name",
        "breed",
        "age_years",
        "age_months",
        "gender",
        "size",
        "location",
      ]);
      if (isValid) setCurrentStep("photos");
    } else if (currentStep === "photos") {
      setCurrentStep("temperament");
    } else if (currentStep === "temperament") {
      const isValid = await trigger(["description", "special_needs"]);
      if (isValid) setCurrentStep("background");
    } else if (currentStep === "background") {
      const isValid = await trigger(["medical_history", "vaccinated", "spayed_neutered"]);
      if (isValid) setCurrentStep("review");
    }
  };

  const goToPreviousStep = () => {
    setFormError(null);
    if (currentStep === "photos") setCurrentStep("basics");
    else if (currentStep === "temperament") setCurrentStep("photos");
    else if (currentStep === "background") setCurrentStep("temperament");
    else if (currentStep === "review") setCurrentStep("background");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > 5) {
      toast.error("You can upload a maximum of 5 photos.");
      return;
    }

    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateDogImageFile({
        name: file.name,
        size: file.size,
        type: file.type,
      });

      if (!validation.valid) {
        toast.error(validation.error || `File ${file.name} is invalid.`);
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadDogPhotoAction(formData);
      if (res.success && res.data) {
        setPhotos((prev) => [
          ...prev,
          {
            path: res.data.path,
            url: res.data.url,
            isPrimary: prev.length === 0,
          },
        ]);
        toast.success(`Uploaded ${file.name}`);
      } else {
        toast.error(res.error || `Failed to upload ${file.name}`);
      }
    }

    setUploading(false);
    e.target.value = "";
  };

  const setPrimaryPhoto = (index: number) => {
    setPhotos((prev) =>
      prev.map((photo, i) => ({
        ...photo,
        isPrimary: i === index,
      }))
    );
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length > 0 && !updated.some((p) => p.isPrimary)) {
        updated[0].isPrimary = true;
      }
      return updated;
    });
  };

  const onSubmit = async (values: DogSubmissionInput) => {
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await createDogAction(
        values,
        photos.map((p) => ({
          path: p.path,
          url: p.url,
          isPrimary: p.isPrimary,
        }))
      );

      if (!res.success) {
        setFormError({
          title: "We couldn't submit your dog's profile.",
          description:
            res.error ||
            "Please check the information provided and try again. Your answers have been preserved.",
        });
        toast.error("Submission could not be completed. Please review your answers.");
        setSubmitting(false);
        return;
      }

      setSubmittedDogName(values.name);
      toast.success(`${values.name}'s profile has been submitted for review.`);
      setCurrentStep("submitted");
    } catch {
      setFormError({
        title: "We couldn't submit your dog's profile.",
        description: "An unexpected network error occurred. Please try again. Your answers have been kept.",
      });
      toast.error("Network error while submitting. Please try again.");
      setSubmitting(false);
    }
  };

  // 1. SUBMISSION CONFIRMATION
  if (currentStep === "submitted") {
    return (
      <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-10 space-y-6 animate-in fade-in-50 duration-300">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
          <Check className="h-6 w-6 stroke-[2.5]" />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
            Profile Under Review
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl font-normal text-foreground">
            Your dog&apos;s profile has been submitted.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            We&apos;ll review the information before the profile becomes available to people looking to adopt.
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-xs sm:text-sm space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Dog Profile</span>
            <span className="font-medium text-foreground">{submittedDogName || formValues.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Current Status</span>
            <span className="font-medium text-emerald-700 dark:text-emerald-300">
              Pending Administrative Review
            </span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link
            href="/my-dogs"
            className={cn(buttonVariants({ size: "lg" }), "font-medium")}
          >
            View My Dogs
          </Link>
          <Link
            href="/dogs"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "font-medium")}
          >
            Browse Dogs
          </Link>
        </div>
      </div>
    );
  }

  const currentStepNumber = STEPS.find((s) => s.id === currentStep)?.number || 1;

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

      {/* Global Form Error Alert */}
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
        {/* STEP 1: ABOUT YOUR DOG */}
        {currentStep === "basics" && (
          <section className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="space-y-1">
              <h2 className="font-serif text-2xl font-normal text-foreground">
                About your dog
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Start with basic details so prospective adopters can learn who your dog is.
              </p>
            </div>

            <div className="space-y-5">
              {/* Dog Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-foreground">
                  Dog name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. Bella"
                  {...register("name")}
                  aria-invalid={Boolean(errors.name)}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              {/* Breed */}
              <div className="space-y-2">
                <Label htmlFor="breed" className="text-sm font-medium text-foreground">
                  Breed or mix <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  If mixed breed or unknown, Mixed Breed or the most prominent mix is helpful.
                </p>
                <Input
                  id="breed"
                  placeholder="e.g. Mixed Breed, Golden Retriever"
                  {...register("breed")}
                  aria-invalid={Boolean(errors.breed)}
                />
                {errors.breed && (
                  <p className="text-xs text-destructive">{errors.breed.message}</p>
                )}
              </div>

              {/* Age */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age_years" className="text-sm font-medium text-foreground">
                    Age in years <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="age_years"
                    type="number"
                    min={0}
                    max={25}
                    {...register("age_years", { valueAsNumber: true })}
                    aria-invalid={Boolean(errors.age_years)}
                  />
                  {errors.age_years && (
                    <p className="text-xs text-destructive">{errors.age_years.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age_months" className="text-sm font-medium text-foreground">
                    Additional months
                  </Label>
                  <Input
                    id="age_months"
                    type="number"
                    min={0}
                    max={11}
                    {...register("age_months", { valueAsNumber: true })}
                    aria-invalid={Boolean(errors.age_months)}
                  />
                  {errors.age_months && (
                    <p className="text-xs text-destructive">{errors.age_months.message}</p>
                  )}
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Gender <span className="text-destructive">*</span>
                </Label>
                <Controller
                  control={control}
                  name="gender"
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { val: DOG_GENDERS.MALE, label: "Male" },
                        { val: DOG_GENDERS.FEMALE, label: "Female" },
                      ].map((g) => (
                        <button
                          key={g.val}
                          type="button"
                          onClick={() => field.onChange(g.val)}
                          className={cn(
                            "h-11 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2",
                            field.value === g.val
                              ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/30 font-semibold"
                              : "border-border/80 bg-card hover:bg-muted/30 text-foreground"
                          )}
                        >
                          <span>{g.label}</span>
                          {field.value === g.val && <Check className="h-4 w-4 text-primary" />}
                        </button>
                      ))}
                    </div>
                  )}
                />
                {errors.gender && (
                  <p className="text-xs text-destructive">{errors.gender.message}</p>
                )}
              </div>

              {/* Size */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Size category <span className="text-destructive">*</span>
                </Label>
                <Controller
                  control={control}
                  name="size"
                  render={({ field }) => (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {SIZE_OPTIONS.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => field.onChange(s.value)}
                          className={cn(
                            "p-3 rounded-xl border text-left transition-all flex flex-col justify-between",
                            field.value === s.value
                              ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/30"
                              : "border-border/80 bg-card hover:bg-muted/30 text-foreground"
                          )}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="text-xs font-semibold">{s.label}</span>
                            {field.value === s.value && <Check className="h-3 w-3 text-primary" />}
                          </div>
                          <span className="text-[11px] text-muted-foreground">{s.desc}</span>
                        </button>
                      ))}
                    </div>
                  )}
                />
                {errors.size && (
                  <p className="text-xs text-destructive">{errors.size.message}</p>
                )}
              </div>

              {/* Coat / Color */}
              <div className="space-y-2">
                <Label htmlFor="color" className="text-sm font-medium text-foreground">
                  Coat color / markings
                </Label>
                <Input
                  id="color"
                  placeholder="e.g. Golden, Black & White, Tricolor"
                  {...register("color")}
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium text-foreground">
                  Current location <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  City and state where the dog is currently located.
                </p>
                <Input
                  id="location"
                  placeholder="e.g. Seattle, WA"
                  {...register("location")}
                  aria-invalid={Boolean(errors.location)}
                />
                {errors.location && (
                  <p className="text-xs text-destructive">{errors.location.message}</p>
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                type="button"
                size="lg"
                onClick={goToNextStep}
                className="gap-2 font-medium w-full sm:w-auto"
              >
                <span>Continue to photos</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
        )}

        {/* STEP 2: PHOTOS */}
        {currentStep === "photos" && (
          <section className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="space-y-1">
              <h2 className="font-serif text-2xl font-normal text-foreground">
                Photos
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                A few clear photos can help a future adopter get to know your dog.
              </p>
            </div>

            {/* Upload Area */}
            {photos.length < 5 && (
              <div className="relative border border-dashed border-border/80 rounded-2xl p-6 sm:p-8 text-center hover:border-primary/50 transition-colors bg-muted/10">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Upload dog photos"
                />
                <div className="flex flex-col items-center justify-center space-y-2.5 pointer-events-none">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {uploading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Upload className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {uploading ? "Uploading photos..." : "Click or drag photos here"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      JPG, PNG, or WebP up to 5MB each ({photos.length} of 5 uploaded)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Photo Preview Strip */}
            {photos.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Uploaded Photos
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photos.map((photo, index) => (
                    <div
                      key={photo.path}
                      className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border/80 bg-muted/30 group"
                    >
                      <Image
                        src={photo.url}
                        alt={`Dog photo ${index + 1}`}
                        fill
                        sizes="(max-width: 640px) 50vw, 33vw"
                        className="object-cover"
                      />

                      {/* Primary Badge */}
                      {photo.isPrimary && (
                        <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                          <Star className="h-3 w-3 fill-current" />
                          Primary
                        </div>
                      )}

                      {/* Controls Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                        {!photo.isPrimary && (
                          <button
                            type="button"
                            onClick={() => setPrimaryPhoto(index)}
                            className="p-1.5 rounded-lg text-xs font-medium bg-background text-foreground hover:bg-muted transition-colors flex items-center gap-1 cursor-pointer"
                            title="Set as primary image"
                          >
                            <Star className="h-3 w-3" />
                            <span>Primary</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="p-1.5 rounded-lg text-xs font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors cursor-pointer"
                          title="Remove photo"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No photos uploaded yet. You can continue and add photos before finalizing.
              </p>
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
                <span>Continue to temperament</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
        )}

        {/* STEP 3: TEMPERAMENT & CARE */}
        {currentStep === "temperament" && (
          <section className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="space-y-1">
              <h2 className="font-serif text-2xl font-normal text-foreground">
                Temperament &amp; care
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Help a future adopter understand what daily life with your dog looks like.
              </p>
            </div>

            {/* Description Prompt */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description" className="text-sm font-medium text-foreground">
                  What is your dog like at home? <span className="text-destructive">*</span>
                </Label>
                <span className={cn(
                  "text-[11px]",
                  descriptionText.length >= 20 ? "text-emerald-700 dark:text-emerald-400 font-medium" : "text-muted-foreground"
                )}>
                  {descriptionText.length} / 20 min characters
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Tell us about their personality, routines, favorite activities, and how they interact with people.
              </p>
              <Textarea
                id="description"
                placeholder="Tell us about their personality, routines, and what they enjoy..."
                rows={6}
                className="text-sm leading-relaxed"
                {...register("description")}
                aria-invalid={Boolean(errors.description)}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description.message}</p>
              )}
            </div>

            {/* Special Needs Prompt */}
            <div className="space-y-2">
              <Label htmlFor="special_needs" className="text-sm font-medium text-foreground">
                Special needs or home considerations
              </Label>
              <p className="text-xs text-muted-foreground">
                Any specific environment, quiet home preference, leash habits, or behavioral notes.
              </p>
              <Textarea
                id="special_needs"
                placeholder="e.g. Prefers a quiet home without other animals, gets anxious during storms, needs a securely fenced yard..."
                rows={3}
                className="text-sm leading-relaxed"
                {...register("special_needs")}
              />
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
                <span>Continue to background</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
        )}

        {/* STEP 4: BACKGROUND */}
        {currentStep === "background" && (
          <section className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="space-y-1">
              <h2 className="font-serif text-2xl font-normal text-foreground">
                Background
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Accurate care and medical information ensures their next home can provide proper support.
              </p>
            </div>

            {/* Vaccinations & Spayed/Neutered Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Controller
                control={control}
                name="vaccinated"
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
                      id="vaccinated"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <Label htmlFor="vaccinated" className="text-sm font-medium cursor-pointer">
                        Vaccinations are up to date
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Current on core vaccines (rabies, DHPP, etc.)
                      </p>
                    </div>
                  </div>
                )}
              />

              <Controller
                control={control}
                name="spayed_neutered"
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
                      id="spayed_neutered"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <Label htmlFor="spayed_neutered" className="text-sm font-medium cursor-pointer">
                        Spayed or neutered
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Has been surgically altered
                      </p>
                    </div>
                  </div>
                )}
              />
            </div>

            {/* Medical History */}
            <div className="space-y-2">
              <Label htmlFor="medical_history" className="text-sm font-medium text-foreground">
                Medical history or care background
              </Label>
              <p className="text-xs text-muted-foreground">
                Past surgeries, allergies, chronic conditions, medications, or dietary requirements.
              </p>
              <Textarea
                id="medical_history"
                placeholder="Any past surgeries, allergies, chronic conditions, or medications..."
                rows={4}
                className="text-sm leading-relaxed"
                {...register("medical_history")}
              />
            </div>

            {/* Reassurance Notice */}
            <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Verification and review</span>
              </div>
              <p className="leading-relaxed">
                Your dog&apos;s information will be reviewed before the profile can become available for adoption. We ask for accurate details so their next home can provide appropriate care.
              </p>
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
                <span>Review your dog&apos;s information</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
        )}

        {/* STEP 5: REVIEW */}
        {currentStep === "review" && (
          <section className="space-y-8 animate-in fade-in-50 duration-200">
            <div className="space-y-1">
              <h2 className="font-serif text-2xl font-normal text-foreground">
                Review your dog&apos;s information
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Please check these details before submitting. You can edit any section if something needs updating.
              </p>
            </div>

            {/* Review Sections */}
            <div className="divide-y divide-border/70 border-y border-border/70">
              {/* 1. About Your Dog */}
              <div className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    About your dog
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCurrentStep("basics")}
                    className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline cursor-pointer"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Edit</span>
                  </button>
                </div>
                <div className="text-sm space-y-1">
                  <p className="text-foreground font-medium text-base font-serif">
                    {formValues.name}
                  </p>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    {formValues.breed} · {formatAge(formValues.age_years, formValues.age_months)} · {formatCapitalize(formValues.gender)} · {formatCapitalize(formValues.size)} size
                  </p>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    Location: {formValues.location}
                    {formValues.color && ` · Coat: ${formValues.color}`}
                  </p>
                </div>
              </div>

              {/* 2. Photos */}
              <div className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Photos ({photos.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCurrentStep("photos")}
                    className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline cursor-pointer"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Edit</span>
                  </button>
                </div>
                {photos.length > 0 ? (
                  <div className="flex gap-2.5 overflow-x-auto pt-1 pb-1">
                    {photos.map((p, idx) => (
                      <div
                        key={p.path}
                        className="relative h-16 w-20 shrink-0 rounded-lg overflow-hidden border border-border/70 bg-muted"
                      >
                        <Image
                          src={p.url}
                          alt={`Review photo ${idx + 1}`}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                        {p.isPrimary && (
                          <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[9px] font-semibold px-1 rounded">
                            Primary
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    No photos uploaded. (Photos can still be added before publishing).
                  </p>
                )}
              </div>

              {/* 3. Temperament & Care */}
              <div className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Temperament &amp; care
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCurrentStep("temperament")}
                    className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline cursor-pointer"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Edit</span>
                  </button>
                </div>
                <div className="text-xs sm:text-sm text-foreground whitespace-pre-line leading-relaxed bg-muted/20 p-3 rounded-xl">
                  {formValues.description}
                </div>
                {formValues.special_needs && (
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground font-semibold">Special needs or considerations:</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formValues.special_needs}</p>
                  </div>
                )}
              </div>

              {/* 4. Background */}
              <div className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Background
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCurrentStep("background")}
                    className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline cursor-pointer"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Edit</span>
                  </button>
                </div>
                <div className="text-xs sm:text-sm space-y-1 text-muted-foreground">
                  <p>
                    Vaccinations:{" "}
                    <span className="text-foreground font-medium">
                      {formValues.vaccinated ? "Up to date" : "Pending or not recorded"}
                    </span>
                  </p>
                  <p>
                    Spayed / Neutered:{" "}
                    <span className="text-foreground font-medium">
                      {formValues.spayed_neutered ? "Yes" : "No"}
                    </span>
                  </p>
                  {formValues.medical_history && (
                    <p className="pt-1 text-foreground leading-relaxed">
                      Medical background: {formValues.medical_history}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Submission Reassurance Notice */}
            <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-1.5 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">
                Ready to submit?
              </p>
              <p className="leading-relaxed">
                Your dog&apos;s information will be reviewed before the profile can become available for adoption.
              </p>
            </div>

            {/* Final Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setCurrentStep("background")}
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
                    <span>Submitting profile...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Submit for Review</span>
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
