"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  MapPin,
  Trash2,
  ExternalLink,
  ArrowRight,
  Dog as DogIcon,
  Check,
  Minus,
} from "lucide-react";
import { buttonVariants, Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteDogAction } from "@/app/actions/dogs";
import { formatDate, formatAge, formatCapitalize } from "@/lib/utils/format";
import { DogStatusBadge } from "@/components/shared/StatusBadges";
import { DOG_STATUSES } from "@/lib/constants/statuses";
import type { DogWithImages } from "@/types";
import { cn } from "@/lib/utils";

interface UserDogCardProps {
  dog: DogWithImages;
  applicationCount?: number;
  onDeleted?: (id: string) => void;
}

function getDogStatusGuidance(status: string): string {
  switch (status) {
    case DOG_STATUSES.AVAILABLE:
      return "Your dog's profile is now available to people looking to adopt.";
    case DOG_STATUSES.PENDING:
      return "Your dog's profile is being reviewed.";
    case DOG_STATUSES.REJECTED:
      return "Your dog's profile was not approved.";
    case DOG_STATUSES.RESERVED:
      return "An adoption application is currently in progress for this dog.";
    case DOG_STATUSES.ADOPTED:
      return "Adoption completed. This dog has settled into their new home.";
    default:
      return "Your dog's profile is on file.";
  }
}

export function UserDogCard({ dog, applicationCount = 0, onDeleted }: UserDogCardProps) {
  const [deleting, setDeleting] = React.useState(false);
  const [isDeleted, setIsDeleted] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  const canDelete = dog.status === DOG_STATUSES.PENDING;

  const handleDelete = async () => {
    setDeleting(true);
    const res = await deleteDogAction(dog.id);
    if (res.success) {
      setIsDeleted(true);
      toast.success(`${dog.name}'s profile has been removed.`);
      onDeleted?.(dog.id);
    } else {
      toast.error(res.error || "Failed to remove submission");
    }
    setDeleting(false);
  };

  if (isDeleted) {
    return null;
  }

  const primaryImg =
    dog.primary_image ||
    dog.images?.find((img) => img.is_primary)?.public_url ||
    dog.images?.[0]?.public_url;

  const statusGuidance = getDogStatusGuidance(dog.status);

  return (
    <>
      <article className="overflow-hidden rounded-2xl border border-border/80 bg-card hover:border-primary/40 transition-all duration-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row">
          {/* Dog Photograph */}
          <div className="relative sm:w-52 md:w-60 aspect-[16/10] sm:aspect-auto shrink-0 bg-muted/40 overflow-hidden">
            {primaryImg ? (
              <Image
                src={primaryImg}
                alt={dog.name}
                fill
                sizes="(max-width: 640px) 100vw, 240px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center p-6 bg-muted/40 text-muted-foreground/40">
                <DogIcon className="h-10 w-10" />
              </div>
            )}
          </div>

          {/* Details Body */}
          <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              {/* Header: Name and Status */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div>
                  <h3 className="font-serif text-2xl font-normal text-foreground">
                    {dog.status === DOG_STATUSES.AVAILABLE ? (
                      <Link
                        href={`/dogs/${dog.id}`}
                        className="hover:text-primary transition-colors inline-flex items-center gap-1.5"
                      >
                        <span>{dog.name}</span>
                      </Link>
                    ) : (
                      <span>{dog.name}</span>
                    )}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {dog.breed} · {formatAge(dog.age_years, dog.age_months)}
                    {dog.gender && ` · ${formatCapitalize(dog.gender)}`}
                  </p>
                </div>

                <div className="self-start sm:self-auto">
                  <DogStatusBadge status={dog.status} />
                </div>
              </div>

              {/* Status and Submission Context */}
              <div className="space-y-1 text-xs">
                <p className="text-muted-foreground">
                  Submitted {formatDate(dog.created_at)}
                </p>
                <p className="text-foreground font-medium text-xs sm:text-sm">
                  {statusGuidance}
                </p>
              </div>

              {/* Adoption Activity indicator if available */}
              {dog.status === DOG_STATUSES.AVAILABLE && applicationCount > 0 && (
                <div className="rounded-xl border border-border/70 bg-muted/30 p-2.5 text-xs flex items-center justify-between">
                  <span className="text-muted-foreground">Adoption activity</span>
                  <span className="font-semibold text-foreground">
                    {applicationCount} {applicationCount === 1 ? "application" : "applications"} received
                  </span>
                </div>
              )}

              {/* Rejection Feedback if any */}
              {dog.status === DOG_STATUSES.REJECTED && dog.rejection_reason && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs space-y-0.5">
                  <p className="font-semibold text-destructive">Review feedback</p>
                  <p className="text-muted-foreground leading-relaxed">
                    {dog.rejection_reason}
                  </p>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                {dog.status === DOG_STATUSES.AVAILABLE ? (
                  <Link
                    href={`/dogs/${dog.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline underline-offset-4"
                  >
                    <span>View public profile</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDetailsOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline underline-offset-4 cursor-pointer"
                  >
                    <span>{dog.status === DOG_STATUSES.REJECTED ? "View details" : "View profile"}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}

                <Link
                  href={`/dogs/${dog.id}`}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <MapPin className="h-3 w-3" />
                  <span>{dog.location}</span>
                </Link>
              </div>

              {canDelete && (
                <AlertDialog>
                  <AlertDialogTrigger
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "sm" }),
                      "h-7 px-2 text-xs text-muted-foreground hover:text-destructive cursor-pointer gap-1"
                    )}
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Withdraw</span>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Withdraw dog profile?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to withdraw {dog.name}&apos;s profile? This will remove the submission from review.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Profile</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={deleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleting ? "Removing..." : "Withdraw Profile"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>
      </article>

      {/* Dog Profile Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
          <DialogHeader className="space-y-1.5 border-b border-border/70 pb-4 text-left">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Dog Profile
              </span>
              <DogStatusBadge status={dog.status} />
            </div>
            <DialogTitle className="font-serif text-2xl font-normal text-foreground">
              {dog.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {dog.breed} · {formatAge(dog.age_years, dog.age_months)} · {dog.location}
            </DialogDescription>
          </DialogHeader>

          {/* Status Message */}
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 text-xs text-foreground leading-relaxed">
            {statusGuidance}
          </div>

          {/* Details Content */}
          <div className="space-y-4 text-xs sm:text-sm divide-y divide-border/60">
            {/* Description */}
            <div className="space-y-1.5 pt-2 first:pt-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Personality &amp; Story
              </p>
              <div className="text-xs sm:text-sm text-foreground whitespace-pre-line leading-relaxed bg-muted/20 p-3 rounded-xl">
                {dog.description}
              </div>
            </div>

            {/* Health & Background */}
            <div className="space-y-2 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Care &amp; Health Background
              </p>
              <div className="space-y-1 text-xs sm:text-sm">
                <p className="flex items-center gap-1.5 text-foreground">
                  <span className="text-muted-foreground">Vaccinations: </span>
                  {dog.vaccinated ? (
                    <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                      <Check className="h-3 w-3" /> Up to date
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Minus className="h-3 w-3" /> Pending or not recorded
                    </span>
                  )}
                </p>
                <p className="flex items-center gap-1.5 text-foreground">
                  <span className="text-muted-foreground">Spayed / Neutered: </span>
                  {dog.spayed_neutered ? (
                    <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                      <Check className="h-3 w-3" /> Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Minus className="h-3 w-3" /> No
                    </span>
                  )}
                </p>
                {dog.medical_history && (
                  <p className="text-foreground pt-1">
                    <span className="text-muted-foreground">Medical history: </span>
                    {dog.medical_history}
                  </p>
                )}
              </div>
            </div>

            {/* Special Needs if any */}
            {dog.special_needs && (
              <div className="space-y-1.5 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Special Needs or Considerations
                </p>
                <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                  {dog.special_needs}
                </p>
              </div>
            )}

            {/* Feedback if any */}
            {dog.status === DOG_STATUSES.REJECTED && dog.rejection_reason && (
              <div className="space-y-1.5 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-destructive">
                  Review feedback
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {dog.rejection_reason}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/70">
            {dog.status === DOG_STATUSES.AVAILABLE ? (
              <Link
                href={`/dogs/${dog.id}`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "gap-1.5 text-xs w-full sm:w-auto font-medium"
                )}
              >
                <span>View Public Listing</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            ) : (
              <div />
            )}

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setDetailsOpen(false)}
              className="text-xs w-full sm:w-auto font-medium"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
