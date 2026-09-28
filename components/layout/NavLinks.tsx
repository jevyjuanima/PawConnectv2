"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, PlusCircle } from "lucide-react";
import type { UserProfile } from "@/lib/clerk/auth";

interface NavLinksProps {
  profile: UserProfile | null;
}

export function NavLinks({ profile }: NavLinksProps) {
  const pathname = usePathname();
  const isAdmin = profile?.role === "admin";

  return (
    <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
      <Link
        href="/"
        className={`px-3 py-1.5 rounded-md transition-colors ${
          pathname === "/"
            ? "text-foreground font-semibold bg-muted"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        }`}
      >
        Home
      </Link>

      <Link
        href="/dogs"
        className={`px-3 py-1.5 rounded-md transition-colors ${
          pathname.startsWith("/dogs")
            ? "text-foreground font-semibold bg-muted"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        }`}
      >
        Browse Dogs
      </Link>

      {profile && (
        <>
          <Link
            href="/dashboard"
            className={`px-3 py-1.5 rounded-md transition-colors ${
              pathname === "/dashboard"
                ? "text-foreground font-semibold bg-muted"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/rehome"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              pathname.startsWith("/rehome")
                ? "text-primary font-semibold bg-primary/10"
                : "text-muted-foreground hover:text-primary hover:bg-primary/5"
            }`}
          >
            <PlusCircle className="h-4 w-4" />
            Rehome a Dog
          </Link>

          <Link
            href="/my-applications"
            className={`px-3 py-1.5 rounded-md transition-colors ${
              pathname.startsWith("/my-applications")
                ? "text-foreground font-semibold bg-muted"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            My Applications
          </Link>

          <Link
            href="/my-dogs"
            className={`px-3 py-1.5 rounded-md transition-colors ${
              pathname.startsWith("/my-dogs")
                ? "text-foreground font-semibold bg-muted"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            My Dogs
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                pathname.startsWith("/admin")
                  ? "text-primary font-semibold bg-primary/10 border border-primary/20"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5"
              }`}
            >
              <ShieldAlert className="h-4 w-4 text-primary" />
              <span>Admin</span>
              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                Staff
              </Badge>
            </Link>
          )}
        </>
      )}
    </nav>
  );
}
