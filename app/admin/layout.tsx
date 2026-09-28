import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/clerk/auth";
import {
  ShieldAlert,
  LayoutDashboard,
  Dog,
  HeartHandshake,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const isAdmin = await isCurrentUserAdmin();

  if (!isAdmin) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Admin Top Navigation Banner */}
      <div className="border-b bg-card shadow-2xs">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-xs">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight text-foreground">
                    PawConnect Admin Console
                  </h1>
                  <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">
                    Staff
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  System oversight, listing verification, application workflows, and user controls.
                </p>
              </div>
            </div>

            {/* Sub-nav Links */}
            <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background hover:bg-muted text-foreground transition-colors"
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
                Overview
              </Link>
              <Link
                href="/admin/dogs"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background hover:bg-muted text-foreground transition-colors"
              >
                <Dog className="h-3.5 w-3.5 text-primary" />
                Dogs Review
              </Link>
              <Link
                href="/admin/applications"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background hover:bg-muted text-foreground transition-colors"
              >
                <HeartHandshake className="h-3.5 w-3.5 text-primary" />
                Applications
              </Link>
              <Link
                href="/admin/users"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-background hover:bg-muted text-foreground transition-colors"
              >
                <Users className="h-3.5 w-3.5 text-primary" />
                Users
              </Link>
            </nav>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
