# PawConnect Frontend Skill

## Stack
Next.js App Router, React, TypeScript, Tailwind, shadcn/ui, Lucide, Clerk, Supabase.

## Rules
- Server Components by default
- Client Components only for real interaction
- no `any`
- `@/` imports
- reuse existing components
- avoid giant components
- avoid duplicate logic
- no mock production data

## UI
Use shadcn/ui for UI primitives. Customize with Tailwind and the existing design tokens.

## Navigation
Navigation must be derived from the authenticated role and rendered consistently across desktop/mobile. Do not maintain conflicting duplicate navigation definitions.

## Data
Use real Supabase data. Handle loading, empty, error, unauthorized, and success states.

## Forms
React Hook Form + Zod for substantial forms. Server-side validation for mutations.

## Images
Use Next/Image where appropriate and preserve responsive aspect ratios.

## Refactoring
Prefer extracting a small, coherent section/component over rewriting unrelated files.

## Verification
Run:
- `npm run typecheck`
- `npm run lint`
- `npm run build`
