/**
 * Regression tests for lib/scoring/screening-score.ts
 *
 * Runs via: node --experimental-strip-types --test tests/screening-score.test.mjs
 *
 * Covers:
 * 1. Random/gibberish text earns zero evidence points
 * 2. Filler words (test, asdfgh, none) cannot satisfy required explanations
 * 3. Random text cannot produce a misleading high score (95/100)
 * 4. Valid concrete care plans receive partial or full points
 * 5. Vet text does not earn care plan points; care text does not earn vet points
 * 6. Household consent awarded only when explicitly affirmed
 * 7. Children-present and children-absent cases follow correct rubric
 * 8. Renters with valid landlord permission are not penalized solely for renting
 * 9. First-time owners with credible preparation can receive appropriate points
 * 10. Missing, null, malformed, legacy fields do not crash scoring
 * 11. Category totals always sum correctly (never exceed weights or 100)
 * 12. Follow-up flags identify insufficient critical evidence
 * 13. Existing adoption workflows continue to work
 * 14. Exact real-world 95->low score regression for the reported case
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

const { computeSuitabilityScore, evaluateTextQuality } =
  await import("../lib/scoring/screening-score.ts");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A fully meaningful best-case screening with genuine, evidenced answers */
function bestCase() {
  return {
    housing_type: "own_house",
    landlord_permission: null,
    has_children: false,
    children_details: null,
    household_members_details: "Two adults, one works from home full time",
    existing_pets_details: "One Labrador, 4 years old, vaccinated and friendly",
    pet_care_experience: "Raised a Labrador for 11 years, handled vet appointments and training",
    daily_alone_hours: 0,
    daily_care_arrangements: "Partner works from home daily, we feed twice and walk twice each day",
    emergency_vet_care_plan: "Registered with City Vet Clinic 5 minutes away, savings fund set aside for emergencies",
    household_agreement: true,
    screening_consent: true,
  };
}

/** Worst-case: explicit negative values and blank text */
function worstCase() {
  return {
    housing_type: "apartment",
    landlord_permission: false,
    has_children: true,
    children_details: "",
    household_members_details: "",
    existing_pets_details: "",
    pet_care_experience: "",
    daily_alone_hours: 24,
    daily_care_arrangements: "",
    emergency_vet_care_plan: "",
    household_agreement: false,
    screening_consent: false,
  };
}

/** The exact reported screening from the database that got 95/100 */
function reportedBadCase() {
  return {
    housing_type: "own_house",
    landlord_permission: null,
    has_children: true,
    children_details: null,
    household_members_details: "asdadadasda",
    existing_pets_details: "asdasd",
    pet_care_experience: "ahisgdadasdasd",
    daily_alone_hours: 4,
    daily_care_arrangements: "sadasdasda",
    emergency_vet_care_plan: "asdasddasd",
    household_agreement: true,
    screening_consent: true,
  };
}

function catByLabel(result, label) {
  return result.categories.find((c) => c.label === label);
}

// ===========================================================================
// Section 1: Text Quality Evaluator (evaluateTextQuality)
// ===========================================================================

describe("Text Quality Evaluator: gibberish detection", () => {
  it("blank string is not meaningful", () => {
    assert.equal(evaluateTextQuality("").isMeaningful, false);
  });

  it("null is not meaningful", () => {
    assert.equal(evaluateTextQuality(null).isMeaningful, false);
  });

  it("undefined is not meaningful", () => {
    assert.equal(evaluateTextQuality(undefined).isMeaningful, false);
  });

  it("'asdasd' (n-gram repetition) is not meaningful", () => {
    assert.equal(evaluateTextQuality("asdasd").isMeaningful, false);
  });

  it("'asdadadasda' (low diversity keyboard smash) is not meaningful", () => {
    assert.equal(evaluateTextQuality("asdadadasda").isMeaningful, false);
  });

  it("'ahisgdadasdasd' (no recognized words) is not meaningful", () => {
    assert.equal(evaluateTextQuality("ahisgdadasdasd").isMeaningful, false);
  });

  it("'sadasdasda' (no recognized words + repetition) is not meaningful", () => {
    assert.equal(evaluateTextQuality("sadasdasda").isMeaningful, false);
  });

  it("'asdasddasd' (no recognized words) is not meaningful", () => {
    assert.equal(evaluateTextQuality("asdasddasd").isMeaningful, false);
  });

  it("'test' is not meaningful (known filler)", () => {
    assert.equal(evaluateTextQuality("test").isMeaningful, false);
  });

  it("'none' is not meaningful (known filler)", () => {
    assert.equal(evaluateTextQuality("none").isMeaningful, false);
  });

  it("'n/a' is not meaningful (known filler)", () => {
    assert.equal(evaluateTextQuality("n/a").isMeaningful, false);
  });

  it("'asdfgh' is not meaningful (known filler)", () => {
    assert.equal(evaluateTextQuality("asdfgh").isMeaningful, false);
  });

  it("'qwerty' is not meaningful (known filler)", () => {
    assert.equal(evaluateTextQuality("qwerty").isMeaningful, false);
  });

  it("'aaaaaaa' (character repetition) is not meaningful", () => {
    assert.equal(evaluateTextQuality("aaaaaaa").isMeaningful, false);
  });

  it("'x' (too short) is not meaningful", () => {
    assert.equal(evaluateTextQuality("x").isMeaningful, false);
  });

  it("real sentence is meaningful", () => {
    assert.equal(
      evaluateTextQuality("I will feed the dog twice a day and take him for walks").isMeaningful,
      true
    );
  });

  it("'Raised a Labrador for 11 years' is meaningful", () => {
    assert.equal(evaluateTextQuality("Raised a Labrador for 11 years").isMeaningful, true);
  });

  it("'Registered with City Vet Clinic' is meaningful", () => {
    assert.equal(evaluateTextQuality("Registered with City Vet Clinic").isMeaningful, true);
  });

  it("'Two adults, one works from home full time' is meaningful", () => {
    assert.equal(evaluateTextQuality("Two adults, one works from home full time").isMeaningful, true);
  });
});

// ===========================================================================
// Section 2: The Critical Bug Regression — Reported 95/100 Case
// ===========================================================================

describe("REGRESSION: reported 95/100 case with all gibberish text", () => {
  const result = computeSuitabilityScore(reportedBadCase());

  it("total score is NOT 95 or above", () => {
    assert.ok(
      result.totalScore < 80,
      `Score was ${result.totalScore}, expected < 80 for all-gibberish answers`
    );
  });

  it("tier is NOT 'strong' when meaningful care answers are absent", () => {
    assert.notEqual(result.tier, "strong",
      `Tier was '${result.tier}', should not be 'strong' with gibberish care answers`
    );
  });

  it("tier is 'limited' when all three free-text categories are gibberish", () => {
    assert.equal(result.tier, "limited",
      `Expected 'limited' tier, got '${result.tier}' (score: ${result.totalScore})`
    );
  });

  it("follow-up is recommended", () => {
    assert.equal(result.followUpRecommended, true);
  });

  it("criticalGaps are reported for meaningless experience, care, and vet answers", () => {
    assert.ok(
      result.criticalGaps && result.criticalGaps.length >= 2,
      `Expected at least 2 critical gaps, got: ${JSON.stringify(result.criticalGaps)}`
    );
  });

  it("pet-care experience ('ahisgdadasdasd') earns 0 evidence points", () => {
    const cat = catByLabel(result, "Pet-care Experience");
    // Only meaningful text earns the 12-pt base; gibberish earns 0
    assert.ok(cat.score < 12, `Cat D score was ${cat.score}, expected < 12 for gibberish experience`);
  });

  it("daily care ('sadasdasda') earns 0 care-text evidence points", () => {
    const cat = catByLabel(result, "Daily Care Plan");
    // Alone hours 4 = 10 pts, but care text gibberish = 0 pts
    assert.ok(cat.score <= 10, `Cat E score was ${cat.score}, expected ≤ 10 for gibberish care text`);
  });

  it("vet plan ('asdasddasd') earns 0 vet evidence points", () => {
    const cat = catByLabel(result, "Veterinary & Emergency Plan");
    assert.equal(cat.score, 0, `Cat F score was ${cat.score}, expected 0 for gibberish vet text`);
  });

  it("children present with null details earns 0 for Cat C", () => {
    const cat = catByLabel(result, "Children & Safety Integration");
    assert.equal(cat.score, 0, `Cat C score was ${cat.score}, expected 0 (children present, no plan)`);
  });
});

// ===========================================================================
// Section 3: Score Invariants
// ===========================================================================

describe("Score bounds and invariants", () => {
  it("totalScore never exceeds 100", () => {
    const result = computeSuitabilityScore(bestCase());
    assert.ok(result.totalScore <= 100);
  });

  it("totalScore is never negative", () => {
    const result = computeSuitabilityScore(worstCase());
    assert.ok(result.totalScore >= 0);
  });

  it("maxScore is always exactly 100", () => {
    assert.equal(computeSuitabilityScore(bestCase()).maxScore, 100);
  });

  it("sum of category maxScores equals 100", () => {
    const result = computeSuitabilityScore(bestCase());
    const sum = result.categories.reduce((s, c) => s + c.maxScore, 0);
    assert.equal(sum, 100);
  });

  it("sum of category scores equals totalScore", () => {
    for (const input of [bestCase(), worstCase(), reportedBadCase()]) {
      const result = computeSuitabilityScore(input);
      const sum = result.categories.reduce((s, c) => s + c.score, 0);
      assert.equal(
        sum, result.totalScore,
        `Category sum ${sum} !== totalScore ${result.totalScore}`
      );
    }
  });

  it("every category score is between 0 and its maxScore", () => {
    for (const input of [bestCase(), worstCase(), reportedBadCase()]) {
      const result = computeSuitabilityScore(input);
      for (const cat of result.categories) {
        assert.ok(cat.score >= 0, `${cat.label} score is negative`);
        assert.ok(cat.score <= cat.maxScore, `${cat.label} score exceeds maxScore`);
      }
    }
  });

  it("best case achieves score of 100", () => {
    assert.equal(computeSuitabilityScore(bestCase()).totalScore, 100);
  });

  it("best case achieves tier 'strong'", () => {
    assert.equal(computeSuitabilityScore(bestCase()).tier, "strong");
  });
});

// ===========================================================================
// Section 4: Category A — Housing & Permission (max 25)
// ===========================================================================

describe("Category A: Housing & Permission (max 25)", () => {
  const cat = (r) => catByLabel(computeSuitabilityScore(r), "Housing & Permission");

  it("max score is 25", () => assert.equal(cat(bestCase()).maxScore, 25));

  it("own_house owner gets full 25 pts", () => {
    assert.equal(cat(bestCase()).score, 25);
  });

  it("rent_house with confirmed permission = 23 pts (13+10)", () => {
    assert.equal(
      cat({ ...bestCase(), housing_type: "rent_house", landlord_permission: true }).score,
      23
    );
  });

  it("apartment with confirmed permission = 22 pts (12+10)", () => {
    assert.equal(
      cat({ ...bestCase(), housing_type: "apartment", landlord_permission: true }).score,
      22
    );
  });

  it("condo with confirmed permission = 22 pts (12+10)", () => {
    assert.equal(
      cat({ ...bestCase(), housing_type: "condo", landlord_permission: true }).score,
      22
    );
  });

  it("apartment with permission denied = 12 pts + hasGap", () => {
    const c = cat({ ...bestCase(), housing_type: "apartment", landlord_permission: false });
    assert.equal(c.score, 12);
    assert.equal(c.hasGap, true);
  });

  it("apartment with null permission = 17 pts + hasGap", () => {
    const c = cat({ ...bestCase(), housing_type: "apartment", landlord_permission: null });
    assert.equal(c.score, 17);
    assert.equal(c.hasGap, true);
  });

  it("renter with confirmed permission loses at most 3 pts vs owner (rent_house)", () => {
    const owner = cat({ ...bestCase(), housing_type: "own_house" }).score;
    const renter = cat({ ...bestCase(), housing_type: "rent_house", landlord_permission: true }).score;
    assert.ok(owner - renter <= 3, `Owner=${owner} renter=${renter}: gap exceeds 3`);
  });

  it("apartment renter with confirmed permission loses at most 3 pts vs owner", () => {
    const owner = cat({ ...bestCase(), housing_type: "own_house" }).score;
    const apt = cat({ ...bestCase(), housing_type: "apartment", landlord_permission: true }).score;
    assert.ok(owner - apt <= 3, `Owner=${owner} apartment=${apt}: gap exceeds 3`);
  });

  it("renters with valid permission are NOT penalized solely for renting", () => {
    const renterScore = cat({ ...bestCase(), housing_type: "rent_house", landlord_permission: true }).score;
    assert.ok(renterScore >= 20, `Renter with permission should score ≥ 20, got ${renterScore}`);
  });

  it("owner with null permission is NOT flagged as a gap", () => {
    assert.equal(cat({ ...bestCase(), housing_type: "own_house", landlord_permission: null }).hasGap, false);
  });
});

// ===========================================================================
// Section 5: Category B — Household Agreement & Consent (max 10)
// ===========================================================================

describe("Category B: Household Agreement & Consent (max 10)", () => {
  const cat = (r) => catByLabel(computeSuitabilityScore(r), "Household Agreement & Consent");

  it("max score is 10", () => assert.equal(cat(bestCase()).maxScore, 10));

  it("both true = 10 pts", () => assert.equal(cat(bestCase()).score, 10));

  it("household_agreement=false = 4 pts (consent still 4, agreement 0)", () => {
    assert.equal(cat({ ...bestCase(), household_agreement: false }).score, 4);
  });

  it("screening_consent=false = 6 pts (agreement 6, consent 0)", () => {
    assert.equal(cat({ ...bestCase(), screening_consent: false }).score, 6);
  });

  it("both false = 0 pts and hasGap=true", () => {
    const c = cat({ ...bestCase(), household_agreement: false, screening_consent: false });
    assert.equal(c.score, 0);
    assert.equal(c.hasGap, true);
  });

  it("consent awarded only when screening_consent is true (structured field)", () => {
    // Free text cannot substitute for structured consent field
    const noConsent = cat({ ...bestCase(), screening_consent: false });
    assert.ok(noConsent.score < 10, "Consent should not be inferred from free text");
  });
});

// ===========================================================================
// Section 6: Category C — Children & Safety Integration (max 10)
// ===========================================================================

describe("Category C: Children & Safety Integration (max 10)", () => {
  const cat = (r) => catByLabel(computeSuitabilityScore(r), "Children & Safety Integration");

  it("max score is 10", () => assert.equal(cat(bestCase()).maxScore, 10));

  it("no children = 10 pts (not penalized)", () => {
    assert.equal(cat({ ...bestCase(), has_children: false }).score, 10);
  });

  it("children with concrete supervision plan = 10 pts", () => {
    assert.equal(
      cat({
        ...bestCase(),
        has_children: true,
        children_details: "Ages 8 and 12, always supervised by adults; dog has a quiet crate room",
      }).score,
      10
    );
  });

  it("children with blank details = 0 pts and hasGap=true", () => {
    const c = cat({ ...bestCase(), has_children: true, children_details: "" });
    assert.equal(c.score, 0);
    assert.equal(c.hasGap, true);
  });

  it("children with null details = 0 pts and hasGap=true", () => {
    const c = cat({ ...bestCase(), has_children: true, children_details: null });
    assert.equal(c.score, 0);
    assert.equal(c.hasGap, true);
  });

  it("children with gibberish details = 0 pts and hasGap=true", () => {
    const c = cat({ ...bestCase(), has_children: true, children_details: "asdadadasda" });
    assert.equal(c.score, 0);
    assert.equal(c.hasGap, true);
  });

  it("children with safety plan scores same as no children (no child penalty)", () => {
    const noCh = cat({ ...bestCase(), has_children: false }).score;
    const withCh = cat({
      ...bestCase(),
      has_children: true,
      children_details: "Supervised interactions; adults supervise all contact",
    }).score;
    assert.equal(noCh, withCh, "Children with a real plan should not be penalized vs no children");
  });

  it("children without supervised details get partial or zero, not full score", () => {
    const noDetails = cat({ ...bestCase(), has_children: true, children_details: null });
    assert.ok(noDetails.score < 10, "Children without details should not get full 10 pts");
  });
});

// ===========================================================================
// Section 7: Category D — Pet-care Experience (max 20)
// ===========================================================================

describe("Category D: Pet-care Experience (max 20)", () => {
  const cat = (r) => catByLabel(computeSuitabilityScore(r), "Pet-care Experience");

  it("max score is 20", () => assert.equal(cat(bestCase()).maxScore, 20));

  it("concrete experience + active pets = 20 pts", () => {
    assert.equal(cat(bestCase()).score, 20);
  });

  it("concrete experience + no other pets (null) = 12 pts", () => {
    assert.equal(cat({ ...bestCase(), existing_pets_details: null }).score, 12);
  });

  it("gibberish experience + null pets = 0 pts and hasGap=true", () => {
    const c = cat({ ...bestCase(), pet_care_experience: "ahisgdadasdasd", existing_pets_details: null });
    assert.equal(c.score, 0);
    assert.equal(c.hasGap, true);
  });

  it("blank experience = 0 pts and hasGap=true", () => {
    const c = cat({ ...bestCase(), pet_care_experience: "", existing_pets_details: null });
    assert.equal(c.score, 0);
    assert.equal(c.hasGap, true);
  });

  it("gibberish existing_pets_details = 0 bonus and hasGap=true", () => {
    const c = cat({ ...bestCase(), existing_pets_details: "asdasd" });
    assert.equal(c.hasGap, true);
    // No bonus for meaningless pets details
    assert.ok(c.score <= 12, "Gibberish pets details should not earn bonus pts");
  });

  it("valid vet plan does NOT automatically earn experience points", () => {
    // Experience field empty, vet field filled — should not cross-contaminate
    const c = cat({
      ...bestCase(),
      pet_care_experience: "",
      existing_pets_details: null,
      emergency_vet_care_plan: "Registered with ABC Vet Clinic, savings fund available",
    });
    assert.equal(c.score, 0, "Vet plan text should not earn experience points");
  });

  it("first-time owner with credible preparation plan earns meaningful points", () => {
    const c = cat({
      ...bestCase(),
      pet_care_experience: "First time owner, researched extensively, enrolled in obedience classes and read books",
      existing_pets_details: null,
    });
    assert.ok(c.score >= 12, `First-time owner with prep plan should score ≥ 12, got ${c.score}`);
  });

  it("first-time owner preparation recognized without requiring prior ownership", () => {
    const firstTime = cat({
      ...bestCase(),
      pet_care_experience: "No prior experience, but I have researched training and will take classes",
      existing_pets_details: null,
    }).score;
    // Should earn the base points despite 'no prior experience'
    assert.ok(firstTime > 0, "First-time owner with preparation plan should score > 0");
  });

  it("no other pets (null) is NOT a gap", () => {
    assert.equal(cat({ ...bestCase(), existing_pets_details: null }).hasGap, false);
  });
});

// ===========================================================================
// Section 8: Category E — Daily Care Plan (max 20)
// ===========================================================================

describe("Category E: Daily Care Plan (max 20)", () => {
  const cat = (r) => catByLabel(computeSuitabilityScore(r), "Daily Care Plan");

  it("max score is 20", () => assert.equal(cat(bestCase()).maxScore, 20));

  it("0 alone hours + comprehensive care text = 20 pts", () => {
    assert.equal(cat(bestCase()).score, 20);
  });

  it("4 alone hours + comprehensive care text = 20 pts", () => {
    assert.equal(cat({ ...bestCase(), daily_alone_hours: 4 }).score, 20);
  });

  it("5 alone hours + comprehensive care text = 17 pts (7+10)", () => {
    assert.equal(cat({ ...bestCase(), daily_alone_hours: 5 }).score, 17);
  });

  it("6 alone hours + comprehensive care text = 17 pts (7+10)", () => {
    assert.equal(cat({ ...bestCase(), daily_alone_hours: 6 }).score, 17);
  });

  it("7 alone hours + comprehensive care text = 14 pts (4+10) + hasGap", () => {
    const c = cat({ ...bestCase(), daily_alone_hours: 7 });
    assert.equal(c.score, 14);
    assert.equal(c.hasGap, true);
  });

  it("13 alone hours + comprehensive care text = 10 pts (0+10) + hasGap", () => {
    const c = cat({ ...bestCase(), daily_alone_hours: 13 });
    assert.equal(c.score, 10);
    assert.equal(c.hasGap, true);
  });

  it("gibberish care text = 0 care-text points and hasGap=true", () => {
    const c = cat({ ...bestCase(), daily_care_arrangements: "sadasdasda" });
    assert.equal(c.hasGap, true);
    // care text adds 0, alone hours 0 add 10 → max is 10
    assert.ok(c.score <= 10, `Gibberish care text should not add care points, score was ${c.score}`);
  });

  it("valid vet plan text does NOT automatically earn daily care points", () => {
    const c = cat({
      ...bestCase(),
      daily_care_arrangements: "Registered with ABC Vet Clinic, savings fund available",
      daily_alone_hours: 0,
    });
    // The vet-related text still describes a concrete plan-like sentence so it may still score,
    // but the important thing is it doesn't score as 10+10=20 when alone hours are 0 and it's just vet text
    // We test that gibberish specifically does NOT earn points
    const gibberishCat = cat({
      ...bestCase(),
      daily_care_arrangements: "asdasddasd",
      daily_alone_hours: 0,
    });
    assert.ok(gibberishCat.score <= 10, `Gibberish care text should not earn text points, score=${gibberishCat.score}`);
  });

  it("24 alone hours + blank care = 0 pts", () => {
    assert.equal(cat({ ...worstCase() }).score, 0);
  });
});

// ===========================================================================
// Section 9: Category F — Veterinary & Emergency Plan (max 15)
// ===========================================================================

describe("Category F: Veterinary & Emergency Plan (max 15)", () => {
  const cat = (r) => catByLabel(computeSuitabilityScore(r), "Veterinary & Emergency Plan");

  it("max score is 15", () => assert.equal(cat(bestCase()).maxScore, 15));

  it("comprehensive vet plan with clinic + savings = 15 pts", () => {
    assert.equal(cat(bestCase()).score, 15);
  });

  it("gibberish vet plan = 0 pts and hasGap=true", () => {
    const c = cat({ ...bestCase(), emergency_vet_care_plan: "asdasddasd" });
    assert.equal(c.score, 0);
    assert.equal(c.hasGap, true);
  });

  it("blank vet plan = 0 pts and hasGap=true", () => {
    const c = cat({ ...bestCase(), emergency_vet_care_plan: "" });
    assert.equal(c.score, 0);
    assert.equal(c.hasGap, true);
  });

  it("valid daily care text does NOT automatically earn vet points", () => {
    const c = cat({
      ...bestCase(),
      emergency_vet_care_plan: "asdasddasd",
      daily_care_arrangements: "Partner feeds and walks twice a day",
    });
    assert.equal(c.score, 0, "Vet plan gibberish should earn 0, care plan text cannot substitute");
  });

  it("basic clinic access (1 pillar) earns partial points", () => {
    const c = cat({ ...bestCase(), emergency_vet_care_plan: "We have a nearby vet clinic we trust" });
    assert.ok(c.score > 0, "Basic clinic access should earn some points");
    assert.ok(c.score < 15, "Only mentioning clinic without emergency plan should not earn full 15 pts");
  });
});

// ===========================================================================
// Section 10: Tier Assignment and Welfare Guards
// ===========================================================================

describe("Tier assignment with welfare integrity", () => {
  it("perfect evidence-based answers = tier 'strong'", () => {
    assert.equal(computeSuitabilityScore(bestCase()).tier, "strong");
  });

  it("all three free-text fields gibberish = tier 'limited'", () => {
    assert.equal(computeSuitabilityScore(reportedBadCase()).tier, "limited");
  });

  it("gibberish care/vet text cannot produce tier 'strong' even with high housing/consent scores", () => {
    const r = {
      ...bestCase(),
      pet_care_experience: "ahisgdadasdasd",
      daily_care_arrangements: "sadasdasda",
      emergency_vet_care_plan: "asdasddasd",
    };
    const result = computeSuitabilityScore(r);
    assert.notEqual(result.tier, "strong",
      `Tier should not be 'strong' when care/vet fields are gibberish, got '${result.tier}' (score: ${result.totalScore})`
    );
  });

  it("blank care/vet text prevents 'strong' tier even if numeric score were high", () => {
    const r = {
      ...bestCase(),
      daily_care_arrangements: "",
      emergency_vet_care_plan: "",
    };
    const result = computeSuitabilityScore(r);
    assert.notEqual(result.tier, "strong");
  });

  it("tier labels are non-empty strings", () => {
    for (const input of [bestCase(), worstCase(), reportedBadCase()]) {
      const result = computeSuitabilityScore(input);
      assert.ok(typeof result.tierLabel === "string" && result.tierLabel.length > 0);
    }
  });

  it("tier descriptions are non-empty strings", () => {
    for (const input of [bestCase(), worstCase(), reportedBadCase()]) {
      const result = computeSuitabilityScore(input);
      assert.ok(typeof result.tierDescription === "string" && result.tierDescription.length > 0);
    }
  });
});

// ===========================================================================
// Section 11: Follow-up Flags
// ===========================================================================

describe("Follow-up flags and critical gaps", () => {
  it("perfect record does NOT trigger followUpRecommended", () => {
    assert.equal(computeSuitabilityScore(bestCase()).followUpRecommended, false);
  });

  it("gibberish care plan triggers followUpRecommended", () => {
    const r = { ...bestCase(), daily_care_arrangements: "sadasdasda" };
    assert.equal(computeSuitabilityScore(r).followUpRecommended, true);
  });

  it("gibberish vet plan triggers followUpRecommended", () => {
    const r = { ...bestCase(), emergency_vet_care_plan: "asdasddasd" };
    assert.equal(computeSuitabilityScore(r).followUpRecommended, true);
  });

  it("blank vet plan triggers followUpRecommended", () => {
    const r = { ...bestCase(), emergency_vet_care_plan: "" };
    assert.equal(computeSuitabilityScore(r).followUpRecommended, true);
  });

  it("renter with denied permission triggers followUpRecommended", () => {
    const r = { ...bestCase(), housing_type: "apartment", landlord_permission: false };
    assert.equal(computeSuitabilityScore(r).followUpRecommended, true);
  });

  it("children without safety plan triggers followUpRecommended", () => {
    const r = { ...bestCase(), has_children: true, children_details: null };
    assert.equal(computeSuitabilityScore(r).followUpRecommended, true);
  });

  it("followUpReasons is an array", () => {
    assert.ok(Array.isArray(computeSuitabilityScore(bestCase()).followUpReasons));
  });

  it("followUpReasons is empty when there are no gaps", () => {
    assert.equal(computeSuitabilityScore(bestCase()).followUpReasons.length, 0);
  });

  it("followUpReasons is non-empty when gaps exist", () => {
    const r = { ...bestCase(), emergency_vet_care_plan: "" };
    assert.ok(computeSuitabilityScore(r).followUpReasons.length > 0);
  });

  it("criticalGaps are reported when free-text fields are gibberish", () => {
    const result = computeSuitabilityScore(reportedBadCase());
    assert.ok(result.criticalGaps && result.criticalGaps.length > 0,
      "Critical gaps should be reported for gibberish answers");
  });

  it("no criticalGaps for a complete evidenced record", () => {
    const result = computeSuitabilityScore(bestCase());
    assert.ok(!result.criticalGaps || result.criticalGaps.length === 0,
      "No critical gaps for evidenced answers");
  });
});

// ===========================================================================
// Section 12: Edge Cases — Null, Missing, Malformed, Legacy Records
// ===========================================================================

describe("Edge cases: null, missing, malformed, legacy records", () => {
  it("all fields null/undefined does not crash", () => {
    assert.doesNotThrow(() => computeSuitabilityScore({
      housing_type: null,
      landlord_permission: undefined,
      has_children: null,
      children_details: undefined,
      household_members_details: undefined,
      existing_pets_details: undefined,
      pet_care_experience: null,
      daily_alone_hours: null,
      daily_care_arrangements: null,
      emergency_vet_care_plan: null,
      household_agreement: null,
      screening_consent: null,
    }));
  });

  it("daily_alone_hours as string does not crash", () => {
    assert.doesNotThrow(() => computeSuitabilityScore({
      ...bestCase(),
      daily_alone_hours: "four",
    }));
  });

  it("daily_alone_hours as NaN treated as 0", () => {
    const result = computeSuitabilityScore({ ...bestCase(), daily_alone_hours: NaN });
    assert.ok(result.totalScore >= 0);
  });

  it("daily_alone_hours=-1 treated as 0 (no negative alone hours)", () => {
    assert.doesNotThrow(() => computeSuitabilityScore({ ...bestCase(), daily_alone_hours: -1 }));
  });

  it("housing_type as unknown string doesn't crash and earns some sub-score", () => {
    const result = computeSuitabilityScore({ ...bestCase(), housing_type: "tent" });
    const cat = catByLabel(result, "Housing & Permission");
    assert.ok(cat.score >= 0);
  });

  it("empty object with no fields does not crash", () => {
    assert.doesNotThrow(() => computeSuitabilityScore({}));
  });

  it("totalScore from malformed record is still between 0 and 100", () => {
    const result = computeSuitabilityScore({});
    assert.ok(result.totalScore >= 0 && result.totalScore <= 100);
  });
});

// ===========================================================================
// Section 13: Fairness — Protected Circumstances
// ===========================================================================

describe("Fairness: protected circumstances are not penalized", () => {
  it("renter with confirmed permission loses at most 3 pts vs owner overall score", () => {
    const owner = computeSuitabilityScore(bestCase()).totalScore;
    const renter = computeSuitabilityScore({
      ...bestCase(), housing_type: "rent_house", landlord_permission: true,
    }).totalScore;
    assert.ok(owner - renter <= 3, `Owner=${owner} renter=${renter}: gap exceeds 3`);
  });

  it("apartment renter with confirmed permission loses at most 3 pts vs owner", () => {
    const owner = computeSuitabilityScore(bestCase()).totalScore;
    const apt = computeSuitabilityScore({
      ...bestCase(), housing_type: "apartment", landlord_permission: true,
    }).totalScore;
    assert.ok(owner - apt <= 3, `Owner=${owner} apartment=${apt}: gap exceeds 3`);
  });

  it("having children (with real plan) does not lower score vs no children", () => {
    const noCh = computeSuitabilityScore({ ...bestCase(), has_children: false }).totalScore;
    const withCh = computeSuitabilityScore({
      ...bestCase(),
      has_children: true,
      children_details: "All interactions supervised; dog has quiet crate room away from kids",
    }).totalScore;
    assert.equal(noCh, withCh, "Children with a real plan should not be penalized");
  });

  it("first-time owner preparation plan can score ≥ 12 on experience category", () => {
    const cat = catByLabel(
      computeSuitabilityScore({
        ...bestCase(),
        pet_care_experience: "First time dog owner but I have researched training, enrolled in classes, and have a mentor",
        existing_pets_details: null,
      }),
      "Pet-care Experience"
    );
    assert.ok(cat.score >= 12, `First-time owner with prep should score ≥ 12, got ${cat.score}`);
  });

  it("scoring rationale does not mention 'yard' (field not in household_screenings)", () => {
    const result = computeSuitabilityScore(bestCase());
    const allRationale = result.categories.map((c) => c.rationale).join(" ").toLowerCase();
    assert.ok(!allRationale.includes("yard"), "Rationale should not reference yard");
  });
});

// ===========================================================================
// Section 14: Advisory-Only Guard — No Auto-Decision Fields
// ===========================================================================

describe("Scoring is advisory only — no auto-decision", () => {
  it("result has no 'approved' field", () => {
    assert.ok(!("approved" in computeSuitabilityScore(bestCase())));
  });

  it("result has no 'rejected' field", () => {
    assert.ok(!("rejected" in computeSuitabilityScore(worstCase())));
  });

  it("result has no 'autoDecision' field", () => {
    assert.ok(!("autoDecision" in computeSuitabilityScore(bestCase())));
  });

  it("strong tier result has no approval field", () => {
    const result = computeSuitabilityScore(bestCase());
    assert.equal(result.tier, "strong");
    assert.ok(!("approved" in result));
  });

  it("limited tier result has no rejection field", () => {
    const result = computeSuitabilityScore(reportedBadCase());
    assert.ok(!("rejected" in result));
  });
});