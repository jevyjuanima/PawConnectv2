"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Home,
  Users,
  Dog as DogIcon,
  Loader2,
  Eye,
  AlertTriangle,
  Stethoscope,
  Heart,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScreeningStatusBadge } from "@/components/shared/StatusBadges";
import { SCREENING_STATUSES, type ScreeningStatus } from "@/lib/constants/statuses";
import { reviewScreeningAction } from "@/app/actions/admin";
import { formatDate } from "@/lib/utils/format";
import type { HouseholdScreeningWithDetails, SuitabilityScoreResult } from "@/types";
import { cn } from "@/lib/utils";
import { SuitabilityScoreCard } from "@/components/admin/SuitabilityScoreCard";

interface AdminScreeningRowProps {
  screening: HouseholdScreeningWithDetails;
  /** Authoritative suitability score pre-computed by the server component. */
  scoreResult: SuitabilityScoreResult;
  onUpdated?: () => void;
}

export function AdminScreeningRow({
  screening: initialScreening,
  scoreResult,
  onUpdated,
}: AdminScreeningRowProps) {
  const [screening, setScreening] = React.useState(initialScreening);
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [selectedStatus, setSelectedStatus] = React.useState<ScreeningStatus>(screening.status);
  const [adminNotes, setAdminNotes] = React.useState(screening.admin_notes || "");
  const [rejectionReason, setRejectionReason] = React.useState(screening.rejection_reason || "");
  const [submitting, setSubmitting] = React.useState(false);

  const dog = screening.dog;
  const applicant = screening.applicant;
  const primaryImg =
    dog?.primary_image ||
    dog?.images?.find((img) => img.is_primary)?.public_url ||
    dog?.images?.[0]?.public_url;

  const handleReviewSubmit = async () => {
    if (selectedStatus === SCREENING_STATUSES.REJECTED && !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason explaining the decision to the applicant.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await reviewScreeningAction(
        screening.id,
        selectedStatus,
        adminNotes.trim() || undefined,
        selectedStatus === SCREENING_STATUSES.REJECTED ? rejectionReason.trim() : undefined
      );

      if (!res.success) {
        toast.error(res.error || "Failed to update screening record");
        setSubmitting(false);
        return;
      }

      setScreening((prev) => ({
        ...prev,
        status: selectedStatus,
        admin_notes: adminNotes.trim() || null,
        rejection_reason:
          selectedStatus === SCREENING_STATUSES.REJECTED ? rejectionReason.trim() || null : null,
        reviewed_at: new Date().toISOString(),
      }));

      toast.success(`Screening marked as ${selectedStatus.replace("_", " ")}.`);
      setReviewOpen(false);
      if (onUpdated) onUpdated();
    } catch {
      toast.error("An unexpected error occurred while reviewing screening.");
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
                Screening for {dog?.name || "Dog"}
              </h3>
              <ScreeningStatusBadge status={screening.status} />
              {/* Suitability tier badge */}
              <span
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full",
                  scoreResult.tier === "strong" && "bg-emerald-700 text-white",
                  scoreResult.tier === "positive" && "bg-primary text-primary-foreground",
                  scoreResult.tier === "mixed" && "bg-amber-600 text-white",
                  scoreResult.tier === "limited" && "bg-orange-700 text-white"
                )}
              >
                {scoreResult.totalScore}/100 · {scoreResult.tierLabel}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              Applicant: <strong className="text-foreground">{applicant?.first_name || "User"} {applicant?.last_name || ""}</strong> ({applicant?.email})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>Submitted {formatDate(screening.created_at)}</span>
        </div>
      </div>

      {/* Snapshot Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-muted/20 p-3.5 rounded-xl border border-border/60">
        <div className="space-y-0.5">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
            <Users className="h-3 w-3" />
            Agreement
          </span>
          <p className="font-semibold text-emerald-700 dark:text-emerald-400">
            {screening.household_agreement ? "All Members Agree" : "Not Confirmed"}
          </p>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
            <Home className="h-3 w-3" />
            Housing
          </span>
          <p className="font-semibold text-foreground capitalize">
            {screening.housing_type.replace("_", " ")}
          </p>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Daily Alone Time
          </span>
          <p className="font-semibold text-foreground">
            {screening.daily_alone_hours} hrs / day
          </p>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            Children
          </span>
          <p className="font-semibold text-foreground">
            {screening.has_children ? "Yes in home" : "No children"}
          </p>
        </div>
      </div>

      {/* Routine & Care Excerpts */}
      <div className="space-y-1 text-xs">
        <span className="font-semibold text-muted-foreground">Household routine:</span>
        <p className="text-foreground line-clamp-2 leading-relaxed bg-background/50 p-2.5 rounded-lg border border-border/50">
          {screening.household_members_details}
        </p>
      </div>

      {/* Private Admin Notes */}
      {screening.admin_notes && (
        <div className="text-xs text-primary bg-primary/5 p-2.5 rounded-lg border border-primary/20">
          <span className="font-bold">Staff Private Note: </span>
          <span>{screening.admin_notes}</span>
        </div>
      )}

      {/* Rejection Reason */}
      {screening.rejection_reason && (
        <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-lg border border-destructive/20">
          <span className="font-bold">Rejection Feedback to Applicant: </span>
          <span>{screening.rejection_reason}</span>
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
        <div className="text-[11px] text-muted-foreground">
          {screening.reviewed_at ? (
            <span>Reviewed on {formatDate(screening.reviewed_at)}</span>
          ) : (
            <span className="text-amber-700 dark:text-amber-400 font-medium">Awaiting Administrator Review</span>
          )}
        </div>

        <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
          <DialogTrigger
            render={
              <Button size="sm" className="text-xs gap-1.5 font-medium cursor-pointer">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Review Household Suitability</span>
              </Button>
            }
          />
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
            <DialogHeader className="border-b border-border/70 pb-4 text-left space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Household Suitability Review
                </span>
                <ScreeningStatusBadge status={screening.status} />
              </div>
              <DialogTitle className="font-serif text-2xl font-normal text-foreground">
                Screening for {dog?.name || "Dog"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Applicant: {applicant?.first_name} {applicant?.last_name} ({applicant?.email})
              </DialogDescription>
            </DialogHeader>

            {/* Suitability Score */}
            <SuitabilityScoreCard result={scoreResult} />

            {/* Comprehensive Questionnaire Inspection */}
            <div className="space-y-4 text-xs sm:text-sm divide-y divide-border/60">
              {/* 1. Household & Agreement */}
              <div className="space-y-1.5 pt-2 first:pt-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  1. Household Agreement &amp; Structure
                </p>
                <div className="bg-muted/20 p-3 rounded-xl space-y-1 text-xs">
                  <p>
                    <span className="text-muted-foreground">Agreement: </span>
                    <strong className="text-emerald-700 dark:text-emerald-400">
                      {screening.household_agreement ? "All members agree" : "Not agreed"}
                    </strong>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Routine &amp; Members: </span>
                    <span className="text-foreground">{screening.household_members_details}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Children: </span>
                    <span className="text-foreground">
                      {screening.has_children ? screening.children_details || "Yes" : "None"}
                    </span>
                  </p>
                </div>
              </div>

              {/* 2. Housing Suitability */}
              <div className="space-y-1.5 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  2. Housing &amp; Permission
                </p>
                <div className="bg-muted/20 p-3 rounded-xl space-y-1 text-xs">
                  <p>
                    <span className="text-muted-foreground">Residence: </span>
                    <strong className="text-foreground capitalize">{screening.housing_type.replace("_", " ")}</strong>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Landlord / HOA Permission: </span>
                    <span>{screening.landlord_permission ? "Confirmed permission" : "N/A or Pending"}</span>
                  </p>
                </div>
              </div>

              {/* 3. Pet Care Experience */}
              <div className="space-y-1.5 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  3. Previous Experience &amp; Existing Animals
                </p>
                <div className="bg-muted/20 p-3 rounded-xl space-y-1 text-xs">
                  <p>
                    <span className="text-muted-foreground">Background: </span>
                    <span className="text-foreground">{screening.pet_care_experience}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Existing pets: </span>
                    <span className="text-foreground">{screening.existing_pets_details || "None reported"}</span>
                  </p>
                </div>
              </div>

              {/* 4. Daily Care & Veterinary Plan */}
              <div className="space-y-1.5 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  4. Daily Care &amp; Veterinary Plan
                </p>
                <div className="bg-muted/20 p-3 rounded-xl space-y-1 text-xs">
                  <p>
                    <span className="text-muted-foreground">Daily alone time: </span>
                    <strong>{screening.daily_alone_hours} hours / day</strong>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Daily care routine: </span>
                    <span className="text-foreground">{screening.daily_care_arrangements}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Veterinary plan: </span>
                    <span className="text-foreground">{screening.emergency_vet_care_plan}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Decision Controls */}
            <div className="pt-2 border-t border-border/70 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground">
                  Set Screening Status
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { val: SCREENING_STATUSES.PENDING, label: "Pending" },
                    { val: SCREENING_STATUSES.UNDER_REVIEW, label: "Under Review" },
                    { val: SCREENING_STATUSES.APPROVED, label: "Approved" },
                    { val: SCREENING_STATUSES.REJECTED, label: "Rejected" },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setSelectedStatus(opt.val)}
                      className={cn(
                        "py-2 px-3 rounded-lg border text-xs font-medium transition-all text-center cursor-pointer",
                        selectedStatus === opt.val
                          ? opt.val === SCREENING_STATUSES.APPROVED
                            ? "bg-emerald-600 text-white border-emerald-600 font-semibold"
                            : opt.val === SCREENING_STATUSES.REJECTED
                            ? "bg-destructive text-destructive-foreground border-destructive font-semibold"
                            : "bg-primary text-primary-foreground border-primary font-semibold"
                          : "bg-card hover:bg-muted text-foreground border-border"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Private Staff Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="admin_notes" className="text-xs font-semibold text-foreground">
                  Private Administrative Notes (Internal Only)
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Confidential to staff. Never shown to applicants.
                </p>
                <Textarea
                  id="admin_notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal observations, landlord verification notes, home assessment..."
                  rows={3}
                  className="text-xs"
                />
              </div>

              {/* Rejection Reason (Required if rejected) */}
              {selectedStatus === SCREENING_STATUSES.REJECTED && (
                <div className="space-y-1.5 animate-in fade-in-50 duration-200">
                  <Label htmlFor="rejection_reason" className="text-xs font-semibold text-destructive">
                    Reason for Rejection <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    This reason will be provided to the applicant.
                  </p>
                  <Textarea
                    id="rejection_reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Household arrangements require an enclosed yard for high-energy breeds..."
                    rows={3}
                    className="text-xs border-destructive/50"
                  />
                </div>
              )}
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
              <Button
                size="sm"
                onClick={handleReviewSubmit}
                disabled={submitting}
                className="gap-2 font-semibold"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving Decision...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Save Screening Decision</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
