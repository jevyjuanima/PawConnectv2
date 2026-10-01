"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  PawPrint,
  HeartHandshake,
  Dog,
  FileText,
  ShieldAlert,
  PlusCircle,
  Home,
  LogIn,
  UserPlus,
  LayoutDashboard,
  Bell,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import type { UserProfile } from "@/lib/clerk/auth";

interface MobileNavProps {
  profile: UserProfile | null;
}

export function MobileNav({ profile }: MobileNavProps) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const isAdmin = profile?.role === "admin";

  const closeNav = () => setOpen(false);

  const getLinkClass = (isActive: boolean) =>
    cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
      isActive
        ? "bg-primary/10 text-primary font-semibold shadow-2xs"
        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
    );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "md:hidden h-9 w-9 text-muted-foreground hover:text-foreground cursor-pointer"
        )}
        aria-label="Open mobile navigation"
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0 flex flex-col justify-between">
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

          <nav className="p-4 flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-200px)]">
            <Link
              href="/"
              onClick={closeNav}
              className={getLinkClass(pathname === "/")}
            >
              <Home className="h-4 w-4" />
              Home
            </Link>

            <Link
              href="/dogs"
              onClick={closeNav}
              className={getLinkClass(pathname.startsWith("/dogs"))}
            >
              <Dog className="h-4 w-4" />
              Browse Dogs
            </Link>

            <SignedIn>
              <Link
                href="/dashboard"
                onClick={closeNav}
                className={getLinkClass(pathname === "/dashboard")}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>

              <Link
                href="/rehome"
                onClick={closeNav}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  pathname.startsWith("/rehome")
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                )}
              >
                <PlusCircle className="h-4 w-4" />
                Rehome a Dog
              </Link>

              <Link
                href="/my-applications"
                onClick={closeNav}
                className={getLinkClass(pathname.startsWith("/my-applications"))}
              >
                <HeartHandshake className="h-4 w-4" />
                My Applications
              </Link>

              <Link
                href="/my-dogs"
                onClick={closeNav}
                className={getLinkClass(pathname.startsWith("/my-dogs"))}
              >
                <FileText className="h-4 w-4" />
                My Listed Dogs
              </Link>

              <Link
                href="/dashboard#notifications"
                onClick={closeNav}
                className={getLinkClass(false)}
              >
                <Bell className="h-4 w-4" />
                Notifications
              </Link>

              {isAdmin && (
                <>
                  <Separator className="my-2" />
                  <Link
                    href="/admin"
                    onClick={closeNav}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                      pathname.startsWith("/admin")
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <ShieldAlert className="h-4 w-4" />
                      Admin Console
                    </span>
                    <Badge
                      variant={pathname.startsWith("/admin") ? "outline" : "secondary"}
                      className={cn(
                        "text-[9px] uppercase font-bold tracking-wider",
                        pathname.startsWith("/admin") && "border-primary-foreground/30 text-primary-foreground"
                      )}
                    >
                      Staff
                    </Badge>
                  </Link>
                </>
              )}
            </SignedIn>
          </nav>
        </div>

        <div className="p-4 border-t flex flex-col gap-3 bg-muted/20">
          <SignedIn>
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8 ring-2 ring-primary/20",
                    },
                  }}
                />
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-foreground truncate max-w-[140px]">
                    {profile?.first_name ? `${profile.first_name} ${profile.last_name || ""}` : "My Account"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Manage profile</span>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </SignedIn>

          <SignedOut>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Display Mode</span>
              <ThemeToggle />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <SignInButton mode="modal">
                <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={closeNav}>
                  <LogIn className="h-3.5 w-3.5" />
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm" className="w-full gap-1.5 shadow-sm" onClick={closeNav}>
                  <UserPlus className="h-3.5 w-3.5" />
                  Sign Up
                </Button>
              </SignUpButton>
            </div>
          </SignedOut>
        </div>
      </SheetContent>
    </Sheet>
  );
}
