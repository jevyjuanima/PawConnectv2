"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Dog,
  LayoutDashboard,
  PlusCircle,
  HeartHandshake,
  FileText,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/lib/clerk/auth";

interface NavLinksProps {
  profile: UserProfile | null;
}

const guestLinks = [
  { href: "/", label: "Home", icon: Home, exact: true },
  { href: "/dogs", label: "Browse Dogs", icon: Dog, exact: false },
];

const userLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/my-applications", label: "My Applications", icon: HeartHandshake, exact: false },
  { href: "/my-dogs", label: "My Dogs", icon: FileText, exact: false },
];

export function NavLinks({ profile }: NavLinksProps) {
  const pathname = usePathname();
  const isAdmin = profile?.role === "admin";

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const linkClass = (active: boolean) =>
    cn(
      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
      active
        ? "bg-primary/10 text-primary font-semibold"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
    );

  return (
    <nav className="hidden md:flex items-center gap-0.5" aria-label="Main navigation">
      {guestLinks.map(({ href, label, icon: Icon, exact }) => (
        <Link key={href} href={href} className={linkClass(isActive(href, exact))}>
          <Icon className="h-3.5 w-3.5" />
          {label}
        </Link>
      ))}

      {profile && (
        <>
          {/* Rehome — visually distinct CTA */}
          <Link
            href="/rehome"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
              isActive("/rehome", false)
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-primary hover:bg-primary/5"
            )}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Rehome a Dog
          </Link>

          {userLinks.map(({ href, label, icon: Icon, exact }) => (
            <Link key={href} href={href} className={linkClass(isActive(href, exact))}>
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}

          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold ml-1 transition-all",
                isActive("/admin", false)
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20"
              )}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Admin
              <Badge
                variant={isActive("/admin", false) ? "outline" : "secondary"}
                className={cn(
                  "text-[9px] px-1 py-0 h-3.5 font-bold uppercase tracking-wider",
                  isActive("/admin", false) &&
                    "border-primary-foreground/30 text-primary-foreground"
                )}
              >
                Staff
              </Badge>
            </Link>
          )}
        </>
      )}
    </nav>
  );
}
