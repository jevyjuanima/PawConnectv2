"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Heart,
  Dog,
  AlertCircle,
  FileCheck,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Eye,
  Camera,
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
import { FollowupStatusBadge } from "@/components/shared/StatusBadges";
import { FollowupReportDialog } from "@/components/followups/FollowupReportDialog";
import { FOLLOWUP_STATUSES } from "@/lib/constants/statuses";
import { formatDate } from "@/lib/utils/format";
import type { FollowupWithDetails } from "@/types";
import { cn } from "@/lib/utils";

interface UserFollowupListProps {
  followups: FollowupWithDetails[];
}

export function UserFollowupList({ followups: initialFollowups }: UserFollowupListProps) {
  const router = useRouter();
  const [selectedForReport, setSelectedForReport] = React.useState<FollowupWithDetails | null>(null);
  const [selectedForView, setSelectedForView] = React.useState<FollowupWithDetails | null>(null);

  // Group followups by dog
  const dogsMap = React.useMemo(() => {
    const map = new Map<string, { dog: FollowupWithDetails["dog"]; items: FollowupWithDetails[] }>();

    for (const f of initialFollowups) {
      const dogId = f.dog_id;
      if (!map.has(dogId)) {
        map.set(dogId, { dog: f.dog, items: [] });
      }
      map.get(dogId)!.items.push(f);
    }

    // Sort items by month_number
    for (const entry of map.values()) {
      entry.items.sort((a, b) => a.month_number - b.month_number);
    }

    return Array.from(map.values());
  }, [initialFollowups]);

  if (initialFollowups.length === 0) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card p-8 sm:p-12 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Heart className="h-7 w-7" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="font-serif text-xl sm:text-2xl font-normal text-foreground">
            No active post-adoption monitoring
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            When you complete an adoption through PawConnect, a 12-month post-adoption monitoring schedule will appear here so you can share your monthly updates and photos.
          </p>
        </div>
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/my-applications" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            View My Applications
          </Link>
          <Link href="/dogs" className={cn(buttonVariants({ size: "sm" }))}>
            Browse Dogs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {dogsMap.map(({ dog, items }) => {
        const dogId = dog?.id || items[0]?.dog_id || "dog";
        const dogName = dog?.name || "Adopted Dog";
        const dogBreed = dog?.breed || "Companion";
        const primaryImg = dog?.primary_image;
        const completedReportsCount = items.filter(
          (i) => i.status === FOLLOWUP_STATUSES.SUBMITTED || i.status === FOLLOWUP_STATUSES.REVIEWED
        ).length;
        const pendingActionItem = items.find(
          (i) => i.status === FOLLOWUP_STATUSES.DUE || i.status === FOLLOWUP_STATUSES.NEEDS_FOLLOW_UP
        );

        return (
          <div
            key={dogId}
            className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs space-y-6"
          >
            {/* Dog Header Banner */}
            <div className="p-5 sm:p-6 border-b border-border/70 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-xl overflow-hidden bg-muted shrink-0 border border-border/80">
                  {primaryImg ? (
                    <Image
                      src={primaryImg}
                      alt={dogName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Dog className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif text-xl sm:text-2xl font-normal text-foreground">
                      {dogName}
                    </h2>
                    <span className="text-[11px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Adopted Family Member
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dogBreed} · 12-Month Post-Adoption Welfare Schedule ({completedReportsCount} of 12 completed)
                  </p>
                </div>
              </div>

              {pendingActionItem && (
                <Button
                  size="sm"
                  onClick={() => setSelectedForReport(pendingActionItem)}
                  className="gap-2 shrink-0 font-medium"
                >
                  <FileCheck className="h-4 w-4" />
                  <span>Submit Month {pendingActionItem.month_number} Report</span>
                </Button>
              )}
            </div>

            {/* Monthly Schedule Grid */}
            <div className="p-5 sm:p-6 pt-0 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {items.map((item) => {
                  const isDue = item.status === FOLLOWUP_STATUSES.DUE;
                  const needsFollowUp = item.status === FOLLOWUP_STATUSES.NEEDS_FOLLOW_UP;
                  const hasReport = Boolean(item.submitted_at);

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "rounded-xl border p-4 transition-all flex flex-col justify-between space-y-3",
                        isDue
                          ? "border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/20"
                          : needsFollowUp
                          ? "border-amber-500/50 bg-amber-500/10 ring-1 ring-amber-500/30"
                          : "border-border/70 bg-card hover:bg-muted/10"
                      )}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-foreground">
                            Month {item.month_number}
                          </span>
                          <FollowupStatusBadge status={item.status} />
                        </div>

                        <div className="text-xs space-y-1">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            <span>Due: {formatDate(item.due_date)}</span>
                          </div>
                          {item.submitted_at && (
                            <p className="text-[11px] text-muted-foreground">
                              Submitted: {formatDate(item.submitted_at)}
                            </p>
                          )}
                        </div>

                        {needsFollowUp && item.additional_followup_instructions && (
                          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-900 dark:text-amber-200">
                            <p className="font-semibold text-[11px]">Staff Follow-Up Request:</p>
                            <p className="text-[11px] leading-relaxed mt-0.5">
                              {item.additional_followup_instructions}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2">
                        {hasReport ? (
                          <button
                            type="button"
                            onClick={() => setSelectedForView(item)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline cursor-pointer"
                          >
                            <Eye className="h-3 w-3" />
                            <span>View Report</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">
                            No report yet
                          </span>
                        )}

                        {(isDue || needsFollowUp || !hasReport) && (
                          <Button
                            size="sm"
                            variant={isDue || needsFollowUp ? "default" : "outline"}
                            onClick={() => setSelectedForReport(item)}
                            className="text-xs h-7 px-2.5 font-medium cursor-pointer"
                          >
                            <span>{hasReport ? "Update" : "Submit"}</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      {/* Submission Dialog */}
      <FollowupReportDialog
        followup={selectedForReport}
        open={Boolean(selectedForReport)}
        onOpenChange={(open) => {
          if (!open) setSelectedForReport(null);
        }}
        onSuccess={() => {
          router.refresh();
        }}
      />

      {/* View Submitted Report Dialog */}
      <Dialog open={Boolean(selectedForView)} onOpenChange={(open) => !open && setSelectedForView(null)}>
        {selectedForView && (
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <DialogHeader className="border-b border-border/70 pb-4 text-left space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Month {selectedForView.month_number} Report
                </span>
                <FollowupStatusBadge status={selectedForView.status} />
              </div>
              <DialogTitle className="font-serif text-2xl font-normal text-foreground">
                Welfare Update for {selectedForView.dog?.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Submitted on {selectedForView.submitted_at ? formatDate(selectedForView.submitted_at) : "N/A"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs sm:text-sm divide-y divide-border/60">
              <div className="space-y-1 pt-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  General Health &amp; Weight
                </p>
                <p className="text-foreground leading-relaxed">{selectedForView.general_health}</p>
              </div>

              <div className="space-y-1 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Eating &amp; Adjustment
                </p>
                <p className="text-foreground leading-relaxed">
                  {selectedForView.eating_behavior_adjustment}
                </p>
              </div>

              <div className="space-y-1 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Veterinary Care
                </p>
                <p className="text-foreground leading-relaxed">{selectedForView.veterinary_care}</p>
              </div>

              <div className="space-y-1 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Living Environment &amp; Routine
                </p>
                <p className="text-foreground leading-relaxed">
                  {selectedForView.living_environment}
                </p>
              </div>

              {selectedForView.problems_concerns && (
                <div className="space-y-1 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Problems or Assistance Requested
                  </p>
                  <p className="text-foreground leading-relaxed">
                    {selectedForView.problems_concerns}
                  </p>
                </div>
              )}

              {selectedForView.additional_followup_instructions && (
                <div className="space-y-1 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Staff Follow-up Advice
                  </p>
                  <p className="text-foreground leading-relaxed bg-muted/30 p-2.5 rounded-lg border border-border/60">
                    {selectedForView.additional_followup_instructions}
                  </p>
                </div>
              )}

              {selectedForView.photo_url && (
                <div className="space-y-2 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Attached Photo
                  </p>
                  <div className="relative aspect-video max-w-sm rounded-xl overflow-hidden border border-border/80">
                    <Image
                      src={selectedForView.photo_url}
                      alt="Follow-up dog photo"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-4 border-t border-border/70 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedForView(null)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
