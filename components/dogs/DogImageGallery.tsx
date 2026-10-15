"use client";

import * as React from "react";
import Image from "next/image";
import { Dog as DogIcon } from "lucide-react";
import type { DogImageRecord } from "@/types";

interface DogImageGalleryProps {
  dogName: string;
  images: DogImageRecord[];
  primaryImageUrl?: string;
  videoUrl?: string | null;
}

export function DogImageGallery({
  dogName,
  images,
  primaryImageUrl,
  videoUrl,
}: DogImageGalleryProps) {
  const initialImage =
    primaryImageUrl ||
    images.find((img) => img.is_primary)?.public_url ||
    images[0]?.public_url;

  const [activeMedia, setActiveMedia] = React.useState<"photo" | "video">("photo");
  const [activeImage, setActiveImage] = React.useState<string | undefined>(
    initialImage
  );

  return (
    <div className="space-y-3">
      {/* Media Type Switcher Tabs (when video is available) */}
      {videoUrl && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveMedia("photo")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeMedia === "photo"
                ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Photos ({images.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMedia("video")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeMedia === "video"
                ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Video Introduction</span>
          </button>
        </div>
      )}

      {/* Main Showcase: Video or Selected Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border/80 bg-black/90 shadow-2xs">
        {activeMedia === "video" && videoUrl ? (
          <div className="relative h-full w-full flex items-center justify-center bg-black">
            <video
              src={videoUrl}
              controls
              playsInline
              preload="metadata"
              className="h-full w-full object-contain"
            >
              Your browser does not support the video element.
            </video>
          </div>
        ) : activeImage ? (
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
            <p className="text-sm font-medium text-muted-foreground">No media available</p>
          </div>
        )}
      </div>

      {/* Thumbnails Row: Photos + Video Thumbnail */}
      {(images.length > 1 || videoUrl) && (
        <div
          className="flex gap-2.5 overflow-x-auto pb-1 pt-0.5"
          role="region"
          aria-label="Dog media gallery"
        >
          {images.map((img, idx) => {
            const isSelected = activeMedia === "photo" && activeImage === img.public_url;
            return (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => {
                  setActiveMedia("photo");
                  setActiveImage(img.public_url);
                }}
                aria-label={`View photo ${idx + 1} of ${dogName}`}
                aria-pressed={isSelected}
                className={`relative h-18 w-22 sm:h-20 sm:w-24 shrink-0 overflow-hidden rounded-xl border transition-all duration-150 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
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

          {videoUrl && (
            <button
              type="button"
              onClick={() => setActiveMedia("video")}
              aria-label={`Play introduction video of ${dogName}`}
              aria-pressed={activeMedia === "video"}
              className={`relative h-18 w-22 sm:h-20 sm:w-24 shrink-0 overflow-hidden rounded-xl border transition-all duration-150 flex flex-col items-center justify-center gap-1 bg-muted/60 text-foreground cursor-pointer ${
                activeMedia === "video"
                  ? "border-primary ring-2 ring-primary/20 opacity-100 bg-primary/10"
                  : "border-border/70 opacity-70 hover:opacity-100"
              }`}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                <span className="text-[10px] font-bold">▶</span>
              </div>
              <span className="text-[10px] font-semibold">Video</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

