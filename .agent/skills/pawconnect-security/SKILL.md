# PawConnect Security Skill

## Roles
Only `user` and `admin`.

## Route protection
Guests cannot access user/admin routes.
Users cannot access `/admin/*`.
Admin checks must happen server-side.

## IDOR
Every resource ID must be checked against authenticated ownership or admin authorization. Prefer constraining the DB operation by the authenticated identity.

## Mass assignment
Whitelist editable fields. Never allow browser input to change role, owner identity, applicant identity, or protected administrative status.

## RLS
RLS must stay enabled. Review RLS whenever data access changes.

## Storage
Validate file MIME type and size server-side; keep paths scoped to the owner/resource.

## Secrets
Never commit or print:
- Clerk secret key
- Supabase secret key
- PATs
- session tokens
- `.env.local`

## Rule
A visual request is never justification for weakening authorization or RLS.
