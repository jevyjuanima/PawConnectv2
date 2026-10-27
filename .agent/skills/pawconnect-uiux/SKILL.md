# PawConnect UI/UX Design Skill
## Editorial, Organic, Human-Centered Pet Adoption & Rehoming

This skill defines the visual and interaction language for PawConnect.

PawConnect is a two-sided community product:
- A signed-in user can adopt a dog.
- The same signed-in user can rehome their own dog.
- `admin` is the only elevated role.

The product should feel like a thoughtful pet/community service, not a generic SaaS dashboard.

---

# 1. Design North Star

PawConnect should communicate:

> **Second chances change lives.**

The interface should feel:
- warm
- trustworthy
- humane
- editorial
- calm
- welcoming
- contemporary
- slightly handcrafted
- practical

The experience should prioritize:
1. Real dog photography
2. Strong typography
3. Editorial composition
4. Generous whitespace
5. Clear actions
6. Quiet trust cues
7. Human details used with restraint

The visual goal is **distinctive without becoming decorative**.

---

# 2. Core Product Story

Everything in the interface should reinforce two equally important paths:

## ADOPT

Find a dog who needs a home.

Flow:
`Browse Dogs → Dog Profile → Apply → Track Application → Adoption`

## REHOME

Help your dog find a new home.

Flow:
`Rehome a Dog → Create Profile → Submit → Admin Review → Track Listing`

These are not separate user roles.

Do not create:
- adopter accounts
- owner accounts
- pet-owner roles
- rehoming-only roles

One `user` can use both paths.

---

# 3. Visual Direction

## 3.1 Overall Style

Use an editorial, organic layout inspired by modern nonprofit/community brands and premium lifestyle publications.

The visual language may combine:
- cream backgrounds
- warm white surfaces
- forest/deep green accents
- muted olive
- warm brown
- soft beige
- subtle clay/terracotta accents
- natural photography
- serif display typography
- clean sans-serif body typography
- irregular image crops
- soft organic shapes
- tiny hand-drawn details

The style should be recognizable even without gradients, icons, or shadows.

## 3.2 Important

Do NOT recreate the reference mockup literally.

Use the same principles, not the exact composition.

The implementation must remain:
- accessible
- responsive
- usable
- consistent with PawConnect's existing components
- compatible with the existing Next.js / shadcn / Tailwind stack

---

# 4. Anti-AI-Slop Rules

Avoid the visual patterns that make a UI look auto-generated.

Never default to:
- giant gradient blobs
- decorative paw-print patterns
- excessive glassmorphism
- excessive rounded cards
- every section becoming a 3-column card grid
- every item receiving an icon inside a circle
- excessive badges and pills
- fake statistics
- giant KPI tiles on public pages
- floating decorative UI for no reason
- generic “AI startup” gradients
- excessive shadows
- excessive hover scaling
- excessive animation
- centered text in every section
- generic startup copy
- meaningless “premium / powerful / seamless / innovative” language

### Card rule

Cards should exist when they help group a meaningful unit.

Do not put:
- a heading in a card
- a paragraph in another card
- a CTA in another card
- a decorative icon in another card

just to fill space.

Use open editorial layout when a card is unnecessary.

---

# 5. Typography

Use two complementary type personalities.

## Display

Prefer a refined serif or high-character display face for:
- hero headings
- major section headings
- campaign-style statements

The display type should feel:
- warm
- literary
- human
- confident

Avoid novelty fonts.

## Body/UI

Use a highly readable sans-serif for:
- navigation
- descriptions
- forms
- labels
- buttons
- status information
- tables

## Hierarchy

A page should usually have:

1. Eyebrow / overline
2. Main heading
3. Supporting copy
4. Primary action
5. Secondary action
6. Supporting content

Do not make every heading huge.

---

# 6. Color System

Use a restrained palette.

Suggested semantic palette:

```text
Background:
- warm white / ivory

Primary:
- deep forest green

Primary hover:
- darker forest green

Secondary accent:
- muted olive

Warm accent:
- terracotta / clay

Text:
- near-black / deep charcoal

Muted text:
- warm gray

Borders:
- soft beige / neutral gray

Surface:
- warm white
- very light cream
```

Do not rely on color alone to communicate:
- errors
- success
- status
- selection

Maintain sufficient contrast.

---

# 7. Photography

Photography is a primary design element, not decoration.

Prefer:
- real-looking dogs
- natural light
- eye contact
- expressive but believable moments
- calm environments
- people interacting naturally with dogs
- home/outdoor contexts

Avoid:
- overly staged stock-photo appearance
- repetitive dog portraits
- cut-out dogs floating on gradients
- unnatural AI-looking anatomy
- excessive image filters

## Hero photography

Use one dominant image.

The hero image should create emotional context without overpowering the CTA.

Good treatments:
- rounded or organic crop
- large editorial image
- edge-to-edge section image
- irregular cutout
- photo crossing section boundaries

Bad treatments:
- tiny image beside a giant headline
- five competing photos above the fold
- image covered in badges and text

---

# 8. Organic Shapes

Organic shape language is allowed and encouraged in moderation.

Use:
- soft irregular image masks
- subtle curved section transitions
- hand-drawn underline
- small imperfect accent stroke
- organic photo crops

Do not use:
- random blobs behind every element
- multiple decorative shapes per section
- shapes that compete with text
- decoration without a clear compositional purpose

Rule:

> One expressive visual idea per section is enough.

---

# 9. Landing Page Architecture

The landing page should use this order.

## 01 — Minimal Navigation

Desktop:

```text
PawConnect

Browse Dogs
How It Works

                         Sign In
                         Find a Pet
```

Signed-in:

```text
PawConnect

Browse Dogs
How It Works

Rehome a Dog
Dashboard
Notifications
Account
```

Admin:

Expose the admin area as a restrained utility entry point.

Never use:
- “STAFF” pill
- glowing admin badge
- loud admin styling

## 02 — Hero

Primary message:

> Find a dog who needs a home.

Alternative campaign headline:

> Second chances change lives.

The hero must communicate both product paths:

- Find a Pet
- Rehome a Dog

Recommended composition:

```text
left:
eyebrow
large headline
supporting copy
primary CTA
secondary CTA

right:
large dog / person photography
```

The composition may break the grid slightly with an organic crop.

## 03 — Featured Dogs

Heading:

> Dogs looking for homes

Show 3–6 real listings from Supabase.

Each listing should prioritize:
- image
- dog name
- breed
- age
- gender when available
- short description
- clear profile action

Avoid badge overload.

Primary link:

`View profile →`

Section link:

`Browse all dogs →`

## 04 — Adoption + Rehoming Split

This is a signature PawConnect section.

Present two distinct paths.

### Adoption

> Find your next companion.

Show the real workflow:
- Browse dogs
- Read profiles
- Submit an application
- Track status

CTA:
`Find a Pet →`

### Rehoming

> Help your dog find a new home.

Show the real workflow:
- Create dog profile
- Submit for review
- Receive/review applications
- Track the listing

CTA:
`Rehome a Dog →`

These should feel like two sides of the same mission.

## 05 — How It Works

Use an editorial sequence, not three giant cards.

```text
01  Discover or List
02  Apply or Review
03  Connect and Transition
```

Use:
- numbered steps
- simple icons only where useful
- short descriptions
- subtle connector lines

## 06 — Trust & Safety

Only make claims supported by the actual product.

Current truthful examples:
- admin-reviewed listings
- structured adoption applications
- direct transitions
- status tracking
- moderation workflow

Do not invent:
- veterinary verification
- shelter partnerships
- background checks
- guaranteed health information
- “100% verified” claims
- unsupported statistics

## 07 — Final CTA

Keep it emotional but restrained.

Example:

> Be part of brighter tomorrows.

Supporting copy:

> Find a dog who needs a home, or help your own dog find the right family.

Actions:
- Find a Pet
- Rehome a Dog

## 08 — Footer

Keep it quiet.

Include:
- PawConnect brand
- concise mission line
- primary links
- account/admin links where appropriate
- social links only if real
- copyright

---

# 10. Dog Card Design

Dog cards should feel editorial rather than marketplace-heavy.

Preferred:

```text
┌─────────────────────┐
│                     │
│      DOG PHOTO      │
│                     │
├─────────────────────┤
│ Bella               │
│ Mixed Breed · 2 yrs │
│                     │
│ Calm, affectionate  │
│ and loves people.   │
│                     │
│ View profile →      │
└─────────────────────┘
```

Use a heart/favorite control only if the product actually supports favorites.

Do not add decorative status pills unless they carry meaningful product information.

---

# 11. Buttons

Use buttons sparingly.

Primary CTA:
- deep green
- high contrast
- clear verb

Examples:
- Find a Pet
- Browse Dogs
- Rehome a Dog
- Apply to Adopt

Secondary CTA:
- outlined
- warm neutral or green
- visually quieter

Do not use:
- gradient buttons
- oversized pill buttons everywhere
- icon-only buttons for important actions

Icons may accompany labels, but text must remain understandable without icons.

---

# 12. Navigation Rules

Create one source of truth for navigation.

Desktop and mobile must derive from the same route definitions.

## Guest

Primary:
- Browse Dogs
- How It Works

Actions:
- Sign In
- Find a Pet

## Member

Primary:
- Browse Dogs
- How It Works
- Rehome a Dog
- Dashboard

Utility:
- Notifications
- Account

Secondary member activity:
- My Applications
- My Dogs

These should not dominate the desktop header.

## Mobile

Group navigation into:

### PUBLIC
Browse Dogs
How It Works

### PRIMARY ACTION
Rehome a Dog

### YOUR ACTIVITY
Dashboard
My Applications
My Dogs
Notifications

### ACCOUNT
Account
Theme

---

# 13. Dashboard Design

The dashboard answers:

> “What is happening with my PawConnect activity?”

Top:

```text
Welcome back.

What would you like to do?

[ Find a Dog ] [ Rehome a Dog ]
```

Then compact activity summary.

Then:
- recent adoption applications
- my dog listings
- recent notifications

Use lists and whitespace before adding cards.

---

# 14. Rehoming Experience

Rehoming should feel supportive, not bureaucratic.

Page structure:

```text
Rehome your dog

Tell us about your dog so we can help connect them
with a suitable new family.

1. About your dog
2. Care & temperament
3. Photos
4. Review & submit
```

Use:
- progressive sections
- clear form labels
- helpful descriptions
- restrained validation
- strong image preview

Do not overwhelm the user with a wall of fields.

---

# 15. Adoption Experience

Dog detail page:

```text
[large photo gallery]     Dog name
                          Breed
                          Age
                          Sex
                          Location/context

                          About this dog
                          Temperament
                          Care information

                          [Apply to Adopt]
```

The CTA should remain obvious.

The application should feel like a thoughtful questionnaire, not an online checkout form.

---

# 16. Status Design

Statuses must be understandable at a glance.

Adoption:

```text
Pending
Under Review
Approved
Reserved
Completed
Adopted
```

Rehoming:

```text
Pending
Available
Rejected
```

Use color plus text, never color alone.

Avoid turning every status into a saturated pill.

---

# 17. Motion

Motion should be subtle.

Good:
- gentle section entrance
- slight image reveal
- understated hover transition
- drawer slide
- modal fade/scale kept minimal

Bad:
- bouncing UI
- parallax everywhere
- floating cards
- continuous decorative animation
- large scale transforms

Default animation principle:

> Motion should clarify interaction, not advertise that animation exists.

---

# 18. Responsive Design

Design intentionally for:

- 360px
- 390px
- 768px
- 1024px
- 1440px+

### Mobile rules

At mobile widths:
- collapse desktop navigation
- stack adoption/rehoming paths
- keep CTA buttons large enough to tap
- protect readable line lengths
- reduce decorative elements
- crop photography intentionally
- avoid horizontal overflow

Do not simply shrink desktop.

Recompose it.

---

# 19. Accessibility

Always maintain:
- semantic headings
- visible focus states
- keyboard navigation
- accessible labels
- sufficient contrast
- alt text for meaningful images
- minimum touch target size
- reduced-motion support where appropriate

Decorative imagery should not create noisy screen-reader output.

---

# 20. shadcn/ui + Tailwind Rules

Use the existing stack:

- shadcn/ui
- Tailwind CSS
- Lucide React
- Framer Motion
- Next.js App Router

Do not introduce a second UI library.

Use shadcn components when a real interaction needs them:
- Dialog
- Sheet
- DropdownMenu
- Button
- Input
- Select
- Form
- Tabs
- Alert
- Toast/Sonner

Do not force everything into shadcn Cards.

Custom composition is encouraged when an editorial layout is more appropriate.

---

# 21. Copywriting

PawConnect copy should be:
- human
- specific
- warm
- concise
- honest

Prefer:
> Help your dog find a new home.

Avoid:
> Unlock a seamless next-generation rehoming ecosystem.

Prefer:
> Browse dogs currently looking for loving families.

Avoid:
> Discover our curated ecosystem of premium pet opportunities.

Never invent product statistics or operational guarantees.

---

# 22. Quality Gate

Before considering a UI task finished, ask:

### Product clarity
- Can a first-time visitor understand adoption and rehoming immediately?
- Is it obvious that one account can do both?

### Visual quality
- Does the layout still feel intentional with icons removed?
- Does it still look good without gradients?
- Is photography doing meaningful work?
- Is the page calm rather than busy?

### Hierarchy
- Is there one clear primary action per section?
- Is important content easier to notice than decoration?

### Responsiveness
- Does it work at 360px and 390px?
- Does the desktop layout use whitespace effectively?

### Authenticity
- Are claims supported by the actual application?
- Are images believable and appropriate?

### Engineering
- TypeScript passes
- lint passes
- production build passes
- protected routes remain protected
- no mock production data
- no security logic moved into client-only UI

---

# 23. Final Design Test

Before shipping any PawConnect page, ask:

> **Would this still look deliberately designed if I removed the gradients, decorative icons, shadows, and badges?**

If the answer is no, simplify the page.

The strongest PawConnect interface should look good because of:
- typography
- photography
- spacing
- alignment
- composition
- clear product thinking

—not because of decoration.
