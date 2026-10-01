"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  MapPin,
  Dog as DogIcon,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { cancelApplicationAction } from "@/app/actions/applications";
import { formatAge, formatCapitalize, formatDate } from "@/lib/utils/format";
import { ApplicationStatusBadge } from "@/components/shared/StatusBadges";
import { APPLICATION_STATUSES } from "@/lib/constants/statuses";
import type { ApplicationWithDetails } from "@/types";
import { cn } from "@/lib/utils";

interface UserApplicationCardProps {
  application: ApplicationWithDetails;
  hasUnreadNotification?: boolean;
  isPast?: boolean;
}

function getHousingLabel(type: string): string {
  switch (type) {
    case "own_house":
      return "Own House";
    case "rent_house":
      return "Rent House";
    case "apartment":
      return "Apartment";
    case "condo":
      return "Condo";
    case "other":
      return "Other";
    default:
      return type;
  }
}

function getExperienceLabel(level: string): string {
  switch (level) {
    case "first_time":
      return "First-Time Dog Parent";
    case "experienced":
      return "Experienced Pet Owner";
    case "expert":
      return "Expert / Trainer";
    default:
      return level;
  }
}

function getStatusGuidance(status: string): string {
  switch (status) {
    case APPLICATION_STATUSES.APPROVED:
      return "Your application has been approved. Check the next step in your adoption journey.";
    case APPLICATION_STATUSES.UNDER_REVIEW:
      return "Your application is currently being reviewed.";
    case APPLICATION_STATUSES.PENDING:
      return "Your application has been received and is queued for review.";
    case APPLICATION_STATUSES.COMPLETED:
      return "Adoption completed. Thank you for welcoming this dog into your home.";
    case APPLICATION_STATUSES.REJECTED:
      return "Your application was not selected for this dog.";
    case APPLICATION_STATUSES.CANCELLED:
      return "This application was withdrawn.";
    default:
      return "Your application is being processed.";
  }
}

export function UserApplicationCard({
  application: initialApp,
  hasUnreadNotification = false,
  isPast = false,
}: UserApplicationCardProps) {
  const [app, setApp] = React.useState(initialApp);
  const [cancelling, setCancelling] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  const dog = app.dog;
  const primaryImg =
    dog.primary_image ||
    dog.images?.find((img) => img.is_primary)?.public_url ||
    dog.images?.[0]?.public_url;

  const canCancel =
    app.status === APPLICATION_STATUSES.PENDING ||
    app.status === APPLICATION_STATUSES.UNDER_REVIEW;

  const handleCancel = async () => {
    setCancelling(true);
    const res = await cancelApplicationAction(app.id);
    if (res.success) {
      setApp((prev) => ({
        ...prev,
        status: APPLICATION_STATUSES.CANCELLED,
      }));
      toast.success("Application successfully withdrawn.");
      setDetailsOpen(false);
    } else {
      toast.error(res.error || "Failed to withdraw application");
    }
    setCancelling(false);
  };

  const statusGuidance = getStatusGuidance(app.status);

  return (
    <>
      <article
        className={cn(
          "overflow-hidden rounded-2xl border transition-all duration-200",
          isPast
            ? "border-border/60 bg-card/60 opacity-90 hover:opacity-100 hover:border-border"
            : "border-border/80 bg-card hover:border-primary/40 shadow-2xs"
        )}
      >
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

          {/* Application Details Body */}
          <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              {/* Top Row: Dog Name & Status */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div>
                  <h3 className="font-serif text-2xl font-normal text-foreground">
                    <Link
                      href={`/dogs/${dog.id}`}
                      className="hover:text-primary transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>{dog.name}</span>
                    </Link>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {dog.breed} · {formatAge(dog.age_years, dog.age_months)}
                    {dog.gender && ` · ${formatCapitalize(dog.gender)}`}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <ApplicationStatusBadge status={app.status} />
                  {hasUnreadNotification && (
                    <span
                      title="New update available"
                      className="flex h-2 w-2 rounded-full bg-primary"
                    />
                  )}
                </div>
              </div>

              {/* Status and Submission Context */}
              <div className="space-y-1 text-xs">
                <p className="text-muted-foreground">
                  Submitted {formatDate(app.created_at)}
                </p>
                <p className="text-foreground font-medium text-xs sm:text-sm">
                  {statusGuidance}
                </p>
              </div>

              {/* Staff Notes / Decision Reason */}
              {app.admin_notes && (
                <div className="rounded-xl border border-border/70 bg-muted/30 p-3 text-xs space-y-0.5">
                  <p className="font-semibold text-foreground">Note from staff</p>
                  <p className="text-muted-foreground leading-relaxed">
                    {app.admin_notes}
                  </p>
                </div>
              )}

              {app.rejection_reason && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs space-y-0.5">
                  <p className="font-semibold text-destructive">Decision feedback</p>
                  <p className="text-muted-foreground leading-relaxed">
                    {app.rejection_reason}
                  </p>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <button
                type="button"
                onClick={() => setDetailsOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline underline-offset-4 cursor-pointer"
              >
                <span>View application</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <div className="flex items-center gap-3">
                <Link
                  href={`/dogs/${dog.id}`}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <MapPin className="h-3 w-3" />
                  <span>{dog.location}</span>
                </Link>

                {canCancel && (
                  <AlertDialog>
                    <AlertDialogTrigger
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                        "h-7 px-2 text-xs text-muted-foreground hover:text-destructive cursor-pointer"
                      )}
                    >
                      Withdraw
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Withdraw application?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to withdraw your adoption application for {dog.name}? This will mark your application as cancelled.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Application</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCancel}
                          disabled={cancelling}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {cancelling ? "Withdrawing..." : "Withdraw Application"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Application Detail Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
          <DialogHeader className="space-y-1.5 border-b border-border/70 pb-4 text-left">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Adoption Questionnaire
              </span>
              <ApplicationStatusBadge status={app.status} />
            </div>
            <DialogTitle className="font-serif text-2xl font-normal text-foreground">
              Application for {dog.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Submitted on {formatDate(app.created_at)} · {dog.breed} in {dog.location}
            </DialogDescription>
          </DialogHeader>

          {/* Status Message */}
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 text-xs text-foreground leading-relaxed">
            {statusGuidance}
          </div>

          {/* Questionnaire Answers */}
          <div className="space-y-4 text-xs sm:text-sm divide-y divide-border/60">
            {/* About You */}
            <div className="space-y-1.5 pt-2 first:pt-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                About you
              </p>
              <p className="text-foreground">
                <span className="text-muted-foreground">Household members: </span>
                {app.household_members_count} {app.household_members_count === 1 ? "person" : "people"}
              </p>
            </div>

            {/* Your Home */}
            <div className="space-y-1.5 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your home
              </p>
              <p className="text-foreground">
                <span className="text-muted-foreground">Residence: </span>
                {getHousingLabel(app.housing_type)}
              </p>
              <p className="text-foreground">
                <span className="text-muted-foreground">Enclosed yard: </span>
                {app.has_yard ? "Yes, secure enclosed yard" : "No enclosed yard"}
              </p>
            </div>

            {/* Experience & Care */}
            <div className="space-y-1.5 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Experience &amp; care
              </p>
              <p className="text-foreground">
                <span className="text-muted-foreground">Dog experience: </span>
                {getExperienceLabel(app.experience_level)}
              </p>
              <p className="text-foreground">
                <span className="text-muted-foreground">Other pets in home: </span>
                {app.has_other_pets ? app.other_pets_details || "Yes" : "None"}
              </p>
            </div>

            {/* Plans */}
            <div className="space-y-1.5 pt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your plans for {dog.name}
              </p>
              <div className="text-xs sm:text-sm text-foreground whitespace-pre-line leading-relaxed bg-muted/20 p-3 rounded-xl">
                {app.reason_for_adopting}
              </div>
            </div>

            {/* Staff Notes if any */}
            {app.admin_notes && (
              <div className="space-y-1.5 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Staff review notes
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {app.admin_notes}
                </p>
              </div>
            )}

            {/* Rejection reason if any */}
            {app.rejection_reason && (
              <div className="space-y-1.5 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-destructive">
                  Decision notes
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {app.rejection_reason}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/70">
            <Link
              href={`/dogs/${dog.id}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-1.5 text-xs w-full sm:w-auto font-medium"
              )}
            >
              <span>View Dog Profile</span>
              <ExternalLink className="h-3 w-3" />
            </Link>

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
