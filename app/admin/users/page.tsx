import * as React from "react";
import { auth } from "@clerk/nextjs/server";
import { Users, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdminUserRow } from "@/components/admin/AdminUserRow";
import { getAdminUsersAction } from "@/app/actions/admin";

export default async function AdminUsersPage() {
  const { userId } = await auth();
  const res = await getAdminUsersAction();
  const profiles = res.success && res.data ? res.data : [];

  const adminCount = profiles.filter((p) => p.role === "admin").length;
  const userCount = profiles.filter((p) => p.role === "user").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              User Accounts &amp; Permissions
            </h2>
            <Badge variant="secondary" className="text-xs">
              {profiles.length} Accounts
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Manage registered accounts, monitor platform access, and manage role elevation.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Badge variant="default" className="gap-1 text-[11px]">
            <Shield className="h-3 w-3" />
            {adminCount} Admin{adminCount > 1 ? "s" : ""}
          </Badge>
          <Badge variant="outline" className="text-[11px]">
            {userCount} Standard User{userCount > 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      {/* User Rows */}
      {profiles.length > 0 ? (
        <div className="space-y-3">
          {profiles.map((profile) => (
            <AdminUserRow
              key={profile.id}
              profile={profile}
              currentUserId={userId || ""}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 p-12 text-center">
          <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="text-base font-bold text-foreground">No Users Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1">
            There are currently no user profiles in the database.
          </p>
        </div>
      )}
    </div>
  );
}
