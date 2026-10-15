import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const migrationPath = path.resolve("supabase/migrations/20261015000001_instructor_features.sql");
const allMigrationsPath = path.resolve("supabase/pawconnect_all_migrations.sql");
const followupActionPath = path.resolve("app/actions/followup.ts");
const dogsActionPath = path.resolve("app/actions/dogs.ts");
const uploadActionPath = path.resolve("app/actions/upload.ts");
const adminActionPath = path.resolve("app/actions/admin.ts");

const migrationSql = fs.readFileSync(migrationPath, "utf8");
const allMigrationsSql = fs.readFileSync(allMigrationsPath, "utf8");
const followupActionSrc = fs.readFileSync(followupActionPath, "utf8");
const dogsActionSrc = fs.readFileSync(dogsActionPath, "utf8");
const uploadActionSrc = fs.readFileSync(uploadActionPath, "utf8");
const adminActionSrc = fs.readFileSync(adminActionPath, "utf8");

test("Security Audit: SQL Function Hardening and search_path protection", () => {
  const secDefinerMatches = [...migrationSql.matchAll(/CREATE OR REPLACE FUNCTION ([\w\.]+)\(\)[\s\S]*?SECURITY DEFINER[\s\S]*?SET search_path = public, pg_catalog;/g)];
  assert.ok(secDefinerMatches.length >= 4, "Expected at least 4 SECURITY DEFINER functions with explicit search_path");
  
  // Verify all function references are qualified
  assert.ok(migrationSql.includes("CREATE OR REPLACE FUNCTION public.is_admin()"));
  assert.ok(migrationSql.includes("CREATE OR REPLACE FUNCTION public.current_user_clerk_id()"));
  assert.ok(migrationSql.includes("SET search_path = public, pg_catalog;"));
});

test("Security Audit: is_admin prevents client JWT spoofing", () => {
  assert.ok(
    migrationSql.includes("(auth.role() = 'service_role' AND (auth.jwt() ->> 'iss') = 'supabase')"),
    "is_admin must require iss = 'supabase' when checking auth.role() = 'service_role'"
  );
});

test("Security Audit: Profile role protection & identity immutability trigger", () => {
  assert.ok(migrationSql.includes("protect_profile_role()"), "Trigger function protect_profile_role must exist");
  assert.ok(migrationSql.includes("RAISE EXCEPTION 'Non-admin users cannot assign or elevate administrative role.';"));
  assert.ok(migrationSql.includes("RAISE EXCEPTION 'Cannot modify identity fields on profile.';"));
  assert.ok(migrationSql.includes("RAISE EXCEPTION 'Only administrators can modify an administrator profile.';"));
  assert.ok(migrationSql.includes("trg_protect_profile_role"), "Trigger trg_protect_profile_role must be attached to profiles");
});

test("Security Audit: Storage policies use Clerk user ID instead of auth.uid()", () => {
  // Verify no policy code uses auth.uid()
  assert.ok(!migrationSql.includes("owner = auth.uid()"), "Migration must NOT use owner = auth.uid() in policy expressions");
  assert.ok(!migrationSql.includes("owner = auth.uid()::text"), "Migration must NOT use owner = auth.uid()::text in policy expressions");
  assert.ok(migrationSql.includes("public.current_user_clerk_id()"), "Storage policies must use public.current_user_clerk_id()");
  
  // dog-photos
  assert.ok(migrationSql.includes("CREATE POLICY \"Public read dog photos\""));
  assert.ok(migrationSql.includes("CREATE POLICY \"Authenticated users can upload dog photos\""));
  assert.ok(migrationSql.includes("CREATE POLICY \"Owners or admin can update dog photos\""));
  assert.ok(migrationSql.includes("CREATE POLICY \"Owners or admin can delete dog photos\""));
});

test("Security Audit: Video storage path ownership validation (App & Database)", () => {
  // Database trigger
  assert.ok(migrationSql.includes("protect_dog_video_path()"));
  assert.ok(migrationSql.includes("video_storage_path must reside within the owner''s authorized folder"));

  // Application actions
  assert.ok(dogsActionSrc.includes("!videoStoragePath.startsWith(`dogs/${userId}/`)"), "createDogAction must validate videoStoragePath ownership");
  assert.ok(dogsActionSrc.includes("!vPath.startsWith(`dogs/${userId}/`)"), "updateDogAction must validate videoStoragePath ownership");
});

test("Security Audit: Follow-up photo storage path ownership validation (App & Database)", () => {
  // Database trigger
  assert.ok(migrationSql.includes("photo_storage_path must belong to the adopter folder"));

  // Application action
  assert.ok(followupActionSrc.includes("!parsed.data.photo_storage_path.startsWith(`dogs/${userId}/`)"), "submitFollowUpReportAction must validate photo_storage_path ownership");
});

test("Security Audit: Follow-up report immutability and valid status transitions", () => {
  // Database trigger
  assert.ok(migrationSql.includes("Reviewed follow-up reports are finalized and cannot be modified."));
  assert.ok(migrationSql.includes("Submitted follow-up reports cannot be modified while pending staff review."));
  assert.ok(migrationSql.includes("OLD.status NOT IN ('upcoming', 'due', 'needs_follow_up')"));
  assert.ok(migrationSql.includes("NEW.status != 'submitted'"));

  // Application action
  assert.ok(followupActionSrc.includes("followup.status === FOLLOWUP_STATUSES.REVIEWED"));
  assert.ok(followupActionSrc.includes("followup.status === FOLLOWUP_STATUSES.SUBMITTED"));
  assert.ok(followupActionSrc.includes("followup.status !== FOLLOWUP_STATUSES.UPCOMING"));
  assert.ok(followupActionSrc.includes("followup.status !== FOLLOWUP_STATUSES.DUE"));
  assert.ok(followupActionSrc.includes("followup.status !== FOLLOWUP_STATUSES.NEEDS_FOLLOW_UP"));
});

test("Security Audit: Relational ownership triggers (Screenings and Follow-ups)", () => {
  assert.ok(migrationSql.includes("validate_household_screening_ownership()"));
  assert.ok(migrationSql.includes("Screening applicant_id must match the applicant on the adoption application."));
  assert.ok(migrationSql.includes("Screening dog_id must match the dog on the adoption application."));

  assert.ok(migrationSql.includes("validate_post_adoption_followup_ownership()"));
  assert.ok(migrationSql.includes("Follow-up adopter_id must match the applicant on the adoption application."));
  assert.ok(migrationSql.includes("Follow-up dog_id must match the dog on the adoption application."));
  assert.ok(migrationSql.includes("Follow-up schedules can only be established for approved or completed adoption applications."));
});

test("Security Audit: Admin role management self-demotion prevention", () => {
  assert.ok(adminActionSrc.includes("userId === targetClerkId && role !== USER_ROLES.ADMIN"));
  assert.ok(adminActionSrc.includes("You cannot revoke your own administrator privileges"));
});

test("Security Audit: Signed URL generation authorization checks", () => {
  // uploadDogVideoAction forces user ID folder in storagePath
  assert.ok(uploadActionSrc.includes("const storagePath = `dogs/${userId}/${cleanFileName}`;"));
  assert.ok(uploadActionSrc.includes("createSignedUploadUrl(storagePath)"));

  // dogs.ts checks access before creating signed playback URL
  assert.ok(dogsActionSrc.includes("canAccess = Boolean((userId && data.owner_id === userId) || isAdmin);"));
  assert.ok(dogsActionSrc.includes("createSignedUrl(data.video_storage_path, 7200)"));

  // admin.ts requires admin privilege before signing videos for staff review
  assert.ok(adminActionSrc.includes("Administrative privileges required"));
  assert.ok(adminActionSrc.includes("createSignedUrl(d.video_storage_path, 3600)"));
});

test("Security Audit: SQL synchronization check", () => {
  assert.ok(allMigrationsSql.includes("-- MIGRATION 6: INSTRUCTOR-REQUESTED FEATURES (HARDENED)"));
  assert.ok(allMigrationsSql.includes("validate_household_screening_ownership"));
  assert.ok(allMigrationsSql.includes("validate_post_adoption_followup_ownership"));
  assert.ok(allMigrationsSql.includes("protect_profile_role"));
  assert.ok(allMigrationsSql.includes("protect_dog_video_path"));
  assert.ok(allMigrationsSql.includes("current_setting('role', true) = 'service_role'"));
});

test("Security Audit: Schema Consistency & PostgREST Relationship Foreign Keys", () => {
  // Foreign keys matching PostgREST queries in admin.ts
  assert.ok(migrationSql.includes("household_screenings_applicant_id_fkey"));
  assert.ok(migrationSql.includes("household_screenings_reviewer_id_fkey"));
  assert.ok(migrationSql.includes("post_adoption_followups_adopter_id_fkey"));
  assert.ok(migrationSql.includes("post_adoption_followups_reviewer_id_fkey"));

  // Household screening columns
  const screeningCols = [
    "household_agreement",
    "housing_type",
    "landlord_permission",
    "has_children",
    "children_details",
    "household_members_details",
    "existing_pets_details",
    "pet_care_experience",
    "daily_alone_hours",
    "daily_care_arrangements",
    "emergency_vet_care_plan",
    "screening_consent",
  ];
  for (const col of screeningCols) {
    assert.ok(migrationSql.includes(col), `household_screenings must contain ${col}`);
  }

  // Follow-up columns
  const followupCols = [
    "month_number",
    "due_date",
    "general_health",
    "eating_behavior_adjustment",
    "veterinary_care",
    "living_environment",
    "problems_concerns",
    "photo_url",
    "photo_storage_path",
    "requires_additional_followup",
    "additional_followup_instructions",
  ];
  for (const col of followupCols) {
    assert.ok(migrationSql.includes(col), `post_adoption_followups must contain ${col}`);
  }
});

test("Security Audit: Screenings and Followups Triggers Enforce INSERT and UPDATE", () => {
  assert.ok(migrationSql.includes("BEFORE INSERT OR UPDATE ON public.household_screenings"));
  assert.ok(migrationSql.includes("BEFORE INSERT OR UPDATE ON public.post_adoption_followups"));
  assert.ok(migrationSql.includes("New screenings must start with status pending."));
  assert.ok(migrationSql.includes("Only administrators can create follow-up schedules."));
});

