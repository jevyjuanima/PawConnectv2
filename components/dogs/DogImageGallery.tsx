"use client";

import * as React from "react";
import Image from "next/image";
import { Dog as DogIcon } from "lucide-react";
import type { DogImageRecord } from "@/types";

interface DogImageGalleryProps {
  dogName: string;
  images: DogImageRecord[];
  primaryImageUrl?: string;
}

export function DogImageGallery({
  dogName,
  images,
  primaryImageUrl,
}: DogImageGalleryProps) {
  const initialImage =
    primaryImageUrl ||
    images.find((img) => img.is_primary)?.public_url ||
    images[0]?.public_url;

  const [activeImage, setActiveImage] = React.useState<string | undefined>(
    initialImage
  );

  return (
    <div className="space-y-3">
      {/* Main Large Display */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border/80 bg-muted/30">
        {activeImage ? (
          <Image
            src={activeImage}
            alt={dogName}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-opacity duration-300"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-muted/30 text-muted-foreground p-8 text-center">
            <DogIcon className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No photograph available</p>
          </div>
        )}
      </div>

      {/* Thumbnails Row */}
      {images.length > 1 && (
        <div
          className="flex gap-2.5 overflow-x-auto pb-1 pt-0.5"
          role="region"
          aria-label="Dog photo gallery"
        >
          {images.map((img, idx) => {
            const isSelected = activeImage === img.public_url;
            return (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => setActiveImage(img.public_url)}
                aria-label={`View photo ${idx + 1} of ${dogName}`}
                aria-pressed={isSelected}
                className={`relative h-18 w-22 sm:h-20 sm:w-24 shrink-0 overflow-hidden rounded-xl border transition-all duration-150 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected
                    ? "border-primary ring-2 ring-primary/20 opacity-100"
                    : "border-border/70 opacity-60 hover:opacity-90"
                }`}
              >
                <Image
                  src={img.public_url}
                  alt={`${dogName} photo thumbnail ${idx + 1}`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

