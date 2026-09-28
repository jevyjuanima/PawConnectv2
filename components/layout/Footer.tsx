import * as React from "react";
import Link from "next/link";
import { PawPrint, Heart, ShieldCheck, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-sm">
                <PawPrint className="h-4 w-4" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                PawConnect
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              PawConnect is a dedicated pet adoption and responsible rehoming platform.
              We connect compassionate adopters with dogs seeking lifelong, loving families through
              verified listings and transparent administrative oversight.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Verified listings &amp; zero-tolerance exploitation policy</span>
            </div>
          </div>

          {/* Adopters */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Adopt
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/dogs" className="hover:text-foreground transition-colors">
                  Browse Dogs
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-foreground transition-colors">
                  Adoption Process
                </Link>
              </li>
              <li>
                <Link href="/my-applications" className="hover:text-foreground transition-colors">
                  Track Applications
                </Link>
              </li>
            </ul>
          </div>

          {/* Rehoming */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Rehome
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/rehome" className="hover:text-foreground transition-colors">
                  Submit a Listing
                </Link>
              </li>
              <li>
                <Link href="/my-dogs" className="hover:text-foreground transition-colors">
                  Manage My Listings
                </Link>
              </li>
              <li>
                <Link href="/#safety" className="hover:text-foreground transition-colors">
                  Rehoming Guidelines
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact / Help */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Support
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs">support@pawconnect.org</span>
              </li>
              <li className="text-xs text-muted-foreground">
                Administrative desk available Mon–Fri, 9am–6pm.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} PawConnect. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Built with care for animals everywhere</span>
            <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500 inline" />
          </div>
        </div>
      </div>
    </footer>
  );
}
