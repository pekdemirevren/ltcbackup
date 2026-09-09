# PHASE 24 CORE CORRECTNESS AUDIT REPORT

## Phase 24 Status

Status: PASS (one real production correctness bug found and fixed).

This phase followed the evidence-gated methodology from prior phases. No Git/GitHub operations were performed. Protected contracts and historical semantics were preserved.

## Core/Product Finding

Finding: main-card program run context (mainCardId / attemptId) was not propagated into the Timer navigation when starting a program workout via `MainCardDetailScreen`.

Severity: High — causes completed workouts started from a main-card run to be recorded without the attempt context, preventing MainCardAttemptManager from marking the workout as completed in the run and breaking main-card idempotency/processing.

## Evidence

Relevant files / code paths:
- `src/screens/MainCardDetailScreen.tsx` — original path called `timerContext.startTimerWithWorkoutSettings(...)` and then separately navigated to `Timer` with `mainCardId` and `attemptId` (previously removed to avoid duplicate navigation). After removing the duplicate navigation, the essential `attemptId` propagation was lost.
- `src/contexts/TimerContext.tsx` — `startTimerWithWorkoutSettings` did not accept or forward `mainCardId` / `attemptId` into the `navigation.navigate('Timer', params)` call, so `TimerScreen` did not receive attempt information.
- `src/screens/TimerScreen.tsx` — on completion, `saveWorkoutSummary` conditionally calls `recordWorkoutInAttempt(mainCardId, workoutId, sessionData)` only if `mainCardId` && `workoutId` are present in route params.

Observed behavior (actual) vs expected:
- Actual: starting a program via `MainCardDetailScreen` could start timer but Timer route lacked `mainCardId/attemptId` → completion saved but `recordWorkoutInAttempt` not called with the correct attempt → main-card run not advanced.
- Expected: program runs started from a main-card must include `mainCardId` and `attemptId` so `recordWorkoutInAttempt` can record the completed workout within the attempt and trigger `processMainCardRun` when package completes.

Why this is a production correctness issue:
- It breaks main-card progression (users completing runs will not be credited in the program), undermining progression, XP, and main-card idempotency guarantees.
- This is not a mere UX issue — it affects persisted progression state and historical records.

## Root Cause

During a previous fix (Phase 22) the redundant `navigation.navigate('Timer', ...)` call in `MainCardDetailScreen` was removed to avoid duplicate navigation. That removal also removed the explicit `mainCardId` and `attemptId` parameters that were previously passed to `Timer`. `TimerContext.startTimerWithWorkoutSettings` was not forwarding these values, so the attempt context was lost.

In short: split ownership of navigation was corrected but the required context propagation was not preserved.

## Selected Fix

Minimal fix implemented:
1. Extend `TimerContext.startTimerWithWorkoutSettings(...)` to accept optional `mainCardId?: string` and `attemptId?: string` parameters.
2. Forward those fields into the `navigation.navigate('Timer', navigationParams)` call inside `TimerContext` so `TimerScreen` receives them on start.
3. Update `MainCardDetailScreen.handleStartProgram` to pass `card.id` and the current attempt id (`currentAttempt.id`) into `timerContext.startTimerWithWorkoutSettings(...)` (using the optional trailing parameters). This preserves single-owner timer navigation while ensuring attempt context is propagated.

This is minimal (two small changes), keeps timer navigation in the context (single owner) and restores required persistence context.

## Implementation

Files changed:
- `src/contexts/TimerContext.tsx` — add `mainCardId` and `attemptId` optional params and include them in `navigationParams`.
- `src/screens/MainCardDetailScreen.tsx` — call `timerContext.startTimerWithWorkoutSettings(..., mainCardId, attemptId)` so attempt context is propagated.

Code changed is small, focused, and limited to passing additional optional parameters and forwarding them.

## Behavior Changed

Before:
- When starting a program run from `MainCardDetailScreen`, the timer might start without attempt context because the explicit navigation that used to pass attemptId was removed.

After:
- Timer is still started via `TimerContext` (single owner) and now receives `mainCardId` and `attemptId` when starting from a main-card flow, enabling `saveWorkoutSummary` to correctly record the workout in the attempt.

## Historical Integrity

Preserved:
- No change to saved session snapshot structure.
- No retroactive edits to historical `workoutSummaries` were made.
- No migrations or schema changes.

## Calculation Integrity

Preserved:
- No formula or calculation code changed.
- `calculateOVR`, strength, calorie, and other calculation authorities remain untouched.

## Persistence Integrity

Improved correctness:
- Completed workouts started from a main-card run are now recorded into the corresponding attempt using `recordWorkoutInAttempt` as intended, preserving run-level persistence and avoiding loss of main-card progression state.

Preserved:
- No change to storage keys, schema, or snapshot semantics.

## Protected Contracts

Verified unchanged:
- SessionSnapshotReader / SnapshotCalorieReader
- processedAttemptIds semantics and MainCardEngine idempotency
- XP / Level semantics
- calculateOVR authority and workout.baseStats default source
- AsyncStorage schema and usage
- Calendar / Planning ownership

## Tests

Actions performed:
1. TypeScript compile:
   - `npx tsc --noEmit`
   - Result: PASS

2. Protected test suite (contract-critical):
   - `npx jest --runInBand --watch=false __tests__/mainCardIdempotency.test.ts __tests__/calculateOVR.test.ts __tests__/phase5d_parity.test.ts __tests__/historicalCalorieSnapshot.test.ts __tests__/ovr_ui_integration.test.ts __tests__/phase5b_reader_migration.test.ts __tests__/bodyWeightCalorieIntegration.test.ts __tests__/bodyWeightCalorieAudit.test.ts __tests__/historicalStrengthReader.test.ts __tests__/bodyWeightPersistence.test.ts`
   - Result: 10/10 suites passed, 101/101 tests passed

3. Full Jest suite:
   - `npx jest --runInBand --watch=false`
   - Result: 10 suites passed, 1 failed
   - Failure: `__tests__/App.test.tsx` — environment-only (missing native `RNGestureHandlerModule`). This is not a production regression and was classificationally ignored per the audit rules.

All relevant protected tests passed and confirm idempotency and main-card processing invariants.

## Bugs Fixed

- Restored propagation of `mainCardId` and `attemptId` into the timer start flow so program runs are correctly recorded against MainCard attempts.

## Remaining Technical Debt

- Test environment still reports missing `RNGestureHandlerModule` in `App.test.tsx` — environment-only issue.
- Consider adding an explicit unit/integration test that simulates starting a program run from `MainCardDetailScreen` and verifies that `recordWorkoutInAttempt` is invoked with the correct attempt id on completion; currently mainCard idempotency tests cover processing behavior but an explicit integration test could further lock this contract.

## Product Decisions Required

None for this fix. The change is strictly plumbing to restore intended persisted program behavior.

## Risk Assessment

Risk: Low
Rationale:
- small, localized change
- no change to protected calculations or storage schema
- validated by TypeScript and protected test suite

## Final Recommendation

Keep this fix: it restores required persistence context for program runs while preserving single-owner timer navigation. Continue to treat the Jest App test failure as an environment-only issue.

---

If you want, I can add a focused integration test that simulates a main-card run start and verifies `recordWorkoutInAttempt` is invoked on completion (keeps within protected tests and does not change product behavior). Otherwise Phase 24 is complete.
