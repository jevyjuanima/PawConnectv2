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
import { NotificationBell } from "@/components/layout/NotificationBell";
import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import type { UserProfile } from "@/lib/clerk/auth";

interface MobileNavProps {
  profile: UserProfile | null;
}

export function MobileNav({ profile }: MobileNavProps) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const isAdmin = profile?.role === "admin";

  const closeNav = () => setOpen(false);

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
            <SheetTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-sm">
                <PawPrint className="h-4 w-4" />
              </div>
              <span className="font-bold text-lg tracking-tight">PawConnect</span>
            </SheetTitle>
          </SheetHeader>

          <nav className="p-4 flex flex-col gap-1">
            <Link
              href="/"
              onClick={closeNav}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                pathname === "/"
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <Home className="h-4 w-4" />
              Home
            </Link>

            <Link
              href="/dogs"
              onClick={closeNav}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                pathname.startsWith("/dogs")
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <Dog className="h-4 w-4" />
              Browse Dogs
            </Link>

            <SignedIn>
              <Link
                href="/dashboard"
                onClick={closeNav}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  pathname === "/dashboard"
                    ? "bg-muted text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>

              <Link
                href="/rehome"
                onClick={closeNav}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  pathname.startsWith("/rehome")
                    ? "bg-muted text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <PlusCircle className="h-4 w-4 text-primary" />
                Rehome a Dog
              </Link>

              <Link
                href="/my-applications"
                onClick={closeNav}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  pathname.startsWith("/my-applications")
                    ? "bg-muted text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <HeartHandshake className="h-4 w-4" />
                My Applications
              </Link>

              <Link
                href="/my-dogs"
                onClick={closeNav}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  pathname.startsWith("/my-dogs")
                    ? "bg-muted text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <FileText className="h-4 w-4" />
                My Listed Dogs
              </Link>

              {isAdmin && (
                <>
                  <Separator className="my-2" />
                  <Link
                    href="/admin"
                    onClick={closeNav}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      pathname.startsWith("/admin")
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-primary/90 hover:bg-primary/10"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <ShieldAlert className="h-4 w-4 text-primary" />
                      Admin Console
                    </span>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                      Staff
                    </Badge>
                  </Link>
                </>
              )}
            </SignedIn>
          </nav>
        </div>

        <div className="p-4 border-t flex flex-col gap-3 bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Display Mode</span>
            <div className="flex items-center gap-2">
              <SignedIn>
                <NotificationBell />
              </SignedIn>
              <ThemeToggle />
            </div>
          </div>

          <SignedOut>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <SignInButton mode="modal">
                <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={closeNav}>
                  <LogIn className="h-3.5 w-3.5" />
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm" className="w-full gap-1.5" onClick={closeNav}>
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
