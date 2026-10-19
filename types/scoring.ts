export interface ScoreCategory {
  /** Short human-readable category name shown to staff */
  label: string;
  /** Points awarded (never negative) */
  score: number;
  /** Maximum points possible for this category */
  maxScore: number;
  /** Explanation of every point awarded or withheld, separated by ". " */
  rationale: string;
  /** True when a field was blank or not-applicable; staff may want to follow up */
  hasGap: boolean;
  /** Specific missing or insufficient information identified */
  missingEvidence?: string;
  /** Actionable follow-up question when clarification is needed */
  followUpQuestion?: string;
}

export interface SuitabilityScoreResult {
  totalScore: number;
  maxScore: 100;
  tier: "strong" | "positive" | "mixed" | "limited";
  tierLabel: string;
  tierDescription: string;
  categories: ScoreCategory[];
  /** Staff-facing notice when follow-up questions are recommended */
  followUpRecommended: boolean;
  followUpReasons: string[];
  /** Critical welfare areas missing substantive evidence */
  criticalGaps?: string[];
}
