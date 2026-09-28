"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Dog as DogIcon,
  Loader2,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { reviewDogAction } from "@/app/actions/admin";
import {
  formatAge,
  formatDate,
} from "@/lib/utils/format";
import { DogStatusBadge } from "@/components/shared/StatusBadges";
import { DOG_STATUSES } from "@/lib/constants/statuses";
import { cn } from "@/lib/utils";
import type { DogWithImages } from "@/types";

interface AdminDogRowProps {
  dog: DogWithImages;
}

export function AdminDogRow({ dog: initialDog }: AdminDogRowProps) {
  const [dog, setDog] = React.useState(initialDog);
  const [processing, setProcessing] = React.useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");

  const handleApprove = async () => {
    setProcessing(true);
    const res = await reviewDogAction(dog.id, DOG_STATUSES.AVAILABLE);
    if (res.success) {
      setDog((prev) => ({ ...prev, status: DOG_STATUSES.AVAILABLE }));
      toast.success(`${dog.name} has been approved and is now live.`);
    } else {
      toast.error(res.error || "Failed to approve dog");
    }
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejecting this listing.");
      return;
    }

    setProcessing(true);
    const res = await reviewDogAction(dog.id, DOG_STATUSES.REJECTED, rejectReason.trim());
    if (res.success) {
      setDog((prev) => ({
        ...prev,
        status: DOG_STATUSES.REJECTED,
        rejection_reason: rejectReason.trim(),
      }));
      setRejectDialogOpen(false);
      toast.success(`${dog.name} listing marked as rejected.`);
    } else {
      toast.error(res.error || "Failed to reject dog");
    }
    setProcessing(false);
  };

  const primaryImg =
    dog.primary_image ||
    dog.images?.find((img) => img.is_primary)?.public_url ||
    dog.images?.[0]?.public_url;

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl border bg-card shadow-2xs hover:shadow-xs transition-shadow">
      {/* Dog Media & Meta */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden bg-muted shrink-0 border">
          {primaryImg ? (
            <Image
              src={primaryImg}
              alt={dog.name}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <DogIcon className="h-6 w-6 text-muted-foreground/40" />
            </div>
          )}
        </div>

        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-foreground truncate">
              {dog.name}
            </h3>
            <DogStatusBadge status={dog.status} />
          </div>

          <p className="text-xs text-muted-foreground truncate">
            <span>{dog.breed}</span>
            <span className="mx-1">•</span>
            <span>{formatAge(dog.age_years, dog.age_months)}</span>
            <span className="mx-1">•</span>
            <span>{dog.location}</span>
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-muted-foreground">
            <span>Owner: <strong className="text-foreground">{dog.owner?.first_name || dog.owner_id.substring(0, 10)}</strong></span>
            <span>•</span>
            <span>Listed: {formatDate(dog.created_at)}</span>
            {dog.vaccinated && (
              <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-3 w-3" />
                Vax
              </span>
            )}
          </div>

          {dog.rejection_reason && (
            <p className="text-xs text-destructive pt-1">
              Rejection note: {dog.rejection_reason}
            </p>
          )}
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0">
        <Link
          href={`/dogs/${dog.id}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1 text-xs")}
          target="_blank"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Preview
        </Link>

        {dog.status === DOG_STATUSES.PENDING && (
          <>
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
              <DialogTrigger
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
                )}
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Dog Listing: {dog.name}</DialogTitle>
                  <DialogDescription>
                    Provide a clear explanation for rejecting this listing. The reason will be sent to the pet owner.
                  </DialogDescription>
                </DialogHeader>

                <div className="py-2 space-y-2">
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Unclear vaccination records, missing location confirmation, or violates policy..."
                    rows={4}
                  />
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setRejectDialogOpen(false)}
                    disabled={processing}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={processing || !rejectReason.trim()}
                  >
                    {processing ? "Rejecting..." : "Confirm Rejection"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              size="sm"
              onClick={handleApprove}
              disabled={processing}
              className="gap-1.5 text-xs font-semibold shadow-xs"
            >
              {processing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Approve Listing
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
