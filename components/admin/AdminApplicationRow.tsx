"use client";

import * as React from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Home,
  Users,
  ShieldCheck,
  Dog as DogIcon,
  Loader2,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { reviewApplicationAction } from "@/app/actions/admin";
import { formatDate } from "@/lib/utils/format";
import { ApplicationStatusBadge } from "@/components/shared/StatusBadges";
import { APPLICATION_STATUSES } from "@/lib/constants/statuses";
import type { ApplicationWithDetails } from "@/types";

interface AdminApplicationRowProps {
  application: ApplicationWithDetails;
}

export function AdminApplicationRow({
  application: initialApp,
}: AdminApplicationRowProps) {
  const [app, setApp] = React.useState(initialApp);
  const [processing, setProcessing] = React.useState(false);

  // Rejection Dialog State
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");

  // Approval Dialog State
  const [approveOpen, setApproveOpen] = React.useState(false);
  const [adminNotes, setAdminNotes] = React.useState(app.admin_notes || "");

  const dog = app.dog;
  const applicant = app.applicant;
  const primaryImg =
    dog.primary_image ||
    dog.images?.find((img) => img.is_primary)?.public_url ||
    dog.images?.[0]?.public_url;

  const handleStartReview = async () => {
    setProcessing(true);
    const res = await reviewApplicationAction(
      app.id,
      APPLICATION_STATUSES.UNDER_REVIEW
    );
    if (res.success) {
      setApp((prev) => ({
        ...prev,
        status: APPLICATION_STATUSES.UNDER_REVIEW,
      }));
      toast.success("Application marked as Under Review.");
    } else {
      toast.error(res.error || "Failed to update application status");
    }
    setProcessing(false);
  };

  const handleApprove = async () => {
    setProcessing(true);
    const res = await reviewApplicationAction(
      app.id,
      APPLICATION_STATUSES.APPROVED,
      adminNotes.trim() || undefined
    );
    if (res.success) {
      setApp((prev) => ({
        ...prev,
        status: APPLICATION_STATUSES.APPROVED,
        admin_notes: adminNotes.trim() || prev.admin_notes,
      }));
      setApproveOpen(false);
      toast.success(`Application approved! Dog ${dog.name} is now reserved.`);
    } else {
      toast.error(res.error || "Failed to approve application");
    }
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejecting the application.");
      return;
    }

    setProcessing(true);
    const res = await reviewApplicationAction(
      app.id,
      APPLICATION_STATUSES.REJECTED,
      undefined,
      rejectReason.trim()
    );
    if (res.success) {
      setApp((prev) => ({
        ...prev,
        status: APPLICATION_STATUSES.REJECTED,
        rejection_reason: rejectReason.trim(),
      }));
      setRejectOpen(false);
      toast.success("Application marked as rejected.");
    } else {
      toast.error(res.error || "Failed to reject application");
    }
    setProcessing(false);
  };

  const handleFinalizeAdoption = async () => {
    setProcessing(true);
    const res = await reviewApplicationAction(
      app.id,
      APPLICATION_STATUSES.COMPLETED
    );
    if (res.success) {
      setApp((prev) => ({
        ...prev,
        status: APPLICATION_STATUSES.COMPLETED,
      }));
      toast.success(`Adoption finalized! ${dog.name} marked as adopted.`);
    } else {
      toast.error(res.error || "Failed to finalize adoption");
    }
    setProcessing(false);
  };

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-2xs hover:shadow-xs transition-shadow space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-muted shrink-0 border">
            {primaryImg ? (
              <Image
                src={primaryImg}
                alt={dog.name}
                fill
                sizes="48px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <DogIcon className="h-6 w-6 text-muted-foreground/40" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">
                Application for {dog.name}
              </h3>
              <ApplicationStatusBadge status={app.status} />
            </div>
            <p className="text-xs text-muted-foreground">
              Applicant: <strong className="text-foreground">{applicant?.first_name || "User"} {applicant?.last_name || ""}</strong> ({applicant?.email})
            </p>
          </div>
        </div>

        <span className="text-xs text-muted-foreground shrink-0">
          Submitted: {formatDate(app.created_at)}
        </span>
      </div>

      {/* Questionnaire Answers Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 text-xs bg-muted/20 p-3 rounded-xl border">
        <div className="space-y-0.5">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
            <Home className="h-3 w-3" />
            Housing
          </span>
          <p className="font-semibold text-foreground capitalize">
            {app.housing_type.replace("_", " ")}
          </p>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            Yard
          </span>
          <p className="font-semibold text-foreground">
            {app.has_yard ? "Enclosed Yard" : "No Yard"}
          </p>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
            <Users className="h-3 w-3" />
            Household
          </span>
          <p className="font-semibold text-foreground">
            {app.household_members_count} member{app.household_members_count > 1 ? "s" : ""}
          </p>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
            <DogIcon className="h-3 w-3" />
            Experience
          </span>
          <p className="font-semibold text-foreground capitalize">
            {app.experience_level.replace("_", " ")}
          </p>
        </div>
      </div>

      {/* Other Pets Details */}
      {app.has_other_pets && app.other_pets_details && (
        <div className="text-xs space-y-1">
          <span className="font-semibold text-muted-foreground uppercase text-[10px]">
            Other Pets in Household:
          </span>
          <p className="text-foreground bg-muted/30 p-2.5 rounded-lg border">
            {app.other_pets_details}
          </p>
        </div>
      )}

      {/* Reason for Adopting */}
      <div className="text-xs space-y-1">
        <span className="font-semibold text-muted-foreground uppercase text-[10px]">
          Applicant Motivation &amp; Routine:
        </span>
        <p className="text-foreground bg-muted/30 p-2.5 rounded-lg border whitespace-pre-line leading-relaxed">
          {app.reason_for_adopting}
        </p>
      </div>

      {/* Admin Feedback Display */}
      {app.admin_notes && (
        <div className="text-xs text-primary bg-primary/5 p-2.5 rounded-lg border border-primary/20">
          <span className="font-bold">Staff Notes: </span>
          <span>{app.admin_notes}</span>
        </div>
      )}

      {app.rejection_reason && (
        <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-lg border border-destructive/20">
          <span className="font-bold">Rejection Reason: </span>
          <span>{app.rejection_reason}</span>
        </div>
      )}

      {/* Action Workflow Controls */}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t">
        {/* Pending -> Start Review */}
        {app.status === APPLICATION_STATUSES.PENDING && (
          <Button
            size="sm"
            onClick={handleStartReview}
            disabled={processing}
            className="gap-1.5 text-xs shadow-xs"
          >
            {processing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Clock className="h-3.5 w-3.5" />
            )}
            Begin Review
          </Button>
        )}

        {/* Under Review -> Approve or Reject */}
        {app.status === APPLICATION_STATUSES.UNDER_REVIEW && (
          <>
            {/* Reject Modal */}
            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
              <DialogTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject Application
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Application</DialogTitle>
                  <DialogDescription>
                    Provide a reason for rejecting this application. This note will be dispatched to the applicant.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-2">
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Housing policies prohibit dogs of this size, yard not secure..."
                    rows={4}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setRejectOpen(false)}>
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

            {/* Approve Match Modal */}
            <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
              <DialogTrigger
                render={
                  <Button size="sm" className="text-xs gap-1.5 shadow-xs cursor-pointer">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approve Match
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Approve Adoption Match</DialogTitle>
                  <DialogDescription>
                    Approving this application will reserve {dog.name} and notify the applicant to coordinate the final meet &amp; handoff.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-2 space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Optional Review / Handoff Notes:
                  </span>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="e.g. Approved for meet-and-greet on Saturday..."
                    rows={3}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setApproveOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleApprove} disabled={processing}>
                    {processing ? "Approving..." : "Confirm Approval"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}

        {/* Approved -> Finalize Adoption */}
        {app.status === APPLICATION_STATUSES.APPROVED && (
          <Button
            size="sm"
            onClick={handleFinalizeAdoption}
            disabled={processing}
            className="gap-1.5 text-xs shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {processing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileCheck className="h-3.5 w-3.5" />
            )}
            Complete Adoption
          </Button>
        )}
      </div>
    </div>
  );
}
