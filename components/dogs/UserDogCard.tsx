"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  Calendar,
  MapPin,
  Trash2,
  ExternalLink,
  AlertCircle,
  Dog as DogIcon,
  ShieldAlert,
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
import { deleteDogAction } from "@/app/actions/dogs";
import { formatDate, formatAge } from "@/lib/utils/format";
import { DogStatusBadge } from "@/components/shared/StatusBadges";
import { DOG_STATUSES } from "@/lib/constants/statuses";
import { cn } from "@/lib/utils";
import type { DogWithImages } from "@/types";

interface UserDogCardProps {
  dog: DogWithImages;
  onDeleted?: (id: string) => void;
}

export function UserDogCard({ dog, onDeleted }: UserDogCardProps) {
  const [deleting, setDeleting] = React.useState(false);
  const [isDeleted, setIsDeleted] = React.useState(false);

  const canDelete = dog.status === DOG_STATUSES.PENDING;

  const handleDelete = async () => {
    setDeleting(true);
    const res = await deleteDogAction(dog.id);
    if (res.success) {
      setIsDeleted(true);
      toast.success(`${dog.name}'s listing has been deleted.`);
      onDeleted?.(dog.id);
    } else {
      toast.error(res.error || "Failed to delete listing");
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

  return (
    <Card className="overflow-hidden rounded-2xl border bg-card shadow-xs transition-shadow hover:shadow-sm">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Dog Thumbnail */}
          <div className="relative sm:w-56 aspect-[16/10] sm:aspect-auto shrink-0 bg-muted overflow-hidden">
            {primaryImg ? (
              <Image
                src={primaryImg}
                alt={dog.name}
                fill
                sizes="(max-width: 640px) 100vw, 224px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center p-6 bg-muted">
                <DogIcon className="h-10 w-10 text-muted-foreground/40" />
              </div>
            )}
            <div className="absolute top-3 left-3 sm:hidden">
              <DogStatusBadge status={dog.status} className="bg-background/90 backdrop-blur-md" />
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
                  <div className="hidden sm:block">
                    <DogStatusBadge status={dog.status} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span>{dog.breed}</span>
                  <span className="text-border">•</span>
                  <span>{formatAge(dog.age_years, dog.age_months)}</span>
                  <span className="text-border">•</span>
                  <MapPin className="h-3 w-3" />
                  <span>{dog.location}</span>
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                <Calendar className="h-3.5 w-3.5" />
                <span>Listed: {formatDate(dog.created_at)}</span>
              </div>
            </div>

            {/* Status alerts */}
            {dog.status === DOG_STATUSES.PENDING && (
              <div className="rounded-xl bg-amber-500/10 p-3 text-xs border border-amber-500/20 text-foreground flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Pending Administrative Review: </span>
                  <span className="text-muted-foreground">
                    PawConnect staff are verifying details. Once approved, {dog.name} will be visible publicly.
                  </span>
                </div>
              </div>
            )}

            {dog.status === DOG_STATUSES.REJECTED && (
              <div className="rounded-xl bg-destructive/10 p-3 text-xs border border-destructive/20 text-foreground space-y-1">
                <p className="font-bold text-destructive flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4" />
                  Listing Rejected by Admin
                </p>
                {dog.rejection_reason && (
                  <p className="text-muted-foreground">{dog.rejection_reason}</p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t">
              {dog.status === DOG_STATUSES.AVAILABLE ? (
                <Link
                  href={`/dogs/${dog.id}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "gap-1.5 text-xs"
                  )}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Public Listing
                </Link>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Status: <strong className="text-foreground capitalize">{dog.status}</strong>
                </span>
              )}

              {canDelete && (
                <AlertDialog>
                  <AlertDialogTrigger
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "sm" }),
                      "text-xs text-destructive hover:bg-destructive/10 gap-1.5 cursor-pointer"
                    )}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Submission
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Dog Listing?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {dog.name}&apos;s rehoming submission?
                        This will permanently remove the listing from PawConnect.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Listing</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={deleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleting ? "Deleting..." : "Yes, Delete"}
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
