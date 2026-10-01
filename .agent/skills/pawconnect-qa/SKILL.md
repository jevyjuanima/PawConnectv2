# PawConnect QA Skill

## Quality gates
- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Guest
Home, Browse, Dog Details, Auth pages, protected-route blocking.

## User
Sign in, profile sync, browse, rehome, image upload, My Dogs, application, My Applications, notifications.

## Admin
Admin access, dog moderation, application review, adoption completion, user roles.

## Security regression
Test guest/user/admin role boundaries, IDOR, role tampering, protected status mutations, storage ownership.

## Visual regression
Check 360, 390, 768, 1024, 1440px.

## UI quality
Look for:
- excessive cards
- excessive pills
- weak hierarchy
- bad spacing
- duplicate navigation
- broken mobile nav
- overflow
- dead buttons
- fake metrics/claims

## Test data
Never leave temporary demo/test records in the live dataset.

## Reporting
Separate:
- observed runtime results
- code-review results
- manual-required tests
