# PawConnect Agent Workflow Skill

## Before coding
1. Identify the task.
2. Read `SKILLS.md`.
3. Read `UI_UX_SKILLS.md` for UI work.
4. Read only the relevant task skill(s).
5. Inspect affected files and dependencies.
6. Write a brief implementation plan.

## For UI work
Inspect the current rendered interface.
Simplify first.
Do not add decorative components just to fill space.
Use real content and existing data.
Keep guest/user/admin navigation separate.

## For backend work
Trace UI → server action → Supabase → RLS/state machine before editing.

## While editing
Make focused changes.
Do not rewrite unrelated code.
Do not add dependencies without reason.
Do not weaken security.

## After editing
Run targeted checks, then the full quality gate.
Review the rendered result for UI work.

## Commit
Only commit intended changes with a clear message.
