"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, PawPrint } from "lucide-react";
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
  PUBLIC_NAV_ITEMS,
  MEMBER_PRIMARY_ACTION,
  MEMBER_ACTIVITY_ITEMS,
  ADMIN_NAV_ITEM,
  GUEST_PRIMARY_CTA,
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
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const getLinkClass = (active: boolean) =>
    cn(
      "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
      active
        ? "bg-muted text-foreground font-semibold"
        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
    );

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
                <span className="font-bold text-base tracking-tight leading-tight">PawConnect</span>
                <span className="text-[10px] text-muted-foreground font-medium">Adoption &amp; Rehoming</span>
              </div>
            </SheetTitle>
          </SheetHeader>

          <nav className="p-4 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-210px)]">
            {/* PUBLIC */}
            <div className="space-y-1">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Public
              </p>
              <div className="space-y-0.5">
                {PUBLIC_NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeNav}
                    className={getLinkClass(isActive(item.href, item.exact))}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <SignedIn>
              {/* PRIMARY MEMBER ACTION */}
              <div className="space-y-1 pt-2 border-t">
                <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Primary Member Action
                </p>
                <div className="space-y-0.5">
                  <Link
                    href={MEMBER_PRIMARY_ACTION.href}
                    onClick={closeNav}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-colors",
                      isActive(MEMBER_PRIMARY_ACTION.href)
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/10 text-primary hover:bg-primary/15"
                    )}
                  >
                    {MEMBER_PRIMARY_ACTION.label}
                  </Link>
                </div>
              </div>

              {/* YOUR ACTIVITY */}
              <div className="space-y-1 pt-2 border-t">
                <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Your Activity
                </p>
                <div className="space-y-0.5">
                  {MEMBER_ACTIVITY_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeNav}
                      className={getLinkClass(isActive(item.href, item.exact))}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* RESTRAINED ADMIN ENTRY */}
              {isAdmin && (
                <div className="space-y-1 pt-2 border-t">
                  <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Administration
                  </p>
                  <div className="space-y-0.5">
                    <Link
                      href={ADMIN_NAV_ITEM.href}
                      onClick={closeNav}
                      className={getLinkClass(isActive(ADMIN_NAV_ITEM.href, false))}
                    >
                      {ADMIN_NAV_ITEM.label} Console
                    </Link>
                  </div>
                </div>
              )}
            </SignedIn>
          </nav>
        </div>

        {/* ACCOUNT SECTION (BOTTOM DRAWER) */}
        <div className="p-4 border-t bg-muted/20 space-y-3">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Account
          </p>

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
                  <span className="text-xs font-semibold text-foreground truncate max-w-[130px]">
                    {profile?.first_name ? `${profile.first_name} ${profile.last_name || ""}` : "My Account"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Manage profile</span>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </SignedIn>

          <SignedOut>
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <SignInButton mode="modal">
                  <Button variant="outline" size="sm" className="w-full text-xs font-medium" onClick={closeNav}>
                    Sign In
                  </Button>
                </SignInButton>
                <Link
                  href={GUEST_PRIMARY_CTA.href}
                  onClick={closeNav}
                  className={cn(buttonVariants({ size: "sm" }), "w-full text-xs font-medium shadow-xs")}
                >
                  {GUEST_PRIMARY_CTA.label}
                </Link>
              </div>
            </div>
          </SignedOut>
        </div>
      </SheetContent>
    </Sheet>
  );
}
