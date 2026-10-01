import * as React from "react";
import Link from "next/link";
import { PawPrint, Heart, ShieldCheck, Mail } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const footerLinks = {
  adopt: [
    { href: "/dogs", label: "Browse Dogs" },
    { href: "/#how-it-works", label: "How It Works" },
    { href: "/dashboard", label: "Dashboard" },
  ],
  rehome: [
    { href: "/rehome", label: "Rehome a Dog" },
    { href: "/my-dogs", label: "My Dog Listings" },
    { href: "/#safety", label: "Trust & Safety" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t bg-muted/20" aria-label="Site footer">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs group-hover:shadow-md transition-shadow">
                <PawPrint className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">
                PawConnect
              </span>
            </Link>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              A community platform connecting people who want to adopt dogs
              with caregivers who need to rehome responsibly through structured
              applications and administrative review.
            </p>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Admin-reviewed listings · Structured application process</span>
            </div>
          </div>

          {/* Adopt column */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-widest">
              Adopt
            </h3>
            <ul className="space-y-2">
              {footerLinks.adopt.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Rehome column */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-widest">
              Rehome
            </h3>
            <ul className="space-y-2">
              {footerLinks.rehome.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support column */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-widest">
              Support
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs">support@pawconnect.org</span>
              </li>
              <li className="text-xs leading-relaxed">
                Platform administration and review desk available weekdays.
              </li>
            </ul>
          </div>
        </div>

        <Separator className="mt-10 mb-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} PawConnect. All rights reserved.</p>
          <div className="flex items-center gap-1.5">
            <span>Thoughtful adoption and responsible rehoming</span>
            <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
          </div>
        </div>
      </div>
    </footer>
  );
}
