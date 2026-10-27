"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Heart,
  Dog,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Eye,
  Camera,
  Video,
  Play,
  Pencil,
  ShieldCheck,
  Syringe,
  Pill,
  Scale,
  FileText,
  Sparkles,
  ArrowRight,
  Upload,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { FollowupVideoPlayer } from "@/components/followups/FollowupVideoPlayer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FollowupStatusBadge } from "@/components/shared/StatusBadges";
import { FollowupReportDialog } from "@/components/followups/FollowupReportDialog";
import { FOLLOWUP_STATUSES } from "@/lib/constants/statuses";
import { formatDate, formatAge, formatCapitalize } from "@/lib/utils/format";
import type { FollowupWithDetails } from "@/types";
import { cn } from "@/lib/utils";

interface UserFollowupListProps {
  followups: FollowupWithDetails[];
}

type RecordCategory = "health" | "vaccinations" | "deworming" | "weight" | "notes";

interface MonthInfo {
  index: number;
  monthNumber: number;
  shortLabel: string;
  fullLabel: string;
  year: number;
  monthName: string;
  followup: FollowupWithDetails | null;
}

export function UserFollowupList({ followups: initialFollowups }: UserFollowupListProps) {
  const router = useRouter();

  // Group all followups by dog
  const dogsMap = React.useMemo(() => {
    const map = new Map<
      string,
      {
        dog: FollowupWithDetails["dog"];
        items: FollowupWithDetails[];
      }
    >();

    for (const f of initialFollowups) {
      const dogId = f.dog_id || f.dog?.id || "unknown";
      if (!map.has(dogId)) {
        map.set(dogId, {
          dog: f.dog,
          items: [],
        });
      }
      map.get(dogId)!.items.push(f);
    }

    // Sort items by month_number for each dog
    for (const entry of map.values()) {
      entry.items.sort((a, b) => a.month_number - b.month_number);
    }

    return Array.from(map.values());
  }, [initialFollowups]);

  // Selected Dog State (defaults to first dog)
  const [selectedDogId, setSelectedDogId] = React.useState<string>(
    dogsMap[0]?.dog?.id || dogsMap[0]?.items[0]?.dog_id || ""
  );

  React.useEffect(() => {
    if (dogsMap.length > 0 && !dogsMap.some((e) => (e.dog?.id || e.items[0]?.dog_id) === selectedDogId)) {
      setSelectedDogId(dogsMap[0].dog?.id || dogsMap[0].items[0]?.dog_id || "");
    }
  }, [dogsMap, selectedDogId]);

  // Active dog entry
  const activeDogEntry = React.useMemo(() => {
    return (
      dogsMap.find((entry) => (entry.dog?.id || entry.items[0]?.dog_id) === selectedDogId) ||
      dogsMap[0]
    );
  }, [dogsMap, selectedDogId]);

  const activeDog = activeDogEntry?.dog;
  const activeItems = React.useMemo(() => activeDogEntry?.items || [], [activeDogEntry]);

  // Default year state
  const defaultYear = React.useMemo(() => {
    if (activeItems.length > 0 && activeItems[0].due_date) {
      const y = parseInt(activeItems[0].due_date.split("-")[0], 10);
      if (!isNaN(y)) return y;
    }
    return 2026;
  }, [activeItems]);

  const [selectedYear, setSelectedYear] = React.useState<number>(defaultYear);

  React.useEffect(() => {
    setSelectedYear(defaultYear);
  }, [defaultYear]);

  // Standard 12-month calendar navigation
  const monthsList: MonthInfo[] = React.useMemo(() => {
    const calendarNames = [
      { short: "Jan", full: "January" },
      { short: "Feb", full: "February" },
      { short: "Mar", full: "March" },
      { short: "Apr", full: "April" },
      { short: "May", full: "May" },
      { short: "Jun", full: "June" },
      { short: "Jul", full: "July" },
      { short: "Aug", full: "August" },
      { short: "Sep", full: "September" },
      { short: "Oct", full: "October" },
      { short: "Nov", full: "November" },
      { short: "Dec", full: "December" },
    ];

    return calendarNames.map((m, idx) => {
      const matching = activeItems.find((item) => {
        if (!item.due_date) return false;
        const [y, mon] = item.due_date.split("-").map(Number);
        return y === selectedYear && mon - 1 === idx;
      });

      return {
        index: idx,
        monthNumber: matching ? matching.month_number : idx + 1,
        shortLabel: m.short,
        fullLabel: `${m.full} ${selectedYear}`,
        year: selectedYear,
        monthName: m.full,
        followup: matching || null,
      };
    });
  }, [selectedYear, activeItems]);

  // Auto-select initial month: focus on due / needs_follow_up month if available
  const initialMonthIdx = React.useMemo(() => {
    const pendingItem = activeItems.find(
      (i) => i.status === FOLLOWUP_STATUSES.DUE || i.status === FOLLOWUP_STATUSES.NEEDS_FOLLOW_UP
    );
    if (pendingItem && pendingItem.due_date) {
      const [y, mon] = pendingItem.due_date.split("-").map(Number);
      if (y === defaultYear) return mon - 1;
    }
    const firstWithDate = activeItems[0];
    if (firstWithDate && firstWithDate.due_date) {
      const [y, mon] = firstWithDate.due_date.split("-").map(Number);
      if (y === defaultYear) return mon - 1;
    }
    return 0;
  }, [activeItems, defaultYear]);

  const [selectedMonthIndex, setSelectedMonthIndex] = React.useState<number>(initialMonthIdx);

  React.useEffect(() => {
    setSelectedMonthIndex(initialMonthIdx);
  }, [initialMonthIdx]);

  const currentMonthInfo = monthsList[selectedMonthIndex] || monthsList[0];
  const currentFollowup = currentMonthInfo?.followup;

  // Dialog & View states
  const [selectedForReport, setSelectedForReport] = React.useState<FollowupWithDetails | null>(null);
  const [selectedForView, setSelectedForView] = React.useState<FollowupWithDetails | null>(null);
  const [activeRecordCategory, setActiveRecordCategory] = React.useState<RecordCategory | null>(null);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = React.useState<string | null>(null);

  // Derive photos and videos for the active month
  const monthMedia = React.useMemo(() => {
    if (!currentFollowup) return { photos: [], videos: [] };

    const photos: { id: string; url: string; title: string }[] = [];
    const videos: { id: string; storagePath: string; duration?: string; title: string }[] = [];

    if (currentFollowup.photo_url) {
      photos.push({
        id: `fu-photo-${currentFollowup.id}`,
        url: currentFollowup.photo_url,
        title: `Month ${currentFollowup.month_number} Photo`,
      });
    }

    if (currentFollowup.video_storage_path) {
      videos.push({
        id: `fu-vid-${currentFollowup.id}`,
        storagePath: currentFollowup.video_storage_path,
        duration: "0:30",
        title: `Month ${currentFollowup.month_number} Video Clip`,
      });
    }

    return { photos, videos };
  }, [currentFollowup]);

  // Overall progress
  const completedReportsCount = React.useMemo(() => {
    return activeItems.filter(
      (i) => i.status === FOLLOWUP_STATUSES.SUBMITTED || i.status === FOLLOWUP_STATUSES.REVIEWED
    ).length;
  }, [activeItems]);

  const dogName = activeDog?.name || "Adopted Companion";
  const dogBreed = activeDog?.breed || "Companion";
  const dogPhoto = activeDog?.primary_image || activeDog?.images?.[0]?.public_url;
  const ageLabel = activeDog ? formatAge(activeDog.age_years, activeDog.age_months) : "";
  const genderLabel = activeDog?.gender ? formatCapitalize(activeDog.gender) : "";
  const sizeLabel = activeDog?.size ? `${formatCapitalize(activeDog.size)} size` : "";

  const handlePrevMonth = () => {
    if (selectedMonthIndex === 0) {
      setSelectedYear((y) => y - 1);
      setSelectedMonthIndex(11);
    } else {
      setSelectedMonthIndex((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonthIndex === 11) {
      setSelectedYear((y) => y + 1);
      setSelectedMonthIndex(0);
    } else {
      setSelectedMonthIndex((prev) => prev + 1);
    }
  };

  // Empty state if no follow-ups at all
  if (initialFollowups.length === 0) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card p-8 sm:p-12 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Heart className="h-7 w-7" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="font-serif text-xl sm:text-2xl font-normal text-foreground">
            No active post-adoption monitoring
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            When you complete an adoption through PawConnect, a 12-month post-adoption monitoring schedule will appear here so you can share your monthly updates and photos.
          </p>
        </div>
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/my-applications" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            View My Applications
          </Link>
          <Link href="/dogs" className={cn(buttonVariants({ size: "sm" }))}>
            Browse Dogs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* ── MULTI-DOG SELECTOR (if user has adopted >1 dog) ── */}
      {dogsMap.length > 1 && (
        <div className="space-y-2 pb-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Your Adopted Dogs
          </p>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {dogsMap.map(({ dog, items }) => {
              const id = dog?.id || items[0]?.dog_id || "dog";
              const name = dog?.name || "Dog";
              const breed = dog?.breed || "Companion";
              const photo = dog?.primary_image || dog?.images?.[0]?.public_url;
              const isSelected = id === selectedDogId;
              const doneCount = items.filter(
                (i) => i.status === FOLLOWUP_STATUSES.SUBMITTED || i.status === FOLLOWUP_STATUSES.REVIEWED
              ).length;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedDogId(id)}
                  className={cn(
                    "flex items-center gap-2.5 p-2 pr-3.5 rounded-xl border text-left transition-all shrink-0 cursor-pointer shadow-2xs",
                    isSelected
                      ? "bg-primary/10 border-primary text-foreground font-semibold ring-1 ring-primary/20"
                      : "bg-card border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  <div className="relative h-9 w-9 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/60">
                    {photo ? (
                      <Image src={photo} alt={name} fill sizes="36px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Dog className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight text-foreground">{name}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      {breed} · {doneCount}/12 done
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── DOG PROFILE HEADER CARD ── */}
      <div className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4 sm:gap-5 min-w-0">
          <div className="relative h-20 w-20 sm:h-22 sm:w-22 rounded-2xl overflow-hidden bg-muted shrink-0 border border-border/80 shadow-2xs">
            {dogPhoto ? (
              <Image src={dogPhoto} alt={dogName} fill sizes="88px" className="object-cover" priority />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Dog className="h-8 w-8" />
              </div>
            )}
          </div>

          <div className="space-y-1.5 min-w-0">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground truncate">
                  {dogName}
                </h1>
                <span className="text-[11px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0">
                  Adopted Family Member
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {dogBreed} · 12-Month Post-Adoption Welfare Schedule
              </p>
            </div>

            {/* Badges: Gender, Age, Size, Schedule Progress */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {genderLabel && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                  {genderLabel}
                </span>
              )}
              {ageLabel && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted/80 text-foreground border border-border/70">
                  {ageLabel}
                </span>
              )}
              {sizeLabel && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted/80 text-foreground border border-border/70">
                  {sizeLabel}
                </span>
              )}
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                {completedReportsCount} of 12 Completed
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action Button for Selected Month */}
        {currentFollowup && (
          <div className="shrink-0 flex items-center gap-2">
            {currentFollowup.submitted_at ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedForReport(currentFollowup)}
                className="gap-2 font-medium cursor-pointer"
              >
                <Pencil className="h-4 w-4" />
                <span>Update Month {currentFollowup.month_number} Report</span>
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setSelectedForReport(currentFollowup)}
                className="gap-2 font-medium cursor-pointer shadow-xs"
              >
                <FileCheck className="h-4 w-4" />
                <span>Submit Month {currentFollowup.month_number} Report</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── CALENDAR MONTH SELECTOR BAR ── */}
      <div className="flex items-center justify-between gap-2 p-2 rounded-2xl border border-border/70 bg-card shadow-xs">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handlePrevMonth}
          className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-1 flex-1 justify-start sm:justify-center">
          {monthsList.map((m, idx) => {
            const isSelected = idx === selectedMonthIndex;
            const isSubmitted = m.followup?.status === FOLLOWUP_STATUSES.SUBMITTED;
            const isReviewed = m.followup?.status === FOLLOWUP_STATUSES.REVIEWED;
            const isDue = m.followup?.status === FOLLOWUP_STATUSES.DUE;
            const isNeedsFollowup = m.followup?.status === FOLLOWUP_STATUSES.NEEDS_FOLLOW_UP;

            return (
              <button
                key={m.shortLabel}
                type="button"
                onClick={() => setSelectedMonthIndex(idx)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer relative",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-2xs font-bold scale-102"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                {isSelected ? `${m.shortLabel} ${m.year}` : m.shortLabel}
                {isNeedsFollowup && !isSelected && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-card" />
                )}
                {isDue && !isSelected && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-card" />
                )}
                {isSubmitted && !isSelected && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-card" />
                )}
                {isReviewed && !isSelected && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                )}
              </button>
            );
          })}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleNextMonth}
          className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* ── SECTION: PHOTOS & VIDEOS FOR SELECTED MONTH ── */}
      <section aria-labelledby="media-heading" className="space-y-3 pt-2">
        <div>
          <h2 id="media-heading" className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {currentMonthInfo?.fullLabel || "Monthly Media"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {monthMedia.photos.length} photo{monthMedia.photos.length === 1 ? "" : "s"} · {monthMedia.videos.length} video{monthMedia.videos.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3.5">
          {/* Photo Thumbnails */}
          {monthMedia.photos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setSelectedPhotoPreview(photo.url)}
              className="relative aspect-square rounded-2xl overflow-hidden border border-border/70 bg-muted/20 group hover:border-primary/60 transition-all shadow-2xs cursor-pointer"
              title={photo.title}
            >
              <Image
                src={photo.url}
                alt={photo.title}
                fill
                sizes="(max-width: 640px) 50vw, 20vw"
                className="object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
            </button>
          ))}

          {/* Video Thumbnails */}
          {monthMedia.videos.map((vid) => (
            <button
              key={vid.id}
              type="button"
              onClick={() => currentFollowup && setSelectedForView(currentFollowup)}
              className="relative aspect-square rounded-2xl overflow-hidden border border-border/70 bg-black group hover:border-primary/60 transition-all shadow-2xs cursor-pointer"
              title={vid.title}
            >
              {dogPhoto && (
                <Image
                  src={dogPhoto}
                  alt={vid.title}
                  fill
                  sizes="20vw"
                  className="object-cover opacity-60 transition-transform duration-200 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-primary transition-all shadow-md">
                  <Play className="h-5 w-5 fill-current ml-0.5" />
                </div>
              </div>
              {vid.duration && (
                <span className="absolute bottom-2 right-2 text-[10px] font-bold bg-black/80 text-white px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                  {vid.duration}
                </span>
              )}
            </button>
          ))}

          {/* Informative state if no video was uploaded */}
          {monthMedia.videos.length === 0 && (
            <div className="aspect-square rounded-2xl border border-dashed border-border/70 bg-muted/10 flex flex-col items-center justify-center p-3 text-center text-muted-foreground/70">
              <Video className="h-5 w-5 mb-1 text-muted-foreground/40" />
              <span className="text-[11px] leading-tight">No video clip uploaded</span>
            </div>
          )}

          {/* Informative state if no photos uploaded */}
          {monthMedia.photos.length === 0 && (
            <div className="aspect-square rounded-2xl border border-dashed border-border/70 bg-muted/10 flex flex-col items-center justify-center p-3 text-center text-muted-foreground/70">
              <Camera className="h-5 w-5 mb-1 text-muted-foreground/40" />
              <span className="text-[11px] leading-tight">No photo uploaded</span>
            </div>
          )}
        </div>
      </section>

      {/* ── SECTION: RECORDS FOR SELECTED MONTH ── */}
      <section aria-labelledby="records-heading" className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <h2 id="records-heading" className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Records for {currentMonthInfo?.fullLabel || "Selected Month"}
          </h2>
          {currentFollowup && (
            <FollowupStatusBadge status={currentFollowup.status} />
          )}
        </div>

        {/* Staff Follow-up Request Banner (if applicable) */}
        {currentFollowup?.status === FOLLOWUP_STATUSES.NEEDS_FOLLOW_UP && currentFollowup.additional_followup_instructions && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 sm:p-5 flex items-start gap-3.5 shadow-xs">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs sm:text-sm">
              <p className="font-bold text-amber-900 dark:text-amber-200">
                Shelter Staff Follow-Up Request:
              </p>
              <p className="text-foreground leading-relaxed">
                {currentFollowup.additional_followup_instructions}
              </p>
              <div className="pt-1">
                <Button
                  size="sm"
                  onClick={() => setSelectedForReport(currentFollowup)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs h-7 px-3 cursor-pointer"
                >
                  Provide Update Now
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          {/* 1. HEALTH RECORDS */}
          <button
            type="button"
            onClick={() => setActiveRecordCategory("health")}
            className="w-full rounded-2xl border border-border/70 bg-card p-4 hover:border-primary/40 hover:bg-muted/20 transition-all flex items-center justify-between gap-4 text-left shadow-2xs group cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="h-11 w-11 rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Heart className="h-5 w-5 fill-current" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <h3 className="text-sm font-bold text-foreground">Health Records</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {currentFollowup?.general_health
                    ? `1 report · ${currentFollowup.submitted_at ? formatDate(currentFollowup.submitted_at) : "Submitted"} · ${currentFollowup.general_health}`
                    : `1 checkpoint · Due ${currentFollowup?.due_date ? formatDate(currentFollowup.due_date) : "N/A"} · General wellness`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="relative h-10 w-14 rounded-lg overflow-hidden bg-muted/60 border border-border/60 shrink-0 hidden sm:block">
                {dogPhoto ? (
                  <Image src={dogPhoto} alt="Health" fill sizes="56px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Heart className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* 2. VACCINATIONS */}
          <button
            type="button"
            onClick={() => setActiveRecordCategory("vaccinations")}
            className="w-full rounded-2xl border border-border/70 bg-card p-4 hover:border-primary/40 hover:bg-muted/20 transition-all flex items-center justify-between gap-4 text-left shadow-2xs group cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <h3 className="text-sm font-bold text-foreground">Vaccinations</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {currentFollowup?.veterinary_care
                    ? `1 report · ${currentFollowup.submitted_at ? formatDate(currentFollowup.submitted_at) : "Logged"} · ${currentFollowup.veterinary_care}`
                    : activeDog?.vaccinated
                    ? "Core vaccines up to date (Rabies, DHPP, Booster)"
                    : "Vaccination checkup & booster verification"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="relative h-10 w-14 rounded-lg overflow-hidden bg-muted/60 border border-border/60 shrink-0 hidden sm:block">
                {dogPhoto ? (
                  <Image src={dogPhoto} alt="Vaccinations" fill sizes="56px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Syringe className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* 3. DEWORMING */}
          <button
            type="button"
            onClick={() => setActiveRecordCategory("deworming")}
            className="w-full rounded-2xl border border-border/70 bg-card p-4 hover:border-primary/40 hover:bg-muted/20 transition-all flex items-center justify-between gap-4 text-left shadow-2xs group cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="h-11 w-11 rounded-xl bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400 flex items-center justify-center shrink-0">
                <Pill className="h-5 w-5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <h3 className="text-sm font-bold text-foreground">Deworming</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {currentFollowup?.veterinary_care?.toLowerCase().includes("parasite") || currentFollowup?.veterinary_care?.toLowerCase().includes("worm")
                    ? `1 report · ${currentFollowup.veterinary_care}`
                    : "Internal parasite, flea & heartworm prevention schedule"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="relative h-10 w-14 rounded-lg overflow-hidden bg-muted/60 border border-border/60 shrink-0 hidden sm:block">
                {dogPhoto ? (
                  <Image src={dogPhoto} alt="Deworming" fill sizes="56px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Pill className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* 4. WEIGHT */}
          <button
            type="button"
            onClick={() => setActiveRecordCategory("weight")}
            className="w-full rounded-2xl border border-border/70 bg-card p-4 hover:border-primary/40 hover:bg-muted/20 transition-all flex items-center justify-between gap-4 text-left shadow-2xs group cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="h-11 w-11 rounded-xl bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400 flex items-center justify-center shrink-0">
                <Scale className="h-5 w-5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <h3 className="text-sm font-bold text-foreground">Weight</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {currentFollowup?.general_health
                    ? `1 report · ${currentFollowup.submitted_at ? formatDate(currentFollowup.submitted_at) : "Logged"} · ${sizeLabel || "Condition monitored"}`
                    : sizeLabel
                    ? `1 report · ${sizeLabel} · Regular body condition score`
                    : "Body condition and weight check"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="relative h-10 w-14 rounded-lg overflow-hidden bg-muted/60 border border-border/60 shrink-0 hidden sm:block">
                {dogPhoto ? (
                  <Image src={dogPhoto} alt="Weight" fill sizes="56px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Scale className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* 5. NOTES */}
          <button
            type="button"
            onClick={() => setActiveRecordCategory("notes")}
            className="w-full rounded-2xl border border-border/70 bg-card p-4 hover:border-primary/40 hover:bg-muted/20 transition-all flex items-center justify-between gap-4 text-left shadow-2xs group cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="h-11 w-11 rounded-xl bg-muted text-foreground flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <h3 className="text-sm font-bold text-foreground">Notes</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {currentFollowup?.living_environment || currentFollowup?.eating_behavior_adjustment
                    ? `Routine, adjustment, and sleeping arrangement notes`
                    : "Living environment, daily walk routine & adjustment notes"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="relative h-10 w-14 rounded-lg overflow-hidden bg-muted/60 border border-border/60 shrink-0 hidden sm:block">
                {dogPhoto ? (
                  <Image src={dogPhoto} alt="Notes" fill sizes="56px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>

        {/* Adopter Action Bar for Selected Month */}
        {currentFollowup && (
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl border border-border/60 bg-muted/20">
            <div className="text-xs space-y-0.5 text-center sm:text-left">
              <span className="font-semibold text-foreground block">
                Month {currentFollowup.month_number} Follow-up:
              </span>
              <span className="text-muted-foreground block">
                {currentFollowup.submitted_at
                  ? `Submitted on ${formatDate(currentFollowup.submitted_at)}`
                  : `Scheduled checkpoint · Due on ${formatDate(currentFollowup.due_date)}`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {currentFollowup.submitted_at ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedForView(currentFollowup)}
                    className="text-xs gap-1.5 h-8 font-medium cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View Full Report</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setSelectedForReport(currentFollowup)}
                    className="text-xs gap-1.5 h-8 font-medium cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Update Report</span>
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setSelectedForReport(currentFollowup)}
                  className="text-xs gap-1.5 h-8 font-medium cursor-pointer shadow-xs"
                >
                  <FileCheck className="h-3.5 w-3.5" />
                  <span>Submit Month {currentFollowup.month_number} Report</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── RECORD CATEGORY DETAILS MODAL ── */}
      <Dialog open={Boolean(activeRecordCategory)} onOpenChange={(open) => !open && setActiveRecordCategory(null)}>
        {activeRecordCategory && currentFollowup && (
          <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto p-6 space-y-6">
            <DialogHeader className="border-b border-border/70 pb-4 text-left space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {currentMonthInfo?.fullLabel} Record Details
                </span>
                <FollowupStatusBadge status={currentFollowup.status} />
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground capitalize">
                {activeRecordCategory === "health" && "Health Records"}
                {activeRecordCategory === "vaccinations" && "Vaccination & Medical Care"}
                {activeRecordCategory === "deworming" && "Deworming & Parasite Prevention"}
                {activeRecordCategory === "weight" && "Weight & Physical Wellness"}
                {activeRecordCategory === "notes" && "Routine & Living Notes"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Documented for {dogName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs sm:text-sm">
              {activeRecordCategory === "health" && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-1">
                    <p className="font-semibold text-foreground text-xs uppercase tracking-wider">
                      General Health, Energy &amp; Coat Condition
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      {currentFollowup.general_health || "No health update logged yet for this month."}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-1">
                    <p className="font-semibold text-foreground text-xs uppercase tracking-wider">
                      Eating Habits &amp; Adjustment
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      {currentFollowup.eating_behavior_adjustment || "No eating habit notes logged yet."}
                    </p>
                  </div>
                </div>
              )}

              {activeRecordCategory === "vaccinations" && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-1">
                    <p className="font-semibold text-foreground text-xs uppercase tracking-wider">
                      Core Vaccination Status
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      {activeDog?.vaccinated
                        ? "Vaccinations are recorded as up to date (Core vaccines, Rabies, DHPP)."
                        : "Vaccination status pending or not recorded."}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-1">
                    <p className="font-semibold text-foreground text-xs uppercase tracking-wider">
                      Veterinary Care Log
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      {currentFollowup.veterinary_care || "No veterinary visits logged for this month yet."}
                    </p>
                  </div>
                </div>
              )}

              {activeRecordCategory === "deworming" && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-1">
                    <p className="font-semibold text-foreground text-xs uppercase tracking-wider">
                      Deworming &amp; Parasite Routine
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      {currentFollowup.veterinary_care || "Regular parasite prevention (heartworm, flea, tick, and internal deworming) recommended."}
                    </p>
                  </div>
                </div>
              )}

              {activeRecordCategory === "weight" && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-1">
                    <p className="font-semibold text-foreground text-xs uppercase tracking-wider">
                      Dog Size &amp; Frame
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      {sizeLabel ? `Standard ${sizeLabel}` : "Size not recorded"}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-1">
                    <p className="font-semibold text-foreground text-xs uppercase tracking-wider">
                      Body Condition &amp; Nutrition
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      {currentFollowup.general_health || "Weight and physical wellness monitored monthly."}
                    </p>
                  </div>
                </div>
              )}

              {activeRecordCategory === "notes" && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-1">
                    <p className="font-semibold text-foreground text-xs uppercase tracking-wider">
                      Living Environment &amp; Daily Exercise
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      {currentFollowup.living_environment || "No living environment notes logged yet."}
                    </p>
                  </div>
                  {currentFollowup.problems_concerns && (
                    <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-1">
                      <p className="font-semibold text-amber-900 dark:text-amber-300 text-xs uppercase tracking-wider">
                        Assistance or Problems Noted
                      </p>
                      <p className="text-foreground leading-relaxed">
                        {currentFollowup.problems_concerns}
                      </p>
                    </div>
                  )}
                  {currentFollowup.additional_followup_instructions && (
                    <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-1">
                      <p className="font-semibold text-emerald-900 dark:text-emerald-300 text-xs uppercase tracking-wider">
                        Staff Welfare Advice
                      </p>
                      <p className="text-foreground leading-relaxed">
                        {currentFollowup.additional_followup_instructions}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="pt-3 border-t border-border/70 flex justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveRecordCategory(null)}
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setActiveRecordCategory(null);
                  setSelectedForReport(currentFollowup);
                }}
                className="font-medium"
              >
                {currentFollowup.submitted_at ? "Update Report" : "Submit Report"}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* ── PHOTO LIGHTBOX / PREVIEW DIALOG ── */}
      <Dialog open={Boolean(selectedPhotoPreview)} onOpenChange={(open) => !open && setSelectedPhotoPreview(null)}>
        {selectedPhotoPreview && (
          <DialogContent className="max-w-2xl p-4 bg-background">
            <DialogHeader className="sr-only">
              <DialogTitle>Photo Preview</DialogTitle>
              <DialogDescription>Full-sized photo for {dogName}</DialogDescription>
            </DialogHeader>
            <div className="relative aspect-4/3 w-full rounded-xl overflow-hidden bg-black">
              <Image
                src={selectedPhotoPreview}
                alt={`Photo of ${dogName}`}
                fill
                sizes="(max-width: 768px) 100vw, 800px"
                className="object-contain"
              />
            </div>
            <div className="pt-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedPhotoPreview(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* ── VIEW REPORT DIALOG (WITH VIDEO PLAYER) ── */}
      <Dialog open={Boolean(selectedForView)} onOpenChange={(open) => !open && setSelectedForView(null)}>
        {selectedForView && (
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <DialogHeader className="border-b border-border/70 pb-4 text-left space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Month {selectedForView.month_number} Report
                </span>
                <FollowupStatusBadge status={selectedForView.status} />
              </div>
              <DialogTitle className="font-serif text-2xl font-normal text-foreground">
                Welfare Update for {selectedForView.dog?.name || dogName}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Submitted on {selectedForView.submitted_at ? formatDate(selectedForView.submitted_at) : "N/A"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs sm:text-sm divide-y divide-border/60">
              <div className="space-y-1 pt-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  General Health &amp; Weight
                </p>
                <p className="text-foreground leading-relaxed">{selectedForView.general_health || "N/A"}</p>
              </div>

              <div className="space-y-1 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Eating &amp; Adjustment
                </p>
                <p className="text-foreground leading-relaxed">
                  {selectedForView.eating_behavior_adjustment || "N/A"}
                </p>
              </div>

              <div className="space-y-1 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Veterinary Care
                </p>
                <p className="text-foreground leading-relaxed">{selectedForView.veterinary_care || "N/A"}</p>
              </div>

              <div className="space-y-1 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Living Environment &amp; Routine
                </p>
                <p className="text-foreground leading-relaxed">
                  {selectedForView.living_environment || "N/A"}
                </p>
              </div>

              {selectedForView.problems_concerns && (
                <div className="space-y-1 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Problems or Assistance Requested
                  </p>
                  <p className="text-foreground leading-relaxed">
                    {selectedForView.problems_concerns}
                  </p>
                </div>
              )}

              {selectedForView.additional_followup_instructions && (
                <div className="space-y-1 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Staff Follow-up Advice
                  </p>
                  <p className="text-foreground leading-relaxed bg-muted/30 p-2.5 rounded-lg border border-border/60">
                    {selectedForView.additional_followup_instructions}
                  </p>
                </div>
              )}

              {selectedForView.photo_url && (
                <div className="space-y-2 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Attached Photo
                  </p>
                  <div className="relative aspect-video max-w-sm rounded-xl overflow-hidden border border-border/80">
                    <Image
                      src={selectedForView.photo_url}
                      alt="Follow-up dog photo"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}

              {selectedForView.video_storage_path && (
                <div className="space-y-2 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Attached Video Clip
                  </p>
                  <FollowupVideoPlayer storagePath={selectedForView.video_storage_path} />
                </div>
              )}
            </div>

            <DialogFooter className="pt-4 border-t border-border/70 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedForView(null)}
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const target = selectedForView;
                  setSelectedForView(null);
                  setSelectedForReport(target);
                }}
                className="gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Update Report</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* ── SUBMISSION DIALOG ── */}
      <FollowupReportDialog
        followup={selectedForReport}
        open={Boolean(selectedForReport)}
        onOpenChange={(open) => {
          if (!open) setSelectedForReport(null);
        }}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
