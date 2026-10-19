/**
 * Evidence-Based Adoption Suitability Scoring - PawConnect V2
 * ============================================================
 *
 * This module computes an advisory suitability score from household screening
 * questionnaire answers. It evaluates actual answer quality using deterministic,
 * conservative evidence verification—never awarding points merely because a text
 * field is non-empty, meets a character threshold, or contains keyboard smash.
 *
 * IMPORTANT:
 * - Scores are informational and decision-support ONLY.
 * - No score tier ever automatically approves, rejects, or deprioritizes an application.
 * - Missing or not-applicable fields are noted explicitly, never treated as disqualifying.
 * - First-time owners, renters, households with children, and homes without yards are
 *   assessed fairly based on practical arrangements, not penalized for circumstances.
 * - Text presence is NOT evidence. Meaningless, repetitive, placeholder, or random
 *   strings receive zero evidence points and are flagged for human follow-up.
 *
 * SCORING CATEGORIES & MAXIMUM WEIGHTS (Total = exactly 100):
 * ----------------------------------------------------------
 * Category                             Max   Criteria
 * ----------------------------------------------------------
 * A. Housing & Permission               25   Housing type + valid permission situation
 * B. Household Agreement & Consent      10   Explicit affirmative consent values
 * C. Children & Safety Integration      10   Concrete supervision/integration plan
 * D. Pet-care Experience                20   Verifiable experience or preparation plan
 * E. Daily Care Plan                    20   Alone hours + feeding/exercise/coverage
 * F. Veterinary & Emergency Plan        15   Clinic access + financial/emergency plan
 * ----------------------------------------------------------
 * Total:                               100
 */

import type { ScoreCategory, SuitabilityScoreResult } from "@/types";
export type { ScoreCategory, SuitabilityScoreResult };

// -------------------------------------------------------------------------
// Input type - matches household_screenings DB record
// -------------------------------------------------------------------------

export interface ScreeningScoreInput {
  housing_type: string;
  landlord_permission: boolean | null;
  has_children: boolean;
  children_details?: string | null;
  household_members_details?: string | null;
  existing_pets_details: string | null;
  pet_care_experience: string;
  daily_alone_hours: number;
  daily_care_arrangements: string;
  emergency_vet_care_plan: string;
  household_agreement: boolean;
  screening_consent: boolean;
}

// -------------------------------------------------------------------------
// Text Quality Evaluator
// -------------------------------------------------------------------------

export interface TextQualityAssessment {
  isMeaningful: boolean;
  cleanText: string;
  reason?: string;
  recognizedWordCount: number;
  wordCount: number;
}

/**
 * Curated lexicon of common English functional words and domain-specific pet adoption words.
 * Used deterministically without external network or AI dependencies.
 */
const KNOWN_WORDS = new Set<string>([
  // Functional / Pronouns / Conjunctions / Prepositions / Auxiliaries
  "i", "we", "our", "my", "you", "he", "she", "they", "them", "it", "this", "that", "these", "those",
  "the", "a", "an", "and", "but", "or", "so", "for", "with", "without", "in", "on", "at", "to", "from",
  "by", "of", "about", "into", "through", "during", "before", "after", "above", "below", "between",
  "have", "has", "had", "having", "will", "would", "can", "could", "shall", "should", "may", "might", "must",
  "do", "does", "did", "doing", "done", "is", "are", "was", "were", "been", "being", "be",
  "take", "takes", "taking", "took", "taken", "get", "gets", "getting", "got", "give", "gives", "giving", "gave",
  "go", "goes", "going", "went", "come", "comes", "coming", "came", "make", "makes", "making", "made",
  "see", "know", "think", "want", "need", "like", "love", "look", "help", "keep", "let", "call",
  "not", "also", "very", "just", "more", "most", "some", "any", "all", "both", "each", "every", "other",
  "yes", "always", "usually", "often", "sometimes", "never", "well", "together",

  // Household & Living
  "home", "house", "apartment", "condo", "room", "yard", "garden", "space", "floor", "door", "gate",
  "fence", "fenced", "family", "member", "members", "partner", "spouse", "husband", "wife", "mother", "father",
  "mom", "dad", "parent", "parents", "son", "daughter", "brother", "sister", "child", "children", "kids",
  "toddler", "infant", "teen", "teenager", "adult", "adults", "friend", "friends", "roommate", "roommates",
  "neighbor", "neighbors", "landlord", "owner", "live", "lives", "living", "stay", "stays", "staying",

  // Work & Routine
  "work", "works", "working", "job", "office", "remote", "wfh", "hybrid", "shift", "hours", "hour",
  "day", "days", "daily", "week", "weeks", "time", "times", "schedule", "routine", "morning", "afternoon",
  "evening", "night", "noon", "lunch", "break", "leave", "leaving", "alone", "away", "back", "return",
  "someone", "anybody", "everybody", "sitter", "daycare", "boarding", "caregiver", "visit", "visits",

  // Pets & Animals
  "pet", "pets", "dog", "dogs", "puppy", "puppies", "pup", "canine", "cat", "cats", "kitten", "kittens",
  "feline", "animal", "animals", "breed", "labrador", "retriever", "shepherd", "golden", "poodle", "husky",
  "beagle", "terrier", "aspin", "shih", "tzu", "bulldog", "corgi", "mutt", "mixed",

  // Daily Dog Care
  "feed", "feeds", "feeding", "food", "kibble", "meal", "meals", "water", "bowl", "diet", "nutrition",
  "treat", "treats", "snack", "walk", "walks", "walking", "walked", "walker", "exercise", "exercising",
  "run", "running", "play", "playing", "fetch", "park", "leash", "harness", "collar", "potty", "pee", "poop",
  "bathroom", "toilet", "train", "trained", "training", "trainer", "command", "commands", "sit", "stay",
  "groom", "grooming", "bath", "bathe", "bathing", "brush", "brushing", "clean", "cleaning", "crate", "bed",
  "toy", "toys", "care", "cares", "caring", "cared", "attention", "love", "gentle", "safe", "safety",

  // Experience & Background
  "experience", "experienced", "own", "owned", "owning", "raise", "raised", "raising", "rescue", "rescued",
  "adopt", "adopted", "adopting", "adoption", "foster", "fostered", "fostering", "first", "beginner", "novice",
  "research", "researched", "researching", "learn", "learned", "learning", "read", "book", "classes", "course",
  "guide", "guidance", "advice", "prepared", "prepare", "preparation", "ready", "support", "responsible",

  // Veterinary, Medical & Emergency
  "vet", "vets", "veterinary", "veterinarian", "clinic", "hospital", "doctor", "dr", "appointment", "checkup",
  "checkups", "routine", "annual", "vaccine", "vaccines", "vaccination", "vaccinations", "vaccinated",
  "deworm", "deworming", "dewormed", "spay", "spayed", "neuter", "neutered", "rabies", "parvo", "distemper",
  "flea", "tick", "heartworm", "preventive", "prevention", "medication", "medications", "medicine", "pill",
  "sick", "ill", "injury", "injured", "emergency", "emergencies", "urgent", "24/7", "er", "hospitalization",
  "transport", "transportation", "car", "drive", "driver", "vehicle", "ride", "taxi",
  "fund", "funds", "savings", "budget", "cost", "costs", "expense", "expenses", "afford", "affordable",
  "pay", "paying", "payment", "money", "insurance", "policy", "cover", "covered",

  // Children Safety & Integration
  "supervise", "supervised", "supervision", "supervising", "watch", "watching", "monitor", "monitoring",
  "boundary", "boundaries", "separate", "separated", "separating", "separation", "quiet", "rest", "resting",
  "teach", "teaches", "teaching", "taught", "respect", "careful", "handle", "handling", "behavior", "temperament",

  // Local Context (Philippines / Tagalog pet-care terminology)
  "aso", "mga", "pusa", "alaga", "pagaalaga", "bahay", "tahanan", "pamilya", "bakuna", "gamot", "klinika",
  "beterinaryo", "pakain", "kain", "lakad", "bantay", "kwarto", "bakuran", "pera", "oras", "bata"
]);

/**
 * Common filler/placeholder patterns that convey zero substantive evidence.
 */
const KNOWN_FILLERS = new Set<string>([
  "none", "n/a", "na", "n.a.", "n / a", "nothing", "no", "nope", "nil", "idk",
  "test", "testing", "sample", "dummy", "placeholder", "asdf", "asdfgh", "qwerty",
  "zxcv", "foo", "bar", "baz", "xxx", "unknown", "not sure", "any", "ok", "okay",
  "good", "fine", "same", "na.", "n/a.", "x", "xx", "xxx", "..."
]);

export function evaluateTextQuality(text: string | null | undefined): TextQualityAssessment {
  if (!text || typeof text !== "string") {
    return { isMeaningful: false, cleanText: "", reason: "blank", recognizedWordCount: 0, wordCount: 0 };
  }

  const clean = text.trim();
  if (clean.length < 4) {
    return { isMeaningful: false, cleanText: clean, reason: "too_short", recognizedWordCount: 0, wordCount: 0 };
  }

  const lower = clean.toLowerCase();

  // Exact filler match (single-phrase checks only)
  if (KNOWN_FILLERS.has(lower)) {
    return { isMeaningful: false, cleanText: clean, reason: "placeholder_or_filler", recognizedWordCount: 0, wordCount: 1 };
  }

  // Single-character repetition across 4+ chars (e.g. "aaaaa", "zzzz", ".....")
  if (/(.)\1{3,}/i.test(lower)) {
    return { isMeaningful: false, cleanText: clean, reason: "character_repetition", recognizedWordCount: 0, wordCount: 0 };
  }

  // N-gram repeated pattern on the whole string with spaces removed
  // (e.g. "asdasd", "asdasdasd" — only applies to short single-token inputs)
  const withoutSpaces = lower.replace(/\s+/g, "");
  if (withoutSpaces.length <= 20 && /^(.{2,4})\1+$/i.test(withoutSpaces)) {
    return { isMeaningful: false, cleanText: clean, reason: "repetitive_pattern", recognizedWordCount: 0, wordCount: 0 };
  }

  // Split into word tokens first for per-word checks
  const tokens = lower
    .split(/[^a-z0-9'-]+/i)
    .filter((w) => w.length >= 2 && !/^\d+$/.test(w));

  if (tokens.length === 0) {
    return { isMeaningful: false, cleanText: clean, reason: "no_words", recognizedWordCount: 0, wordCount: 0 };
  }

  // Character diversity check applied PER WORD (single tokens) only.
  // A normal multi-word sentence uses repeated letters across words, so checking the full
  // concatenated string would reject valid text. Only flag tokens that appear to be
  // single-word keyboard smashes of 8+ letters with very low unique character ratio.
  if (tokens.length === 1) {
    const lettersOnly = tokens[0].replace(/[^a-z]/g, "");
    if (lettersOnly.length >= 8) {
      const uniqueChars = new Set(lettersOnly).size;
      const diversityRatio = uniqueChars / lettersOnly.length;
      if (diversityRatio < 0.40) {
        return { isMeaningful: false, cleanText: clean, reason: "low_character_diversity", recognizedWordCount: 0, wordCount: 1 };
      }
    }
  }

  // Unpronounceable long consonant clusters within a single token
  // (Real English words rarely exceed 4 consonants in a row)
  // Only applies per-token to avoid rejecting valid multi-word text
  const hasBadConsonantCluster = tokens.some((token) => /[bcdfghjklmnpqrstvwxyz]{6,}/i.test(token));
  if (hasBadConsonantCluster) {
    return { isMeaningful: false, cleanText: clean, reason: "consonant_cluster", recognizedWordCount: 0, wordCount: tokens.length };
  }

  // Lexicon recognition
  let recognizedCount = 0;
  for (const token of tokens) {
    const stripped = token.replace(/^[-']+|[-']+$/g, "");
    if (KNOWN_WORDS.has(stripped)) {
      recognizedCount++;
    }
  }

  // If zero words are recognized in our lexicon, it is random characters / gibberish
  // (e.g. "ahisgdadasdasd", "sadasdasda", "asdasddasd")
  if (recognizedCount === 0) {
    return { isMeaningful: false, cleanText: clean, reason: "no_recognized_words", recognizedWordCount: 0, wordCount: tokens.length };
  }

  // If multi-word response but less than 20% recognized words, it's predominantly random noise
  if (tokens.length >= 4 && recognizedCount / tokens.length < 0.20) {
    return { isMeaningful: false, cleanText: clean, reason: "predominantly_unrecognized", recognizedWordCount: recognizedCount, wordCount: tokens.length };
  }

  return {
    isMeaningful: true,
    cleanText: clean,
    recognizedWordCount: recognizedCount,
    wordCount: tokens.length,
  };
}

// -------------------------------------------------------------------------
// Category A: Housing & Permission (max 25)
// -------------------------------------------------------------------------
function scoreHousing(s: ScreeningScoreInput): ScoreCategory {
  const MAX = 25;
  const notes: string[] = [];
  let score = 0;
  let hasGap = false;
  let missingEvidence: string | undefined;
  let followUpQuestion: string | undefined;

  const housing = s.housing_type || "";
  const needsPermission =
    housing === "rent_house" || housing === "apartment" || housing === "condo";

  // Sub-score 1: Housing suitability baseline (max 15)
  if (housing === "own_house") {
    score += 15;
    notes.push("Own house: typically provides stable space for dog care (+15)");
  } else if (housing === "rent_house") {
    score += 13;
    notes.push("Rented house: suitable living arrangement (+13)");
  } else if (housing === "apartment" || housing === "condo") {
    score += 12;
    notes.push("Apartment/condo: suitable dwelling when exercise routines are provided (+12)");
  } else {
    score += 12;
    notes.push("Other dwelling type recorded (+12)");
  }

  // Sub-score 2: Landlord / property permission (max 10)
  if (!needsPermission) {
    score += 10;
    notes.push("Owner/independent dwelling: landlord permission not required (+10)");
  } else if (s.landlord_permission === true) {
    score += 10;
    notes.push("Landlord/HOA pet permission explicitly confirmed (+10)");
  } else if (s.landlord_permission === false) {
    score += 0;
    hasGap = true;
    notes.push("Landlord/HOA permission explicitly NOT confirmed (0)");
    missingEvidence = "Landlord or HOA permission has not been granted for a rented/managed property.";
    followUpQuestion = "Has your landlord or HOA approved keeping a dog of this size and breed on the property?";
  } else {
    // null or unspecified on a rental property
    score += 5;
    hasGap = true;
    notes.push("Landlord/HOA permission status is unspecified (+5 partial)");
    missingEvidence = "Permission status is pending or unspecified for a rented property.";
    followUpQuestion = "Can you provide written or verbal confirmation of landlord approval for a pet?";
  }

  return {
    label: "Housing & Permission",
    score: Math.min(score, MAX),
    maxScore: MAX,
    rationale: notes.join(". "),
    hasGap,
    missingEvidence,
    followUpQuestion,
  };
}

// -------------------------------------------------------------------------
// Category B: Household Agreement & Consent (max 10)
// -------------------------------------------------------------------------
function scoreAgreement(s: ScreeningScoreInput): ScoreCategory {
  const MAX = 10;
  const notes: string[] = [];
  let score = 0;
  let hasGap = false;
  let missingEvidence: string | undefined;
  let followUpQuestion: string | undefined;

  if (s.household_agreement === true) {
    score += 6;
    notes.push("All household members affirmatively agreed to adoption (+6)");
  } else {
    hasGap = true;
    notes.push("Household agreement is not affirmatively recorded (0)");
    missingEvidence = "Full household agreement is unconfirmed or pending.";
    followUpQuestion = "Have all members of your household met and agreed to welcome a dog?";
  }

  if (s.screening_consent === true) {
    score += 4;
    notes.push("Screening consent explicitly confirmed (+4)");
  } else {
    hasGap = true;
    notes.push("Screening data consent not confirmed (0)");
    missingEvidence = "Screening data processing consent is missing.";
  }

  return {
    label: "Household Agreement & Consent",
    score: Math.min(score, MAX),
    maxScore: MAX,
    rationale: notes.join(". "),
    hasGap,
    missingEvidence,
    followUpQuestion,
  };
}

// -------------------------------------------------------------------------
// Category C: Children & Safety Integration (max 10)
// -------------------------------------------------------------------------
function scoreChildren(s: ScreeningScoreInput): ScoreCategory {
  const MAX = 10;
  const notes: string[] = [];
  let score = 0;
  let hasGap = false;
  let missingEvidence: string | undefined;
  let followUpQuestion: string | undefined;

  if (!s.has_children) {
    score = 10;
    notes.push("No children residing in home: consistent baseline integration (+10)");
  } else {
    const quality = evaluateTextQuality(s.children_details);

    if (!quality.isMeaningful) {
      score = 0;
      hasGap = true;
      notes.push("Children present in home, but no substantive safety or integration plan provided (0)");
      missingEvidence = "Children are present in the household, but no safety, supervision, or quiet space arrangement was described.";
      followUpQuestion = "Children are present: how will adult supervision, child-dog interactions, and quiet retreat spaces be managed?";
    } else {
      const lower = quality.cleanText.toLowerCase();

      // Check concrete safety indicators
      const hasSupervision = /supervis|watch|attend|monitor|adult|careful|teach|respect|gentle|train/i.test(lower);
      const hasSafeSpace = /quiet|space|room|crate|separate|retreat|gate|barrier|bed/i.test(lower);
      const hasAgeOrExperience = /year|age|old|teen|experienced|grew up|familiar/i.test(lower);

      if (hasSupervision || (hasSafeSpace && hasAgeOrExperience)) {
        score = 10;
        notes.push("Children present with concrete supervision, boundaries, and safe interaction plan (+10)");
      } else {
        score = 5;
        hasGap = true;
        notes.push("Children present with basic description, but specific supervision/retreat protocols need clarification (+5 partial)");
        missingEvidence = "General child information provided without specific supervision or safe-space protocols.";
        followUpQuestion = "Can you describe how adult supervision and quiet resting areas for the dog will be handled around the children?";
      }
    }
  }

  return {
    label: "Children & Safety Integration",
    score: Math.min(score, MAX),
    maxScore: MAX,
    rationale: notes.join(". "),
    hasGap,
    missingEvidence,
    followUpQuestion,
  };
}

// -------------------------------------------------------------------------
// Category D: Pet-care Experience (max 20)
// -------------------------------------------------------------------------
function scoreExperience(s: ScreeningScoreInput): ScoreCategory {
  const MAX = 20;
  const notes: string[] = [];
  let score = 0;
  let hasGap = false;
  let missingEvidence: string | undefined;
  let followUpQuestion: string | undefined;

  // Base experience or first-time owner preparation (max 12)
  const expQuality = evaluateTextQuality(s.pet_care_experience);

  if (!expQuality.isMeaningful) {
    score += 0;
    hasGap = true;
    notes.push("Pet-care experience field contains no substantive evidence (0)");
    missingEvidence = "Insufficient evidence: no concrete prior pet care experience or first-time owner preparation plan was described.";
    followUpQuestion = "What prior experience do you have caring for animals, or what preparation and research have you done as a first-time owner?";
  } else {
    const lower = expQuality.cleanText.toLowerCase();

    // Check for prior care duties or structured preparation
    const hasPriorCare = /raised|owned|owning|had a dog|years|foster|rescued|cared|caring|walking|feeding|grooming|trained|veterinary/i.test(lower);
    const hasFirstTimePrep = /first.?time|never owned|research|classes|course|trainer|read|books|mentor|support|learning|prepared/i.test(lower);

    if (hasPriorCare || hasFirstTimePrep) {
      score += 12;
      notes.push(hasPriorCare
        ? "Concrete prior pet-care experience documented (+12)"
        : "Credible preparation, learning, and support plan documented for first-time owner (+12)"
      );
    } else {
      score += 6;
      hasGap = true;
      notes.push("General pet interest noted, but specific daily care experience or preparation details are minimal (+6 partial)");
      missingEvidence = "General interest stated, but daily handling responsibilities or structured preparation are not detailed.";
      followUpQuestion = "Could you share more details about your hands-on daily animal-care duties or training preparations?";
    }
  }

  // Active pet ownership bonus (max 8)
  if (s.existing_pets_details === null || s.existing_pets_details === undefined) {
    notes.push("No other pets currently in household (not penalized)");
  } else {
    const petsQuality = evaluateTextQuality(s.existing_pets_details);
    if (!petsQuality.isMeaningful) {
      hasGap = true;
      notes.push("Other pets indicated, but details provided are invalid or lack substance (0)");
      if (!missingEvidence) {
        missingEvidence = "Other household pets were indicated, but species, age, or temperament details were not provided.";
      }
      followUpQuestion = "Please provide details on your current pets (species, age, vaccination status, and temperament with dogs).";
    } else {
      score += 8;
      notes.push("Active hands-on pet care documented with current household animals (+8)");
    }
  }

  return {
    label: "Pet-care Experience",
    score: Math.min(score, MAX),
    maxScore: MAX,
    rationale: notes.join(". "),
    hasGap,
    missingEvidence,
    followUpQuestion,
  };
}

// -------------------------------------------------------------------------
// Category E: Daily Care Plan (max 20)
// -------------------------------------------------------------------------
function scoreDailyCare(s: ScreeningScoreInput): ScoreCategory {
  const MAX = 20;
  const notes: string[] = [];
  let score = 0;
  let hasGap = false;
  let missingEvidence: string | undefined;
  let followUpQuestion: string | undefined;

  // Sub-score 1: Daily alone hours (max 10)
  const rawAlone = Number(s.daily_alone_hours);
  const alone = Number.isFinite(rawAlone) && rawAlone >= 0 ? rawAlone : 0;

  if (alone <= 4) {
    score += 10;
    notes.push("Dog alone 4 hours or less per day: positive welfare indicator (+10)");
  } else if (alone <= 6) {
    score += 7;
    notes.push("Dog alone 5-6 hours/day: acceptable routine (+7)");
  } else if (alone <= 8) {
    score += 4;
    hasGap = true;
    notes.push("Dog alone 7-8 hours/day: upper threshold (+4)");
    missingEvidence = "Dog will be alone 7-8 hours daily; daytime exercise and potty breaks need verification.";
    followUpQuestion = "Who will provide midday bathroom breaks and companionship on days the dog is left for 7-8 hours?";
  } else if (alone <= 12) {
    score += 2;
    hasGap = true;
    notes.push("Dog alone " + alone + " hours/day: significant welfare concern (+2)");
    missingEvidence = "Dog will be alone for extended hours (" + alone + " hrs); daytime care arrangements are critical.";
    followUpQuestion = "How will feeding, exercise, and companionship be managed during extended daily absences of " + alone + " hours?";
  } else {
    score += 0;
    hasGap = true;
    notes.push("Dog alone " + alone + " hours/day: severe welfare concern (0)");
    missingEvidence = "Dog alone exceeding 12 hours daily constitutes a serious welfare concern.";
    followUpQuestion = "What arrangements (e.g. dog walker, family, daycare) will be put in place to avoid extreme alone hours?";
  }

  // Sub-score 2: Daily care arrangements text (max 10)
  const careQuality = evaluateTextQuality(s.daily_care_arrangements);

  if (!careQuality.isMeaningful) {
    hasGap = true;
    notes.push("Daily care arrangements response contains no substantive routine (0)");
    if (!missingEvidence) {
      missingEvidence = "Insufficient evidence: the response does not describe a daily feeding, exercise, or supervision arrangement.";
    }
    if (!followUpQuestion) {
      followUpQuestion = "Who will care for the dog during work hours or unexpected absences, and what is your planned feeding and walking schedule?";
    }
  } else {
    const lower = careQuality.cleanText.toLowerCase();

    // Care pillars
    const hasFeeding = /feed|food|meal|kibble|water|diet|breakfast|dinner|pakain|kain/i.test(lower);
    const hasExercise = /walk|potty|exercise|run|play|park|leash|bathroom|yard|garden|lakad/i.test(lower);
    const hasCoverage = /wfh|work from home|hybrid|schedule|family|partner|neighbor|sitter|daycare|someone|home|companion/i.test(lower);

    const pillarsCount = (hasFeeding ? 1 : 0) + (hasExercise ? 1 : 0) + (hasCoverage ? 1 : 0);

    if (pillarsCount >= 2) {
      score += 10;
      notes.push("Comprehensive daily routine with balanced feeding, exercise, and absence coverage (+10)");
    } else if (pillarsCount === 1) {
      score += 5;
      hasGap = true;
      notes.push("Partial care routine described; coverage during absences or exercise routines need detail (+5 partial)");
      if (!missingEvidence) {
        missingEvidence = "Partial routine provided; absence coverage or exercise schedule needs clarification.";
      }
      if (!followUpQuestion) {
        followUpQuestion = "Who will care for the dog during work hours, and what daily walking routine is planned?";
      }
    } else {
      score += 3;
      hasGap = true;
      notes.push("General care statement provided without concrete daily schedule (+3 partial)");
      if (!missingEvidence) {
        missingEvidence = "General statement provided without concrete daily feeding or exercise schedules.";
      }
      if (!followUpQuestion) {
        followUpQuestion = "Could you outline your intended daily schedule for feeding, walking, and bathroom breaks?";
      }
    }
  }

  return {
    label: "Daily Care Plan",
    score: Math.min(score, MAX),
    maxScore: MAX,
    rationale: notes.join(". "),
    hasGap,
    missingEvidence,
    followUpQuestion,
  };
}

// -------------------------------------------------------------------------
// Category F: Veterinary & Emergency Plan (max 15)
// -------------------------------------------------------------------------
function scoreVetPlan(s: ScreeningScoreInput): ScoreCategory {
  const MAX = 15;
  const notes: string[] = [];
  let score = 0;
  let hasGap = false;
  let missingEvidence: string | undefined;
  let followUpQuestion: string | undefined;

  const vetQuality = evaluateTextQuality(s.emergency_vet_care_plan);

  if (!vetQuality.isMeaningful) {
    hasGap = true;
    notes.push("Veterinary and emergency care plan contains no substantive information (0)");
    missingEvidence = "Insufficient evidence: no concrete veterinary access, routine care, or emergency financial arrangement was described.";
    followUpQuestion = "Which veterinary clinic will you use, and how do you plan to handle emergency medical expenses or transportation?";
  } else {
    const lower = vetQuality.cleanText.toLowerCase();

    // Check specific veterinary & emergency pillars (ensuring daily care text doesn't accidentally earn vet points)
    const hasClinicAccess = /vet|veterinar|clinic|hospital|doctor|beterinaryo|nearby|access/i.test(lower);
    const hasEmergencyPreparedness = /emergency|urgent|24\/7|er|transport|car|drive|ride|vehicle/i.test(lower);
    const hasFinancialOrPreventive = /fund|savings|budget|insurance|afford|cost|expense|pay|vaccin|deworm|annual|checkup|routine/i.test(lower);

    const vetPillars = (hasClinicAccess ? 1 : 0) + (hasEmergencyPreparedness ? 1 : 0) + (hasFinancialOrPreventive ? 1 : 0);

    if (vetPillars >= 2) {
      score = 15;
      notes.push("Comprehensive veterinary plan covering clinic access and emergency preparedness (+15)");
    } else if (vetPillars === 1) {
      score = 8;
      hasGap = true;
      notes.push("Basic veterinary access or financial intent stated, but emergency response is incomplete (+8 partial)");
      missingEvidence = "Basic veterinary access mentioned, but emergency funding or transport arrangements were not detailed.";
      followUpQuestion = "How do you plan to cover unexpected emergency medical costs or transport the dog if urgent care is required?";
    } else {
      score = 4;
      hasGap = true;
      notes.push("General veterinary awareness noted, but specific clinic or financial plans are missing (+4 partial)");
      missingEvidence = "General intent expressed without concrete veterinary clinic access or emergency cost planning.";
      followUpQuestion = "Do you have a specific veterinary clinic identified and an emergency budget for unforeseen medical needs?";
    }
  }

  return {
    label: "Veterinary & Emergency Plan",
    score: Math.min(score, MAX),
    maxScore: MAX,
    rationale: notes.join(". "),
    hasGap,
    missingEvidence,
    followUpQuestion,
  };
}

// -------------------------------------------------------------------------
// Main exported function
// -------------------------------------------------------------------------

export function computeSuitabilityScore(
  screening: ScreeningScoreInput
): SuitabilityScoreResult {
  // Safe normalization of input to handle null, undefined, legacy, or malformed records
  const safeInput: ScreeningScoreInput = {
    housing_type: typeof screening?.housing_type === "string" ? screening.housing_type : "",
    landlord_permission: screening?.landlord_permission ?? null,
    has_children: Boolean(screening?.has_children),
    children_details: screening?.children_details ?? null,
    household_members_details: screening?.household_members_details ?? null,
    existing_pets_details: screening?.existing_pets_details ?? null,
    pet_care_experience: typeof screening?.pet_care_experience === "string" ? screening.pet_care_experience : "",
    daily_alone_hours: Number.isFinite(Number(screening?.daily_alone_hours)) ? Number(screening.daily_alone_hours) : 0,
    daily_care_arrangements: typeof screening?.daily_care_arrangements === "string" ? screening.daily_care_arrangements : "",
    emergency_vet_care_plan: typeof screening?.emergency_vet_care_plan === "string" ? screening.emergency_vet_care_plan : "",
    household_agreement: Boolean(screening?.household_agreement),
    screening_consent: Boolean(screening?.screening_consent),
  };

  const categories: ScoreCategory[] = [
    scoreHousing(safeInput),
    scoreAgreement(safeInput),
    scoreChildren(safeInput),
    scoreExperience(safeInput),
    scoreDailyCare(safeInput),
    scoreVetPlan(safeInput),
  ];

  // Invariant: totalScore = sum of 6 category scores, bounded [0, 100]
  const total = Math.max(0, Math.min(100, categories.reduce((sum, c) => sum + c.score, 0)));

  // Critical welfare gaps inspection
  const careQuality = evaluateTextQuality(safeInput.daily_care_arrangements);
  const vetQuality = evaluateTextQuality(safeInput.emergency_vet_care_plan);
  const expQuality = evaluateTextQuality(safeInput.pet_care_experience);

  const criticalGaps: string[] = [];
  if (!careQuality.isMeaningful) criticalGaps.push("Daily care arrangements contain no concrete routine");
  if (!vetQuality.isMeaningful) criticalGaps.push("Emergency veterinary care plan contains no concrete arrangements");
  if (!expQuality.isMeaningful) criticalGaps.push("Pet-care experience provides no verifiable background or preparation");

  const followUpReasons: string[] = [];
  for (const cat of categories) {
    if (cat.hasGap) {
      followUpReasons.push(cat.label);
    }
  }

  // Tier assignment with welfare integrity guardrails
  // A high numeric total must NOT conceal missing critical welfare information
  let tier: SuitabilityScoreResult["tier"];
  let tierLabel: string;
  let tierDescription: string;

  const allFreeTextMeaningless = !careQuality.isMeaningful && !vetQuality.isMeaningful && !expQuality.isMeaningful;
  const criticalCareOrVetMissing = !careQuality.isMeaningful || !vetQuality.isMeaningful;

  if (allFreeTextMeaningless) {
    tier = "limited";
    tierLabel = "Limited Information";
    tierDescription = "Critical care, veterinary, and experience responses contain meaningless or missing text. Staff follow-up is required before any adoption decision.";
  } else if (criticalCareOrVetMissing) {
    // If essential daily care or vet care is completely meaningless, cannot be 'strong'
    if (total >= 40) {
      tier = "mixed";
      tierLabel = "Mixed Indicators";
      tierDescription = "Housing and consent are confirmed, but essential daily care or veterinary arrangements lack verifiable evidence. Staff follow-up is required.";
    } else {
      tier = "limited";
      tierLabel = "Limited Information";
      tierDescription = "Essential daily care or veterinary plans are missing or lack substance. Staff follow-up is required.";
    }
  } else {
    if (total >= 80) {
      tier = "strong";
      tierLabel = "Strong Indicators";
      tierDescription = "Many positive markers are present. Review individual categories and follow up on any flagged gaps before making a decision.";
    } else if (total >= 60) {
      tier = "positive";
      tierLabel = "Positive Indicators";
      tierDescription = "Good baseline with some areas to explore further. Review flagged gaps during the screening interview.";
    } else if (total >= 40) {
      tier = "mixed";
      tierLabel = "Mixed Indicators";
      tierDescription = "Notable gaps in the submission. Staff follow-up questions are recommended before approving.";
    } else {
      tier = "limited";
      tierLabel = "Limited Information";
      tierDescription = "Insufficient detail to form a complete picture. Staff should contact the applicant for follow-up before making any decision.";
    }
  }

  return {
    totalScore: total,
    maxScore: 100,
    tier,
    tierLabel,
    tierDescription,
    categories,
    followUpRecommended: followUpReasons.length > 0,
    followUpReasons,
    criticalGaps: criticalGaps.length > 0 ? criticalGaps : undefined,
  };
}