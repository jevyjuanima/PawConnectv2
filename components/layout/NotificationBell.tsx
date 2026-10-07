"use client";

import * as React from "react";
import {
  Bell,
  CheckCircle2,
  ClipboardCheck,
  RefreshCw,
  XCircle,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getNotificationsAction,
  markNotificationAsReadAction,
} from "@/app/actions/notifications";
import type { NotificationRecord } from "@/types";

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

    if (diffInSeconds < 60) return "Just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

type NotificationCategory = "approved" | "rejected" | "application" | "system";

function getNotificationCategory(n: NotificationRecord): NotificationCategory {
  const title = (n.title || "").toLowerCase();
  const msg = (n.message || "").toLowerCase();

  if (
    title.includes("reject") ||
    title.includes("not approved") ||
    msg.includes("not approved") ||
    msg.includes("rejected")
  ) {
    return "rejected";
  }

  if (
    title.includes("approved") ||
    msg.includes("approved") ||
    msg.includes("finalized") ||
    msg.includes("congratulations")
  ) {
    return "approved";
  }

  if (
    n.type === "application_status" ||
    title.includes("application") ||
    title.includes("adoption")
  ) {
    return "application";
  }

  return "system";
}

function NotificationIcon({ n }: { n: NotificationRecord }) {
  const category = getNotificationCategory(n);

  switch (category) {
    case "approved":
      return (
        <div className="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-4" />
        </div>
      );
    case "rejected":
      return (
        <div className="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400">
          <XCircle className="size-4" />
        </div>
      );
    case "application":
      return (
        <div className="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
          <ClipboardCheck className="size-4" />
        </div>
      );
    case "system":
    default:
      return (
        <div className="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/70 text-muted-foreground">
          <Bell className="size-4" />
        </div>
      );
  }
}

export function NotificationBell() {
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [markingAll, setMarkingAll] = React.useState(false);

  const fetchNotifications = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNotificationsAction();
      if (res.success && res.data) {
        setNotifications(res.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = React.useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  const handleMarkAsRead = async (id: string) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    try {
      await markNotificationAsReadAction(id);
    } catch {
      // Background retry or ignore
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    if (unread.length === 0 || markingAll) return;

    setMarkingAll(true);
    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    try {
      await Promise.allSettled(
        unread.map((n) => markNotificationAsReadAction(n.id))
      );
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "relative size-9 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground shadow-xs ring-2 ring-background animate-in fade-in zoom-in-75 duration-200"
            aria-hidden="true"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        collisionPadding={12}
        className="w-[calc(100vw-1.5rem)] sm:w-[390px] max-w-[400px] p-0 shadow-xl border border-border/80 rounded-2xl bg-popover overflow-hidden flex flex-col"
      >
        {/* Compact, Sticky Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-popover/95 px-4 py-3 backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-foreground">
              Notifications
            </span>
            {unreadCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                {unreadCount} new
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
            >
              {markingAll ? "Marking..." : "Mark all as read"}
            </button>
          )}
        </div>

        {/* Scrollable Notification List */}
        <div className="max-h-[380px] sm:max-h-[420px] overflow-y-auto divide-y divide-border/40 overscroll-contain">
          {loading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center text-xs text-muted-foreground">
              <RefreshCw className="size-4 animate-spin mb-2 text-muted-foreground/60" />
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground mb-3">
                <Bell className="size-4.5" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                You&apos;re all caught up
              </p>
              <p className="mt-1 text-xs text-muted-foreground max-w-[220px]">
                No new notifications right now.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                role="button"
                tabIndex={0}
                onClick={() => handleMarkAsRead(n.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleMarkAsRead(n.id);
                  }
                }}
                className={cn(
                  "group flex items-start gap-3 p-3.5 sm:p-4 transition-colors cursor-pointer text-left select-none focus:outline-none focus-visible:bg-muted/70",
                  !n.is_read
                    ? "bg-primary/[0.03] hover:bg-primary/[0.06] dark:bg-primary/[0.05] dark:hover:bg-primary/[0.09]"
                    : "bg-transparent hover:bg-muted/40"
                )}
              >
                {/* Small status/type icon */}
                <NotificationIcon n={n} />

                {/* Content Block with Clear Hierarchy */}
                <div className="flex flex-1 min-w-0 flex-col gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4
                      className={cn(
                        "text-xs leading-snug break-words",
                        !n.is_read
                          ? "font-semibold text-foreground"
                          : "font-medium text-foreground/80"
                      )}
                    >
                      {n.title}
                    </h4>
                    {!n.is_read && (
                      <span
                        className="mt-1 size-2 shrink-0 rounded-full bg-primary"
                        title="Unread notification"
                        aria-label="Unread"
                      />
                    )}
                  </div>

                  {/* Unclipped Message Preview */}
                  <p className="text-xs leading-relaxed text-muted-foreground break-words whitespace-normal">
                    {n.message}
                  </p>

                  {/* Subtle Timestamp */}
                  <span className="mt-0.5 text-[11px] font-normal text-muted-foreground/75">
                    {formatRelativeTime(n.created_at)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Subtle Secondary Footer */}
        <div className="border-t border-border/60 bg-muted/20 p-2 text-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full text-xs font-normal text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={fetchNotifications}
            disabled={loading}
          >
            <RefreshCw
              className={cn("size-3.5 mr-1.5", loading && "animate-spin")}
            />
            {loading ? "Checking for updates..." : "Refresh notifications"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
