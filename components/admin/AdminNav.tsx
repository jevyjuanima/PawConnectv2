"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Dog, HeartHandshake, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminNav() {
  const pathname = usePathname();

  const links = [
    {
      href: "/admin",
      label: "Overview",
      icon: LayoutDashboard,
      isActive: pathname === "/admin",
    },
    {
      href: "/admin/dogs",
      label: "Dogs",
      icon: Dog,
      isActive: pathname.startsWith("/admin/dogs"),
    },
    {
      href: "/admin/applications",
      label: "Applications",
      icon: HeartHandshake,
      isActive: pathname.startsWith("/admin/applications"),
    },
    {
      href: "/admin/users",
      label: "Users",
      icon: Users,
      isActive: pathname.startsWith("/admin/users"),
    },
  ];

  return (
    <nav className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all shrink-0",
              link.isActive
                ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
                : "bg-background hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", link.isActive ? "text-primary-foreground" : "text-primary")} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
