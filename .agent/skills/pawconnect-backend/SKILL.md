# PawConnect Backend Skill

## Backend
Next.js Server Actions and Route Handlers are the server layer.

## Identity
Clerk is the identity source.
Supabase is the application data/storage source.

## Protected mutation order
Authenticate → authorize → validate → verify ownership/state → mutate → notify/audit if required → return safe result.

## Never trust
- role
- owner ID
- applicant ID
- user ID from the browser
- protected status
- approval state

## Database
Use the existing migrations and schema. Do not invent a parallel schema.

## State machine
Business transitions must be enforced server/database side, not only in UI.

## Storage
Dog photos use Supabase Storage with type/size/path restrictions.

## Error handling
Do not expose raw SQL errors, stack traces, tokens, or secret values.
