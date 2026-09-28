"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home, Dog } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export default function DogsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Dogs gallery error:", error.message);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center max-w-lg">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-6">
        <Dog className="h-8 w-8" />
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">
        Unable to Load Dog Listings
      </h1>

      <p className="text-sm text-muted-foreground mb-6">
        We encountered an issue retrieving the latest verified dog listings from the database.
      </p>

      <Alert variant="destructive" className="text-left mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="text-xs font-bold">Network or Database Notice</AlertTitle>
        <AlertDescription className="text-xs">
          The dog adoption service could not complete your request. Please check your connection and retry.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
        <Button onClick={() => reset()} className="w-full sm:w-auto gap-2">
          <RotateCcw className="h-4 w-4" />
          Retry Search
        </Button>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto gap-2")}
        >
          <Home className="h-4 w-4" />
          Home
        </Link>
      </div>
    </div>
  );
}
