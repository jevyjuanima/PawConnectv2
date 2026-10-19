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
  Video,
  PlayCircle,
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
import {
  createDogPhotoUploadUrlAction,
  deleteDogPhotoAction,
  createDogVideoUploadUrlAction,
} from "@/app/actions/upload";
import { validateDogImageFile, validateDogVideoFile, VIDEO_UPLOAD_LIMITS } from "@/lib/validations/upload";
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
  const [videoPath, setVideoPath] = React.useState<string>(followup?.video_storage_path || "");
  const [videoFileName, setVideoFileName] = React.useState<string>("");
  const [videoUploading, setVideoUploading] = React.useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = React.useState(0);
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
      video_storage_path: followup?.video_storage_path || "",
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
        video_storage_path: followup.video_storage_path || "",
      });
      setPhotoUrl(followup.photo_url || "");
      setPhotoPath(followup.photo_storage_path || "");
      setVideoPath(followup.video_storage_path || "");
      setVideoFileName("");
      setVideoUploadProgress(0);
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
      const urlRes = await createDogPhotoUploadUrlAction({
        name: file.name,
        size: file.size,
        type: file.type,
      });

      if (!urlRes.success || !urlRes.data) {
        toast.error(urlRes.error || "Failed to prepare photo upload");
        return;
      }

      const { signedUrl, storagePath, publicUrl } = urlRes.data;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", signedUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Photo upload failed with status ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error("Network error during photo upload"));
        xhr.send(file);
      });

      setPhotoUrl(publicUrl);
      setPhotoPath(storagePath);
      setValue("photo_url", publicUrl);
      setValue("photo_storage_path", storagePath);
      toast.success("Photo attached");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error uploading photo");
    } finally {
      setPhotoUploading(false);
      e.target.value = "";
    }
  };

  const handleRemovePhoto = () => {
    if (photoPath) {
      deleteDogPhotoAction(photoPath).catch(() => {});
    }
    setPhotoUrl("");
    setPhotoPath("");
    setValue("photo_url", "");
    setValue("photo_storage_path", "");
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateDogVideoFile({
      name: file.name,
      size: file.size,
      type: file.type,
    });

    if (!validation.valid) {
      toast.error(validation.error || "Invalid video file");
      e.target.value = "";
      return;
    }

    setVideoUploading(true);
    setVideoUploadProgress(0);
    setVideoFileName(file.name);

    try {
      // Step 1: Get a signed upload URL from the server
      const urlRes = await createDogVideoUploadUrlAction({
        name: file.name,
        size: file.size,
        type: file.type,
      });

      if (!urlRes.success || !urlRes.data) {
        toast.error(urlRes.error || "Failed to prepare video upload");
        setVideoUploading(false);
        setVideoFileName("");
        e.target.value = "";
        return;
      }

      const { signedUrl, storagePath } = urlRes.data;

      // Step 2: Upload directly to Supabase Storage via XHR (enables progress)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", signedUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            setVideoUploadProgress(Math.round((evt.loaded / evt.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error("Network error during video upload"));
        xhr.send(file);
      });

      setVideoPath(storagePath);
      setValue("video_storage_path", storagePath);
      setVideoUploadProgress(100);
      toast.success("Video attached successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Video upload failed");
      setVideoPath("");
      setVideoFileName("");
      setValue("video_storage_path", "");
    } finally {
      setVideoUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveVideo = () => {
    setVideoPath("");
    setVideoFileName("");
    setVideoUploadProgress(0);
    setValue("video_storage_path", "");
  };

  const onSubmit = async (values: FollowupReportInput) => {
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await submitFollowUpReportAction({
        ...values,
        photo_url: photoUrl || null,
        photo_storage_path: photoPath || null,
        video_storage_path: videoPath || null,
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
          <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
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
                  disabled={photoUploading || videoUploading}
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

          {/* 7. Optional Dog Welfare Video */}
          <div className="space-y-2.5 pt-1">
            <Label className="text-sm font-medium text-foreground">
              Short video of {dogName} <span className="text-xs font-normal text-muted-foreground">(optional)</span>
            </Label>
            <p className="text-xs text-muted-foreground">
              Upload a short video clip showing {dogName}&apos;s current condition, behaviour, or daily routine. MP4 or WebM, up to {VIDEO_UPLOAD_LIMITS.MAX_FILE_SIZE_LABEL}.
            </p>

            {videoPath ? (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-600/40 bg-emerald-500/5">
                <PlayCircle className="h-8 w-8 text-emerald-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {videoFileName || "Video attached"}
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    Uploaded · ready to submit
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveVideo}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  title="Remove video"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : videoUploading ? (
              <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Uploading video... {videoUploadProgress}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-200 rounded-full"
                    style={{ width: `${videoUploadProgress}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{videoFileName}</p>
              </div>
            ) : (
              <div className="relative border border-dashed border-border/80 rounded-xl p-4 text-center hover:border-primary/50 transition-colors bg-muted/10 max-w-sm">
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={handleVideoUpload}
                  disabled={videoUploading || photoUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Upload follow-up dog video"
                />
                <div className="flex flex-col items-center justify-center space-y-1.5 pointer-events-none">
                  <Video className="h-5 w-5 text-muted-foreground" />
                  <p className="text-xs font-medium text-foreground">Attach a short video clip</p>
                  <p className="text-[11px] text-muted-foreground">MP4 or WebM · up to {VIDEO_UPLOAD_LIMITS.MAX_FILE_SIZE_LABEL}</p>
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
              disabled={submitting || photoUploading || videoUploading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || photoUploading || videoUploading}
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
