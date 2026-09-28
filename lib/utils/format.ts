import { DOG_STATUSES, APPLICATION_STATUSES } from "@/lib/constants/statuses";

export function formatAge(years: number, months: number = 0): string {
  if (years === 0 && months === 0) return "Unknown";
  if (years === 0) return `${months} mo${months > 1 ? "s" : ""}`;
  if (months === 0) return `${years} yr${years > 1 ? "s" : ""}`;
  return `${years} yr${years > 1 ? "s" : ""}, ${months} mo${months > 1 ? "s" : ""}`;
}

export function formatCapitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function formatStatusLabel(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function getDogStatusBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case DOG_STATUSES.AVAILABLE:
      return "default";
    case DOG_STATUSES.RESERVED:
      return "secondary";
    case DOG_STATUSES.ADOPTED:
      return "outline";
    case DOG_STATUSES.PENDING:
      return "secondary";
    case DOG_STATUSES.REJECTED:
    case DOG_STATUSES.ARCHIVED:
      return "destructive";
    default:
      return "outline";
  }
}

export function getApplicationStatusBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case APPLICATION_STATUSES.APPROVED:
    case APPLICATION_STATUSES.COMPLETED:
      return "default";
    case APPLICATION_STATUSES.PENDING:
    case APPLICATION_STATUSES.UNDER_REVIEW:
      return "secondary";
    case APPLICATION_STATUSES.REJECTED:
    case APPLICATION_STATUSES.CANCELLED:
      return "destructive";
    default:
      return "outline";
  }
}

export function formatDate(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
