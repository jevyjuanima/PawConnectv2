import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DogNotFound() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 max-w-xl text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Listing Unavailable
      </p>

      <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-foreground mb-4">
        We couldn&apos;t find that dog.
      </h1>

      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-8">
        The listing may have been removed or is no longer available. Explore our other dogs currently waiting for a loving home.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/dogs"
          className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto font-medium gap-2")}
        >
          <Search className="h-4 w-4" />
          Browse Dogs
        </Link>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto font-medium gap-2")}
        >
          <ArrowLeft className="h-4 w-4" />
          Return Home
        </Link>
      </div>
    </div>
  );
}
