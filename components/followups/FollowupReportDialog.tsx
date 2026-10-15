"use client";

import * as React from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  Camera,
  Heart,
  Stethoscope,
  Home,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  followupReportSchema,
  type FollowupReportInput,
} from "@/lib/validations/followup";
import { submitFollowUpReportAction } from "@/app/actions/followup";
import { uploadDogPhotoAction } from "@/app/actions/upload";
import { validateDogImageFile } from "@/lib/validations/upload";
import type { FollowupWithDetails } from "@/types";

interface FollowupReportDialogProps {
  followup: FollowupWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function FollowupReportDialog({
  followup,
  open,
  onOpenChange,
  onSuccess,
}: FollowupReportDialogProps) {
  const [submitting, setSubmitting] = React.useState(false);
  const [photoUploading, setPhotoUploading] = React.useState(false);
  const [photoUrl, setPhotoUrl] = React.useState<string>(followup?.photo_url || "");
  const [photoPath, setPhotoPath] = React.useState<string>(followup?.photo_storage_path || "");
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FollowupReportInput>({
    resolver: zodResolver(followupReportSchema),
    defaultValues: {
      followup_id: followup?.id || "",
      general_health: followup?.general_health || "",
      eating_behavior_adjustment: followup?.eating_behavior_adjustment || "",
      veterinary_care: followup?.veterinary_care || "",
      living_environment: followup?.living_environment || "",
      problems_concerns: followup?.problems_concerns || "",
      photo_url: followup?.photo_url || "",
      photo_storage_path: followup?.photo_storage_path || "",
    },
  });

  React.useEffect(() => {
    if (followup) {
      reset({
        followup_id: followup.id,
        general_health: followup.general_health || "",
        eating_behavior_adjustment: followup.eating_behavior_adjustment || "",
        veterinary_care: followup.veterinary_care || "",
        living_environment: followup.living_environment || "",
        problems_concerns: followup.problems_concerns || "",
        photo_url: followup.photo_url || "",
        photo_storage_path: followup.photo_storage_path || "",
      });
      setPhotoUrl(followup.photo_url || "");
      setPhotoPath(followup.photo_storage_path || "");
      setFormError(null);
    }
  }, [followup, reset]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateDogImageFile({
      name: file.name,
      size: file.size,
      type: file.type,
    });

    if (!validation.valid) {
      toast.error(validation.error || "Invalid image file");
      e.target.value = "";
      return;
    }

    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadDogPhotoAction(formData);
      if (res.success && res.data) {
        setPhotoUrl(res.data.url);
        setPhotoPath(res.data.path);
        setValue("photo_url", res.data.url);
        setValue("photo_storage_path", res.data.path);
        toast.success("Photo attached");
      } else {
        toast.error(res.error || "Failed to upload photo");
      }
    } catch {
      toast.error("Error uploading photo");
    } finally {
      setPhotoUploading(false);
      e.target.value = "";
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl("");
    setPhotoPath("");
    setValue("photo_url", "");
    setValue("photo_storage_path", "");
  };

  const onSubmit = async (values: FollowupReportInput) => {
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await submitFollowUpReportAction({
        ...values,
        photo_url: photoUrl || null,
        photo_storage_path: photoPath || null,
      });

      if (!res.success) {
        setFormError(res.error || "Failed to submit follow-up report");
        toast.error("Submission failed");
        setSubmitting(false);
        return;
      }

      toast.success("Monthly welfare report submitted successfully!");
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch {
      setFormError("An unexpected error occurred. Please try again.");
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (!followup) return null;

  const dogName = followup.dog?.name || "your dog";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
        <DialogHeader className="border-b border-border/70 pb-4 text-left space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Heart className="h-4 w-4" />
            <span>Month {followup.month_number} Welfare Report</span>
          </div>
          <DialogTitle className="font-serif text-2xl font-normal text-foreground">
            Monthly Monitoring for {dogName}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Due date: {followup.due_date} · Help us ensure {dogName} is thriving in their new home.
          </DialogDescription>
        </DialogHeader>

        {formError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{formError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* 1. General Health & Condition */}
          <div className="space-y-2">
            <Label htmlFor="general_health" className="text-sm font-medium text-foreground">
              1. General health, weight &amp; coat condition <span className="text-destructive">*</span>
            </Label>
            <p className="text-xs text-muted-foreground">
              How is {dogName}&apos;s weight, energy, coat, and physical wellness?
            </p>
            <Textarea
              id="general_health"
              placeholder={`Describe ${dogName}'s physical condition, energy levels, weight changes, and general well-being...`}
              rows={3}
              className="text-sm leading-relaxed"
              {...register("general_health")}
              aria-invalid={Boolean(errors.general_health)}
            />
            {errors.general_health && (
              <p className="text-xs text-destructive">{errors.general_health.message}</p>
            )}
          </div>

          {/* 2. Eating, Behavior & Adjustment */}
          <div className="space-y-2">
            <Label htmlFor="eating_behavior_adjustment" className="text-sm font-medium text-foreground">
              2. Eating habits, behavior &amp; household adjustment <span className="text-destructive">*</span>
            </Label>
            <p className="text-xs text-muted-foreground">
              How are they eating, sleeping, getting along with family members, and adapting to routines?
            </p>
            <Textarea
              id="eating_behavior_adjustment"
              placeholder="Appetite, favorite activities, behavior with household members or other pets, crate/leash manners..."
              rows={3}
              className="text-sm leading-relaxed"
              {...register("eating_behavior_adjustment")}
              aria-invalid={Boolean(errors.eating_behavior_adjustment)}
            />
            {errors.eating_behavior_adjustment && (
              <p className="text-xs text-destructive">{errors.eating_behavior_adjustment.message}</p>
            )}
          </div>

          {/* 3. Veterinary Care */}
          <div className="space-y-2">
            <Label htmlFor="veterinary_care" className="text-sm font-medium text-foreground">
              3. Veterinary care &amp; medical visits <span className="text-destructive">*</span>
            </Label>
            <p className="text-xs text-muted-foreground">
              Recent checkups, vaccinations, parasite prevention, or upcoming vet appointments.
            </p>
            <Textarea
              id="veterinary_care"
              placeholder="e.g. Visited vet for annual booster; flea and heartworm preventative given on schedule; healthy..."
              rows={2}
              className="text-sm leading-relaxed"
              {...register("veterinary_care")}
              aria-invalid={Boolean(errors.veterinary_care)}
            />
            {errors.veterinary_care && (
              <p className="text-xs text-destructive">{errors.veterinary_care.message}</p>
            )}
          </div>

          {/* 4. Living Environment & Daily Care */}
          <div className="space-y-2">
            <Label htmlFor="living_environment" className="text-sm font-medium text-foreground">
              4. Living environment &amp; daily exercise <span className="text-destructive">*</span>
            </Label>
            <p className="text-xs text-muted-foreground">
              Sleeping arrangements, daily walk routine, and enrichment.
            </p>
            <Textarea
              id="living_environment"
              placeholder="e.g. Sleeps on orthopedic bed in bedroom; 2 daily walks and yard play; regular companionship..."
              rows={2}
              className="text-sm leading-relaxed"
              {...register("living_environment")}
              aria-invalid={Boolean(errors.living_environment)}
            />
            {errors.living_environment && (
              <p className="text-xs text-destructive">{errors.living_environment.message}</p>
            )}
          </div>

          {/* 5. Problems or Concerns Requiring Assistance (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="problems_concerns" className="text-sm font-medium text-foreground">
              5. Problems, behavioral challenges, or assistance requested
            </Label>
            <p className="text-xs text-muted-foreground">
              Optional: let our rehoming staff know if you need guidance with training, separation anxiety, or veterinary support.
            </p>
            <Textarea
              id="problems_concerns"
              placeholder="Any issues you'd like support with, or leave empty if everything is going smoothly..."
              rows={2}
              className="text-sm leading-relaxed"
              {...register("problems_concerns")}
            />
          </div>

          {/* 6. Optional Recent Dog Photo */}
          <div className="space-y-2.5 pt-2">
            <Label className="text-sm font-medium text-foreground">
              Recent photo of {dogName}
            </Label>
            <p className="text-xs text-muted-foreground">
              Upload a recent picture so we can see how {dogName} is doing (optional).
            </p>

            {photoUrl ? (
              <div className="relative w-40 h-32 rounded-xl overflow-hidden border border-border/80 group">
                <Image
                  src={photoUrl}
                  alt={`Recent photo of ${dogName}`}
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-xs"
                  title="Remove photo"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="relative border border-dashed border-border/80 rounded-xl p-4 text-center hover:border-primary/50 transition-colors bg-muted/10 max-w-sm">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  disabled={photoUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Upload recent dog photo"
                />
                <div className="flex flex-col items-center justify-center space-y-1.5 pointer-events-none">
                  {photoUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <Camera className="h-5 w-5 text-muted-foreground" />
                  )}
                  <p className="text-xs font-medium text-foreground">
                    {photoUploading ? "Uploading photo..." : "Attach a recent photo"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    JPG, PNG, or WebP up to 5MB
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/70">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || photoUploading}
              className="gap-2 font-semibold w-full sm:w-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting Report...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Submit Monthly Report</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
