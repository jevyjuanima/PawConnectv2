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
    <div className="space-y-4">
      {/* Main Large Display */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border bg-muted shadow-xs">
        {activeImage ? (
          <Image
            src={activeImage}
            alt={dogName}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover transition-all duration-300"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 text-muted-foreground p-8 text-center">
            <DogIcon className="h-16 w-16 text-primary/40 mb-3" />
            <p className="text-sm font-medium">No photo available</p>
          </div>
        )}
      </div>

      {/* Thumbnails Row */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              onClick={() => setActiveImage(img.public_url)}
              className={`relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                activeImage === img.public_url
                  ? "border-primary ring-2 ring-primary/20 scale-102"
                  : "border-border/60 opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={img.public_url}
                alt={`${dogName} photo ${idx + 1}`}
                fill
                sizes="96px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
