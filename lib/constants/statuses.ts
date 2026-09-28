export const USER_ROLES = {
  USER: "user",
  ADMIN: "admin",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const DOG_STATUSES = {
  PENDING: "pending",
  AVAILABLE: "available",
  RESERVED: "reserved",
  ADOPTED: "adopted",
  REJECTED: "rejected",
  ARCHIVED: "archived",
} as const;

export type DogStatus = (typeof DOG_STATUSES)[keyof typeof DOG_STATUSES];

export const APPLICATION_STATUSES = {
  PENDING: "pending",
  UNDER_REVIEW: "under_review",
  APPROVED: "approved",
  REJECTED: "rejected",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type ApplicationStatus =
  (typeof APPLICATION_STATUSES)[keyof typeof APPLICATION_STATUSES];

export const DOG_SIZES = {
  SMALL: "small",
  MEDIUM: "medium",
  LARGE: "large",
  GIANT: "giant",
} as const;

export type DogSize = (typeof DOG_SIZES)[keyof typeof DOG_SIZES];

export const DOG_GENDERS = {
  MALE: "male",
  FEMALE: "female",
} as const;

export type DogGender = (typeof DOG_GENDERS)[keyof typeof DOG_GENDERS];
