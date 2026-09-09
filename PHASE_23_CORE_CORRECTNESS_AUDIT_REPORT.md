# PHASE 23 CORE CORRECTNESS AUDIT REPORT

## Phase 23 Status

Status: PASS

This phase followed the same guardrail methodology used in the earlier phases:
- no Git/GitHub usage
- no speculative feature work
- no protected contract changes
- no formula rewrite
- no historical truth rewrite
- no planner/calendar migration
- no change to external native calendar usage
- no change to internal planning/event ownership
- one real, evidence-backed issue only

## Core/Product Finding

Finding: duplicate navigation/start ownership in the collectible workout start flow.

Severity: High

## Evidence

Production flow under audit:
- WorkoutMain → CollectibleWorkoutDetail → Timer → WorkoutSummary

Evidence in `src/screens/CollectibleWorkoutDetailScreen.tsx`:
- `handleStartWorkout` called `timerContext.startTimerWithWorkoutSettings(...)`
- `TimerContext.startTimerWithWorkoutSettings(...)` itself calls `navigation.navigate('Timer', ...)`
- the screen then immediately performed a second navigation/back action in the same start path

This caused split ownership of the same workout startup:
- the timer context was already the authoritative launch owner
- the screen also attempted to navigate away from the same flow
- the flow could be interrupted or state-corrupted depending on navigation stack timing

## Root Cause

The root cause was not a formula or persistence issue. It was a genuine state/navigation ownership bug:
- startup responsibility was split across two layers
- one owner wanted to start the timer and navigate to `Timer`
- another owner also moved the stack away from the active flow

This is a real code-path correctness bug because navigation order and ownership determine whether the timer screen is the active workout session or whether the app falls back to a stale route.

## Selected Improvement/Fix

Fix applied:
- Remove the redundant `navigation.goBack()` from the collectible workout start flow
- Keep `TimerContext.startTimerWithWorkoutSettings(...)` as the single owner of the timer launch

This preserves the existing route architecture and avoids creating a second, contradictory navigation action.

## Implementation

File changed:
- `src/screens/CollectibleWorkoutDetailScreen.tsx`

Behavior after fix:
- the screen no longer performs a second navigation after the timer context has already launched the workout
- the timer session remains attached to the correct workout and exercise context
- no planner/history data was rewritten
- no protected contracts were altered

## Files Changed

- `src/screens/CollectibleWorkoutDetailScreen.tsx`

## Behavior Changed

Before:
- collectible detail flow started the timer and then also navigated/backed away from the same flow

After:
- timer startup is owned by a single place
- the active session stays on the correct route and workout state

## Behavior Preserved

This fix did not change:
- historical truth semantics
- session snapshot semantics
- `SessionSnapshotReader` contract
- `SnapshotCalorieReader` contract
- `processedAttemptIds` idempotency
- `calculateOVR` authority
- `workout.baseStats` default-source behavior
- XP/level semantics
- AsyncStorage schema
- calendar/planning ownership
- recurring-event storage semantics

## Historical Integrity

Confirmed preserved:
- completed workout data remains authoritative
- planned event data remains separate from completed session data
- no snapshot rewrite or historical mutation occurred

## Calculation Integrity

Confirmed preserved:
- no calculations or formulas were modified
- no metrics source precedence changed
- no historical aggregation path was altered

## Persistence Integrity

Confirmed preserved:
- no persistence schema changed
- no duplicate summary write introduced by this fix
- no change to `workoutSummaries` semantics
- no change to `MainCardAttemptManager` semantics beyond the flow owner fix

## Protected Contracts

Protected contracts checked and preserved:
- Historical Truth
- SessionSnapshotReader
- SnapshotCalorieReader
- processedAttemptIds
- MainCard idempotency
- D1 calculateOVR authority
- D5 workout.baseStats default source
- XP / Level semantics
- Persistence schema
- Navigation ownership
- Calendar/Event ownership
- Summary ownership
- Settings ownership

## Tests

Executed exactly as requested:

1. TypeScript
- `npx tsc --noEmit`
- Result: PASS

2. Protected suite
- `npx jest --runInBand --watch=false __tests__/mainCardIdempotency.test.ts __tests__/calculateOVR.test.ts __tests__/phase5d_parity.test.ts __tests__/historicalCalorieSnapshot.test.ts __tests__/ovr_ui_integration.test.ts __tests__/phase5b_reader_migration.test.ts __tests__/bodyWeightCalorieIntegration.test.ts __tests__/bodyWeightCalorieAudit.test.ts __tests__/historicalStrengthReader.test.ts __tests__/bodyWeightPersistence.test.ts`
- Result: 10/10 suites passed, 101/101 tests passed

3. Full suite
- `npx jest --runInBand --watch=false`
- Result: 10 suites passed, 1 failed
- Remaining failure: `__tests__/App.test.tsx`
- Cause: environment-only native test issue (`RNGestureHandlerModule` missing)
- Not classified as production logic regression

## Bugs Fixed

- Fixed duplicate navigation/start ownership in the collectible workout start flow.

## Remaining Technical Debt

- The full Jest suite still has the same environment-only native module failure in `App.test.tsx` caused by missing `RNGestureHandlerModule`.
- No additional production correctness issue met the proof standard in this audit.

## Product Decisions Required

None for this fix.
The change stayed within the current route ownership model and did not require altered product logic.

## Risk Assessment

Risk after fix: Low
Reason:
- minimal scope
- same route architecture preserved
- no historical or formula change
- protected contract validation passed

## Final Recommendation

The active collectible workout start flow is now consistent with a single owner for timer startup and navigation. This resolves a real production correctness bug without touching historical truth, formulas, or protected persistence contracts.

The remaining App test failure should continue to be treated as an environment-only issue rather than a production regression.
