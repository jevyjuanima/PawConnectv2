# PawConnect UI/UX Skill

## Design objective
PawConnect should look like a thoughtful, human-designed adoption product — not a generic AI SaaS landing page and not a template admin dashboard.

## Visual personality
Warm, calm, editorial, trustworthy, human, restrained, modern.

## Design hierarchy
Use this order:
1. Typography
2. Photography
3. Whitespace
4. Alignment
5. Subtle borders/surfaces
6. Components
7. Motion

## Anti-AI-slop rules
Avoid:
- card grids for every section
- excessive rounded boxes
- excessive pills
- fake metric/stat bars
- decorative paw patterns
- gradient blobs
- glassmorphism
- icon circles everywhere
- excessive shadows
- excessive centered copy
- every link with an icon
- three identical feature cards repeated across the page
- generic startup language
- visual noise used to make a page feel "designed"

When the page feels busy, remove elements before adding elements.

## Shadcn
100% shadcn/ui + Tailwind CSS + Lucide React.
Never add another component library.

## Navigation information architecture
### Guest
Home | Browse Dogs | How It Works
Right: Sign In | Find a Pet

### User
Home | Browse Dogs | Dashboard | My Applications | My Dogs
Primary: Rehome a Dog
Right: Notifications | Account

### Admin
Home | Browse Dogs | Admin
Admin area: Overview | Dogs | Applications | Users
Right: Notifications | Account

Guests/users must never see admin navigation. Users must not see admin routes, even by direct URL. UI visibility is not a security boundary.

## Desktop navbar
- 64–72px height
- logo left
- 2–4 high-priority links max in the public shell
- one primary action
- minimal icon use
- subtle bottom border
- no oversized badge
- no "Staff" pill unless the admin context genuinely needs it
- active state should be typography/border/background nuance, not a giant filled tab

## Mobile nav
Use shadcn Sheet.
Keep hierarchy simple.
Guest: Browse, How It Works, Sign In, Find a Pet.
User: Browse, Dashboard, Applications, My Dogs, Rehome, Notifications, Account.
Admin: public basics + Admin section.
Avoid 10+ equally weighted buttons.

## Landing page
Preferred structure:
1. Minimal navbar
2. Hero with one strong dog image
3. Featured Dogs
4. How It Works
5. Rehome section
6. Trust & Safety
7. Final CTA
8. Footer

### Hero
Question answered immediately: "What is PawConnect?"
Primary: Find a Pet
Secondary: Rehome a Dog
Use one dominant image.
Do not use fake statistics, trust-pills, paw-patterns, or multiple competing visual blocks.

### Featured Dogs
Image-led. Real Supabase data. Fewer metadata labels. One clear CTA.

### How It Works
Prefer one editorial three-step flow over a row of giant icon cards.

### Trust
Use actual product mechanisms: admin review, application questionnaire, status tracking, controlled account access.

## User dashboard
Hierarchy:
Greeting → compact summary → quick actions → recent applications → my dogs → notifications.

The dashboard is a control center, not an analytics product.
Prefer a strong list/table hierarchy over many cards.

## Admin dashboard
Hierarchy:
Needs attention → pending queues → concise metrics → recent activity.
Operations first. Avoid ornamental charts.

## Responsive
Inspect at 360, 390, 768, 1024, 1440px.

## Accessibility
Semantic HTML, visible focus, labels, keyboard navigation, useful alt text, status labels/icons, adequate contrast.

## Visual acceptance question
"Would this still look intentional if the gradients, shadows, and icons were removed?"
If no, fix hierarchy rather than adding decoration.
