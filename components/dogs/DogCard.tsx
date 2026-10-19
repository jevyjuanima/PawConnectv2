import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Dog as DogIcon, MapPin, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatAge, formatCapitalize } from "@/lib/utils/format";
import type { DogWithImages } from "@/types";

interface DogCardProps {
  dog: DogWithImages;
  priority?: boolean;
}

export function DogCard({ dog, priority }: DogCardProps) {
  const primaryImg =
    dog.primary_image ||
    dog.images?.find((img) => img.is_primary)?.public_url ||
    dog.images?.[0]?.public_url;

  const isAvailable = dog.status === "available";

  return (
    <article className="group overflow-hidden rounded-2xl border border-border/80 bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-md flex flex-col justify-between">
      <div>
        {/* Dog Photograph */}
        <Link
          href={`/dogs/${dog.id}`}
          className="relative block aspect-[4/3] w-full overflow-hidden bg-muted"
        >
          {primaryImg ? (
            <Image
              src={primaryImg}
              alt={dog.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              priority={priority}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-muted/40 text-muted-foreground p-6 text-center">
              <DogIcon className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <span className="text-xs font-medium">Photo pending review</span>
            </div>
          )}

          {/* Availability Badge */}
          <div className="absolute top-3 left-3">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md shadow-xs ${
                isAvailable
                  ? "bg-background/95 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25"
                  : "bg-background/95 text-muted-foreground border border-border"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isAvailable ? "bg-emerald-500" : "bg-muted-foreground"
                }`}
              />
              {isAvailable ? "Available" : formatCapitalize(dog.status)}
            </span>
          </div>
        </Link>

        {/* Dog Information */}
        <div className="p-5 space-y-3">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                <Link href={`/dogs/${dog.id}`}>{dog.name}</Link>
              </h3>
            </div>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">
              {dog.breed}
            </p>
          </div>

          {/* Quick Attribute Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <Badge variant="secondary" className="px-2 py-0 text-[11px] font-medium bg-muted/80 text-foreground/80 border-border/50">
              {formatAge(dog.age_years, dog.age_months)}
            </Badge>
            {dog.size && (
              <Badge variant="secondary" className="px-2 py-0 text-[11px] font-medium bg-muted/80 text-foreground/80 border-border/50">
                {formatCapitalize(dog.size)} size
              </Badge>
            )}
            {dog.gender && (
              <Badge variant="secondary" className="px-2 py-0 text-[11px] font-medium bg-muted/80 text-foreground/80 border-border/50">
                {formatCapitalize(dog.gender)}
              </Badge>
            )}
          </div>

          {dog.description ? (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {dog.description}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/75 italic">
              A loving dog looking for a compassionate forever home.
            </p>
          )}

          {dog.location && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5">
              <MapPin className="h-3 w-3 shrink-0 text-primary/70" />
              <span className="truncate">{dog.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Action Link */}
      <div className="px-5 pb-5 pt-1 border-t border-border/40 mt-1">
        <Link
          href={`/dogs/${dog.id}`}
          className="inline-flex items-center justify-between w-full text-xs font-semibold text-primary hover:text-primary/80 transition-colors group/link pt-2"
        >
          <span>Meet {dog.name}</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/link:translate-x-1" />
        </Link>
      </div>
    </article>
  );
}
