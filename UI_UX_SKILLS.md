# PAWCONNECT — UI/UX SPECIFICATION & DESIGN SYSTEM STANDARD

> **Document Status**: Living UI/UX Specification & Design System Standard  
> **Target Audience**: Core Engineers, UI/UX Designers, Code Reviewers, and AI Coding Agents (Gemini / Antigravity)  
> **Enforcement**: Mandatory for all pages, layouts, components, and interactive workflows.  
> **Core Rule**: 100% shadcn/ui + Tailwind CSS + Lucide React. Zero third-party styling or alternative component libraries.

---

## 1. DESIGN PHILOSOPHY & BRAND IDENTITY

PawConnect is an ethical pet adoption and responsible dog rehoming platform connecting compassionate adopters, pet parents in need of rehoming, and administrative staff who inspect every submission.

The design identity must strictly balance warmth and empathy with modern technological trustworthiness:
- **Clean**: High signal-to-noise ratio, generous whitespace, sharp boundaries, zero clutter.
- **Modern**: Subtle border lines, refined rounded radiuses (`rounded-xl` to `rounded-2xl`), cohesive neutral palettes.
- **Warm**: Earthy honey/amber/terracotta primary tones, welcoming typography, friendly pet photography and iconography.
- **Trustworthy**: Rigorous status badges, clear security indicators, administrative verification cues.
- **Professional**: Consistent spacing grid, standardized data tables, accessible typography hierarchy, predictable interactions.
- **Simple**: Clear paths to action, straightforward forms, no confusing nested navigation, low cognitive load.

### 1.1 Core Design Principles
1. **Prefer restraint over decoration.**
2. **Every visual element must have a purpose.**
3. **Typography, photography, spacing, and alignment establish hierarchy before decorative UI.**
4. **Do not reproduce generic AI SaaS landing-page patterns.**
5. **Use cards only when they improve grouping or interaction.**
6. **Remove unnecessary elements before adding new ones.**

**Strict Prohibitions**:
- NO cartoonish or childish clip-art.
- NO excessive or disorienting animations (Framer motion limited to subtle fades/scale-in).
- NO heavy unreadable gradients or iridescent backgrounds.
- NO gratuitous glassmorphism that degrades contrast or legibility.
- NO arbitrary ad-hoc inline styles or utility color hacks.
- NO decorative paw-dot grids or repetitive background bloat.
- NO fake statistics bars or pseudo-metrics.

---

## 2. VISUAL HIERARCHY & TYPOGRAPHY

### 2.1 Type Scale & Rules
PawConnect uses standard system-optimized typography (Inter / Geist / sans-serif) with clear hierarchical rules:

| Element | Class / Size | Tracking | Weight | Leading | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | `text-4xl sm:text-5xl md:text-6xl` | `tracking-tight` | `font-extrabold` | `leading-[1.15]` | Landing page primary hook |
| **Page H1** | `text-3xl sm:text-4xl` | `tracking-tight` | `font-extrabold` | `leading-tight` | Page main headers (Dashboard, Dogs gallery, Rehome wizard) |
| **Section H2** | `text-2xl sm:text-3xl` | `tracking-tight` | `font-bold` | `leading-snug` | Major page sections, content blocks |
| **Card / Item H3** | `text-lg sm:text-xl` | `tracking-tight` | `font-bold` | `leading-normal` | Card titles, modal headers, subsection headers |
| **Subheading H4** | `text-base` | `tracking-normal` | `font-semibold` | `leading-normal` | List group headers, field section titles |
| **Body Large** | `text-base sm:text-lg` | `normal` | `font-normal` | `leading-relaxed` | Hero lead paragraph, prominent callouts |
| **Body Default** | `text-sm` | `normal` | `font-normal` | `leading-normal` | Standard descriptions, form labels, card copy |
| **Caption / Muted** | `text-xs` | `normal` | `font-medium` | `leading-normal` | Metadata, helper texts, timestamps, table cells |
| **Micro Badge** | `text-[10px] sm:text-xs` | `tracking-wider` | `font-semibold` | `leading-none` | Status badges, category pills, staff indicators |

### 2.2 Text Hierarchy Principles
1. Every page must contain exactly one `h1` element representing the primary view purpose.
2. Pair every `h1` or `h2` with a companion lead paragraph (`text-muted-foreground text-sm`) providing context.
3. Use high-contrast headings (`text-foreground`) and legible secondary text (`text-muted-foreground`).

---

## 3. COLOR PALETTE & SEMANTIC TOKENS

The system uses standard semantic design tokens mapped through CSS variables:

### 3.1 Core Semantic Roles
- `bg-background`: Main viewport background (crisp light in light mode, deep slate in dark mode).
- `bg-card`: Surface background for cards, tables, modal containers, and drawers.
- `bg-muted` / `bg-muted/50`: Subtle background grouping for section separators, secondary actions, and table headers.
- `text-foreground`: Highest contrast primary text.
- `text-muted-foreground`: Secondary text, timestamps, subtitles, and captions.
- `border-border`: Subtle, clean 1px border lines defining cards and sections.

### 3.2 Action & Status Tokens
- **Primary** (`bg-primary text-primary-foreground`): Warm amber / terracotta. Used for key conversion buttons, active filters, and primary brand badges.
- **Secondary** (`bg-secondary text-secondary-foreground`): Subtle neutral pill, auxiliary callouts.
- **Success / Available / Approved** (`emerald`):
  - Badge: `bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20`
- **Warning / Pending / Under Review** (`amber`):
  - Badge: `bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20`
- **Destructive / Rejected / Cancelled** (`rose` / `destructive`):
  - Badge: `bg-destructive/10 text-destructive border-destructive/20`
- **Reserved / Special** (`blue` / `indigo`):
  - Badge: `bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20`

---

## 4. SPACING, GRID & RESPONSIVE LAYOUTS

### 4.1 Spacing Scale (8pt Grid Standard)
- Intra-element spacing: `gap-1.5` (6px), `gap-2` (8px), `gap-3` (12px).
- Component internal padding: `p-4` (16px), `p-5` (20px), `p-6` (24px).
- Container vertical rhythm: `space-y-6` to `space-y-8`.
- Page section gaps: `gap-12 md:gap-16` on content pages; `gap-16 md:gap-24` on marketing landing.

### 4.2 Breakpoints & Layout Targets
PawConnect must look and operate flawlessly across five key screen widths:
1. **360px** (Compact Mobile): Zero horizontal overflow. Stacked actions, full-width inputs, touch-friendly touch targets (min 44px).
2. **390px** (Standard Mobile): Fluid cards, clean sheet drawer navigation.
3. **768px** (Tablet / iPad): 2-column card grids, responsive header toggles, compact tables with horizontal scrolling or card transformations.
4. **1024px** (Small Laptop / Desktop): 3-column dog cards, persistent top navigation, side-by-side dashboard sections.
5. **1440px** (Wide Desktop): Contained container max-width (`max-w-6xl` or `max-w-7xl`), centered alignment with consistent gutters.

---

## 5. NAVIGATION & INFORMATION ARCHITECTURE

PawConnect enforces a unified, role-aware Information Architecture:

### 5.1 Route Tree & Roles

```text
GUEST (Unauthenticated)
├── Home (/)
├── Browse Dogs (/dogs)
├── Sign In (/sign-in)
└── Sign Up (/sign-up)

AUTHENTICATED USER
├── Home (/)
├── Browse Dogs (/dogs)
├── Dashboard (/dashboard) [Control Center]
├── Rehome a Dog (/rehome) [Submission Wizard]
├── My Applications (/my-applications)
├── My Dogs (/my-dogs)
├── Notifications (Bell Dropdown + In-App Alerts)
└── Profile (Clerk UserButton)

ADMIN (Staff Role)
└── Admin Console (/admin)
    ├── Overview (/admin)
    ├── Dogs Moderation (/admin/dogs)
    ├── Applications Review (/admin/applications)
    └── Users & Access (/admin/users)
```

### 5.2 Header Standards
- **Desktop**:
  - Left: Logo icon + "PawConnect" title and subtitle.
  - Middle: Navigation links with active route indicator (`bg-muted font-semibold text-foreground`).
  - Right: Theme toggle, notification bell (if signed in), Clerk `UserButton` (if signed in) or `SignInButton`/`SignUpButton` (if signed out).
  - Admin button: Discretely integrated with a "Staff" badge so as not to clutter user views.
- **Mobile**:
  - Clean sticky header with logo, theme toggle, and hamburger menu trigger.
  - Drawer uses shadcn `Sheet` from the right/left with complete role-aware links and quick sign-in triggers.

---

## 6. LANDING PAGE DESIGN SPECIFICATION

The landing page must communicate a legitimate animal rescue and rehoming ecosystem:

1. **Hero Section**:
   - Compelling statement on ethical pet adoption and responsible rehoming.
   - Immediate dual CTAs: Primary "Browse Available Dogs" (`/dogs`) and Secondary "Rehome a Dog" (`/rehome`).
   - Quick Trust Pillars: "100% Vetted Listings", "Direct Connections", "Zero Commercial Exploitation".
2. **Featured Dogs Section**:
   - Real-time Supabase query showing up to 6 recently approved dogs.
   - Clean `DogCard` instances displaying primary photo, age, location, and key tags.
   - Direct link to full catalog (`/dogs`).
   - Polished empty state when zero dogs are pending/available.
3. **How It Works**:
   - Clear side-by-side comparison cards for **Adopting a Dog** vs. **Rehoming Responsibly**.
   - 3 clear, numbered steps for each path.
4. **Trust & Safety Section**:
   - Highlighting strict application screening, no-breeding policies, and verified veterinary transparency.
5. **Call to Action & Footer**:
   - Clean invitation banner followed by comprehensive footer with categorization (Adopt, Rehome, Support) and legal info.

---

## 7. USER DASHBOARD SPECIFICATION (`/dashboard`)

The dashboard serves as the member's central operations hub:

```text
Welcome & Header (Greeting, User Name, Role Pill)
   ↓
Summary KPI Cards (4-grid or 2x2: Applications, My Dogs, Approved Matches, Unread Alerts)
   ↓
Quick Actions Bar (Browse Dogs, Rehome a Dog, Track Applications)
   ↓
Recent Adoption Applications (Top 3 items with live status badges)
   ↓
Recent Dog Submissions (Top 3 items with live status badges)
   ↓
Recent Notifications & Activity Stream
```

**Mandatory Rules**:
- Every statistic is calculated from real Supabase records.
- Zero mock metrics.
- Empty states must provide friendly encouragement and a clear CTA button.

---

## 8. ADMIN DASHBOARD SPECIFICATION (`/admin`)

The admin portal is engineered for operational efficiency and moderation speed:

1. **Clear Header Sub-nav**:
   - Simple tabs: `Overview`, `Dogs Review`, `Applications`, `Users`.
   - Distinct active tab states.
2. **Action-Required Callouts**:
   - Prominent alert cards when `pendingDogs > 0` or `pendingApplications > 0`.
3. **Key Operational Metrics**:
   - Total Dogs, Pending Verification, Total Applications, Registered Users.
4. **Streamlined Management Tables**:
   - Clean column alignments, status pills, action buttons (`Approve`, `Reject`, `Review`).
   - Dialog confirmations for destructive or final state transitions.

---

## 9. COMPONENT STANDARDS & SHADCN/UI MANDATE

All UI components must be 100% compliant with shadcn/ui primitives:

### 9.1 Buttons (`components/ui/button.tsx`)
- Standard heights: `sm` (h-8 or h-9), `default` (h-10), `lg` (h-12).
- Rounded radius: Consistent `rounded-xl` or `rounded-4xl` pill standard across interactive elements.
- Always include an accompanying icon from `lucide-react` with `h-4 w-4` and appropriate spacing.

### 9.2 Cards (`components/ui/card.tsx`)
- Subtle border (`border ring-1 ring-foreground/5` or `border shadow-xs`).
- Smooth hover elevation on clickable cards (`hover:border-primary/40 hover:shadow-md transition-all`).
- Clear inner padding (`p-5` or `p-6`).

### 9.3 Status Badges (`components/shared/StatusBadges.tsx`)
- Reusable `DogStatusBadge` and `ApplicationStatusBadge` across all views.
- Must include a semantic status icon (`CheckCircle2`, `Clock`, `Heart`, `XCircle`, `ShieldCheck`).
- Color independence: Status must be clearly identifiable by text label and icon, never color alone.

### 9.4 Tables (`components/ui/table.tsx`)
- Wrapped in an overflow container (`overflow-x-auto rounded-xl border`).
- Clean table headers with uppercase muted typography (`text-xs font-semibold uppercase tracking-wider`).
- Consistent row heights and vertically centered cells.

### 9.5 Forms & Inputs
- Standard `Input`, `Select`, `Textarea`, `Checkbox`, `RadioGroup` wrapped in React Hook Form + Zod.
- Clear error states placed immediately beneath inputs.
- Disabled buttons during submitting states with loading spinners.

---

## 10. SYSTEM STATES (LOADING, EMPTY, ERROR, SUCCESS)

Every view, card list, and data table must explicitly support:

1. **Loading State**:
   - Standardized skeleton cards (`DogCardSkeleton.tsx`, table row skeletons).
   - Zero cumulative layout shift (CLS = 0).
2. **Empty State**:
   - Centered container with dashed border (`border-dashed bg-muted/20 p-8 sm:p-12`).
   - Relevant muted icon (`h-12 w-12 text-muted-foreground/40`).
   - Explanatory copy and primary resolution action button.
3. **Error State**:
   - Informative alerts using shadcn `Alert` (`variant="destructive"`).
   - Clear retry or back-navigation action.
4. **Success State**:
   - Immediate toast feedback via Sonner with contextual messaging.

---

## 11. ACCESSIBILITY (A11Y) & CODE QUALITY

- **Contrast**: Maintain WCAG 2.1 AA contrast ratio (min 4.5:1 for normal text).
- **Semantics**: Strict usage of `<main>`, `<nav>`, `<header>`, `<footer>`, `<section>`.
- **Keyboard Navigation**: Focus outlines via `focus-visible:ring-2 focus-visible:ring-ring`.
- **Screen Readers**: `aria-label` on icon-only buttons (theme toggle, mobile nav hamburger, close buttons).
- **Image Optimization**: Always provide descriptive `alt` tags and responsive Next.js `Image` `sizes`.
