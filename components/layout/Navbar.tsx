import * as React from "react";
import Link from "next/link";
import { PawPrint, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { NavLinks } from "@/components/layout/NavLinks";
import { MobileNav } from "@/components/layout/MobileNav";
import { getCurrentUserProfile } from "@/lib/clerk/auth";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export async function Navbar() {
  const profile = await getCurrentUserProfile();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Desktop Nav */}
        <div className="flex items-center gap-6 md:gap-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-transform hover:scale-105"
            aria-label="PawConnect Home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-sm">
              <PawPrint className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-foreground leading-none">
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
                    avatarBox: "h-9 w-9 ring-2 ring-primary/20",
                  },
                }}
              />
            </div>
          </SignedIn>

          <SignedOut>
            <div className="hidden sm:flex items-center gap-2">
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm" className="gap-1.5 font-medium">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm" className="gap-1.5 shadow-sm font-medium">
                  <UserPlus className="h-4 w-4" />
                  Get Started
                </Button>
              </SignUpButton>
            </div>
          </SignedOut>

          {/* Mobile Navigation Drawer Trigger */}
          <MobileNav profile={profile} />
        </div>
      </div>
    </header>
  );
}
