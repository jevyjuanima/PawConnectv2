import * as React from "react";
import Link from "next/link";
import { ChevronRight, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RehomeForm } from "@/components/rehome/RehomeForm";

export default function RehomePage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-foreground">Rehome a Dog</span>
      </nav>

      {/* Header */}
      <div className="border-b pb-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider font-semibold">
            Responsible Rehoming
          </Badge>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
          <PlusCircle className="h-8 w-8 text-primary" />
          List a Dog for Adoption
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Complete the form below with comprehensive health, medical, and temperament details. Every listing is reviewed by PawConnect administrators before being published.
        </p>
      </div>

      {/* Form Container */}
      <RehomeForm />
    </div>
  );
}
