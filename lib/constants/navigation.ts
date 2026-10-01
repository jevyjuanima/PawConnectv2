/**
 * Shared navigation configuration and route definitions.
 * Role-aware single source of truth for desktop and mobile navigation.
 */

export interface NavLinkItem {
  href: string;
  label: string;
  exact?: boolean;
}

export const ROUTES = {
  HOME: "/",
  DOGS: "/dogs",
  HOW_IT_WORKS: "/#how-it-works",
  REHOME: "/rehome",
  DASHBOARD: "/dashboard",
  APPLICATIONS: "/my-applications",
  MY_DOGS: "/my-dogs",
  NOTIFICATIONS: "/dashboard#notifications",
  ADMIN: "/admin",
  ADMIN_DOGS: "/admin/dogs",
  ADMIN_APPLICATIONS: "/admin/applications",
  ADMIN_USERS: "/admin/users",
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
} as const;

/**
 * Guest Navigation
 * Only Browse Dogs, How It Works (+ Sign In, Find a Pet CTA)
 */
export const GUEST_NAV_ITEMS: readonly NavLinkItem[] = [
  { href: ROUTES.DOGS, label: "Browse Dogs" },
  { href: ROUTES.HOW_IT_WORKS, label: "How It Works" },
] as const;

/**
 * Authenticated Normal User Navigation
 * Browse Dogs, Dashboard, My Applications, My Dogs, Rehome a Dog
 */
export const USER_NAV_ITEMS: readonly NavLinkItem[] = [
  { href: ROUTES.DOGS, label: "Browse Dogs" },
  { href: ROUTES.DASHBOARD, label: "Dashboard", exact: true },
  { href: ROUTES.APPLICATIONS, label: "My Applications" },
  { href: ROUTES.MY_DOGS, label: "My Dogs" },
  { href: ROUTES.REHOME, label: "Rehome a Dog" },
] as const;

/**
 * Authenticated Admin Navigation
 * Browse Dogs, Admin Dashboard, Dogs, Applications, Users
 */
export const ADMIN_NAV_ITEMS: readonly NavLinkItem[] = [
  { href: ROUTES.DOGS, label: "Browse Dogs" },
  { href: ROUTES.ADMIN, label: "Admin Dashboard", exact: true },
  { href: ROUTES.ADMIN_DOGS, label: "Dogs" },
  { href: ROUTES.ADMIN_APPLICATIONS, label: "Applications" },
  { href: ROUTES.ADMIN_USERS, label: "Users" },
] as const;

export const GUEST_PRIMARY_CTA: NavLinkItem = {
  href: ROUTES.DOGS,
  label: "Find a Pet",
};
