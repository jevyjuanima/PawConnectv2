"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
  Search,
  User,
  MessageSquare,
  Loader2,
  RefreshCw,
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { FollowupStatusBadge } from "@/components/shared/StatusBadges";
import { FOLLOWUP_STATUSES } from "@/lib/constants/statuses";
import { reviewFollowupAction } from "@/app/actions/admin";
import { formatDate, formatAge, formatCapitalize } from "@/lib/utils/format";
import type { FollowupWithDetails } from "@/types";
import { cn } from "@/lib/utils";

interface AdminWelfareMonitorProps {
  initialFollowups: FollowupWithDetails[];
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

export function AdminWelfareMonitor({ initialFollowups }: AdminWelfareMonitorProps) {
  const router = useRouter();

  // Search & Status filters
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  // Group all followups by dog
  const dogsMap = React.useMemo(() => {
    const map = new Map<
      string,
      {
        dog: FollowupWithDetails["dog"];
        adopter: FollowupWithDetails["adopter"];
        items: FollowupWithDetails[];
      }
    >();

    for (const f of initialFollowups) {
      const dogId = f.dog_id || f.dog?.id || "unknown";
      if (!map.has(dogId)) {
        map.set(dogId, {
          dog: f.dog,
          adopter: f.adopter,
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

  // Filtered dog entries based on search & status filter
  const filteredDogs = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return dogsMap.filter(({ dog, adopter, items }) => {
      const matchesSearch =
        !q ||
        dog?.name?.toLowerCase().includes(q) ||
        dog?.breed?.toLowerCase().includes(q) ||
        `${adopter?.first_name || ""} ${adopter?.last_name || ""}`.toLowerCase().includes(q) ||
        adopter?.email?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (statusFilter === "all") return true;
      if (statusFilter === FOLLOWUP_STATUSES.SUBMITTED) {
        return items.some((i) => i.status === FOLLOWUP_STATUSES.SUBMITTED);
      }
      if (statusFilter === FOLLOWUP_STATUSES.DUE) {
        return items.some((i) => i.status === FOLLOWUP_STATUSES.DUE);
      }
      if (statusFilter === FOLLOWUP_STATUSES.REVIEWED) {
        return items.some((i) => i.status === FOLLOWUP_STATUSES.REVIEWED);
      }
      if (statusFilter === FOLLOWUP_STATUSES.NEEDS_FOLLOW_UP) {
        return items.some((i) => i.status === FOLLOWUP_STATUSES.NEEDS_FOLLOW_UP);
      }

      return true;
    });
  }, [dogsMap, searchQuery, statusFilter]);

  // Selected Dog State
  const [selectedDogId, setSelectedDogId] = React.useState<string>(
    filteredDogs[0]?.dog?.id || filteredDogs[0]?.items[0]?.dog_id || ""
  );

  // Update selected dog if current selection is not in filtered list
  React.useEffect(() => {
    if (filteredDogs.length > 0) {
      const exists = filteredDogs.some(
        (e) => (e.dog?.id || e.items[0]?.dog_id) === selectedDogId
      );
      if (!exists) {
        setSelectedDogId(filteredDogs[0].dog?.id || filteredDogs[0].items[0]?.dog_id || "");
      }
    }
  }, [filteredDogs, selectedDogId]);

  // Active dog entry
  const activeDogEntry = React.useMemo(() => {
    return (
      filteredDogs.find(
        (entry) => (entry.dog?.id || entry.items[0]?.dog_id) === selectedDogId
      ) || filteredDogs[0]
    );
  }, [filteredDogs, selectedDogId]);

  const activeDog = activeDogEntry?.dog;
  const activeAdopter = activeDogEntry?.adopter;
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

  // Standard 12-month calendar order: Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec
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
      // Find if this dog has a followup due in this calendar month & year
      const matching = activeItems.find((item) => {
        if (!item.due_date) return false;
        const [y, mon] = item.due_date.split("-").map(Number);
        return y === selectedYear && mon - 1 === idx;
      });

      return {
        index: idx,
        monthIndex: idx,
        monthNumber: matching ? matching.month_number : idx + 1,
        shortLabel: m.short,
        fullLabel: `${m.full} ${selectedYear}`,
        year: selectedYear,
        monthName: m.full,
        followup: matching || null,
      };
    });
  }, [selectedYear, activeItems]);

  // Selected Month Index (0 = Jan, 1 = Feb, ..., 11 = Dec) - defaults to 0 (January)
  const [selectedMonthIndex, setSelectedMonthIndex] = React.useState<number>(0);

  const currentMonthInfo = monthsList[selectedMonthIndex] || monthsList[0];
  const currentFollowup = currentMonthInfo?.followup;

  // Active secondary tab
  const [activeTab, setActiveTab] = React.useState<string>("monthly");

  // Dialog & Review states
  const [selectedForReview, setSelectedForReview] = React.useState<FollowupWithDetails | null>(null);
  const [selectedForView, setSelectedForView] = React.useState<FollowupWithDetails | null>(null);
  const [activeRecordCategory, setActiveRecordCategory] = React.useState<RecordCategory | null>(null);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = React.useState<string | null>(null);

  // Review Form States
  const [adminNotes, setAdminNotes] = React.useState("");
  const [requestAdditional, setRequestAdditional] = React.useState(false);
  const [instructions, setInstructions] = React.useState("");
  const [submittingReview, setSubmittingReview] = React.useState(false);

  const openReviewModal = (item: FollowupWithDetails) => {
    setSelectedForReview(item);
    setAdminNotes(item.admin_notes || "");
    setRequestAdditional(item.requires_additional_followup || false);
    setInstructions(item.additional_followup_instructions || "");
  };

  const handleReviewSubmit = async (
    statusToSet: typeof FOLLOWUP_STATUSES.REVIEWED | typeof FOLLOWUP_STATUSES.NEEDS_FOLLOW_UP
  ) => {
    if (!selectedForReview) return;
    setSubmittingReview(true);
    try {
      const res = await reviewFollowupAction(
        selectedForReview.id,
        statusToSet,
        adminNotes.trim() || undefined,
        requestAdditional,
        requestAdditional ? instructions.trim() || undefined : undefined
      );

      if (!res.success) {
        toast.error(res.error || "Failed to update follow-up");
        setSubmittingReview(false);
        return;
      }

      toast.success(
        statusToSet === FOLLOWUP_STATUSES.REVIEWED
          ? "Report marked as reviewed and approved."
          : "Additional follow-up requested from adopter."
      );
      setSelectedForReview(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error updating report");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Derive photos and videos for the active month
  const monthMedia = React.useMemo(() => {
    if (!currentFollowup) return { photos: [], videos: [] };

    const photos: { id: string; url: string; title: string }[] = [];
    const videos: { id: string; storagePath: string; duration?: string; title: string }[] = [];

    // Monthly report submitted photo
    if (currentFollowup.photo_url) {
      photos.push({
        id: `fu-photo-${currentFollowup.id}`,
        url: currentFollowup.photo_url,
        title: `Month ${currentFollowup.month_number} Photo`,
      });
    }

    // Monthly report submitted video
    if (currentFollowup.video_storage_path) {
      videos.push({
        id: `fu-video-${currentFollowup.id}`,
        storagePath: currentFollowup.video_storage_path,
        duration: "0:24",
        title: `Month ${currentFollowup.month_number} Video Clip`,
      });
    }

    // Fallback: If no photos submitted yet, show dog's listing photo for context
    if (photos.length === 0 && activeDog?.primary_image) {
      photos.push({
        id: `dog-primary-${activeDog.id}`,
        url: activeDog.primary_image,
        title: `${activeDog.name} - Profile Image`,
      });
    }

    return { photos, videos };
  }, [currentFollowup, activeDog]);

  if (dogsMap.length === 0) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card p-12 text-center space-y-4 max-w-xl mx-auto shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Heart className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            No welfare monitoring records found
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            When an adoption application is finalized and approved, a 12-month post-adoption monitoring schedule is automatically created here for staff review.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/admin/applications"
            className={cn(buttonVariants({ size: "sm" }), "rounded-lg text-xs font-medium")}
          >
            Review Applications Queue
          </Link>
        </div>
      </div>
    );
  }

  const dogName = activeDog?.name || "Dog";
  const dogBreed = activeDog?.breed || "Companion";
  const dogPhoto = activeDog?.primary_image || activeDog?.images?.[0]?.public_url;
  const ageLabel = activeDog ? formatAge(activeDog.age_years, activeDog.age_months) : "";
  const genderLabel = activeDog?.gender ? formatCapitalize(activeDog.gender) : "";
  const sizeLabel = activeDog?.size ? `${formatCapitalize(activeDog.size)} size` : "";
  const adopterName = activeAdopter ? `${activeAdopter.first_name || ""} ${activeAdopter.last_name || ""}`.trim() : "Adopter";

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

  return (
    <div className="w-full">
      {/* ── MAIN CONTAINER: SIDEBAR + MONITOR CONTENT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── LEFT SIDEBAR: MONITORED DOGS SELECTOR ── */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 space-y-5 shadow-xs">
            {/* Header & Filter */}
            <div className="space-y-3 pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                  <Dog className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-extrabold text-sm tracking-tight text-foreground">
                    Monitored Dogs
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    {filteredDogs.length} adopted {filteredDogs.length === 1 ? "dog" : "dogs"}
                  </p>
                </div>
              </div>

              {/* Search Dog / Adopter */}
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search dog, adopter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 text-xs h-8 rounded-xl bg-muted/30 border-border/70"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 text-[11px] font-semibold">
                {[
                  { id: "all", label: "All" },
                  { id: FOLLOWUP_STATUSES.SUBMITTED, label: "Needs Review" },
                  { id: FOLLOWUP_STATUSES.DUE, label: "Due" },
                  { id: FOLLOWUP_STATUSES.REVIEWED, label: "Reviewed" },
                ].map((tab) => {
                  const isActive = statusFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setStatusFilter(tab.id)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg shrink-0 transition-colors cursor-pointer",
                        isActive
                          ? "bg-emerald-600 text-white font-bold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Monitored Dogs List */}
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
              {filteredDogs.map(({ dog, adopter, items }) => {
                const id = dog?.id || items[0]?.dog_id || "dog";
                const name = dog?.name || "Dog";
                const breed = dog?.breed || "Companion";
                const photo = dog?.primary_image || dog?.images?.[0]?.public_url;
                const isSelected = id === selectedDogId;
                const pendingReviewCount = items.filter(
                  (i) => i.status === FOLLOWUP_STATUSES.SUBMITTED
                ).length;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedDogId(id)}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer",
                      isSelected
                        ? "bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 border border-emerald-500/30 shadow-2xs font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative h-9 w-9 rounded-xl overflow-hidden bg-muted shrink-0 border border-border/60">
                        {photo ? (
                          <Image src={photo} alt={name} fill sizes="36px" className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/60">
                            <Dog className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate text-foreground leading-tight">
                          {name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                          {breed}
                        </p>
                      </div>
                    </div>

                    {pendingReviewCount > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-white shrink-0 shadow-2xs">
                        {pendingReviewCount} new
                      </span>
                    )}
                  </button>
                );
              })}

              {filteredDogs.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6 italic">
                  No dogs match search.
                </p>
              )}
            </div>
          </div>
        </aside>

        {/* ── RIGHT MAIN PANEL: DOG MONITORING VIEW ── */}
        <main className="lg:col-span-9 space-y-6">
          {/* Breadcrumb & Quick Action */}
          <div className="flex items-center justify-between gap-4">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Link href="/admin/follow-ups" className="hover:text-foreground transition-colors">
                Welfare Monitoring
              </Link>
              <span>&gt;</span>
              <span className="text-foreground font-semibold truncate">{dogName}</span>
            </nav>

            {activeDog?.id && (
              <Link
                href={`/dogs/${activeDog.id}`}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-8 px-3 text-xs gap-1.5 rounded-lg border-border/80 font-medium"
                )}
                title="View Public Dog Listing"
              >
                <ExternalLink className="h-3 w-3" />
                <span>View Listing</span>
              </Link>
            )}
          </div>

          {/* Dog Profile Header Card */}
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
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground truncate">
                    {dogName}
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {dogBreed} · Adopter: <span className="font-semibold text-foreground">{adopterName}</span>
                  </p>
                </div>

                {/* Pill Badges: Gender, Age, Size, Core Vaccines */}
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
                    12-Month Schedule
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Staff Action if Selected Month has Submitted Report */}
            {currentFollowup?.status === FOLLOWUP_STATUSES.SUBMITTED && (
              <Button
                size="sm"
                onClick={() => openReviewModal(currentFollowup)}
                className="gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold shrink-0 shadow-xs h-9 cursor-pointer"
              >
                <FileCheck className="h-4 w-4" />
                <span>Review Month {currentFollowup.month_number} Report</span>
              </Button>
            )}
          </div>

          {/* Secondary Tab Strip */}
          <div className="border-b border-border/70 pb-1">
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar text-xs font-semibold">
              {[
                { id: "overview", label: "Overview" },
                { id: "monthly", label: "Monthly" },
                { id: "health", label: "Health" },
                { id: "vaccinations", label: "Vaccinations" },
                { id: "deworming", label: "Deworming" },
                { id: "weight", label: "Weight" },
                { id: "notes", label: "Notes" },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (tab.id !== "overview" && tab.id !== "monthly") {
                        setActiveRecordCategory(tab.id as RecordCategory);
                      }
                    }}
                    className={cn(
                      "px-3 py-2 rounded-lg transition-all shrink-0 cursor-pointer",
                      isActive
                        ? "text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400 rounded-b-none font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Month Navigation Bar: < [Jan 2026] Feb Mar Apr ... > */}
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
                const isNeedsFollowup = m.followup?.status === FOLLOWUP_STATUSES.NEEDS_FOLLOW_UP;

                return (
                  <button
                    key={m.shortLabel}
                    type="button"
                    onClick={() => setSelectedMonthIndex(idx)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer relative",
                      isSelected
                        ? "bg-emerald-600 dark:bg-emerald-500 text-white shadow-2xs font-bold scale-102"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                  >
                    {isSelected ? `${m.shortLabel} ${m.year}` : m.shortLabel}
                    {isSubmitted && !isSelected && (
                      <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-card" />
                    )}
                    {isReviewed && !isSelected && (
                      <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                    )}
                    {isNeedsFollowup && !isSelected && (
                      <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-card" />
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
                  className="relative aspect-square rounded-2xl overflow-hidden border border-border/70 bg-muted/20 group hover:border-emerald-500/60 transition-all shadow-2xs cursor-pointer"
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
                  className="relative aspect-square rounded-2xl overflow-hidden border border-border/70 bg-black group hover:border-emerald-500/60 transition-all shadow-2xs cursor-pointer"
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
                    <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-emerald-600 transition-all shadow-md">
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

              {/* Informative state if no video clip was submitted */}
              {monthMedia.videos.length === 0 && (
                <div className="aspect-square rounded-2xl border border-dashed border-border/70 bg-muted/10 flex flex-col items-center justify-center p-3 text-center text-muted-foreground/70">
                  <Video className="h-5 w-5 mb-1 text-muted-foreground/40" />
                  <span className="text-[11px] leading-tight">No video clip was submitted</span>
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

            <div className="space-y-2.5">
              {/* 1. HEALTH RECORDS */}
              <button
                type="button"
                onClick={() => setActiveRecordCategory("health")}
                className="w-full rounded-2xl border border-border/70 bg-card p-4 hover:border-emerald-500/40 hover:bg-muted/20 transition-all flex items-center justify-between gap-4 text-left shadow-2xs group cursor-pointer"
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
                className="w-full rounded-2xl border border-border/70 bg-card p-4 hover:border-emerald-500/40 hover:bg-muted/20 transition-all flex items-center justify-between gap-4 text-left shadow-2xs group cursor-pointer"
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
                className="w-full rounded-2xl border border-border/70 bg-card p-4 hover:border-emerald-500/40 hover:bg-muted/20 transition-all flex items-center justify-between gap-4 text-left shadow-2xs group cursor-pointer"
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
                className="w-full rounded-2xl border border-border/70 bg-card p-4 hover:border-emerald-500/40 hover:bg-muted/20 transition-all flex items-center justify-between gap-4 text-left shadow-2xs group cursor-pointer"
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
                className="w-full rounded-2xl border border-border/70 bg-card p-4 hover:border-emerald-500/40 hover:bg-muted/20 transition-all flex items-center justify-between gap-4 text-left shadow-2xs group cursor-pointer"
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

            {/* Staff Review Action Bar for Active Month */}
            {currentFollowup && (
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl border border-border/60 bg-muted/20">
                <div className="text-xs space-y-0.5 text-center sm:text-left">
                  <span className="font-semibold text-foreground block">
                    Month {currentFollowup.month_number} Follow-up Status:
                  </span>
                  <span className="text-muted-foreground block">
                    {currentFollowup.submitted_at
                      ? `Submitted on ${formatDate(currentFollowup.submitted_at)} by ${adopterName}`
                      : `Due on ${formatDate(currentFollowup.due_date)}`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {currentFollowup.submitted_at && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedForView(currentFollowup)}
                      className="text-xs gap-1.5 h-8 font-medium cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View Full Report</span>
                    </Button>
                  )}
                  {currentFollowup.submitted_at && (
                    <Button
                      size="sm"
                      onClick={() => openReviewModal(currentFollowup)}
                      className="text-xs gap-1.5 h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                    >
                      <FileCheck className="h-3.5 w-3.5" />
                      <span>Review &amp; Approve</span>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </section>
        </main>
      </div>

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
                Documented for {dogName} · Adopter: {adopterName}
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
              {currentFollowup.submitted_at && (
                <Button
                  size="sm"
                  onClick={() => {
                    setActiveRecordCategory(null);
                    openReviewModal(currentFollowup);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  Review Report
                </Button>
              )}
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
                Submitted on {selectedForView.submitted_at ? formatDate(selectedForView.submitted_at) : "N/A"} by {adopterName}
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

            <DialogFooter className="pt-4 border-t border-border/70 flex justify-between gap-2">
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
                  setSelectedForView(null);
                  openReviewModal(selectedForView);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                Review Report
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* ── STAFF REVIEW & APPROVE MODAL ── */}
      <Dialog open={Boolean(selectedForReview)} onOpenChange={(open) => !open && setSelectedForReview(null)}>
        {selectedForReview && (
          <DialogContent className="max-w-lg p-6 space-y-5">
            <DialogHeader className="border-b border-border/70 pb-3 text-left space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <FileCheck className="h-4 w-4" />
                <span>Staff Welfare Review</span>
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                Month {selectedForReview.month_number} Report for {selectedForReview.dog?.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Submitted by {selectedForReview.adopter?.first_name} {selectedForReview.adopter?.last_name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1.5">
                <Label htmlFor="admin_notes" className="text-xs font-semibold text-foreground">
                  Internal Staff Notes (Private)
                </Label>
                <Textarea
                  id="admin_notes"
                  placeholder="Notes for shelter staff records..."
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-3 pt-1 border-t border-border/60">
                <div className="flex items-start gap-2.5">
                  <Checkbox
                    id="request_additional"
                    checked={requestAdditional}
                    onCheckedChange={(checked) => setRequestAdditional(Boolean(checked))}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="request_additional"
                      className="text-xs font-semibold text-foreground cursor-pointer"
                    >
                      Request Additional Follow-up / Clarification
                    </Label>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Check this if you require more information or follow-up photos from the adopter.
                    </p>
                  </div>
                </div>

                {requestAdditional && (
                  <div className="space-y-1.5 pl-6">
                    <Label htmlFor="instructions" className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                      Instructions to Adopter (Visible to Adopter)
                    </Label>
                    <Textarea
                      id="instructions"
                      placeholder="e.g. Please provide an update on the vet checkup for the limp..."
                      rows={2}
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      className="text-xs border-amber-500/40"
                    />
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-border/70 flex flex-col sm:flex-row items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedForReview(null)}
                disabled={submittingReview}
              >
                Cancel
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {requestAdditional ? (
                  <Button
                    size="sm"
                    onClick={() => handleReviewSubmit(FOLLOWUP_STATUSES.NEEDS_FOLLOW_UP)}
                    disabled={submittingReview}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5 w-full sm:w-auto text-xs"
                  >
                    {submittingReview ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                    <span>Request Follow-up</span>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleReviewSubmit(FOLLOWUP_STATUSES.REVIEWED)}
                    disabled={submittingReview}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 w-full sm:w-auto text-xs"
                  >
                    {submittingReview ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    <span>Approve &amp; Mark Reviewed</span>
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
