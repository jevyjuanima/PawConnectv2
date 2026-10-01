import * as React from "react";
import {
  CheckCircle2,
  Clock,
  Heart,
  XCircle,
  ShieldCheck,
  FileCheck,
  Ban,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DOG_STATUSES, APPLICATION_STATUSES } from "@/lib/constants/statuses";
import { formatStatusLabel } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
  showIcon?: boolean;
  label?: string;
}

export function DogStatusBadge({
  status,
  className,
  showIcon = true,
  label,
}: StatusBadgeProps) {
  let icon: React.ReactNode = null;
  let badgeClass = "";

  switch (status) {
    case DOG_STATUSES.AVAILABLE:
      icon = <CheckCircle2 className="h-3 w-3 shrink-0" />;
      badgeClass =
        "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20";
      break;
    case DOG_STATUSES.PENDING:
      icon = <Clock className="h-3 w-3 shrink-0" />;
      badgeClass =
        "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20";
      break;
    case DOG_STATUSES.RESERVED:
      icon = <ShieldCheck className="h-3 w-3 shrink-0" />;
      badgeClass =
        "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20";
      break;
    case DOG_STATUSES.ADOPTED:
      icon = <Heart className="h-3 w-3 shrink-0 fill-current" />;
      badgeClass =
        "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20";
      break;
    case DOG_STATUSES.REJECTED:
      icon = <XCircle className="h-3 w-3 shrink-0" />;
      badgeClass =
        "bg-destructive/10 text-destructive border-destructive/20";
      break;
    case DOG_STATUSES.ARCHIVED:
      icon = <Ban className="h-3 w-3 shrink-0" />;
      badgeClass = "bg-muted text-muted-foreground border-border";
      break;
    default:
      icon = null;
      badgeClass = "bg-muted text-muted-foreground border-border";
  }

  let defaultLabel = formatStatusLabel(status);
  if (status === DOG_STATUSES.PENDING) {
    defaultLabel = "Pending Review";
  } else if (status === DOG_STATUSES.REJECTED) {
    defaultLabel = "Not approved";
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors",
        badgeClass,
        className
      )}
    >
      {showIcon && icon}
      <span>{label || defaultLabel}</span>
    </Badge>
  );
}

export function ApplicationStatusBadge({
  status,
  className,
  showIcon = true,
}: StatusBadgeProps) {
  let icon: React.ReactNode = null;
  let badgeClass = "";

  switch (status) {
    case APPLICATION_STATUSES.PENDING:
      icon = <Clock className="h-3 w-3 shrink-0" />;
      badgeClass =
        "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20";
      break;
    case APPLICATION_STATUSES.UNDER_REVIEW:
      icon = <Clock className="h-3 w-3 shrink-0 animate-pulse" />;
      badgeClass =
        "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30";
      break;
    case APPLICATION_STATUSES.APPROVED:
      icon = <CheckCircle2 className="h-3 w-3 shrink-0" />;
      badgeClass =
        "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20";
      break;
    case APPLICATION_STATUSES.COMPLETED:
      icon = <FileCheck className="h-3 w-3 shrink-0" />;
      badgeClass =
        "bg-primary/10 text-primary border-primary/20";
      break;
    case APPLICATION_STATUSES.REJECTED:
      icon = <XCircle className="h-3 w-3 shrink-0" />;
      badgeClass =
        "bg-destructive/10 text-destructive border-destructive/20";
      break;
    case APPLICATION_STATUSES.CANCELLED:
      icon = <XCircle className="h-3 w-3 shrink-0" />;
      badgeClass = "bg-muted text-muted-foreground border-border";
      break;
    default:
      icon = null;
      badgeClass = "bg-muted text-muted-foreground border-border";
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold capitalize tracking-wide transition-colors",
        badgeClass,
        className
      )}
    >
      {showIcon && icon}
      <span>{formatStatusLabel(status)}</span>
    </Badge>
  );
}
