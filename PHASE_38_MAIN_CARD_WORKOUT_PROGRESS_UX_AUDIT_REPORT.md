# PHASE 38 — Main Card / Workout Progress UX Integrity Audit

## Executive Summary
This phase focused on the product/UX integrity of main-card and workout progress states. The protected correctness baseline remained intact, and no calculation or persistence contract was changed. A real user-visible issue was found: progress indicators were stale because the relevant screens only loaded their state on initial mount and did not refresh when the screen became active again after a workout/session completed.

## Proven Issue
The progress UI was rehydrating from AsyncStorage only once when a screen mounted. After a workout finished and saved progress was updated, the user could return to the same screen and still see old values until the screen was remounted.

Evidence in the code path:
- `src/components/MainCardCardNew.tsx` loaded main-card state with `useEffect` only on mount.
- `src/screens/MainCardDetailScreen.tsx` loaded `getMainCardState()` and `getCurrentAttempt()` only on mount.
- `src/screens/CollectibleWorkoutDetailScreen.tsx` loaded level/completion data on mount only.
- `src/screens/WorkoutScreen.tsx` loaded workout levels and XP on mount only.

This created an actual UX mismatch between persisted state and the UI: the user could be told the workout/package was complete or still in progress even though the saved state had already updated after returning to the screen.

## Why This Is a Real Production UX Bug
The mismatch was not theoretical:
- progress values are persisted in AsyncStorage (`main_card_state_*`, `workoutSummaries`, level/XP storage)
- the UI read those values from storage but never refreshed on focus
- the user sees stale progress labels, progress bars, and completion markers after a session completes

This is a user-facing product issue even though it does not break the underlying math or reward contracts.

## Scope and Guardrails Followed
- No calculation rules were changed.
- No historical truth or reward logic was altered.
- No persistence contract was widened or redefined.
- The fix is limited to UI state refresh timing: reload on focus when the user returns to the screen.

## Fix Applied
The relevant screens now re-load their state when they regain focus:
- `src/components/MainCardCardNew.tsx`
- `src/screens/MainCardDetailScreen.tsx`
- `src/screens/CollectibleWorkoutDetailScreen.tsx`
- `src/screens/WorkoutScreen.tsx`

This keeps the UI aligned with persisted state without altering the game rules or reward logic.

## Validation
Project validation passed after the fix:
- Jest: 14/14 suites passed
- 113/113 tests passed
