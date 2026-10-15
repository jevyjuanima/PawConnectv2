import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/clerk/auth";
import { ShieldCheck, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdminNav } from "@/components/admin/AdminNav";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const isAdmin = await isCurrentUserAdmin();

  if (!isAdmin) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-muted/15 flex flex-col">
      {/* Admin Top Navigation Banner */}
      <header className="border-b border-border/80 bg-card sticky top-0 z-30 shadow-2xs backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 py-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-xs">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-lg font-normal tracking-tight text-foreground">
                      PawConnect
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/20 px-1.5 py-0"
                    >
                      Staff Console
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground hidden sm:block">
                    Operational management for listings, applications, screenings, and welfare.
                  </p>
                </div>
              </div>

              {/* Mobile Back Link */}
              <Link
                href="/"
                className="lg:hidden text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-medium"
              >
                <span>Site</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            {/* Admin Subnav */}
            <div className="flex items-center justify-between lg:justify-end gap-3">
              <AdminNav />

              {/* Desktop Back Link */}
              <Link
                href="/"
                className="hidden lg:inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium pl-3 border-l border-border/70 shrink-0"
              >
                <span>Public Site</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        {children}
      </main>
    </div>
  );
}
