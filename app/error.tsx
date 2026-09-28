"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log unexpected errors safely on client without exposing internal credentials
    console.error("Application runtime error:", error.message);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[60vh] text-center max-w-lg">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-6 shadow-xs">
        <AlertCircle className="h-8 w-8" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mb-2">
        Something Went Wrong
      </h1>

      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
        We encountered an unexpected issue while loading this page. Our team has been notified.
      </p>

      <Alert variant="destructive" className="text-left mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="text-xs font-bold">Error Notice</AlertTitle>
        <AlertDescription className="text-xs">
          An error occurred during page rendering. Please try refreshing or return to the homepage.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
        <Button onClick={() => reset()} className="w-full sm:w-auto gap-2 shadow-xs">
          <RotateCcw className="h-4 w-4" />
          Try Again
        </Button>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto gap-2")}
        >
          <Home className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
