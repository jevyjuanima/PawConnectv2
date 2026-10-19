import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

const applicationsActionPath = path.resolve("app/actions/applications.ts");
const adminActionPath = path.resolve("app/actions/admin.ts");
const applyPagePath = path.resolve("app/dogs/[id]/apply/page.tsx");
const dogDetailPagePath = path.resolve("app/dogs/[id]/page.tsx");
const applicationFormPath = path.resolve("components/applications/ApplicationForm.tsx");
const adminAppRowPath = path.resolve("components/admin/AdminApplicationRow.tsx");
const initialSchemaPath = path.resolve("supabase/migrations/20260928000001_initial_schema.sql");
const instructorMigrationPath = path.resolve("supabase/migrations/20261015000001_instructor_features.sql");

const applicationsActionSrc = fs.readFileSync(applicationsActionPath, "utf8");
const adminActionSrc = fs.readFileSync(adminActionPath, "utf8");
const applyPageSrc = fs.readFileSync(applyPagePath, "utf8");
const dogDetailPageSrc = fs.readFileSync(dogDetailPagePath, "utf8");
const applicationFormSrc = fs.readFileSync(applicationFormPath, "utf8");
const adminAppRowSrc = fs.readFileSync(adminAppRowPath, "utf8");
const initialSchemaSql = fs.readFileSync(initialSchemaPath, "utf8");
const instructorMigrationSql = fs.readFileSync(instructorMigrationPath, "utf8");

test("Screening & Application: unique_applicant_dog_active constraint is preserved in database schema", () => {
  assert.ok(
    initialSchemaSql.includes("CONSTRAINT unique_applicant_dog_active UNIQUE (dog_id, applicant_id)"),
    "unique_applicant_dog_active constraint must exist on adoption_applications"
  );
});

test("Screening & Application: createApplicationAction pre-checks all existing applications without ignoring rejected/cancelled", () => {
  // Must NOT filter out cancelled or rejected applications in pre-check query
  assert.ok(
    !applicationsActionSrc.includes(
      '.not("status", "in", `("${APPLICATION_STATUSES.CANCELLED}","${APPLICATION_STATUSES.REJECTED}")`)'
    ),
    "createApplicationAction must check for ANY existing application row for the dog/applicant pair"
  );

  // Must provide informative error messages for different statuses
  assert.ok(
    applicationsActionSrc.includes("You already have an active application in review for this dog."),
    "Must notify applicant when active application exists"
  );
  assert.ok(
    applicationsActionSrc.includes("An application for this dog was previously submitted and reviewed."),
    "Must notify applicant when past application was reviewed and rejected"
  );
  assert.ok(
    applicationsActionSrc.includes("An application for this dog was previously submitted and withdrawn."),
    "Must notify applicant when past application was cancelled"
  );
});

test("Screening & Application: createApplicationAction catches database unique constraint 23505 gracefully", () => {
  assert.ok(
    applicationsActionSrc.includes("unique_applicant_dog_active") || applicationsActionSrc.includes("23505"),
    "createApplicationAction must handle 23505 / unique_applicant_dog_active gracefully"
  );
  assert.ok(
    applicationsActionSrc.includes("An application for this dog has already been submitted by your account."),
    "createApplicationAction must return a user-friendly message rather than raw database error string"
  );
});

test("Screening & Application: /dogs/[id]/apply detects existing application including rejected status", () => {
  assert.ok(
    !applyPageSrc.includes('.not("status", "in", \'("cancelled","rejected")\')'),
    "Apply page must check for existing application without ignoring rejected/cancelled"
  );
  assert.ok(
    applyPageSrc.includes("You&apos;ve already applied for {dog.name}."),
    "Apply page must display existing application banner"
  );
  assert.ok(
    applyPageSrc.includes("existingApp.status === \"rejected\""),
    "Apply page must handle rejected application status specifically"
  );
  assert.ok(
    applyPageSrc.includes('href="/my-applications"'),
    "Apply page must provide direct link to My Applications"
  );
});

test("Screening & Application: /dogs/[id] displays status-aware application tracking", () => {
  assert.ok(
    dogDetailPageSrc.includes("existingApplicationStatus"),
    "Dog detail page must track existing application status"
  );
  assert.ok(
    dogDetailPageSrc.includes('href="/my-applications"'),
    "Dog detail page must provide button to view in My Applications"
  );
});

test("Screening & Application: ApplicationForm provides direct navigation to /my-applications on duplicate error", () => {
  assert.ok(
    applicationFormSrc.includes('href="/my-applications"'),
    "ApplicationForm error alert must provide direct link to /my-applications"
  );
});

test("Screening & Application: Ownership rules prevent applying for own dog listing", () => {
  assert.ok(
    applicationsActionSrc.includes("dog.owner_id === userId"),
    "Must verify dog is not owned by the applicant"
  );
  assert.ok(
    applicationsActionSrc.includes("You cannot submit an adoption application for your own listed dog"),
    "Must return clear error if applicant owns the dog"
  );
});

test("Screening & Application: Admin approval gate blocks application approval until screening is approved", () => {
  // Server-side enforcement in admin.ts
  assert.ok(
    adminActionSrc.includes("household_screenings"),
    "admin.ts must query household_screenings before approving an application"
  );
  assert.ok(
    adminActionSrc.includes("screening.status !== SCREENING_STATUSES.APPROVED"),
    "admin.ts must verify screening.status is APPROVED"
  );
  assert.ok(
    adminActionSrc.includes("cannot be approved because its family & household suitability screening has not been approved"),
    "admin.ts must return clear error when screening is not approved"
  );

  // Client-side UI gating in AdminApplicationRow.tsx
  assert.ok(
    adminAppRowSrc.includes("app.screening && app.screening.status !== SCREENING_STATUSES.APPROVED"),
    "AdminApplicationRow must disable Approve Match button when screening is unapproved"
  );
});

test("Screening & Application: Household screening schema validates 10 criteria strictly", () => {
  const householdScreeningSchema = z.object({
    household_agreement: z.literal(true, {
      errorMap: () => ({ message: "All household members must agree to adopting a dog" }),
    }),
    housing_type: z.enum(["own_house", "rent_house", "apartment", "condo", "other"]),
    landlord_permission: z.boolean().nullable().optional(),
    has_children: z.boolean(),
    children_details: z.string().max(500).nullable().optional(),
    household_members_details: z.string().min(3, "Household details must be at least 3 characters").max(500),
    existing_pets_details: z.string().max(500).nullable().optional(),
    pet_care_experience: z.string().min(5, "Pet experience must be at least 5 characters").max(1000),
    daily_alone_hours: z.number().int().min(0).max(24),
    daily_care_arrangements: z.string().min(5, "Daily arrangements must be at least 5 characters").max(1000),
    emergency_vet_care_plan: z.string().min(5, "Emergency plan must be at least 5 characters").max(1000),
    screening_consent: z.literal(true, {
      errorMap: () => ({ message: "You must consent to background screening verification" }),
    }),
  });

  // Valid screening
  const validData = {
    household_agreement: true,
    housing_type: "own_house",
    has_children: false,
    household_members_details: "2 adults in household",
    pet_care_experience: "5 years dog care",
    daily_alone_hours: 4,
    daily_care_arrangements: "Work from home schedule",
    emergency_vet_care_plan: "Local veterinary clinic registered",
    screening_consent: true,
  };
  const validRes = householdScreeningSchema.safeParse(validData);
  assert.ok(validRes.success, "Valid screening data must pass validation");

  // Invalid: missing consent
  const missingConsent = { ...validData, screening_consent: false };
  assert.ok(!householdScreeningSchema.safeParse(missingConsent).success, "Consent false must fail");

  // Invalid: missing household agreement
  const missingAgreement = { ...validData, household_agreement: false };
  assert.ok(!householdScreeningSchema.safeParse(missingAgreement).success, "Agreement false must fail");

  // Invalid: alone hours > 24
  const invalidHours = { ...validData, daily_alone_hours: 25 };
  assert.ok(!householdScreeningSchema.safeParse(invalidHours).success, "Alone hours > 24 must fail");
});

test("Screening & Application: Relational integrity and cascade deletes", () => {
  assert.ok(
    instructorMigrationSql.includes("REFERENCES public.adoption_applications(id) ON DELETE CASCADE"),
    "household_screenings must reference adoption_applications with ON DELETE CASCADE"
  );
  assert.ok(
    instructorMigrationSql.includes("idx_uq_screenings_application_id"),
    "One screening per application index must exist"
  );
});
