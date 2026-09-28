import { USER_ROLES, type UserRole } from "@/lib/constants/statuses";

export function isAdmin(role?: UserRole | string | null): boolean {
  return role === USER_ROLES.ADMIN;
}

export function isUser(role?: UserRole | string | null): boolean {
  return role === USER_ROLES.USER || role === USER_ROLES.ADMIN;
}

export class AuthorizationError extends Error {
  constructor(message = "Unauthorized: administrative privileges required.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function assertAdmin(role?: UserRole | string | null): asserts role is "admin" {
  if (!isAdmin(role)) {
    throw new AuthorizationError();
  }
}

