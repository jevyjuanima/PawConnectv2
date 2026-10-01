/**
 * Shared navigation configuration and route definitions.
 * Single source of truth for desktop and mobile navigation.
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
  SIGN_IN: "/sign-in",
} as const;

/**
 * Public navigation links available to all visitors.
 */
export const PUBLIC_NAV_ITEMS: readonly NavLinkItem[] = [
  { href: ROUTES.DOGS, label: "Browse Dogs" },
  { href: ROUTES.HOW_IT_WORKS, label: "How It Works" },
] as const;

/**
 * Primary action for members to submit a dog for rehoming.
 */
export const MEMBER_PRIMARY_ACTION: NavLinkItem = {
  href: ROUTES.REHOME,
  label: "Rehome a Dog",
};

/**
 * Top-level navigation items for signed-in members on desktop.
 * Note: My Applications and My Dogs are intentionally excluded from desktop top-level,
 * accessible through Dashboard and Mobile Nav.
 */
export const MEMBER_DESKTOP_NAV_ITEMS: readonly NavLinkItem[] = [
  ...PUBLIC_NAV_ITEMS,
  MEMBER_PRIMARY_ACTION,
  { href: ROUTES.DASHBOARD, label: "Dashboard", exact: true },
] as const;

/**
 * Member activity navigation items shown in Dashboard and Mobile navigation.
 */
export const MEMBER_ACTIVITY_ITEMS: readonly NavLinkItem[] = [
  { href: ROUTES.DASHBOARD, label: "Dashboard", exact: true },
  { href: ROUTES.APPLICATIONS, label: "My Applications" },
  { href: ROUTES.MY_DOGS, label: "My Dogs" },
  { href: ROUTES.NOTIFICATIONS, label: "Notifications" },
] as const;

/**
 * Restrained Admin entry point.
 */
export const ADMIN_NAV_ITEM: NavLinkItem = {
  href: ROUTES.ADMIN,
  label: "Admin",
};

/**
 * Primary guest conversion CTA.
 */
export const GUEST_PRIMARY_CTA: NavLinkItem = {
  href: ROUTES.DOGS,
  label: "Find a Pet",
};
