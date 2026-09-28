"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldAlert, RotateCcw, Home } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Admin dashboard error:", error.message);
  }, [error]);

  return (
    <div className="py-12 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-6">
        <ShieldAlert className="h-8 w-8" />
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
        Admin Console Error
      </h2>

      <p className="text-sm text-muted-foreground mb-6">
        An error occurred while loading administrative records. Ensure your administrative privileges remain active.
      </p>

      <Alert variant="destructive" className="text-left mb-6">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle className="text-xs font-bold">Administrative Access Notice</AlertTitle>
        <AlertDescription className="text-xs">
          Unable to complete the administrative query. If the problem persists, please check your network connection.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
        <Button onClick={() => reset()} className="w-full sm:w-auto gap-2">
          <RotateCcw className="h-4 w-4" />
          Reload Admin View
        </Button>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto gap-2")}
        >
          <Home className="h-4 w-4" />
          Return to Platform Home
        </Link>
      </div>
    </div>
  );
}
