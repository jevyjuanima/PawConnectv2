import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Dog, PlusCircle, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserDogCard } from "@/components/dogs/UserDogCard";
import { getUserDogsAction } from "@/app/actions/dogs";
import { cn } from "@/lib/utils";

export default async function MyDogsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/my-dogs");
  }

  const result = await getUserDogsAction();
  const dogs = result.success && result.data ? result.data : [];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-foreground">My Dogs</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b pb-6 max-w-4xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs uppercase tracking-wider font-semibold">
              Rehoming Dashboard
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <Dog className="h-8 w-8 text-primary" />
            My Listed Dogs
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track approval states, review status, and adoption progress for dogs you have listed for rehoming.
          </p>
        </div>

        <Link
          href="/rehome"
          className={cn(buttonVariants(), "gap-2 self-start sm:self-auto shrink-0 shadow-sm")}
        >
          <PlusCircle className="h-4 w-4" />
          List Another Dog
        </Link>
      </div>

      {/* Content */}
      {dogs.length > 0 ? (
        <div className="space-y-4 max-w-4xl">
          {dogs.map((dog) => (
            <UserDogCard key={dog.id} dog={dog} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 p-12 text-center max-w-2xl mx-auto my-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <Dog className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground">No Dogs Listed Yet</h2>
          <p className="text-sm text-muted-foreground max-w-md mt-1 mb-6">
            You haven&apos;t submitted any dogs for rehoming yet. If you need to find a safe and loving home for a dog, start a listing today.
          </p>
          <Link
            href="/rehome"
            className={cn(buttonVariants(), "gap-2 shadow-sm")}
          >
            <PlusCircle className="h-4 w-4" />
            Submit a Rehoming Listing
          </Link>
        </div>
      )}
    </div>
  );
}
