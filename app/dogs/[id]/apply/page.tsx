import * as React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ChevronRight, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ApplicationForm } from "@/components/applications/ApplicationForm";
import { getDogByIdAction } from "@/app/actions/dogs";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DOG_STATUSES } from "@/lib/constants/statuses";

interface ApplyPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ApplyPage({ params }: ApplyPageProps) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect(`/sign-in?redirect_url=/dogs/${id}/apply`);
  }

  const result = await getDogByIdAction(id);
  if (!result.success || !result.data) {
    notFound();
  }

  const dog = result.data;

  // Cannot adopt own dog
  if (dog.owner_id === userId) {
    redirect(`/dogs/${id}`);
  }

  // Cannot apply if not available
  if (dog.status !== DOG_STATUSES.AVAILABLE) {
    redirect(`/dogs/${id}`);
  }

  // Check if existing application is already in flight
  try {
    const supabase = await createServerSupabaseClient();
    const { data: existingApp } = await supabase
      .from("adoption_applications")
      .select("id, status")
      .eq("dog_id", dog.id)
      .eq("applicant_id", userId)
      .not("status", "in", '("cancelled","rejected")')
      .maybeSingle();

    if (existingApp) {
      redirect("/my-applications");
    }
  } catch {
    // Non-fatal, application form handles error
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/dogs" className="hover:text-foreground transition-colors">
          Browse Dogs
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/dogs/${dog.id}`} className="hover:text-foreground transition-colors">
          {dog.name}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-foreground">Adoption Application</span>
      </nav>

      {/* Header */}
      <div className="border-b pb-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider font-semibold">
            Adoption Application
          </Badge>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
          <Heart className="h-8 w-8 text-primary fill-primary/20" />
          Adopt {dog.name}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Complete this questionnaire to help PawConnect administrators and {dog.name}&apos;s caretaker evaluate home compatibility.
        </p>
      </div>

      {/* Form */}
      <ApplicationForm dog={dog} />
    </div>
  );
}
