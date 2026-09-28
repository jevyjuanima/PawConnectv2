# PawConnect

A modern, web-based pet adoption and responsible rehoming platform engineered to bridge the gap between pet seekers, pet owners needing to responsibly rehome their dogs, and administrative staff who verify submissions and process adoptions.

---

## Roles

PawConnect enforces a strict two-role authorization model:

- **User**:
  - Browse verified available dogs with search and filtering.
  - View comprehensive dog profiles (temperament, medical history, media, location).
  - Submit adoption applications for available dogs.
  - Rehome a dog (submit dog profile, medical records, and upload images).
  - Monitor adoption application statuses and review stages.
  - Monitor submitted rehoming listings and approval progression.
  - Receive automated notifications regarding status changes.
- **Admin**:
  - Full system oversight, audit logging, and metric tracking.
  - Review submitted rehoming requests: inspect dog profiles, verify images, and approve or reject listings.
  - Manage adoption applications: review prospective adopters, evaluate questionnaire responses, advance statuses (`under_review`, `approved`, `rejected`), and complete adoptions.
  - Manage inventory of dogs across all statuses (`pending`, `available`, `reserved`, `adopted`, `rejected`, `archived`).
  - Manage user accounts and roles.

---

## Features

- **Browse Available Dogs**: Fast, responsive catalog with multi-attribute filtering (breed, size, gender, location).
- **Dog Details**: Rich profile pages displaying photo galleries, temperament, vaccination/spay status, and bio.
- **Adoption Applications**: Multi-field validated application capturing housing, experience, and lifestyle compatibility.
- **Dog Rehoming**: Guided submission form with image uploads directly to Supabase Storage.
- **Application Tracking**: User dashboard for real-time tracking of submitted applications and review stages.
- **Admin Moderation**: Dedicated admin portal to approve/reject dog listings and manage adoption lifecycles.
- **Notifications**: Automated in-app notifications on all status updates.
- **Image Uploads**: Validated image upload pipeline with Supabase Storage CDN integration.
- **Adoption Lifecycle Management**: Full state machine governing transitions from `pending` -> `available` -> `reserved` -> `adopted`.

---

## Technology Stack

- **Framework**: Next.js (App Router, Server Components, Route Handlers, Server Actions)
- **Frontend**: React, TypeScript, Node.js
- **UI & Styling**: shadcn/ui (100% compliance, preset `b7Br9WuFE`), Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Forms & Validation**: React Hook Form, Zod
- **Notifications & Toasts**: Sonner
- **Authentication**: Clerk (official Next.js App Router SDK)
- **Backend & Database**: Supabase (PostgreSQL, Row Level Security, Supabase Storage, Supabase Realtime)
- **Version Control & Hosting**: GitHub, Vercel

---

## Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/your-username/pawconnect.git
cd pawconnect
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the project root by copying the template:

```bash
cp .env.example .env.local
```

> **IMPORTANT**: `.env.local` contains private configuration and secret keys. It is ignored by Git and must **NEVER** be committed to version control.

Populate `.env.local` with your Clerk and Supabase credentials:

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
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOi...
SUPABASE_SECRET_KEY=eyJhbGciOi...
```

### 4. Supabase Setup & Migrations
All database migrations, tables, RLS policies, triggers, and storage bucket definitions are located in:

```text
supabase/migrations/
```

Apply the SQL migration files in sequence or execute `supabase/pawconnect_all_migrations.sql` in your Supabase SQL Editor.

### 5. Start the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## Build & Quality Validation Commands

Verify code health, type safety, and production build output:

```bash
# Typecheck TypeScript codebase
npm run typecheck

# Lint with ESLint
npm run lint

# Compile production build
npm run build
```

---

## Architecture & Engineering Standards

For detailed system specifications, database state machines, RLS rules, and security guidelines, refer to [`SKILLS.md`](./SKILLS.md).
