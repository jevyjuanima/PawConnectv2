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
          {/* Dashboard */}
          <Link
            href="/dashboard"
            className={linkClass(isActive("/dashboard", true))}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard
          </Link>

          {/* Rehome a Dog */}
          <Link
            href="/rehome"
            className={linkClass(isActive("/rehome", false))}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Rehome a Dog
          </Link>

          {/* My Applications */}
          <Link
            href="/my-applications"
            className={linkClass(isActive("/my-applications", false))}
          >
            <HeartHandshake className="h-3.5 w-3.5" />
            My Applications
          </Link>

          {/* My Dogs */}
          <Link
            href="/my-dogs"
            className={linkClass(isActive("/my-dogs", false))}
          >
            <FileText className="h-3.5 w-3.5" />
            My Dogs
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold ml-1.5 transition-all border",
                isActive("/admin", false)
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted border-border"
              )}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Admin</span>
              <Badge
                variant={isActive("/admin", false) ? "outline" : "secondary"}
                className={cn(
                  "text-[9px] px-1 py-0 h-3.5 font-bold uppercase tracking-wider",
                  isActive("/admin", false)
                    ? "border-primary-foreground/30 text-primary-foreground"
                    : "text-muted-foreground"
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
