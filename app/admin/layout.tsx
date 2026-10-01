import * as React from "react";
import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/clerk/auth";
import { ShieldAlert } from "lucide-react";
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

            {/* Simple Sub-nav Links */}
            <AdminNav />
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
