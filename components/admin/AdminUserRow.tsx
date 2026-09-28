"use client";

import * as React from "react";
import { toast } from "sonner";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { updateUserRoleAction } from "@/app/actions/admin";
import { formatDate } from "@/lib/utils/format";
import { USER_ROLES } from "@/lib/constants/statuses";
import type { ProfileRecord } from "@/types";

interface AdminUserRowProps {
  profile: ProfileRecord;
  currentUserId: string;
}

export function AdminUserRow({
  profile: initialProfile,
  currentUserId,
}: AdminUserRowProps) {
  const [profile, setProfile] = React.useState(initialProfile);
  const [processing, setProcessing] = React.useState(false);

  const isSelf = profile.clerk_id === currentUserId;
  const isAdmin = profile.role === USER_ROLES.ADMIN;

  const handleRoleToggle = async () => {
    const newRole = isAdmin ? USER_ROLES.USER : USER_ROLES.ADMIN;
    setProcessing(true);

    const res = await updateUserRoleAction(profile.clerk_id, newRole);
    if (res.success) {
      setProfile((prev) => ({ ...prev, role: newRole }));
      toast.success(
        `User ${profile.first_name || profile.email} role updated to ${newRole}.`
      );
    } else {
      toast.error(res.error || "Failed to update role");
    }
    setProcessing(false);
  };

  const displayName = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(" ") || "Unnamed User";

  const initials = (profile.first_name?.[0] || profile.email?.[0] || "U").toUpperCase();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-card shadow-2xs hover:shadow-xs transition-shadow">
      {/* User Info */}
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="h-10 w-10 border shrink-0">
          {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={displayName} />}
          <AvatarFallback className="font-bold text-xs bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-foreground truncate">
              {displayName}
            </span>
            {isSelf && (
              <Badge variant="outline" className="text-[10px] py-0">
                You
              </Badge>
            )}
            <Badge
              variant={isAdmin ? "default" : "secondary"}
              className="text-[10px] uppercase font-bold tracking-wider"
            >
              {profile.role}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
        </div>
      </div>

      {/* Meta & Role Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-4 text-xs text-muted-foreground shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
        <span>Joined: {formatDate(profile.created_at)}</span>

        {!isSelf ? (
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant={isAdmin ? "outline" : "secondary"}
                  size="sm"
                  className="text-xs gap-1.5 h-8 cursor-pointer"
                >
                  {isAdmin ? (
                    <>
                      <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />
                      Demote to User
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      Grant Admin
                    </>
                  )}
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {isAdmin ? "Revoke Admin Privileges?" : "Grant Admin Privileges?"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {isAdmin
                    ? `Are you sure you want to remove administrator privileges from ${displayName}? They will only have standard user access.`
                    : `Are you sure you want to grant full administrator privileges to ${displayName}? They will be able to review dogs, manage applications, and access admin settings.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRoleToggle} disabled={processing}>
                  {processing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Confirm Role Change"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <span className="text-xs text-muted-foreground italic">Primary Session</span>
        )}
      </div>
    </div>
  );
}
