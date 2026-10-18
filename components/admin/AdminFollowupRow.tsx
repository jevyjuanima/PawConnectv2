"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  Heart,
  Dog as DogIcon,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Loader2,
  Camera,
  Video,
  Eye,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FollowupVideoPlayer } from "@/components/followups/FollowupVideoPlayer";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FollowupStatusBadge } from "@/components/shared/StatusBadges";
import { FOLLOWUP_STATUSES, type FollowupStatus } from "@/lib/constants/statuses";
import { reviewFollowupAction } from "@/app/actions/admin";
import { formatDate } from "@/lib/utils/format";
import type { FollowupWithDetails } from "@/types";
import { cn } from "@/lib/utils";

interface AdminFollowupRowProps {
  followup: FollowupWithDetails;
  onUpdated?: () => void;
}

export function AdminFollowupRow({
  followup: initialFollowup,
  onUpdated,
}: AdminFollowupRowProps) {
  const [followup, setFollowup] = React.useState(initialFollowup);
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [adminNotes, setAdminNotes] = React.useState(followup.admin_notes || "");
  const [requestAdditional, setRequestAdditional] = React.useState(
    followup.requires_additional_followup || false
  );
  const [instructions, setInstructions] = React.useState(
    followup.additional_followup_instructions || ""
  );
  const [submitting, setSubmitting] = React.useState(false);

  const dog = followup.dog;
  const adopter = followup.adopter;
  const primaryImg =
    dog?.primary_image ||
    dog?.images?.find((img) => img.is_primary)?.public_url ||
    dog?.images?.[0]?.public_url;

  const hasReport = Boolean(followup.submitted_at);

  const handleReviewSubmit = async (statusToSet: typeof FOLLOWUP_STATUSES.REVIEWED | typeof FOLLOWUP_STATUSES.NEEDS_FOLLOW_UP) => {
    setSubmitting(true);
    try {
      const res = await reviewFollowupAction(
        followup.id,
        statusToSet,
        adminNotes.trim() || undefined,
        requestAdditional,
        requestAdditional ? instructions.trim() || undefined : undefined
      );

      if (!res.success) {
        toast.error(res.error || "Failed to update follow-up");
        setSubmitting(false);
        return;
      }

      setFollowup((prev) => ({
        ...prev,
        status: statusToSet,
        admin_notes: adminNotes.trim() || null,
        requires_additional_followup: requestAdditional,
        additional_followup_instructions: requestAdditional ? instructions.trim() || null : null,
        reviewed_at: new Date().toISOString(),
      }));

      toast.success(
        statusToSet === FOLLOWUP_STATUSES.REVIEWED
          ? "Report marked as reviewed."
          : "Additional follow-up requested from adopter."
      );
      setReviewOpen(false);
      if (onUpdated) onUpdated();
    } catch {
      toast.error("An unexpected error occurred while reviewing follow-up.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xs hover:border-border transition-all space-y-4">
      {/* Row Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-muted shrink-0 border border-border/70">
            {primaryImg ? (
              <Image
                src={primaryImg}
                alt={dog?.name || "Dog"}
                fill
                sizes="48px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                <DogIcon className="h-6 w-6" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-foreground truncate">
                Month {followup.month_number} Follow-Up · {dog?.name || "Dog"}
              </h3>
              <FollowupStatusBadge status={followup.status} />
            </div>
            <p className="text-xs text-muted-foreground truncate">
              Adopter: <strong className="text-foreground">{adopter?.first_name || "User"} {adopter?.last_name || ""}</strong> ({adopter?.email})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto shrink-0 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>Due: {formatDate(followup.due_date)}</span>
          </div>
          {followup.submitted_at && (
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
              Reported {formatDate(followup.submitted_at)}
            </span>
          )}
          {followup.video_storage_path && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
              <Video className="h-3 w-3" />
              <span>Video</span>
            </span>
          )}
        </div>
      </div>

      {/* Snapshot / Summary */}
      {hasReport ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-muted/20 p-3.5 rounded-xl border border-border/60">
            <div>
              <span className="font-semibold text-muted-foreground">General Health: </span>
              <p className="text-foreground mt-0.5 line-clamp-2">{followup.general_health}</p>
            </div>
            <div>
              <span className="font-semibold text-muted-foreground">Adjustment &amp; Behavior: </span>
              <p className="text-foreground mt-0.5 line-clamp-2">{followup.eating_behavior_adjustment}</p>
            </div>
          </div>

          {followup.problems_concerns && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
              <span className="font-semibold flex items-center gap-1.5 mb-0.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                Adopter Concerns / Support Request:
              </span>
              <p className="leading-relaxed">{followup.problems_concerns}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/80 bg-muted/10 p-3.5 text-xs text-muted-foreground flex items-center justify-between">
          <span>Awaiting monthly welfare report submission from adopter.</span>
          <span className="text-[11px] font-medium">Due {followup.due_date}</span>
        </div>
      )}

      {/* Staff Notes */}
      {followup.admin_notes && (
        <div className="text-xs text-primary bg-primary/5 p-2.5 rounded-lg border border-primary/20">
          <span className="font-bold">Staff Private Note: </span>
          <span>{followup.admin_notes}</span>
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
        <div className="text-[11px] text-muted-foreground">
          {followup.reviewed_at ? (
            <span>Reviewed on {formatDate(followup.reviewed_at)}</span>
          ) : hasReport ? (
            <span className="text-blue-700 dark:text-blue-400 font-medium">Report Ready for Staff Review</span>
          ) : (
            <span>Report pending</span>
          )}
        </div>

        {hasReport && (
          <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
            <DialogTrigger
              render={
                <Button size="sm" className="text-xs gap-1.5 font-medium cursor-pointer">
                  <Eye className="h-3.5 w-3.5" />
                  <span>Review Report</span>
                </Button>
              }
            />
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
              <DialogHeader className="border-b border-border/70 pb-4 text-left space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Month {followup.month_number} Welfare Report
                  </span>
                  <FollowupStatusBadge status={followup.status} />
                </div>
                <DialogTitle className="font-serif text-2xl font-normal text-foreground">
                  Post-Adoption Monitoring for {dog?.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Adopter: {adopter?.first_name} {adopter?.last_name} ({adopter?.email}) · Submitted {followup.submitted_at ? formatDate(followup.submitted_at) : "N/A"}
                </DialogDescription>
              </DialogHeader>

              {/* Answers */}
              <div className="space-y-4 text-xs sm:text-sm divide-y divide-border/60">
                <div className="space-y-1 pt-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    1. General Health &amp; Condition
                  </p>
                  <p className="text-foreground leading-relaxed bg-muted/20 p-3 rounded-xl">
                    {followup.general_health}
                  </p>
                </div>

                <div className="space-y-1 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    2. Eating Habits &amp; Adjustment
                  </p>
                  <p className="text-foreground leading-relaxed bg-muted/20 p-3 rounded-xl">
                    {followup.eating_behavior_adjustment}
                  </p>
                </div>

                <div className="space-y-1 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    3. Veterinary Care
                  </p>
                  <p className="text-foreground leading-relaxed bg-muted/20 p-3 rounded-xl">
                    {followup.veterinary_care}
                  </p>
                </div>

                <div className="space-y-1 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    4. Living Environment &amp; Exercise
                  </p>
                  <p className="text-foreground leading-relaxed bg-muted/20 p-3 rounded-xl">
                    {followup.living_environment}
                  </p>
                </div>

                {followup.problems_concerns && (
                  <div className="space-y-1 pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      5. Problems / Concerns Requiring Staff Assistance
                    </p>
                    <p className="text-foreground leading-relaxed bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl">
                      {followup.problems_concerns}
                    </p>
                  </div>
                )}

                {followup.photo_url && (
                  <div className="space-y-2 pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Attached Dog Photo
                    </p>
                    <div className="relative aspect-video max-w-md rounded-xl overflow-hidden border border-border/80">
                      <Image
                        src={followup.photo_url}
                        alt="Follow-up dog photo"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Attached Dog Video or Informative Empty State */}
                <div className="space-y-2 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Attached Dog Video
                  </p>
                  {followup.video_storage_path ? (
                    <FollowupVideoPlayer storagePath={followup.video_storage_path} />
                  ) : (
                    <div className="flex items-center gap-2.5 p-3 rounded-xl border border-dashed border-border/80 bg-muted/10 text-xs text-muted-foreground">
                      <Video className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                      <span>No video clip was submitted for this monthly report.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Review & Feedback Section */}
              <div className="pt-2 border-t border-border/70 space-y-4">
                {/* Additional Follow-Up Checkbox */}
                <div
                  onClick={() => setRequestAdditional(!requestAdditional)}
                  className={cn(
                    "flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer select-none transition-all",
                    requestAdditional
                      ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30"
                      : "border-border/80 bg-card hover:bg-muted/20"
                  )}
                >
                  <Checkbox
                    id="requestAdditional"
                    checked={requestAdditional}
                    onCheckedChange={(checked) => setRequestAdditional(Boolean(checked))}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5 text-xs">
                    <Label htmlFor="requestAdditional" className="font-semibold text-foreground cursor-pointer">
                      Flag as &ldquo;Needs Follow-Up&rdquo;
                    </Label>
                    <p className="text-muted-foreground">
                      Check this if concerns are reported and staff intervention, advice, or veterinary clarification is required.
                    </p>
                  </div>
                </div>

                {requestAdditional && (
                  <div className="space-y-1.5 animate-in fade-in-50 duration-200">
                    <Label htmlFor="instructions" className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                      Instructions / Advice for Adopter
                    </Label>
                    <Textarea
                      id="instructions"
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="e.g. Please follow up with your vet regarding dietary changes, or let us know if crate training assistance is needed..."
                      rows={3}
                      className="text-xs border-amber-500/40"
                    />
                  </div>
                )}

                {/* Private Staff Notes */}
                <div className="space-y-1.5">
                  <Label htmlFor="admin_notes_followup" className="text-xs font-semibold text-foreground">
                    Private Administrative Notes (Internal Only)
                  </Label>
                  <Textarea
                    id="admin_notes_followup"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Internal welfare evaluation notes..."
                    rows={2}
                    className="text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/70">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReviewOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {requestAdditional ? (
                    <Button
                      size="sm"
                      onClick={() => handleReviewSubmit(FOLLOWUP_STATUSES.NEEDS_FOLLOW_UP)}
                      disabled={submitting}
                      className="gap-2 font-semibold bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                      <span>Request Follow-Up</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleReviewSubmit(FOLLOWUP_STATUSES.REVIEWED)}
                      disabled={submitting}
                      className="gap-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      <span>Mark as Reviewed</span>
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
