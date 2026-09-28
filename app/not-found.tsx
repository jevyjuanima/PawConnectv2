import * as React from "react";
import Link from "next/link";
import { Dog, Search, Home } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center max-w-md min-h-[60vh]">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary mb-6 shadow-xs">
        <Dog className="h-10 w-10" />
      </div>

      <span className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
        404 — Page Not Found
      </span>

      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-3">
        Lost Your Trail?
      </h1>

      <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
        The page you are looking for might have been moved, removed, or doesn&apos;t exist. Let&apos;s get you back to where dogs are waiting for loving homes.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
        <Link
          href="/dogs"
          className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto gap-2 shadow-xs")}
        >
          <Search className="h-4 w-4" />
          Browse Available Dogs
        </Link>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto gap-2")}
        >
          <Home className="h-4 w-4" />
          Return Home
        </Link>
      </div>
    </div>
  );
}
