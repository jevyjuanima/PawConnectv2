import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Dog as DogIcon, MapPin } from "lucide-react";
import { formatAge, formatCapitalize } from "@/lib/utils/format";
import type { DogWithImages } from "@/types";

interface DogCardProps {
  dog: DogWithImages;
}

export function DogCard({ dog }: DogCardProps) {
  const primaryImg =
    dog.primary_image ||
    dog.images?.find((img) => img.is_primary)?.public_url ||
    dog.images?.[0]?.public_url;

  const isAvailable = dog.status === "available";

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/50 flex flex-col justify-between">
      <div>
        {/* Dog Photograph */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {primaryImg ? (
            <Image
              src={primaryImg}
              alt={dog.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-102"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-muted/50 text-muted-foreground p-6 text-center">
              <DogIcon className="h-10 w-10 text-muted-foreground/40 mb-2" />
              <span className="text-xs">Photo pending</span>
            </div>
          )}

          {/* Availability Badge */}
          <div className="absolute top-3 left-3">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium backdrop-blur-md shadow-xs ${
                isAvailable
                  ? "bg-background/90 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                  : "bg-background/90 text-muted-foreground border border-border"
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
        </div>

        {/* Dog Information */}
        <div className="p-5 space-y-2.5">
          <div>
            <h3 className="font-serif text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
              {dog.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {dog.breed} · {formatAge(dog.age_years, dog.age_months)}
              {dog.gender && ` · ${formatCapitalize(dog.gender)}`}
            </p>
          </div>

          {dog.description ? (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {dog.description}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/80 italic">
              Friendly and looking for a caring home.
            </p>
          )}

          {dog.location && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80 pt-1">
              <MapPin className="h-3 w-3 shrink-0 text-primary/70" />
              <span className="truncate">{dog.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Action Link */}
      <div className="px-5 pb-5 pt-1">
        <Link
          href={`/dogs/${dog.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors group/link"
        >
          <span>View profile</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/link:translate-x-1" />
        </Link>
      </div>
    </article>
  );
}
