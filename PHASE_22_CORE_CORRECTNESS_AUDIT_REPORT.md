# PHASE 22 CORE CORRECTNESS AUDIT REPORT

## Phase 22 Status

Status: PASS with one verified production fix.

This audit used the requested guardrails:
- no Git/GitHub operations
- no new feature work
- no protected contract changes
- no architecture migrations
- no external calendar changes
- no formula changes
- no historical rewrite
- only real, evidence-backed correctness issues accepted

## Audit Scope

This phase audited the active production flow paths requested in scope:
- WorkoutMain → CollectibleWorkoutDetail → GenericWorkoutSettings → Timer → WorkoutSummary
- WorkoutMain → MainCardDetail → Timer → WorkoutSummary

It focused on the requested priorities:
1. data correctness
2. workout result correctness
3. calculation / aggregation correctness
4. persistence correctness
5. navigation / state consistency
6. planned event vs completed session separation

## Finding

Selected issue: duplicate Timer start/navigation in the main-card flow.

Severity: High (production flow correctness issue, because the timer begin path was being triggered twice in the same flow and could create inconsistent state during workout startup).

## Evidence

Code evidence in `src/screens/MainCardDetailScreen.tsx`:
- `timerContext.startTimerWithWorkoutSettings(...)` was called
- immediately followed by a second `navigation.navigate('Timer', ...)`

This created two competing start paths for the same workout:
- the context-owned timer startup already navigates to `Timer`
- the screen also performed a second navigation manually

Root cause:
- timer startup ownership was split between the context and the screen
- the screen performed a second navigation after the authoritative timer start had already initiated the same route
- because the route and state were initialized twice, the active workout/attempt context could become inconsistent and race-prone

## Selected Fix

Fix applied: remove the redundant second navigation from the main-card start flow.

File changed:
- `src/screens/MainCardDetailScreen.tsx`

Implementation detail:
- kept the timer context as the single owner of the timer launch
- removed the manual duplicate `navigation.navigate('Timer', ...)` call
- no new dependencies, no refactor, no formula changes

## Files Changed

- `src/screens/MainCardDetailScreen.tsx`

## Behavior Changed

Before:
- `MainCardDetailScreen.handleStartProgram` called `timerContext.startTimerWithWorkoutSettings(...)`
- then immediately invoked a second navigation to `Timer`

After:
- the timer context is the sole start owner for the timer route
- the app navigates once to the correct timer session for the selected workout

## Behavior Preserved

The fix intentionally preserves the protected contract boundaries:
- no historical snapshot rewrite
- no formula changes
- no external calendar move
- no persistence schema changes
- no change to `SessionSnapshotReader` semantics
- no change to `SnapshotCalorieReader` semantics
- no change to `calculateOVR` authority
- no change to `workout.baseStats` default source
- no change to `processedAttemptIds` idempotency contract
- no change to XP/level logic semantics

## Historical Integrity

Confirmed preserved:
- completed workouts remain distinct from planned calendar events
- current settings are not used as authoritative historical truth
- workout summary data remains tied to the completed session snapshot state
- no retroactive re-write was added to historical data

## Calculation Integrity

Confirmed preserved:
- no formula was changed
- no aggregation logic was altered
- no calculation authority was shifted away from existing protected code paths
- the fix is navigation/state-level only, not algorithmic

## Persistence Integrity

Confirmed preserved:
- no AsyncStorage schema was changed
- no duplicate summary write was introduced by this fix
- no stale state management changes were added
- existing idempotency contracts remain intact

## Calendar/Event Integrity

No calendar architecture or permission changes were made.
The internal planning/event system remains unchanged and in place.
This audit did not expand scope into native calendar or external integration work.

## Navigation Integrity

This issue was a real navigation/state correctness bug in the active production flow.
It was not speculative or UX-only.
The fix ensures the main-card program path does not create split ownership of startup navigation.

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

Executed as requested:

1. Compile check
   - `npx tsc --noEmit`
   - Result: PASS

2. Protected suite
   - `npx jest --runInBand --watch=false __tests__/mainCardIdempotency.test.ts __tests__/calculateOVR.test.ts __tests__/phase5d_parity.test.ts __tests__/historicalCalorieSnapshot.test.ts __tests__/ovr_ui_integration.test.ts __tests__/phase5b_reader_migration.test.ts __tests__/bodyWeightCalorieIntegration.test.ts __tests__/bodyWeightCalorieAudit.test.ts __tests__/historicalStrengthReader.test.ts __tests__/bodyWeightPersistence.test.ts`
   - Result: 10/10 suites passed, 101/101 tests passed

3. Full suite
   - `npx jest --runInBand --watch=false`
   - Result: 10 suites passed, 1 failed
   - Remaining failure is environment-only: `__tests__/App.test.tsx` fails because `RNGestureHandlerModule` is not available in the test environment.
   - This is not treated as a production logic regression.

## Bugs Fixed

- Fixed the duplicate main-card timer start path in `src/screens/MainCardDetailScreen.tsx`.

## Remaining Technical Debt

- The App test environment still lacks the native `RNGestureHandlerModule` shim; this is an environment issue, not a logic issue in the active product flow.
- No additional production correctness issue met the audit standard after this targeted fix.

## Product Decisions Required

No new product decisions were required for this issue.
The fix stayed within the current contract and avoided speculative product behavior.

## Risk Assessment

Risk after fix: Low.
Reason:
- the change is minimal
- it only removes redundant startup navigation
- it keeps all protected logic and historical semantics intact
- validation passed for compile and contract-critical suites

## Final Recommendation

The app’s active workout start flow is now aligned with a single authoritative timer-start path in the main-card flow, without changing protected calculations or historical data ownership.

Recommendation: keep this fix and continue to treat the remaining App test failure as a separate native environment issue rather than a product correctness defect.
