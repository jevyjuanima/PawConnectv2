"use client";

import * as React from "react";
import { TrendingUp, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SuitabilityScoreResult } from "@/types";

interface SuitabilityScoreCardProps {
  result: SuitabilityScoreResult;
  className?: string;
}

const TIER_STYLES = {
  strong: {
    ring: "border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/30",
    badge: "bg-emerald-700 text-white",
    bar: "bg-emerald-500",
    label: "text-emerald-700 dark:text-emerald-400",
  },
  positive: {
    ring: "border-primary/30 bg-primary/[0.03]",
    badge: "bg-primary text-primary-foreground",
    bar: "bg-primary",
    label: "text-primary",
  },
  mixed: {
    ring: "border-amber-400/40 bg-amber-50/60 dark:bg-amber-950/30",
    badge: "bg-amber-600 text-white",
    bar: "bg-amber-400",
    label: "text-amber-700 dark:text-amber-400",
  },
  limited: {
    ring: "border-orange-400/40 bg-orange-50/60 dark:bg-orange-950/30",
    badge: "bg-orange-700 text-white",
    bar: "bg-orange-400",
    label: "text-orange-700 dark:text-orange-400",
  },
} as const;

export function SuitabilityScoreCard({ result, className }: SuitabilityScoreCardProps) {
  const [expanded, setExpanded] = React.useState(false);
  const styles = TIER_STYLES[result.tier];
  const pct = Math.round((result.totalScore / result.maxScore) * 100);

  return (
    <div className={cn("rounded-xl border p-4 space-y-3 text-xs", styles.ring, className)}>
      {/* Advisory banner */}
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground italic border-b border-border/40 pb-2">
        <Info className="h-3 w-3 shrink-0" />
        <span>Advisory score only. Does not automatically approve, reject, or deprioritize any application.</span>
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
            Screening Indicator Summary
          </span>
        </div>
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0", styles.badge)}>
          {result.tierLabel}
        </span>
      </div>

      {/* Score bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-baseline">
          <span className={cn("text-2xl font-extrabold", styles.label)}>{result.totalScore}</span>
          <span className="text-[10px] text-muted-foreground">/ {result.maxScore} pts</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-700", styles.bar)}
            style={{ width: pct + "%" }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed">{result.tierDescription}</p>
      </div>

      {/* Follow-up notice */}
      {result.followUpRecommended && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-300/50 p-2.5 text-[10px] text-amber-800 dark:text-amber-300">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            <strong>Staff follow-up recommended</strong> for:{" "}
            {result.followUpReasons.join(", ")}.
          </span>
        </div>
      )}

      {/* Category breakdown (collapsible) */}
      <div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <Info className="h-3 w-3" />
          {expanded ? "Hide category breakdown" : "Show category breakdown"}
        </button>

        {expanded && (
          <div className="mt-3 space-y-3 animate-in fade-in-50 duration-200">
            {result.categories.map((cat) => {
              const catPct = Math.round((cat.score / cat.maxScore) * 100);
              return (
                <div key={cat.label} className="space-y-0.5">
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-1 min-w-0">
                      {cat.hasGap && (
                        <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" aria-label="Follow-up recommended" />
                      )}
                      <span className="font-medium text-foreground truncate">{cat.label}</span>
                    </div>
                    <span className="text-muted-foreground shrink-0">
                      {cat.score}/{cat.maxScore}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", cat.hasGap ? "bg-amber-400" : styles.bar)}
                      style={{ width: catPct + "%" }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{cat.rationale}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}