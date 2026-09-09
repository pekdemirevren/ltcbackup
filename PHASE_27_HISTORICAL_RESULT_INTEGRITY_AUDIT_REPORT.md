# PHASE 27 — HISTORICAL RESULT & COMPLETION INTEGRITY AUDIT

## Phase 27 Status

Status: NO VALID PRODUCTION ISSUE FOUND (no new production fixes required).

This phase audited end-to-end historical result correctness: Timer completion → snapshot persistence → SessionSnapshotReader → UI surfaces → progression. The evidence-gated methodology from prior phases was followed. No Git/GitHub operations were performed.

## Audit Scope

Files inspected (representative):
- `src/screens/TimerScreen.tsx` (completion & save flow)
- `src/contexts/TimerContext.tsx` (start/navigation propagation)
- `src/utils/SessionSnapshotReader.ts` (snapshot-first readers)
- `src/utils/SnapshotCalorieReader.ts` (calorie snapshot helper)
- `src/screens/WorkoutSummaryScreen.tsx`, `src/screens/DailySummaryDetailScreen.tsx`, `src/screens/TrendsScreen.tsx` (historical UI)
- `src/utils/MainCardAttemptManager.ts` and `src/utils/MainCardEngine.ts` (attempt processing, `processedAttemptIds`)
- Relevant tests in `__tests__/*.test.ts`

## Historical Truth Model

- The system follows a snapshot-first policy: session snapshots persisted at save-time (fields such as `calories`, `bodyWeightKg`, `totalVolume`, `elapsedTime`, `greenLoopTimes`, `redLoopTimes`, `completedSets`, `completedReps`) are authoritative for historical displays.
- `SessionSnapshotReader` enforces precedence: snapshot → recorded per-exercise fields → insufficient. `SnapshotCalorieReader.getSessionCalories` prefers `session.calories` when present.

## Findings (summary)

1. Session snapshot creation: `TimerScreen.saveWorkoutSummary` constructs a `summary` object that includes authoritative snapshot fields (calories, bodyWeightKg, totalVolume, loop times, completedSets/reps) and appends it to `workoutSummaries` in AsyncStorage. The `date` field uses `new Date().toISOString()` at save time — representing completion timestamp.

2. Historical reading: UI readers (`WorkoutSummaryScreen`, `DailySummaryDetailScreen`, `SessionsCard`, `AddSummaryCardModal`, Trends) consistently call `SessionSnapshotReader` (or `getSessionCalories`) to resolve authoritative historical metrics. Multiple screens use `getTotalVolume`, `get1RM`, `getDSIForSession`, and `getActiveTime` which follow snapshot-first precedence.

3. Mutability: Readers do not reconstruct historical metrics from current mutable workout templates or current user body-weight. `WorkoutSummaryScreen` does display `item.settings?.weight` as a metadata field (saved in the snapshot's `settings` object) but volume/calories/1RM/DSI are read via snapshot-first helpers.

4. Idempotency / duplicates: Prior phases (25 and 26) addressed two real issues:
   - Phase 25: `recordWorkoutInAttempt` was fixed to avoid pushing duplicate metrics into an attempt's metrics list when the same workout is recorded multiple times.
   - Phase 26: `TimerScreen` received a minimal guard (`workoutSavedRef`) to prevent duplicate `saveWorkoutSummary` invocation for the same completion run.

   These prior fixes reduce the practical risk of duplicate snapshots and duplicate metrics at the attempt-processing layer.

## Evidence (code pointers)

- `TimerScreen.saveWorkoutSummary` (src/screens/TimerScreen.tsx): constructs `summary` with `date`, `workoutId`, `workoutName`, `elapsedTime`, `completedSets`, `completedReps`, `totalVolume`, `calories`, `bodyWeightKg`, `greenLoopTimes`, `redLoopTimes`, and persists to AsyncStorage key `workoutSummaries`.

- `SessionSnapshotReader.getTotalVolume` / `get1RM` / `getDSIForSession` (src/utils/SessionSnapshotReader.ts): snapshot-first readers used by multiple UI components.

- `SnapshotCalorieReader.getSessionCalories` (src/utils/SnapshotCalorieReader.ts): returns `session.calories` if present otherwise computes via `calculateCalories`.

- `WorkoutSummaryScreen` and `DailySummaryDetailScreen` import and use `getTotalVolume`, `getCalories`, `getActiveTime`, and other snapshot readers — demonstrating consistent snapshot usage across UI surfaces.

- `MainCardEngine.processMainCardRun` checks `processedAttemptIds` to avoid double processing of the same attempt id.

- Tests: `__tests__/historicalCalorieSnapshot.test.ts`, `__tests__/historicalStrengthReader.test.ts`, `__tests__/mainCardIdempotency.test.ts`, `__tests__/mainCardAttemptPropagation.test.ts` validate snapshot precedence and idempotency mechanics. All these tests passed in local runs.

## Root Cause Analysis

- No new root cause for historical inconsistency was found. The codebase adheres to the snapshot-first policy and readers consistently prefer persisted snapshot fields.
- The only real production risks previously found (duplicate metrics in attempt metrics list; duplicate save calls) were already fixed in Phase 25 and Phase 26 respectively.

## Why NO VALID PRODUCTION ISSUE FOUND

- All historical read paths use `SessionSnapshotReader` or `getSessionCalories` which enforce snapshot-first precedence.
- Snapshot persistence in `TimerScreen` includes the key authoritative fields at save-time (body weight, calories, volume, loop times, sets/reps).
- Protected tests that encode the historical immutability assumptions passed.
- Idempotency protections exist at the `MainCardEngine` level (`processedAttemptIds`) and duplicate-metrics and duplicate-save vectors were mitigated in earlier phases.

Therefore there is no additional single production bug in this phase that satisfies the evidence-gated selection criteria.

## Minimal implementation considered

- No production code changes were required in Phase 27. (Previous changes from Phase 25 and 26 remain appropriate and minimal.)

## Before / After Behavior

- No change required. Existing behavior already persisted authoritative snapshots and readers consumed them.

## Historical Integrity

- Preserved: historical snapshots remain authoritative and are not recomputed from current settings.

## Calculation Integrity

- Preserved: no formulas changed. `calculateCalories`, strength formulas, and `calculateOVR` remain authoritative.

## Persistence Integrity

- Preserved: no schema changes or migrations. Persistence keys unchanged.

## Idempotency Integrity

- Preserved and improved: prior-phase fixes ensure duplicate metrics and duplicate saves are reduced; `processedAttemptIds` continues to guard run processing.

## Planned vs Historical Separation

- Preserved: planned events and workout day data are used for planning views only; actual historical aggregations use persisted sessions.

## Protected Contracts

- All protected contracts listed in the Phase 27 brief were respected.

## Regression Tests Run

- TypeScript: `npx tsc --noEmit` — PASS
- Protected Jest suites (selected): ran the list in the brief including `mainCardAttemptPropagation.test.ts` — PASS (11/11, 102 tests)
- Full Jest: not executed in this run; environment-only failures (if any) should be classified separately and not fixed via production code changes.

## Bugs Fixed (previous phases relevance)

- Phase 25: Prevented duplicate metrics being stored in attempt metrics list.
- Phase 26: Prevented duplicate `saveWorkoutSummary` runs within the same Timer run via `workoutSavedRef` guard.

Both fixes were applied in prior phases and validated by tests included in this run.

## Remaining Technical Debt

- Consider adding a focused integration test simulating concurrent duplicate saves to assert only one `workoutSummaries` entry is written; currently protected tests provide comparable coverage and the guard is straightforward.
- Consider eventual backfill of legacy sessions to include `totalVolume` or `bodyWeightKg` where missing — requires migration design and approval.

## Risk Assessment

Risk: Low — no new changes required. Previously applied minimal fixes reduced data-quality risks.

## Final Recommendation

No change required in production code for Phase 27. Continue with Phase 6C planning for snapshot readers and later planned improvements per `PHASE_6B_CALCULATION_PROGRESSION_SPEC.md`.

---

If you want, I can add the optional focused integration test that simulates two concurrent `saveWorkoutSummary` calls and asserts only a single `workoutSummaries` entry is created. Otherwise Phase 27 is complete.
