"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, PawPrint, Bell } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import type { UserProfile } from "@/lib/clerk/auth";
import {
  GUEST_NAV_ITEMS,
  USER_NAV_ITEMS,
  ADMIN_NAV_ITEMS,
  GUEST_PRIMARY_CTA,
  type NavLinkItem,
} from "@/lib/constants/navigation";

interface MobileNavProps {
  profile: UserProfile | null;
}

export function MobileNav({ profile }: MobileNavProps) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const isAdmin = profile?.role === "admin";

  const closeNav = () => setOpen(false);

  const isActive = (href: string, exact?: boolean) => {
    if (href.startsWith("/#")) return false;
    if (exact) return pathname === href;
    return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
  };

  const getLinkClass = (active: boolean) =>
    cn(
      "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
      active
        ? "bg-muted text-foreground font-semibold"
        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
    );

  const navItems: readonly NavLinkItem[] = !profile
    ? GUEST_NAV_ITEMS
    : isAdmin
    ? ADMIN_NAV_ITEMS
    : USER_NAV_ITEMS;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "md:hidden h-9 w-9 text-muted-foreground hover:text-foreground cursor-pointer"
        )}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[320px] p-0 flex flex-col justify-between">
        <div className="flex flex-col">
          <SheetHeader className="p-4 border-b text-left">
            <SheetTitle className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-xs">
                <PawPrint className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-lg tracking-tight leading-tight">PawConnect</span>
                <span className="text-[10px] text-muted-foreground font-medium">Adoption &amp; Rehoming</span>
              </div>
            </SheetTitle>
          </SheetHeader>

          {/* Navigation Links */}
          <nav className="p-4 flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-200px)]">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeNav}
                className={getLinkClass(isActive(item.href, item.exact))}
              >
                {item.label}
              </Link>
            ))}

            <SignedIn>
              <Link
                href="/dashboard#notifications"
                onClick={closeNav}
                className={getLinkClass(false)}
              >
                <span className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  Notifications
                </span>
              </Link>
            </SignedIn>
          </nav>
        </div>

        {/* Footer Area: User Profile or Sign-in Actions */}
        <div className="p-4 border-t flex flex-col gap-3 bg-muted/20">
          <SignedIn>
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8 ring-1 ring-border",
                    },
                  }}
                />
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-foreground truncate max-w-[140px]">
                    {profile?.first_name ? `${profile.first_name} ${profile.last_name || ""}` : "My Account"}
                  </span>
                  <span className="text-[10px] text-muted-foreground capitalize">
                    {profile?.role === "admin" ? "Staff Administrator" : "Pet Parent"}
                  </span>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </SignedIn>

          <SignedOut>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground font-medium">Appearance</span>
              <ThemeToggle />
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href={GUEST_PRIMARY_CTA.href}
                onClick={closeNav}
                className={cn(buttonVariants({ size: "sm" }), "w-full font-medium shadow-xs text-sm")}
              >
                {GUEST_PRIMARY_CTA.label}
              </Link>
              <SignInButton mode="modal">
                <Button variant="outline" size="sm" className="w-full font-medium text-sm" onClick={closeNav}>
                  Sign In
                </Button>
              </SignInButton>
            </div>
          </SignedOut>
        </div>
      </SheetContent>
    </Sheet>
  );
}
