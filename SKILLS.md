# PAWCONNECT — ENGINEERING RULEBOOK & SKILLS STANDARD

> **Document Status**: Permanent Living Specification & System Architecture Rulebook  
> **Target Audience**: Core Engineers, Full-Stack Developers, Code Reviewers, and AI Coding Agents (Gemini / Antigravity)  
> **Enforcement**: Mandatory for all feature implementation, bug fixes, refactoring, and code reviews.

---

## 1. PROJECT OVERVIEW

### 1.1 Purpose
**PawConnect** is a modern, web-based pet adoption and rehoming platform engineered to bridge the gap between pet seekers, pet owners needing to responsibly rehome their dogs, and administrative staff who verify submissions and process adoptions.

The system emphasizes trust, security, simplicity, and efficiency, providing a seamless and transparent lifecycle for every dog listed on the platform.

### 1.2 System Roles & Permissions
PawConnect enforces a strict two-role authorization model:

```text
┌────────────────────────────────────────────────────────┐
│                        ROLES                           │
├──────────────────────────┬─────────────────────────────┤
│          user            │            admin            │
└──────────────────────────┴─────────────────────────────┘
```

- **`user`**:
  - Browse verified available dogs with advanced search and filtering.
  - View comprehensive dog profiles (temperament, medical history, media, location).
  - Submit adoption applications for available dogs.
  - Submit their own dogs for rehoming (entering details, medical records, and uploading pictures).
  - Monitor their adoption application statuses and review stages.
  - Monitor their submitted rehoming listings (approval status, adoption progression).
  - Receive automated notifications regarding status changes and review outcomes.
  - Manage their own profile and personal details.
  - *Note*: There are **NO** separate "adopter" and "owner" roles. Every authenticated account is a `user` with both capabilities.

- **`admin`**:
  - Full system oversight and audit capability.
  - Manage user accounts, role flags, and system access.
  - Review submitted rehoming requests: inspect dog profiles, verify images, and approve or reject submissions with review notes.
  - Manage adoption applications: review prospective adopters, evaluate questionnaire responses, advance statuses (`under_review`, `approved`, `rejected`), and complete adoptions.
  - Manage inventory of dogs across all statuses (`pending`, `available`, `reserved`, `adopted`, `rejected`, `archived`).
  - Monitor platform activity, audit trails, and system-wide metrics.

### 1.3 Core Workflows
1. **Rehoming Submission Workflow**:
   `user` fills multi-step validated submission form → images uploaded to Supabase Storage → dog created in `pending` status → `admin` reviews listing → `admin` approves (status → `available`) or rejects with reason (status → `rejected`) → notification dispatched to `user`.
2. **Adoption Application Workflow**:
   `user` selects `available` dog → completes adoption questionnaire form → application created in `pending` status → `admin` moves to `under_review` → `admin` approves or rejects application → on approval/match, dog status updates to `reserved` → upon finalized handoff, `admin` marks application `completed` and dog `adopted` → notification dispatched to applicant.
3. **Notification Lifecycle**:
   Triggered on state changes in applications or rehoming submissions → recorded in `notifications` table → delivered via UI bell/feed and Supabase Realtime subscription.

### 1.4 Approved Technology Stack
- **Framework**: Next.js (App Router, Server Components, Route Handlers, Server Actions)
- **Library**: React, TypeScript (strict mode enabled)
- **Styling**: Tailwind CSS
- **Design System & Components**: shadcn/ui (100% compliance)
- **Icons**: Lucide React
- **Animations**: Framer Motion (subtle, intentional micro-interactions only)
- **Forms & Validation**: React Hook Form, Zod
- **Notifications & Toasts**: Sonner
- **Authentication**: Clerk (official Next.js App Router SDK)
- **Backend & Database**: Supabase (PostgreSQL, Row Level Security, Supabase Storage, Supabase Realtime)
- **Version Control**: Git & GitHub

---

## 2. SENIOR DEVELOPER MINDSET

Every developer and AI coding agent working on PawConnect must operate under the following core engineering principles:

1. **Inspect Before Modifying**: Never guess file structure, existing functions, or database schemas. Inspect current code and context first.
2. **Understand Architecture Before Coding**: Trace user flows from client UI down to database constraints before typing code.
3. **Identify Root Causes**: Do not apply superficial patches or workaround hacks. If a component fails or a query rejects, diagnose the underlying schema, type, or permission mismatch.
4. **Avoid Random Fixes & Unnecessary Rewrites**: Preserve working code. Make focused, surgical improvements with clear rationale.
5. **Security Before Exposure**: Every new route, Server Action, and query must default to authenticated and role-checked access before exposing data.
6. **Data Ownership First**: Verify the identity of the requester (`auth.userId`) against record ownership (`user_id`) before every database read, update, or deletion.
7. **Mobile-First Layout**: Design and inspect mobile layouts first. Responsive design is not an afterthought.
8. **No Mock Data Rule**: The application must interact with real Supabase database tables and real Clerk sessions. Never use in-memory arrays or mocked JSON responses to fake production functionality.

---

## 3. UI/UX DESIGN STANDARDS

### 3.1 Design Philosophy & Aesthetic
The visual identity of PawConnect is:
- **Clean, Modern, Trustworthy, Warm, Professional, Simple, Responsive**.
- It inspires confidence in adopters and pet owners without feeling clinical or sterile.

### 3.2 Visual & Stylistic Rules
- **Typography**: Clean, readable sans-serif font family (Inter / Geist / Roboto). Strict hierarchy:
  - `h1`: 2rem to 2.5rem (32px–40px), bold, tight tracking.
  - `h2`: 1.5rem to 1.875rem (24px–30px), semibold.
  - `h3`: 1.25rem to 1.5rem (20px–24px), medium/semibold.
  - `body`: 1rem (16px), regular, 1.5 line height for high legibility.
  - `caption / small`: 0.875rem (14px) or 0.75rem (12px), muted foreground.
- **Color Palette**: Warm, balanced, accessible palette adhering to WCAG 2.1 AA contrast ratios:
  - Primary: Warm amber / honey / terracotta tones balanced with deep slate / neutral darks.
  - Neutral Backgrounds: Crisp clean whites and muted grays (`bg-background`, `bg-muted/50`).
  - Status Indicators:
    - Success / Available / Completed: Emerald / Forest Green.
    - Warning / Pending / Under Review: Warm Amber / Ochre.
    - Destructive / Rejected / Cancelled: Rose / Crimson.
    - Info / Reserved: Slate / Indigo.
- **Spacing**: 4px / 8px grid system (`gap-2`, `gap-4`, `gap-6`, `gap-8`, `p-4`, `p-6`). Maintain breathing room around actionable elements.
- **Visual Clutter Prohibitions**:
  - NO excessive or disorienting animations.
  - NO heavy, unreadable gradients.
  - NO childish or cartoonish clip-art aesthetics.
  - NO gratuitous glassmorphism that obscures text readability.
  - NO oversized decorative elements that push functional content below the fold.

### 3.3 State Representation
Every interactive view or data grid must explicitly handle four distinct states:
1. **Loading State**: Clean Skeleton components matching the exact layout of the target data card/table. No sudden layout shifts (CLS = 0).
2. **Empty State**: Friendly, clear messaging with an illustrative icon, contextual explanation, and a primary call-to-action (e.g., "No applications found. Browse available dogs to adopt!").
3. **Error State**: Informative, user-friendly alert with troubleshooting guidance or a retry button. Never expose raw stack traces.
4. **Success State**: Immediate toast feedback via Sonner and clear visual badges/transitions.

### 3.4 Interactive Elements & Feedback
- **Forms**: React Hook Form + Zod. Real-time inline field validation, accessible error text beneath inputs, and disabled submit buttons during pending mutations.
- **Confirmation Dialogs**: Destructive actions (e.g., rejecting an application, cancelling a submission, archiving a dog) MUST require an explicit `AlertDialog` with clear consequences.
- **Navigation**: Clean header with role-aware navigation links, active route indicators, user profile dropdown, and a responsive drawer/sheet for mobile viewports.

---

## 4. SHADCN/UI MANDATE

### 4.1 100% shadcn/ui Requirement
PawConnect is built strictly on **shadcn/ui** and **Tailwind CSS**.
- **PROHIBITED LIBRARIES**: Do NOT install or import Material UI (MUI), Ant Design, Bootstrap, Chakra UI, DaisyUI, Mantine, or proprietary pre-built dashboard templates.
- **Component Source**: If shadcn/ui provides the component, it must be used. Custom components are only permitted when shadcn/ui does not offer an equivalent primitive.

### 4.2 Required Preset Initialization Command
When initializing shadcn in the Next.js project, the following exact preset MUST be executed:

```bash
npx shadcn@latest init --preset b7Br9WuFE --template next
```

*Do not replace this preset, change flags, or choose alternative presets.*

### 4.3 Standard Component Registry
Expected shadcn/ui components in `components/ui/`:
- `Accordion`, `Alert`, `Alert Dialog`, `Avatar`, `Badge`, `Breadcrumb`, `Button`, `Calendar`, `Card`, `Checkbox`, `Command`, `Dialog`, `Dropdown Menu`, `Drawer`, `Form`, `Input`, `Label`, `Pagination`, `Popover`, `Progress`, `Radio Group`, `Select`, `Separator`, `Sheet`, `Skeleton`, `Sonner`, `Switch`, `Table`, `Tabs`, `Textarea`, `Tooltip`.

---

## 5. FRONTEND ENGINEERING STANDARDS

### 5.1 Next.js App Router Architecture
- **Route Organization**:
  - `app/(marketing)/`: Public marketing, landing, about, FAQ.
  - `app/(auth)/`: Clerk sign-in and sign-up catch-all routes (`[[...sign-in]]`, `[[...sign-up]]`).
  - `app/(app)/dogs/`: Dog browsing, search, and detailed dog profiles.
  - `app/(app)/rehome/`: User dog rehoming submission wizard.
  - `app/(app)/my-applications/`: User application tracker.
  - `app/(app)/my-dogs/`: User rehomed dog tracker.
  - `app/(admin)/admin/`: Admin console (dashboard, dog approvals, application review, user management).
  - `app/api/`: Webhooks (Clerk webhook sync) and secure route handlers.
- **Server Components by Default**: All page and layout components are React Server Components (`RSC`) unless client-side interactivity is strictly required.
- **Client Components (`"use client"`)**: Confined strictly to leaves of the component tree:
  - Form wrappers (`react-hook-form`).
  - Interactive filters, modals, sheets, and interactive dropdowns.
  - Realtime notification listeners.
- **Clean Imports & Path Aliases**: Use `@/components/...`, `@/lib/...`, `@/types/...`, `@/hooks/...`. Never use deep relative paths (`../../..`).
- **Strict Typing**:
  - No `any`. Explicitly type all component props, action returns, and database payloads.
  - Share inferred Zod schema types across form validations and Server Actions.

---

## 6. BACKEND & SUPABASE ENGINEERING STANDARDS

### 6.1 Server-Side Architecture
- Next.js Server Actions and Route Handlers represent the backend execution layer.
- All database operations are executed through the Supabase client using authenticated sessions or privileged server clients where appropriate.
- **No Mock APIs**: Never mock database queries with `setTimeout`, hardcoded objects, or client-side mock arrays. All queries execute against PostgreSQL via Supabase.

### 6.2 Clerk + Supabase Integration
- Clerk is the single source of truth for **identity**.
- Supabase is the single source of truth for **application data, relational storage, and files**.
- Use the modern, supported Clerk third-party authentication integration with Supabase:
  - Clerk issues JWT tokens configured with the Supabase JWT template / native integration.
  - The Supabase client in Server Actions / Route Handlers receives the authenticated Clerk JWT, enabling Supabase PostgreSQL to evaluate `auth.jwt()` and enforce Row Level Security natively.
- A Clerk webhook listener (`/api/webhooks/clerk`) securely synchronizes user creations and profile updates into the public `profiles` table.

---

## 7. DATABASE ARCHITECTURE & SCHEMA SPECIFICATION

### 7.1 Relational Schema Diagram
```text
┌─────────────────┐       1:N       ┌────────────────────────┐
│    profiles     │────────────────<│          dogs          │
│ (clerk_user_id) │                 │  (owner_id, status...) │
└────────┬────────┘                 └───────────┬────────────┘
         │                                      │
         │ 1:N                                  │ 1:N
         │                                      ▼
         │                          ┌────────────────────────┐
         │                          │       dog_images       │
         │                          │   (dog_id, url, order) │
         │                          └────────────────────────┘
         │                                      │
         │ 1:N                                  │ 1:N
         ▼                                      ▼
┌────────────────────────┐          ┌────────────────────────┐
│     notifications      │          │ adoption_applications  │
│  (user_id, message...) │          │ (dog_id, applicant_id) │
└────────────────────────┘          └────────────────────────┘
```

### 7.2 Core Tables Definition

#### 1. `profiles`
- `id` (UUID, Primary Key, default `gen_random_uuid()`)
- `clerk_id` (TEXT, Unique, Not Null, indexed) — Foreign link to Clerk User ID.
- `email` (TEXT, Not Null)
- `first_name` (TEXT)
- `last_name` (TEXT)
- `phone` (TEXT)
- `role` (TEXT, Not Null, default `'user'`, check `role IN ('user', 'admin')`)
- `avatar_url` (TEXT)
- `created_at` (TIMESTAMPTZ, default `now()`)
- `updated_at` (TIMESTAMPTZ, default `now()`)

#### 2. `dogs`
- `id` (UUID, Primary Key, default `gen_random_uuid()`)
- `owner_id` (TEXT, Not Null, references `profiles(clerk_id)` on delete cascade)
- `name` (TEXT, Not Null)
- `breed` (TEXT, Not Null)
- `age_years` (INTEGER, Not Null, check `age_years >= 0`)
- `age_months` (INTEGER, default 0, check `age_months >= 0 AND age_months < 12`)
- `gender` (TEXT, Not Null, check `gender IN ('male', 'female')`)
- `size` (TEXT, Not Null, check `size IN ('small', 'medium', 'large', 'giant')`)
- `color` (TEXT)
- `description` (TEXT, Not Null)
- `medical_history` (TEXT)
- `vaccinated` (BOOLEAN, default false)
- `spayed_neutered` (BOOLEAN, default false)
- `special_needs` (TEXT)
- `location` (TEXT, Not Null)
- `status` (TEXT, Not Null, default `'pending'`, check `status IN ('pending', 'available', 'reserved', 'adopted', 'rejected', 'archived')`)
- `rejection_reason` (TEXT)
- `created_at` (TIMESTAMPTZ, default `now()`)
- `updated_at` (TIMESTAMPTZ, default `now()`)

#### 3. `dog_images`
- `id` (UUID, Primary Key, default `gen_random_uuid()`)
- `dog_id` (UUID, Not Null, references `dogs(id)` on delete cascade)
- `storage_path` (TEXT, Not Null)
- `public_url` (TEXT, Not Null)
- `is_primary` (BOOLEAN, default false)
- `display_order` (INTEGER, default 0)
- `created_at` (TIMESTAMPTZ, default `now()`)

#### 4. `adoption_applications`
- `id` (UUID, Primary Key, default `gen_random_uuid()`)
- `dog_id` (UUID, Not Null, references `dogs(id)` on delete cascade)
- `applicant_id` (TEXT, Not Null, references `profiles(clerk_id)` on delete cascade)
- `housing_type` (TEXT, Not Null, check `housing_type IN ('own_house', 'rent_house', 'apartment', 'condo', 'other')`)
- `has_yard` (BOOLEAN, default false)
- `has_other_pets` (BOOLEAN, default false)
- `other_pets_details` (TEXT)
- `household_members_count` (INTEGER, Not Null, check `household_members_count > 0`)
- `experience_level` (TEXT, Not Null, check `experience_level IN ('first_time', 'experienced', 'expert')`)
- `reason_for_adopting` (TEXT, Not Null)
- `status` (TEXT, Not Null, default `'pending'`, check `status IN ('pending', 'under_review', 'approved', 'rejected', 'completed', 'cancelled')`)
- `admin_notes` (TEXT)
- `rejection_reason` (TEXT)
- `created_at` (TIMESTAMPTZ, default `now()`)
- `updated_at` (TIMESTAMPTZ, default `now()`)

#### 5. `notifications`
- `id` (UUID, Primary Key, default `gen_random_uuid()`)
- `user_id` (TEXT, Not Null, references `profiles(clerk_id)` on delete cascade)
- `title` (TEXT, Not Null)
- `message` (TEXT, Not Null)
- `type` (TEXT, Not Null, check `type IN ('application_status', 'rehome_status', 'system')`)
- `reference_id` (UUID) — Polymorphic reference to `dog_id` or `application_id`.
- `is_read` (BOOLEAN, default false)
- `created_at` (TIMESTAMPTZ, default `now()`)

---

## 8. STATUS TRANSITIONS & STATE MACHINE RULES

State transitions must be enforced strictly via database constraints and server-side checks. Illegal transitions must throw explicit validation exceptions.

### 8.1 Dog Status State Machine
```text
                  ┌──────────────┐
                  │   pending    │
                  └──────┬───────┘
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
      ┌──────────────┐        ┌──────────────┐
      │  available   │        │   rejected   │
      └──────┬───────┘        └──────────────┘
             │
             ▼
      ┌──────────────┐
      │   reserved   │
      └──────┬───────┘
             │
             ▼
      ┌──────────────┐
      │   adopted    │
      └──────┬───────┘
             │
             ▼
      ┌──────────────┐
      │   archived   │
      └──────────────┘
```

- **Valid Transitions**:
  - `pending` → `available` (Admin approval)
  - `pending` → `rejected` (Admin rejection with required reason)
  - `available` → `reserved` (Application approved)
  - `available` → `archived` (Owner or Admin withdrawal)
  - `reserved` → `adopted` (Adoption finalized)
  - `reserved` → `available` (Adoption cancelled or applicant failed final check)
  - `adopted` → `archived` (Historical retention)
- **Forbidden Transitions**:
  - Direct jump from `pending` to `adopted`.
  - Modification of dog details once `adopted` or `archived`.
  - Re-opening a `rejected` listing without resubmission.

### 8.2 Adoption Application State Machine
```text
                  ┌──────────────┐
                  │   pending    │
                  └──────┬───────┘
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
      ┌──────────────┐        ┌──────────────┐
      │ under_review │        │  cancelled   │ (Applicant withdrawn)
      └──────┬───────┘        └──────────────┘
             │
             ┌───────────┴───────────┐
             ▼                       ▼
      ┌──────────────┐        ┌──────────────┐
      │   approved   │        │   rejected   │
      └──────┬───────┘        └──────────────┘
             │
             ▼
      ┌──────────────┐
      │  completed   │
      └──────────────┘
```

- **Valid Transitions**:
  - `pending` → `under_review` (Admin starts evaluating applicant)
  - `pending` → `cancelled` (Applicant self-withdrawal)
  - `under_review` → `approved` (Admin grants adoption rights)
  - `under_review` → `rejected` (Admin rejects with reason)
  - `under_review` → `cancelled` (Applicant self-withdrawal)
  - `approved` → `completed` (Physical pet handoff verified)
  - `approved` → `cancelled` (Applicant withdraws before handoff)
- **Rules**:
  - A user cannot submit more than one active application for the same dog.
  - A dog marked `reserved` prevents other users from submitting new applications.

---

## 9. ROW LEVEL SECURITY (RLS) POLICIES

**RLS is strictly mandatory for all tables.** Disabling RLS in development or production is an architectural violation.

### 9.1 Helper Functions
In PostgreSQL, role evaluation relies on a security definer helper:
```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE clerk_id = auth.jwt() ->> 'sub'
      AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

### 9.2 Table Policy Rules

#### `profiles`
- `SELECT`: Public can read basic profile info (first name, avatar). Full profile readable by the owner (`clerk_id = auth.jwt()->>'sub'`) or `is_admin()`.
- `INSERT`: Clerk webhook listener or service role.
- `UPDATE`: Owner can update own contact details; only `is_admin()` can update the `role` column.
- `DELETE`: Prohibited except via administrative service role.

#### `dogs`
- `SELECT`:
  - Anyone (public/unauthenticated) can view dogs where `status = 'available'`.
  - Authenticated users can view dogs they submitted (`owner_id = auth.jwt()->>'sub'`).
  - `is_admin()` can view all dogs regardless of status.
- `INSERT`:
  - Authenticated users can insert dogs where `owner_id = auth.jwt()->>'sub'` and initial `status = 'pending'`.
- `UPDATE`:
  - Dog owner can update details ONLY while `status = 'pending'`.
  - `is_admin()` can update any dog and transition statuses (`status` column).
- `DELETE`:
  - Dog owner can delete ONLY while `status = 'pending'`.
  - `is_admin()` can delete/archive.

#### `dog_images`
- `SELECT`: Accessible if the parent dog record is readable under dog RLS.
- `INSERT`: Allowed if requester is owner of the parent dog (while pending) or `is_admin()`.
- `UPDATE / DELETE`: Allowed if requester is owner of the parent dog (while pending) or `is_admin()`.

#### `adoption_applications`
- `SELECT`:
  - Applicant can view their own applications (`applicant_id = auth.jwt()->>'sub'`).
  - Dog owner can view applications submitted for their dog.
  - `is_admin()` can view all applications.
- `INSERT`:
  - Authenticated users can submit applications for dogs with `status = 'available'`, where `applicant_id = auth.jwt()->>'sub'` and initial `status = 'pending'`.
  - Users cannot apply to adopt their own dogs (`owner_id != applicant_id`).
- `UPDATE`:
  - Applicant can update status to `'cancelled'` only.
  - `is_admin()` can update statuses (`under_review`, `approved`, `rejected`, `completed`) and attach `admin_notes` / `rejection_reason`.
- `DELETE`: Forbidden. Historic records remain for audit trails.

#### `notifications`
- `SELECT`: Owner only (`user_id = auth.jwt()->>'sub'`).
- `INSERT`: Service role or triggered by server-side actions.
- `UPDATE`: Owner can mark `is_read = true`.
- `DELETE`: Owner can dismiss their own notifications.

---

## 10. SECURITY & AUTHORIZATION ENGINEERING

### 10.1 Access Control Hierarchy
1. **Route Level**: Next.js Middleware verifies Clerk session. Admin route group `app/(admin)/admin/**` verifies the user possesses the `admin` role before rendering.
2. **Server Action Level**: Every Server Action re-validates:
   - User authentication state.
   - User role permissions (`role === 'admin'`).
   - Resource ownership (`record.owner_id === userId`).
3. **Database Level**: PostgreSQL Row Level Security rejects unauthorized queries even if route or action layer is bypassed.

### 10.2 Defense Against Specific Attacks
- **Privilege Escalation**: Users cannot self-assign `role: 'admin'`. Profile updates validate against schemas that omit the `role` field.
- **IDOR (Insecure Direct Object Reference)**: Every query filtering by `id` MUST simultaneously filter by `owner_id` or check `is_admin()`.
- **Self-Approval**: Dog owners cannot approve their own dog listings or adoption applications.
- **File Upload Security**:
  - Storage bucket: `dog-photos` (private upload, public CDN read for approved images).
  - Validation: Verify file MIME type (`image/jpeg`, `image/png`, `image/webp`), reject executables/SVGs.
  - File size cap: 5MB per image. Max 5 images per dog.
  - Storage path convention: `dogs/{dog_id}/{uuid}.{ext}`.

---

## 11. FEATURE IMPLEMENTATION WORKFLOW

Every feature implemented in PawConnect must progress sequentially through this strict pipeline:

```text
1. Requirement Analysis
   └─ Document functional scope and edge cases.
2. User Flow Definition
   └─ Outline step-by-step user and admin journey.
3. UI / Component Composition
   └─ Assemble shadcn/ui components with loading/empty/error states.
4. Database & Migration Check
   └─ Confirm table schemas, foreign keys, indexes, and constraints.
5. Authorization & RLS Enforcement
   └─ Verify role permissions and RLS policies.
6. Input Validation (Zod)
   └─ Define strict schemas with user-friendly error messages.
7. Server Logic & Data Mutation
   └─ Implement Server Actions with structured responses: `{ success, data, error }`.
8. Error Handling & Feedback
   └─ Connect Sonner toasts and inline form alerts.
9. Testing & Build Verification
   └─ Verify responsive viewports, test state transitions, run `npm run lint` and `npm run build`.
```

---

## 12. CODE QUALITY & REPOSITORY HYGIENE

### 12.1 Naming Conventions
- **Folders**: Lowercase with dashes (kebab-case) (e.g., `adoption-applications`, `dog-details`).
- **React Components**: PascalCase (e.g., `DogCard.tsx`, `ApplicationStatusBadge.tsx`).
- **Utilities & Hooks**: camelCase (e.g., `useDogFilter.ts`, `formatDate.ts`).
- **Database Tables & Columns**: snake_case (e.g., `adoption_applications`, `applicant_id`).
- **Types & Interfaces**: PascalCase prefixed with descriptive terms (e.g., `DogRecord`, `ApplicationWithDog`).

### 12.2 Clean Code Rules
- Zero Dead Code: Remove unused imports, variables, and components immediately.
- Zero `console.log` in production code: Use structured server-side logging where necessary.
- Reusable Utilities: Factor repetitive logic (date formatting, currency/weight conversions, status badge colors) into `@/lib/utils/`.
- No Unnecessary Dependencies: Always consult standard web APIs and existing packages before installing new npm modules.

---

## 13. PERFORMANCE & ACCESSIBILITY (A11Y)

### 13.1 Performance
- **Image Optimization**: Use Next.js `<Image />` for all dog assets with explicit aspect ratios, modern formats (`webp`, `avif`), and responsive `sizes` attributes.
- **Database Optimization**:
  - Add B-tree indexes to foreign keys and filtered columns: `dogs(status)`, `dogs(owner_id)`, `adoption_applications(dog_id, applicant_id)`.
  - Paginate dog browsing queries (cursor-based or limit/offset).
- **Bundle Optimization**: Keep client components lean. Avoid importing heavy client libraries into Server Components.

### 13.2 Accessibility (A11Y)
- **Semantic HTML**: Strict use of `<main>`, `<nav>`, `<header>`, `<footer>`, `<section>`, `<article>`.
- **Labels & Forms**: Every form input MUST have an associated `<Label>` connected via `htmlFor`.
- **Keyboard Navigation**: All modals, dialogs, drawers, and dropdowns must trap and restore focus smoothly using shadcn/ui primitives.
- **Color Independence**: Status changes must never be conveyed by color alone; always pair colors with text labels or icons.

---

## 14. TESTING & VERIFICATION PROTOCOL

Before any milestone is declared complete:
1. **Verification Checklist**:
   - [ ] Unauthenticated visitor can view available dogs.
   - [ ] Unauthenticated visitor is prompted to sign in when clicking "Adopt" or "Rehome".
   - [ ] Regular user can submit a dog for rehoming; dog appears in `pending` state.
   - [ ] Admin can view `pending` dogs and approve/reject them.
   - [ ] User can apply for an `available` dog; application appears in `pending` state.
   - [ ] Admin can advance application to `under_review`, `approved`, `rejected`, and `completed`.
   - [ ] Completed application marks dog as `adopted`.
   - [ ] Image upload rejects files > 5MB and unsupported formats.
   - [ ] RLS prevents standard users from reading or writing admin views and other users' private data.
2. **Build Verification**:
   ```bash
   npm run lint
   npm run build
   ```
   Both commands must exit cleanly with code `0`.

---

## 15. GITHUB & ENVIRONMENT SECURITY

- **`.gitignore` Enforcement**:
  - `.env`, `.env.local`, `.env.production` MUST never be committed.
  - Ignore `.next/`, `node_modules/`, and build artifacts.
- **Secrets Management**:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Public
  - `CLERK_SECRET_KEY`: Private (Server only)
  - `NEXT_PUBLIC_SUPABASE_URL`: Public
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public (Protected by RLS)
  - `SUPABASE_SERVICE_ROLE_KEY`: Strictly Private (Server actions/webhooks only)
- **Commit Style**: Use Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`).
