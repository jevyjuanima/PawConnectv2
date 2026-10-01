# PawConnect

PawConnect is a modern, full-stack pet adoption and responsible rehoming platform. It bridges the gap between pet seekers, pet owners needing to responsibly rehome their dogs, and shelter or platform administrators who review submissions, verify listings, and manage adoption workflows.

---

## How the System Works (Defense-Friendly Overview)

PawConnect coordinates four key layers into a single, cohesive workflow:

```
┌─────────────────────────────────────────────────────────────┐
│                       CLERK                                 │
│         Authentication & Identity Provider                  │
│   (Sign Up, Sign In, Session Tokens, User Metadata)         │
└──────────────────────────────┬──────────────────────────────┘
                               │ User Session & JWT
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      NEXT.JS 15                             │
│         Application, Frontend & Server Actions              │
│   (React 19, Server Components, Route Guards, UI State)     │
└──────────────────────────────┬──────────────────────────────┘
                               │ Authenticated Service Requests
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE                               │
│         Database, Storage & Row Level Security              │
│   (PostgreSQL DB, Storage Bucket `dog-photos`, RLS Engine)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     PAWCONNECT                              │
│       End-to-End Adoption & Rehoming Workflow               │
│ (Catalog, Applications, Rehoming, Moderation, Notifications)│
└─────────────────────────────────────────────────────────────┘
```

1. **Clerk (Authentication & Identity)**:
   - Manages user registration, secure login, password management, and OAuth sessions.
   - Issues verified user tokens and provides unique user IDs (`user_*`).
   - Automatically synchronizes user profile records into Supabase upon first authenticated interaction.

2. **Next.js 15 (Frontend & Server Architecture)**:
   - Built with the Next.js App Router, React 19, and TypeScript.
   - Provides server-side rendered (SSR) catalog pages for optimal speed and searchability.
   - Uses Server Actions (`app/actions/*`) for secure, server-side mutations, eliminating the need to expose sensitive database keys to the browser.
   - Middleware protects user and admin routes from unauthorized visitor access.

3. **Supabase (PostgreSQL Database & Cloud Storage)**:
   - Serves as the relational database storing users, dog listings, images, applications, and notifications.
   - Enforces PostgreSQL Row-Level Security (RLS) to safeguard user privacy and prevent unauthorized data tampering.
   - Hosts the `dog-photos` storage bucket for high-resolution dog photography with automated CDN delivery.

4. **PawConnect (The Business Logic Engine)**:
   - Unifies authentication, database state machines, and user workflows into a clean, human-centered adoption experience.

---

## System Roles & Permissions

PawConnect enforces a strict two-role authorization model:

| Capability | Guest / Visitor | Authenticated User | Platform Admin |
| :--- | :---: | :---: | :---: |
| Browse catalog & view dog profiles | ✅ | ✅ | ✅ |
| Filter dogs (breed, size, location) | ✅ | ✅ | ✅ |
| Submit adoption applications | ❌ (Redirects to Sign In) | ✅ | ✅ |
| Track own submitted applications | ❌ | ✅ | ✅ |
| Rehome a dog & upload photos | ❌ (Redirects to Sign In) | ✅ | ✅ |
| View own dog listings (`/my-dogs`) | ❌ | ✅ | ✅ |
| In-app notification feed | ❌ | ✅ | ✅ |
| Access Admin Dashboard (`/admin`) | ❌ (Redirects to Sign In) | ❌ (Forbidden) | ✅ |
| Approve/reject rehoming submissions | ❌ | ❌ | ✅ |
| Review & process adoption applications | ❌ | ❌ | ✅ |
| Finalize adoptions (`reserved` -> `adopted`)| ❌ | ❌ | ✅ |
| Manage users & system roles | ❌ | ❌ | ✅ |

---

## State Transitions & Lifecycles

### Dog Listing Lifecycle
```
[User Submits Dog]
       │
       ▼
   `pending`  ──(Admin Rejects)──► `rejected`
       │
  (Admin Approves)
       │
       ▼
  `available` ──(Application Accepted)──► `reserved` ──(Adoption Finalized)──► `adopted`
       │                                     │
       └─────────────────────────────────────┴──(Application Cancelled)──► `available`
```

- **`pending`**: Newly submitted by an owner; visible only to the submitter and admins.
- **`available`**: Approved by admin; listed publicly in the catalog for prospective adopters.
- **`reserved`**: An applicant is approved and the adoption process is underway.
- **`adopted`**: The adoption process is finalized; the dog has found a permanent home.
- **`rejected`**: Submission declined by admin with feedback provided to the owner.
- **`archived`**: Delisted from active catalog.

### Adoption Application Lifecycle
```
[User Submits Application]
           │
           ▼
       `pending`
           │
     (Admin Reviews)
           │
           ▼
     `under_review` ──(Admin Rejection)──► `rejected`
           │
    (Admin Approval)
           │
           ▼
       `approved` ──(Final Hand-off)──► `completed`
```

- **`pending`**: Initial submission received from applicant.
- **`under_review`**: Admin is reviewing housing, lifestyle, and applicant details.
- **`approved`**: Application approved; dog state shifts to `reserved`.
- **`rejected`**: Application declined with an administrative note.
- **`completed`**: Adoption finalized; dog state shifts to `adopted`.

---

## Database Architecture

The Supabase PostgreSQL database consists of the following core tables:

1. **`profiles`**: Synchronized with Clerk user accounts (`id`, `clerk_id`, `email`, `first_name`, `last_name`, `role`, `avatar_url`).
2. **`dogs`**: Dog profiles (`id`, `owner_id`, `name`, `breed`, `age_years`, `age_months`, `gender`, `size`, `color`, `description`, `medical_history`, `vaccinated`, `spayed_neutered`, `special_needs`, `location`, `status`).
3. **`dog_images`**: Photo gallery mappings (`id`, `dog_id`, `storage_path`, `public_url`, `is_primary`, `display_order`).
4. **`adoption_applications`**: Adoption requests (`id`, `dog_id`, `applicant_id`, `housing_type`, `has_yard`, `has_other_pets`, `household_members_count`, `experience_level`, `reason_for_adopting`, `status`, `admin_notes`, `rejection_reason`).
5. **`notifications`**: In-app alerts (`id`, `user_id`, `title`, `message`, `type`, `read`, `link`).

---

## Security Controls

- **Route Protection**: Next.js Middleware blocks unauthorized guest access to private routes (`/dashboard`, `/rehome`, `/my-applications`, `/my-dogs`, `/admin/*`).
- **Role Verification**: Admin routes and Server Actions verify `profiles.role === 'admin'` before performing privileged mutations.
- **Row-Level Security (RLS)**: Enforced directly at the PostgreSQL layer to ensure users can only view or modify their own private records.
- **Input Sanitization & Validation**: Forms are validated on both client and server using Zod schemas (`lib/validations/dog.ts`, `lib/validations/application.ts`).
- **File Upload Protection**: Image uploads are constrained to `image/jpeg`, `image/png`, `image/webp` with a strict 5MB size limit in the `dog-photos` storage bucket.
- **Secret Separation**: Sensitive tokens (`CLERK_SECRET_KEY`, `SUPABASE_SECRET_KEY`) reside exclusively in server environments and are never bundled into client scripts.

---

## Technology Stack

- **Framework**: Next.js 15 (App Router, Server Actions, Server Components)
- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui component architecture
- **Icons**: Lucide React
- **Authentication**: Clerk Next.js SDK
- **Database & Storage**: Supabase (PostgreSQL, Row Level Security, Supabase Storage)
- **Form Management**: React Hook Form, Zod
- **Notifications**: Sonner toasts & database notification feed
- **Hosting & Deployment**: Vercel

---

## Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/jevyjuanima/PawConnectv2.git
cd "pawconnect v2"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the project root:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Supabase Database & Storage
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

> **Note**: Never commit `.env.local` or real API keys to version control.

### 4. Database Setup
Execute the consolidated migrations file in your Supabase SQL Editor:
```text
supabase/pawconnect_all_migrations.sql
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Validation & Code Quality Commands

```bash
# Typecheck TypeScript codebase
npm run typecheck

# Lint with ESLint
npm run lint

# Compile production build
npm run build
```

---

## Live Deployment & Demo Instructions

- **Live URL**: [https://pawconnect-chi.vercel.app](https://pawconnect-chi.vercel.app)
- **Deployment Platform**: Vercel (connected to GitHub `main` branch with continuous deployment)

### Defense & Presentation Demo Walkthrough
1. **Public View**: Open the landing page, browse the available dog catalog, demonstrate dynamic search and breed filters, and inspect a dog profile page.
2. **User Experience**: Sign in with a user account, demonstrate profile synchronization, view the User Dashboard, submit an adoption application, and view application status in `/my-applications`.
3. **Rehoming Flow**: Submit a new dog with medical info and photo upload via `/rehome`.
4. **Admin Moderation**: Sign in with the admin account, open `/admin`, approve/reject rehoming submissions, evaluate adoption applications, and demonstrate dog state updates.
