import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, ShieldCheck, Heart, Dog as DogIcon } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatAge,
  formatCapitalize,
} from "@/lib/utils/format";
import { DogStatusBadge } from "@/components/shared/StatusBadges";
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
    <Card className="group overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:shadow-lg hover:border-primary/40 flex flex-col justify-between">
      <div>
        {/* Image / Fallback Cover */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {primaryImg ? (
            <Image
              src={primaryImg}
              alt={dog.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 text-muted-foreground p-6 text-center">
              <DogIcon className="h-12 w-12 text-primary/40 mb-2" />
              <span className="text-xs font-medium">Photo pending upload</span>
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 left-3 z-10">
            <DogStatusBadge
              status={dog.status}
              className="shadow-sm backdrop-blur-md bg-background/90"
            />
          </div>

          {/* Quick Gender Pill */}
          <div className="absolute top-3 right-3 z-10">
            <Badge
              variant="outline"
              className="bg-background/80 backdrop-blur-md text-xs font-medium border-border/80"
            >
              {formatCapitalize(dog.gender)}
            </Badge>
          </div>
        </div>

        {/* Card Body */}
        <CardContent className="p-5 space-y-3">
          <div className="space-y-1">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-xl font-bold tracking-tight text-foreground truncate group-hover:text-primary transition-colors">
                {dog.name}
              </h3>
              <span className="text-xs font-semibold text-primary shrink-0">
                {formatAge(dog.age_years, dog.age_months)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1">{dog.breed}</p>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
            <span className="truncate">{dog.location}</span>
          </div>

          {/* Quick Info Tags */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Badge variant="secondary" className="text-[11px] font-normal px-2 py-0.5">
              {formatCapitalize(dog.size)}
            </Badge>

            {dog.vaccinated && (
              <Badge
                variant="outline"
                className="text-[11px] font-normal px-2 py-0.5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center gap-1"
              >
                <ShieldCheck className="h-3 w-3" />
                Vaccinated
              </Badge>
            )}

            {dog.spayed_neutered && (
              <Badge
                variant="outline"
                className="text-[11px] font-normal px-2 py-0.5 text-blue-600 dark:text-blue-400 border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20"
              >
                Neutered
              </Badge>
            )}
          </div>
        </CardContent>
      </div>

      {/* Card Action */}
      <CardFooter className="px-5 pb-5 pt-0">
        <Link
          href={`/dogs/${dog.id}`}
          className={cn(
            buttonVariants({ variant: isAvailable ? "default" : "outline" }),
            "w-full shadow-sm group-hover:bg-primary flex items-center justify-center gap-2"
          )}
        >
          {isAvailable ? (
            <>
              <Heart className="h-4 w-4 fill-primary-foreground/20" />
              Meet {dog.name}
            </>
          ) : (
            <>View Profile</>
          )}
        </Link>
      </CardFooter>
    </Card>
  );
}
