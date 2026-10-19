"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Dog,
  HeartHandshake,
  ShieldCheck,
  CalendarCheck,
  Users,
  ExternalLink,
  PawPrint,
  Menu,
  ChevronRight,
  Shield,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/lib/clerk/auth";

interface AdminSidebarProps {
  profile: UserProfile | null;
  pendingCounts?: {
    dogs?: number;
    applications?: number;
    screenings?: number;
    followups?: number;
  };
}

export const ADMIN_NAV_LINKS = [
  {
    href: "/admin",
    label: "Overview",
    icon: LayoutDashboard,
    badgeKey: null,
    exact: true,
  },
  {
    href: "/admin/dogs",
    label: "Dogs Directory",
    icon: Dog,
    badgeKey: "dogs" as const,
  },
  {
    href: "/admin/applications",
    label: "Applications",
    icon: HeartHandshake,
    badgeKey: "applications" as const,
  },
  {
    href: "/admin/screenings",
    label: "Suitability Screenings",
    icon: ShieldCheck,
    badgeKey: "screenings" as const,
  },
  {
    href: "/admin/follow-ups",
    label: "Welfare Monitoring",
    icon: CalendarCheck,
    badgeKey: "followups" as const,
  },
  {
    href: "/admin/users",
    label: "Registered Users",
    icon: Users,
    badgeKey: null,
  },
] as const;

export function AdminSidebarContent({
  profile,
  pendingCounts,
  onNavClick,
}: {
  profile: UserProfile | null;
  pendingCounts?: AdminSidebarProps["pendingCounts"];
  onNavClick?: () => void;
}) {
  const pathname = usePathname();

  const isLinkActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const displayName = profile
    ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Staff Admin"
    : "Staff Admin";

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "PA";

  return (
    <div className="flex flex-col h-full justify-between bg-card select-none overflow-y-auto overflow-x-hidden [scrollbar-width:thin] [scrollbar-color:hsl(var(--muted-foreground)/0.2)_transparent]">
      {/* Top Branding (Shown in mobile drawer sheet, hidden on desktop since Navbar sits right above) */}
      <div className="p-5 border-b border-border/70 flex items-center justify-between lg:hidden">
          <Link
            href="/admin"
            onClick={onNavClick}
            className="flex items-center gap-3 transition-opacity hover:opacity-90"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-xs">
              <PawPrint className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg font-bold tracking-tight text-foreground leading-tight">
                PawConnect
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Admin Console
              </span>
            </div>
          </Link>
          <Badge
            variant="outline"
            className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/20 px-2 py-0.5"
          >
            Staff
          </Badge>
        </div>

        {/* Navigation Section */}
        <div className="p-3 space-y-1">
          <p className="px-3 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
            Operations Menu
          </p>
          <nav className="space-y-1" aria-label="Admin Navigation">
            {ADMIN_NAV_LINKS.map((link) => {
              const active = isLinkActive(link.href, (link as { exact?: boolean }).exact);
              const Icon = link.icon;
              const count =
                link.badgeKey && pendingCounts ? pendingCounts[link.badgeKey] : undefined;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onNavClick}
                  className={cn(
                    "group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all",
                    active
                      ? "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200 font-semibold shadow-2xs border border-rose-200/80 dark:border-rose-800/40"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        active
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    <span className="truncate">{link.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {typeof count === "number" && count > 0 && (
                      <span
                        className={cn(
                          "px-1.5 py-0.2 rounded-full text-[10px] font-bold leading-tight",
                          active
                            ? "bg-rose-600 text-white"
                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                        )}
                      >
                        {count}
                      </span>
                    )}
                    {active && <ChevronRight className="h-3 w-3 text-rose-600 dark:text-rose-400" />}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

      {/* Bottom Profile Section (Reference 1 — Pawsy Pet Haven) */}
      <div className="mt-auto p-3 border-t border-border/70 bg-muted/20 space-y-3 pb-8 sm:pb-10 shrink-0">
        <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/60 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary text-xs font-bold ring-1 ring-primary/20">
              {initials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-foreground truncate max-w-[120px]">
                {displayName}
              </span>
              <span className="text-[10px] text-muted-foreground truncate">
                Staff Administrator
              </span>
            </div>
          </div>
          <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
        </div>

        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "w-full text-xs font-medium justify-between h-8.5 rounded-lg border-border/80 hover:bg-muted/60"
          )}
        >
          <span>Exit to Public Site</span>
          <ExternalLink className="h-3 w-3 text-muted-foreground" />
        </Link>
      </div>
    </div>
  );
}

export function AdminSidebar({
  profile,
  pendingCounts,
}: AdminSidebarProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <>
      {/* Desktop Fixed Left Sidebar (Reference 1 — Pawsy Pet Haven) */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col fixed top-16 bottom-0 left-0 z-30 border-r border-border/80 bg-card shadow-2xs overflow-hidden">
        <AdminSidebarContent profile={profile} pendingCounts={pendingCounts} />
      </aside>

      {/* Mobile Drawer Trigger Bar */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-card border-b border-border/80 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "h-9 w-9 text-foreground cursor-pointer"
              )}
              aria-label="Open staff navigation"
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 flex flex-col justify-between">
              <SheetHeader className="sr-only">
                <SheetTitle>Admin Navigation Menu</SheetTitle>
              </SheetHeader>
              <AdminSidebarContent
                profile={profile}
                pendingCounts={pendingCounts}
                onNavClick={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-2xs">
              <PawPrint className="h-4 w-4" />
            </div>
            <span className="font-serif text-base font-bold text-foreground">
              PawConnect Admin
            </span>
          </Link>
        </div>

        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs font-medium h-8 gap-1")}
        >
          <span>Site</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </>
  );
}
