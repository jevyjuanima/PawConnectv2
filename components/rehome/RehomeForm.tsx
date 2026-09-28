"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Upload,
  X,
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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

interface UploadedPhoto {
  path: string;
  url: string;
  isPrimary: boolean;
}

export function RehomeForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [photos, setPhotos] = React.useState<UploadedPhoto[]>([]);
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<DogSubmissionInput>({
    resolver: zodResolver(dogSubmissionSchema),
    defaultValues: {
      name: "",
      breed: "",
      age_years: 1,
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > 5) {
      toast.error("You can upload a maximum of 5 photos per dog.");
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
            isPrimary: prev.length === 0, // First photo is default primary
          },
        ]);
        toast.success(`Uploaded ${file.name}`);
      } else {
        toast.error(res.error || `Failed to upload ${file.name}`);
      }
    }

    setUploading(false);
    // Reset file input value
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
      // Ensure at least one is primary if photos remain
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
        setFormError(res.error || "Failed to submit listing");
        toast.error(res.error || "Submission failed");
        setSubmitting(false);
        return;
      }

      toast.success(
        "Dog listing submitted! PawConnect staff will review your profile shortly."
      );
      router.push("/my-dogs");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setFormError(msg);
      toast.error(msg);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto">
      {formError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Submission Error</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {/* 1. Basic Identity */}
      <Card className="rounded-2xl border shadow-xs">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              1. Dog Identity &amp; Basics
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter primary details to help prospective adopters discover your dog.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Dog Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Dog Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. Bella, Milo"
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Breed */}
            <div className="space-y-2">
              <Label htmlFor="breed">
                Breed / Mix <span className="text-destructive">*</span>
              </Label>
              <Input
                id="breed"
                placeholder="e.g. Labrador Retriever, Mixed Breed"
                {...register("breed")}
                aria-invalid={!!errors.breed}
              />
              {errors.breed && (
                <p className="text-xs text-destructive">{errors.breed.message}</p>
              )}
            </div>

            {/* Age Years */}
            <div className="space-y-2">
              <Label htmlFor="age_years">
                Age (Years) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="age_years"
                type="number"
                min="0"
                max="25"
                {...register("age_years", { valueAsNumber: true })}
                aria-invalid={!!errors.age_years}
              />
              {errors.age_years && (
                <p className="text-xs text-destructive">{errors.age_years.message}</p>
              )}
            </div>

            {/* Age Months */}
            <div className="space-y-2">
              <Label htmlFor="age_months">Age (Additional Months)</Label>
              <Input
                id="age_months"
                type="number"
                min="0"
                max="11"
                {...register("age_months", { valueAsNumber: true })}
                aria-invalid={!!errors.age_months}
              />
              {errors.age_months && (
                <p className="text-xs text-destructive">{errors.age_months.message}</p>
              )}
            </div>

            {/* Gender Controller */}
            <div className="space-y-2">
              <Label>
                Gender <span className="text-destructive">*</span>
              </Label>
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => field.onChange(DOG_GENDERS.MALE)}
                      className={`h-10 rounded-xl border text-sm font-medium transition-all ${
                        field.value === DOG_GENDERS.MALE
                          ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                          : "border-input bg-background hover:bg-muted text-foreground"
                      }`}
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange(DOG_GENDERS.FEMALE)}
                      className={`h-10 rounded-xl border text-sm font-medium transition-all ${
                        field.value === DOG_GENDERS.FEMALE
                          ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                          : "border-input bg-background hover:bg-muted text-foreground"
                      }`}
                    >
                      Female
                    </button>
                  </div>
                )}
              />
              {errors.gender && (
                <p className="text-xs text-destructive">{errors.gender.message}</p>
              )}
            </div>

            {/* Size Controller */}
            <div className="space-y-2">
              <Label>
                Size <span className="text-destructive">*</span>
              </Label>
              <Controller
                control={control}
                name="size"
                render={({ field }) => (
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { val: DOG_SIZES.SMALL, label: "Small" },
                      { val: DOG_SIZES.MEDIUM, label: "Med" },
                      { val: DOG_SIZES.LARGE, label: "Large" },
                      { val: DOG_SIZES.GIANT, label: "Giant" },
                    ].map((s) => (
                      <button
                        key={s.val}
                        type="button"
                        onClick={() => field.onChange(s.val)}
                        className={`h-10 rounded-xl border text-xs font-medium transition-all ${
                          field.value === s.val
                            ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                            : "border-input bg-background hover:bg-muted text-foreground"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              />
              {errors.size && (
                <p className="text-xs text-destructive">{errors.size.message}</p>
              )}
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label htmlFor="color">Color / Coat</Label>
              <Input
                id="color"
                placeholder="e.g. Golden, Black & White, Tricolor"
                {...register("color")}
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">
                Current Location (City, State) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="location"
                placeholder="e.g. Austin, TX"
                {...register("location")}
                aria-invalid={!!errors.location}
              />
              {errors.location && (
                <p className="text-xs text-destructive">{errors.location.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Health & Veterinary Records */}
      <Card className="rounded-2xl border shadow-xs">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              2. Medical &amp; Health Records
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Accurate health details build trust and ensure the safety of adopters.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Vaccinated Checkbox */}
              <Controller
                control={control}
                name="vaccinated"
                render={({ field }) => (
                  <div className="flex items-center space-x-3 p-3.5 rounded-xl border bg-muted/20">
                    <Checkbox
                      id="vaccinated"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <label
                      htmlFor="vaccinated"
                      className="text-xs font-semibold cursor-pointer select-none"
                    >
                      Vaccinations Up to Date
                    </label>
                  </div>
                )}
              />

              {/* Spayed / Neutered Checkbox */}
              <Controller
                control={control}
                name="spayed_neutered"
                render={({ field }) => (
                  <div className="flex items-center space-x-3 p-3.5 rounded-xl border bg-muted/20">
                    <Checkbox
                      id="spayed_neutered"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <label
                      htmlFor="spayed_neutered"
                      className="text-xs font-semibold cursor-pointer select-none"
                    >
                      Spayed / Neutered
                    </label>
                  </div>
                )}
              />
            </div>

            {/* Medical History */}
            <div className="space-y-2">
              <Label htmlFor="medical_history">Medical History or Chronic Conditions</Label>
              <Textarea
                id="medical_history"
                placeholder="Include past surgeries, medications, allergies, or regular vet care..."
                rows={3}
                {...register("medical_history")}
              />
            </div>

            {/* Special Needs */}
            <div className="space-y-2">
              <Label htmlFor="special_needs">Special Needs or Behavioral Considerations</Label>
              <Textarea
                id="special_needs"
                placeholder="e.g. Needs a quiet home with no other dogs, anxiety during thunderstorms, mobility support..."
                rows={3}
                {...register("special_needs")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Personality & Story */}
      <Card className="rounded-2xl border shadow-xs">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              3. Personality &amp; Story
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tell prospective adopters about your dog&apos;s daily temperament, favorite activities, and reason for rehoming.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Dog Description &amp; Background <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Describe your dog's temperament, how they interact with adults and children, daily energy levels, house training status, and what kind of home would be best for them..."
              rows={5}
              {...register("description")}
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
            <p className="text-[11px] text-muted-foreground">Minimum 20 characters.</p>
          </div>
        </CardContent>
      </Card>

      {/* 4. Photo Upload */}
      <Card className="rounded-2xl border shadow-xs">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="border-b pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                4. Photos
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upload clear, well-lit photos (up to 5 images, max 5MB each).
              </p>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {photos.length} / 5 photos
            </span>
          </div>

          {/* Upload Drop Zone */}
          {photos.length < 5 && (
            <div className="relative border-2 border-dashed border-border/80 rounded-2xl p-8 text-center hover:border-primary/50 transition-colors bg-muted/10">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                aria-label="Upload dog photos"
              />
              <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Upload className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {uploading ? "Uploading..." : "Click or drag photos here"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports JPG, PNG, and WebP (up to 5MB each)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Photo Previews */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              {photos.map((photo, index) => (
                <div
                  key={photo.path}
                  className="relative aspect-[4/3] rounded-xl overflow-hidden border bg-muted group shadow-2xs"
                >
                  <Image
                    src={photo.url}
                    alt={`Uploaded photo ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover"
                  />

                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                    <button
                      type="button"
                      onClick={() => setPrimaryPhoto(index)}
                      className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors ${
                        photo.isPrimary
                          ? "bg-amber-500 text-white"
                          : "bg-background/90 text-foreground hover:bg-background"
                      }`}
                      title="Set as primary image"
                    >
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {photo.isPrimary ? "Primary" : "Make Primary"}
                    </button>

                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="p-1.5 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                      title="Delete photo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {photo.isPrimary && (
                    <div className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                      <Star className="h-3 w-3 fill-current" />
                      Primary Photo
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Welfare Declaration Alert */}
      <Alert className="bg-primary/5 border-primary/20">
        <ShieldAlert className="h-4 w-4 text-primary" />
        <AlertTitle className="text-xs font-bold">Animal Welfare &amp; Verification Notice</AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground leading-relaxed">
          By submitting this listing, you confirm that you are the lawful caretaker of this dog and
          that all medical and temperament details provided are accurate to the best of your knowledge.
          PawConnect administrators will review this submission before it appears publicly.
        </AlertDescription>
      </Alert>

      {/* Submit Action */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4">
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
          disabled={submitting || uploading}
          className="w-full sm:w-auto min-w-[200px] gap-2 font-bold shadow-md"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting Listing...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Submit Listing for Review
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
