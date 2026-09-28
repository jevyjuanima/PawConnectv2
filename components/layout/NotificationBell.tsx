"use client";

import * as React from "react";
import { Bell, Info } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  getNotificationsAction,
  markNotificationAsReadAction,
} from "@/app/actions/notifications";
import type { NotificationRecord } from "@/types";

export function NotificationBell() {
  const [notifications, setNotifications] = React.useState<NotificationRecord[]>([]);
  const [loading, setLoading] = React.useState(false);

  const fetchNotifications = React.useCallback(async () => {
    setLoading(true);
    const res = await getNotificationsAction();
    if (res.success && res.data) {
      setNotifications(res.data);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsReadAction(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "relative h-9 w-9 text-muted-foreground hover:text-foreground cursor-pointer"
        )}
        aria-label="View notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-4 min-w-[1rem] px-1 text-[10px] font-semibold leading-none flex items-center justify-center rounded-full"
          >
            {unreadCount}
          </Badge>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <DropdownMenuLabel className="p-0 text-sm font-semibold">
            Notifications
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground font-normal">
              {unreadCount} unread
            </span>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto divide-y">
          {loading ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground px-4">
              <Info className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
              <p className="font-medium text-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Status updates for your dogs and applications will appear here.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                onClick={() => handleMarkAsRead(n.id)}
                className={`p-3 cursor-pointer flex flex-col items-start gap-1 rounded-none focus:bg-muted/60 ${
                  !n.is_read ? "bg-muted/30" : ""
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    {!n.is_read && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                    {n.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {n.message}
                </p>
              </DropdownMenuItem>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator className="m-0" />
            <div className="p-2 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs h-7 text-muted-foreground hover:text-foreground"
                onClick={fetchNotifications}
              >
                Refresh Notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
