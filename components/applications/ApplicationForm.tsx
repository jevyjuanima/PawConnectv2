"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Heart,
  Loader2,
  AlertCircle,
  Home,
  CheckCircle2,
  Users,
  ShieldCheck,
  Dog as DogIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  adoptionApplicationSchema,
  HOUSING_TYPES,
  EXPERIENCE_LEVELS,
  type AdoptionApplicationInput,
} from "@/lib/validations/application";
import { createApplicationAction } from "@/app/actions/applications";
import { formatAge } from "@/lib/utils/format";
import type { DogWithImages } from "@/types";

interface ApplicationFormProps {
  dog: DogWithImages;
}

export function ApplicationForm({ dog }: ApplicationFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<AdoptionApplicationInput>({
    resolver: zodResolver(adoptionApplicationSchema),
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

  const watchHasOtherPets = watch("has_other_pets");

  const onSubmit = async (values: AdoptionApplicationInput) => {
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await createApplicationAction(values);

      if (!res.success) {
        setFormError(res.error || "Failed to submit application");
        toast.error(res.error || "Submission failed");
        setSubmitting(false);
        return;
      }

      toast.success(
        `Adoption application submitted for ${dog.name}! We will notify you once under review.`
      );
      router.push("/my-applications");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setFormError(msg);
      toast.error(msg);
      setSubmitting(false);
    }
  };

  const primaryImg =
    dog.primary_image ||
    dog.images?.find((img) => img.is_primary)?.public_url ||
    dog.images?.[0]?.public_url;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto">
      {/* Form Area (8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Application Error</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {/* 1. Housing & Living Situation */}
          <Card className="rounded-2xl border shadow-xs">
            <CardContent className="p-6 sm:p-8 space-y-5">
              <div className="border-b pb-4 flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    1. Housing &amp; Living Environment
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Ensure your living environment is safe and suitable for this pet.
                  </p>
                </div>
              </div>

              {/* Housing Type */}
              <div className="space-y-2">
                <Label>
                  Type of Residence <span className="text-destructive">*</span>
                </Label>
                <Controller
                  control={control}
                  name="housing_type"
                  render={({ field }) => (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { val: HOUSING_TYPES.OWN_HOUSE, label: "Own House" },
                        { val: HOUSING_TYPES.RENT_HOUSE, label: "Rent House" },
                        { val: HOUSING_TYPES.APARTMENT, label: "Apartment" },
                        { val: HOUSING_TYPES.CONDO, label: "Condo" },
                        { val: HOUSING_TYPES.OTHER, label: "Other" },
                      ].map((h) => (
                        <button
                          key={h.val}
                          type="button"
                          onClick={() => field.onChange(h.val)}
                          className={`h-10 rounded-xl border text-xs font-medium transition-all ${
                            field.value === h.val
                              ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                              : "border-input bg-background hover:bg-muted text-foreground"
                          }`}
                        >
                          {h.label}
                        </button>
                      ))}
                    </div>
                  )}
                />
                {errors.housing_type && (
                  <p className="text-xs text-destructive">
                    {errors.housing_type.message}
                  </p>
                )}
              </div>

              {/* Yard Checkbox */}
              <Controller
                control={control}
                name="has_yard"
                render={({ field }) => (
                  <div className="flex items-center space-x-3 p-3.5 rounded-xl border bg-muted/20">
                    <Checkbox
                      id="has_yard"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <label
                      htmlFor="has_yard"
                      className="text-xs font-semibold cursor-pointer select-none"
                    >
                      I have an enclosed / secure yard or outdoor area
                    </label>
                  </div>
                )}
              />

              {/* Household Members */}
              <div className="space-y-2">
                <Label htmlFor="household_members_count">
                  Number of Household Members (including yourself){" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="household_members_count"
                  type="number"
                  min="1"
                  max="20"
                  {...register("household_members_count", { valueAsNumber: true })}
                  aria-invalid={!!errors.household_members_count}
                />
                {errors.household_members_count && (
                  <p className="text-xs text-destructive">
                    {errors.household_members_count.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 2. Pets & Experience */}
          <Card className="rounded-2xl border shadow-xs">
            <CardContent className="p-6 sm:p-8 space-y-5">
              <div className="border-b pb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    2. Pet History &amp; Experience
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Help us gauge compatibility with other animals and experience level.
                  </p>
                </div>
              </div>

              {/* Experience Level */}
              <div className="space-y-2">
                <Label>
                  Pet Ownership Experience <span className="text-destructive">*</span>
                </Label>
                <Controller
                  control={control}
                  name="experience_level"
                  render={({ field }) => (
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { val: EXPERIENCE_LEVELS.FIRST_TIME, label: "First-Time Owner" },
                        { val: EXPERIENCE_LEVELS.EXPERIENCED, label: "Experienced" },
                        { val: EXPERIENCE_LEVELS.EXPERT, label: "Expert / Trainer" },
                      ].map((exp) => (
                        <button
                          key={exp.val}
                          type="button"
                          onClick={() => field.onChange(exp.val)}
                          className={`h-11 rounded-xl border text-xs font-medium transition-all ${
                            field.value === exp.val
                              ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                              : "border-input bg-background hover:bg-muted text-foreground"
                          }`}
                        >
                          {exp.label}
                        </button>
                      ))}
                    </div>
                  )}
                />
                {errors.experience_level && (
                  <p className="text-xs text-destructive">
                    {errors.experience_level.message}
                  </p>
                )}
              </div>

              {/* Other Pets Checkbox */}
              <Controller
                control={control}
                name="has_other_pets"
                render={({ field }) => (
                  <div className="flex items-center space-x-3 p-3.5 rounded-xl border bg-muted/20">
                    <Checkbox
                      id="has_other_pets"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <label
                      htmlFor="has_other_pets"
                      className="text-xs font-semibold cursor-pointer select-none"
                    >
                      Do you currently have other pets in the home?
                    </label>
                  </div>
                )}
              />

              {watchHasOtherPets && (
                <div className="space-y-2 animate-in fade-in-50">
                  <Label htmlFor="other_pets_details">
                    Details of Other Pets (species, breed, age, temperament)
                  </Label>
                  <Textarea
                    id="other_pets_details"
                    placeholder="e.g. 1 spayed domestic shorthair cat (5 yrs), 1 friendly male Golden Retriever (3 yrs)..."
                    rows={3}
                    {...register("other_pets_details")}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3. Reason for Adopting */}
          <Card className="rounded-2xl border shadow-xs">
            <CardContent className="p-6 sm:p-8 space-y-4">
              <div className="border-b pb-4">
                <h2 className="text-lg font-bold text-foreground">
                  3. Reason for Adopting {dog.name}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Share why you believe this specific dog will thrive with you.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason_for_adopting">
                  Why are you interested in adopting {dog.name}?{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="reason_for_adopting"
                  placeholder="Tell us about your daily routine, exercise plans, why your home is a great fit, and your commitment to lifelong care..."
                  rows={5}
                  {...register("reason_for_adopting")}
                  aria-invalid={!!errors.reason_for_adopting}
                />
                {errors.reason_for_adopting && (
                  <p className="text-xs text-destructive">
                    {errors.reason_for_adopting.message}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Minimum 30 characters required.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Welfare Notice */}
          <Alert className="bg-primary/5 border-primary/20">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <AlertTitle className="text-xs font-bold">
              Lifelong Adoption Commitment
            </AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground leading-relaxed">
              Adopting a dog is a lifelong commitment of love, veterinary care, and responsibility.
              Applications are reviewed by PawConnect administrators and the dog&apos;s caretaker.
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="gap-2 font-bold shadow-md min-w-[200px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                <>
                  <Heart className="h-4 w-4 fill-primary-foreground/20" />
                  Submit Adoption Application
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Dog Summary Card (4 cols) */}
      <div className="lg:col-span-4">
        <Card className="sticky top-24 rounded-2xl border shadow-sm overflow-hidden">
          <div className="relative aspect-[4/3] w-full bg-muted">
            {primaryImg ? (
              <Image
                src={primaryImg}
                alt={dog.name}
                fill
                sizes="(max-width: 1024px) 100vw, 30vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <DogIcon className="h-12 w-12 text-muted-foreground/40" />
              </div>
            )}
          </div>
          <CardContent className="p-5 space-y-4">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                {dog.name}
              </h3>
              <p className="text-xs text-muted-foreground">{dog.breed}</p>
            </div>

            <div className="space-y-1.5 text-xs border-t pt-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Age</span>
                <span className="font-semibold text-foreground">
                  {formatAge(dog.age_years, dog.age_months)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gender</span>
                <span className="font-semibold text-foreground capitalize">
                  {dog.gender}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location</span>
                <span className="font-semibold text-foreground truncate max-w-[150px]">
                  {dog.location}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Submitting this application does not require any upfront payment or fee.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
