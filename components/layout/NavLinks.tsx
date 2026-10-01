"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/lib/clerk/auth";

interface NavLinksProps {
  profile: UserProfile | null;
}

export function NavLinks({ profile }: NavLinksProps) {
  const pathname = usePathname();
  const isAdmin = profile?.role === "admin";

  const getLinkClass = (isActive: boolean) =>
    cn(
      "px-3 py-1.5 rounded-lg text-sm transition-all font-medium flex items-center gap-1.5",
      isActive
        ? "bg-primary/10 text-primary font-semibold shadow-2xs"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
    );

  return (
    <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
      <Link href="/" className={getLinkClass(pathname === "/")}>
        Home
      </Link>

      <Link
        href="/dogs"
        className={getLinkClass(pathname.startsWith("/dogs"))}
      >
        Browse Dogs
      </Link>

      {profile && (
        <>
          <Link
            href="/dashboard"
            className={getLinkClass(pathname === "/dashboard")}
          >
            Dashboard
          </Link>

          <Link
            href="/rehome"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all font-medium",
              pathname.startsWith("/rehome")
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-primary hover:bg-primary/5"
            )}
          >
            <PlusCircle className="h-4 w-4" />
            Rehome a Dog
          </Link>

          <Link
            href="/my-applications"
            className={getLinkClass(pathname.startsWith("/my-applications"))}
          >
            My Applications
          </Link>

          <Link
            href="/my-dogs"
            className={getLinkClass(pathname.startsWith("/my-dogs"))}
          >
            My Dogs
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all font-semibold ml-1",
                pathname.startsWith("/admin")
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20"
              )}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Admin</span>
              <Badge
                variant={pathname.startsWith("/admin") ? "outline" : "secondary"}
                className={cn(
                  "text-[9px] px-1 py-0 h-3.5 font-bold uppercase tracking-wider",
                  pathname.startsWith("/admin") && "border-primary-foreground/30 text-primary-foreground"
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

