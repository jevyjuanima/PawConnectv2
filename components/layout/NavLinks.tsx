"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/lib/clerk/auth";
import {
  PUBLIC_NAV_ITEMS,
  MEMBER_DESKTOP_NAV_ITEMS,
  ADMIN_NAV_ITEM,
} from "@/lib/constants/navigation";

interface NavLinksProps {
  profile: UserProfile | null;
}

export function NavLinks({ profile }: NavLinksProps) {
  const pathname = usePathname();
  const isAdmin = profile?.role === "admin";

  const isActive = (href: string, exact?: boolean) => {
    if (href.startsWith("/#")) return false;
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navItems = profile ? MEMBER_DESKTOP_NAV_ITEMS : PUBLIC_NAV_ITEMS;

  const linkClass = (active: boolean) =>
    cn(
      "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
      active
        ? "text-foreground font-semibold bg-muted"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
    );

  return (
    <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={linkClass(isActive(item.href, item.exact))}
        >
          {item.label}
        </Link>
      ))}

      {isAdmin && (
        <Link
          href={ADMIN_NAV_ITEM.href}
          className={cn(
            "px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ml-1",
            isActive(ADMIN_NAV_ITEM.href, false)
              ? "text-foreground font-semibold bg-muted"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          {ADMIN_NAV_ITEM.label}
        </Link>
      )}
    </nav>
  );
}
