import * as React from "react";
import Link from "next/link";
import { PawPrint } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { NavLinks } from "@/components/layout/NavLinks";
import { MobileNav } from "@/components/layout/MobileNav";
import { getCurrentUserProfile } from "@/lib/clerk/auth";
import { GUEST_PRIMARY_CTA } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";

export async function Navbar() {
  const profile = await getCurrentUserProfile();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/90 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Desktop Nav */}
        <div className="flex items-center gap-6 lg:gap-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
            aria-label="PawConnect Home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-xs">
              <PawPrint className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl font-bold tracking-tight text-foreground leading-none">
                PawConnect
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">
                Adoption &amp; Rehoming
              </span>
            </div>
          </Link>

          <NavLinks profile={profile} />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          <SignedIn>
            <NotificationBell />
            <div className="ml-1 flex items-center">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-9 w-9 ring-1 ring-border",
                  },
                }}
              />
            </div>
          </SignedIn>

          <SignedOut>
            <div className="hidden md:flex items-center gap-2">
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm" className="font-medium text-sm">
                  Sign In
                </Button>
              </SignInButton>
              <Link
                href={GUEST_PRIMARY_CTA.href}
                className={cn(buttonVariants({ size: "sm" }), "shadow-xs font-medium text-sm")}
              >
                {GUEST_PRIMARY_CTA.label}
              </Link>
            </div>
          </SignedOut>

          {/* Mobile Navigation Drawer Trigger */}
          <MobileNav profile={profile} />
        </div>
      </div>
    </header>
  );
}
