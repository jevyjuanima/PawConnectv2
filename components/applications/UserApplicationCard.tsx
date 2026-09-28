"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Dog as DogIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
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
import { formatDate } from "@/lib/utils/format";
import { ApplicationStatusBadge } from "@/components/shared/StatusBadges";
import { APPLICATION_STATUSES } from "@/lib/constants/statuses";
import { cn } from "@/lib/utils";
import type { ApplicationWithDetails } from "@/types";

interface UserApplicationCardProps {
  application: ApplicationWithDetails;
}

export function UserApplicationCard({
  application: initialApp,
}: UserApplicationCardProps) {
  const [app, setApp] = React.useState(initialApp);
  const [cancelling, setCancelling] = React.useState(false);

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
    } else {
      toast.error(res.error || "Failed to withdraw application");
    }
    setCancelling(false);
  };

  const dog = app.dog;
  const primaryImg =
    dog.primary_image ||
    dog.images?.find((img) => img.is_primary)?.public_url ||
    dog.images?.[0]?.public_url;

  return (
    <Card className="overflow-hidden rounded-2xl border bg-card shadow-xs transition-shadow hover:shadow-sm">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Dog Thumbnail & Quick Info */}
          <div className="relative md:w-64 aspect-[16/10] md:aspect-auto shrink-0 bg-muted overflow-hidden">
            {primaryImg ? (
              <Image
                src={primaryImg}
                alt={dog.name}
                fill
                sizes="(max-width: 768px) 100vw, 256px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center p-6 bg-muted">
                <DogIcon className="h-10 w-10 text-muted-foreground/40" />
              </div>
            )}
            <div className="absolute top-3 left-3 md:hidden">
              <ApplicationStatusBadge status={app.status} className="bg-background/90 backdrop-blur-md" />
            </div>
          </div>

          {/* Details Body */}
          <div className="flex-1 p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold tracking-tight text-foreground">
                    {dog.name}
                  </h3>
                  <div className="hidden md:block">
                    <ApplicationStatusBadge status={app.status} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span>{dog.breed}</span>
                  <span className="text-border">•</span>
                  <MapPin className="h-3 w-3" />
                  <span>{dog.location}</span>
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                <Calendar className="h-3.5 w-3.5" />
                <span>Submitted: {formatDate(app.created_at)}</span>
              </div>
            </div>

            {/* Application Progress Stepper */}
            <div className="grid grid-cols-4 gap-2 pt-1 text-center">
              {/* Step 1: Submitted */}
              <div className="flex flex-col items-center space-y-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-semibold text-foreground">Submitted</span>
              </div>

              {/* Step 2: Under Review */}
              <div className="flex flex-col items-center space-y-1">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full font-bold text-xs ${
                    app.status === APPLICATION_STATUSES.UNDER_REVIEW ||
                    app.status === APPLICATION_STATUSES.APPROVED ||
                    app.status === APPLICATION_STATUSES.COMPLETED
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {app.status === APPLICATION_STATUSES.UNDER_REVIEW ? (
                    <Clock className="h-4 w-4 animate-pulse" />
                  ) : app.status === APPLICATION_STATUSES.APPROVED ||
                    app.status === APPLICATION_STATUSES.COMPLETED ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <span>2</span>
                  )}
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">In Review</span>
              </div>

              {/* Step 3: Decision */}
              <div className="flex flex-col items-center space-y-1">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full font-bold text-xs ${
                    app.status === APPLICATION_STATUSES.APPROVED ||
                    app.status === APPLICATION_STATUSES.COMPLETED
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : app.status === APPLICATION_STATUSES.REJECTED
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {app.status === APPLICATION_STATUSES.REJECTED ? (
                    <XCircle className="h-4 w-4" />
                  ) : app.status === APPLICATION_STATUSES.APPROVED ||
                    app.status === APPLICATION_STATUSES.COMPLETED ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <span>3</span>
                  )}
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">
                  {app.status === APPLICATION_STATUSES.REJECTED ? "Rejected" : "Decision"}
                </span>
              </div>

              {/* Step 4: Finalized */}
              <div className="flex flex-col items-center space-y-1">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full font-bold text-xs ${
                    app.status === APPLICATION_STATUSES.COMPLETED
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {app.status === APPLICATION_STATUSES.COMPLETED ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <span>4</span>
                  )}
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">Adoption Complete</span>
              </div>
            </div>

            {/* Notes / Feedback */}
            {app.admin_notes && (
              <div className="rounded-xl bg-primary/5 p-3 text-xs border border-primary/20">
                <p className="font-semibold text-primary mb-0.5">Staff Review Notes:</p>
                <p className="text-muted-foreground">{app.admin_notes}</p>
              </div>
            )}

            {app.rejection_reason && (
              <div className="rounded-xl bg-destructive/10 p-3 text-xs border border-destructive/20">
                <p className="font-semibold text-destructive mb-0.5 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Reason for Decision:
                </p>
                <p className="text-muted-foreground">{app.rejection_reason}</p>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t">
              <Link
                href={`/dogs/${dog.id}`}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "gap-1 text-xs text-primary"
                )}
              >
                View Dog Profile
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>

              {canCancel && (
                <AlertDialog>
                  <AlertDialogTrigger
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "text-xs text-muted-foreground hover:text-destructive cursor-pointer"
                    )}
                  >
                    Withdraw Application
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Withdraw Adoption Application?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to withdraw your adoption application for {dog.name}?
                        This action will mark the application as cancelled.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Application</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {cancelling ? "Withdrawing..." : "Yes, Withdraw"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
