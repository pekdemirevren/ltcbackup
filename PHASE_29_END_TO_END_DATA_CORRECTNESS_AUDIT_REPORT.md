# PHASE 29 — END-TO-END DATA CORRECTNESS AUDIT

## Phase 29 Status

NO VALID PRODUCTION ISSUE FOUND

## Summary
I audited the full end-to-end workout result flow (plan → timer → input → completion → snapshot → persistence → readers → calculations → UI) with the explicit constraint of making at most one production change only if a provable production bug is found. After repository inspection, file-level reads, and test runs, I did not find a reproducible, provable production correctness bug that requires a production code change.

Protected validations performed during this audit:
- TypeScript compile: `npx tsc --noEmit` — PASS
- Protected Jest subset (11 suites) — PASS (11/11 suites, 102 tests)

Full Jest run outcome:
- Full test suite run: 12 suites
  - 11 passed, 1 failed
  - Failure is an environment/native test harness error (missing native module `RNGestureHandlerModule`) during `__tests__/App.test.tsx` execution. This is a test-environment issue, not a production logic regression.

See "Tests" section below for full logs.

## Audit Scope
Files inspected (high-level):
- src/screens/TimerScreen.tsx
- src/contexts/TimerContext.tsx
- src/utils/MainCardAttemptManager.ts
- src/utils/MainCardEngine.ts
- src/utils/SessionSnapshotReader.ts
- src/utils/SnapshotCalorieReader.ts
- src/utils/CalorieCalculator.ts
- UI readers/screens: `WorkoutSummaryScreen`, `DailySummaryDetailScreen`, `SessionsScreen`, Trends screens
- Calendar/event screens: `CreateWorkoutEventScreen`, `DailySummaryDetailScreen`
- AsyncStorage usage for `workoutSummaries`, `main_card_state_<id>`, `@workout_calendar_events`

I searched for the provided keywords and read the critical reader/persistence/attempt/timer files listed in the Phase 29 instructions.

## State Ownership Map (high level)
- Snapshot/historical metrics (calories, totalVolume, activeTime/restTime, completedSets/reps, exerciseLifts, bodyWeightKg): Source = `TimerScreen.saveWorkoutSummary` (snapshot persisted to `workoutSummaries`). Owner = Timer run at save-time. Readers = `SessionSnapshotReader` helpers (getCalories/getTotalVolume/getActiveTime/getRestTime/get1RM/getDSIForSession) used across UI.
- Calories: authority = persisted `session.calories` (SnapshotCalorieReader.getSessionCalories). Fallback = `calculateCalories` using persisted `bodyWeightKg` or stored body weight.
- Volume: authority = `session.totalVolume` if present; fallback = compute from `exerciseLifts` or recorded session fields.
- Main Card attempts: Owner/writer = `MainCardAttemptManager` / `MainCardEngine.processMainCardRun`. Dedup/idempotency guards: `attempt.completedWorkouts` and `processedAttemptIds`.
- Timer runtime: Owner = `TimerScreen` (ephemeral); intent to start a fresh run signalled by `TimerContext.timerKey`.
- Calendar events: Owner = calendar screens using `@workout_calendar_events`.

## Data Lineage Trace (example workout)
Workout A → 3 sets × 8 reps × 50 kg
- Timer collects loop times, completedSets/completedReps, optionally exerciseLifts or liftedWeightKg.
- On completion, `TimerScreen.saveWorkoutSummary` builds `summary` containing: date, workoutId, workoutName, elapsedTime, completedSets, completedReps, totalVolume, calories (Math.round), bodyWeightKg, greenLoopTimes/redLoopTimes, exerciseLifts where available. It appends to AsyncStorage key `workoutSummaries`.
- Readers call `SessionSnapshotReader` helpers which follow snapshot-first precedence (use persisted `session.calories`/`totalVolume` when present; otherwise recompute from recorded fields).
- `recordWorkoutInAttempt` (if mainCard params present) writes attempt metrics and guarded `completedWorkouts` push. `processMainCardRun` consumes attempt metrics and uses `processedAttemptIds` to avoid double-processing.
- `calculateOVR` is used for OVR calculations where needed (authoritative function present and tested).

At each step I verified:
- No evidence that historical snapshot fields are recomputed using current settings (Snapshot-first readers are used across UI).
- No evidence that changing current body weight or workout settings retroactively alters persisted session.calories when `session.calories` exists (SnapshotCalorieReader respects persisted value).
- Total volume and 1RM readers use snapshot-first logic and fallbacks consistent with spec.

## Previous Phase Fixes Verification
- Phase 25 (`recordWorkoutInAttempt` duplicate metrics): Verified the manager prevents duplicate metric pushes when a workout is already recorded in `attempt.completedWorkouts`. Protected tests (`mainCardAttemptPropagation.test.ts`, `mainCardIdempotency.test.ts`) pass.
- Phase 26 (single-save guard in `TimerScreen.saveWorkoutSummary`): `TimerScreen` includes guard refs to avoid re-entrant duplicate saves; protected tests pass.
- Phase 28 (`timerKey` reset): `TimerScreen` observes `timerKey` and resets runtime state when `timerKey` increments; inspection shows `useEffect` depends on `[workoutId, timerKey]`.

All above protections remain in place and no regressions were observed in protected tests.

## Calculation Correctness
- Calories: Authority = `session.calories` when present (via `SnapshotCalorieReader.getSessionCalories`); otherwise `calculateCalories` is used with persisted body weight. Verified readers and UI (`SessionsScreen`, `WorkoutSummaryScreen`, `WorkoutSummary` components) call the snapshot helper.
- Volume: `SessionSnapshotReader.getTotalVolume` uses `session.totalVolume` if present; otherwise computes from `exerciseLifts` or `liftedWeightKg`+sets/reps. UI uses this reader.
- Active/Rest Time: `getActiveTime` / `getRestTime` have snapshot-first precedence and fallbacks (avg loop times or elapsed-minus-rest). UI screens use these helpers.
- 1RM/DSI: `get1RM` and `getDSIForSession` compute from recorded lifts when available; readers are used by strength screens.
- OVR: `calculateOVR` remains authoritative; tests (`calculateOVR.test.ts`) passed.
- XP/Level: XP awarding occurs during `processMainCardRun` and is guarded by `processedAttemptIds` to avoid double-awarding. Main-card tests pass.

No mismatch in authoritative formulas across layers was found.

## Persistence Correctness
- `TimerScreen.saveWorkoutSummary` appends snapshots to `workoutSummaries`. It includes timestamp (ISO string) and persisted snapshot fields.
- Duplicate writes: earlier phases added guards. I reviewed code paths for concurrent writes; primary dedup protections exist in `TimerScreen` (save guard), `MainCardAttemptManager` (metrics dedup), and `MainCardEngine` (`processedAttemptIds`).
- Race conditions that are purely theoretical were not reported as bugs per Phase 29 rules. No reproducible race was found.
- No evidence of session IDs duplication in the code paths inspected.

## Main Card Integrity
- `recordWorkoutInAttempt` prevents duplicate metrics and duplicate `completedWorkouts` entries; tests verify this.
- `processMainCardRun` respects `processedAttemptIds` and is idempotent for the same attempt id; tested and passing.

## Timer Integrity
- Verified `TimerScreen` reset logic depends on `[workoutId, timerKey]` so starting the same workout twice resets runtime state (Phase 28 fix present).
- Save flow continues to set local saved refs to avoid duplicate saves.
- No flaky path reproducing a stale-run leakage was found after the Phase 28 fix.

## Calendar / Event Integrity
- Calendar screens persist events under `@workout_calendar_events` and do not mix planned events into `workoutSummaries` (plausible code paths inspected). Planned events are kept separate and used to launch Timer but do not mutate historical snapshots.
- Multiple same-day events are aggregated in daily readers; recurring edit logic exists and no duplication bug was found.

## Tests
- TypeScript compile: PASS
- Protected Jest subset (explicit list in Phase 29): PASS (11/11 suites, 102 tests)
- Full Jest run: 11 passed, 1 failed — failure due to test environment/native dependency: `Invariant Violation: TurboModuleRegistry.getEnforcing(...): 'RNGestureHandlerModule' could not be found.` This arises in `App.test.tsx` which imports `react-native-gesture-handler` at top-level; in a node/Jest environment without the native module wired, the test fails. This is an environment/native module test harness failure, not a production logic regression. Recommendation: run RN-specific UI test with proper native mocks or exclude App-level integration in pure-JS CI.

Full failing test stack (excerpt):
- Invariant Violation: TurboModuleRegistry.getEnforcing(...): 'RNGestureHandlerModule' could not be found
- Origin: import 'react-native-gesture-handler' at App.tsx top

## Conclusion / Decision Gate
Result: NO VALID PRODUCTION ISSUE FOUND.

Rationale:
- I performed keyword-based scanning, read all relevant reader/persistence/attempt/timer/context files, traced a representative workout end-to-end, and validated protected tests.
- Snapshot-first policy is consistently implemented and used by UI readers (`SessionSnapshotReader` + `SnapshotCalorieReader`).
- Dedup/idempotency protections from previous phases are present and validated by tests.
- The only failing test in the full suite is a native-module/test-harness issue and not a production data correctness regression.
- No production code changes were necessary under Phase 29 rules.

## Areas Verified (high level)
- Historical snapshot creation: PASS
- Readers (snapshot-first): PASS
- Calories persistence & snapshot precedence: PASS
- Volume persistence & fallback computation: PASS
- Active/rest time readers: PASS
- 1RM/DSI readers: PASS
- Main Card idempotency & processedAttemptIds: PASS
- Timer lifecycle and reset (incl. Phase 28 fix): PASS
- Calendar/event ownership and planned vs actual separation: PASS

## Remaining Technical Debt / Recommendations (non-blocking)
- Add a focused integration test that simulates: Start Workout A → Back → Start Workout A again and asserts Timer runtime state resets (protects Phase 28 fix). I can add this if you want.
- Add a focused test that simulates concurrent duplicate `saveWorkoutSummary` calls to assert only one `workoutSummaries` entry is appended (protects Phase 26 reasoning). Optional.
- Consider documenting CI instructions to mock or stub `react-native-gesture-handler` or provide a Jest mock to avoid false negatives in full Jest runs that include `App.test.tsx`.

## Files/Functions of Interest
- src/screens/TimerScreen.tsx — saveWorkoutSummary, runtime reset effect
- src/contexts/TimerContext.tsx — timerKey and startTimer helper functions
- src/utils/MainCardAttemptManager.ts — recordWorkoutInAttempt (dedup guarded)
- src/utils/MainCardEngine.ts — processMainCardRun, processedAttemptIds
- src/utils/SessionSnapshotReader.ts — getCalories/getTotalVolume/getActiveTime/getRestTime/get1RM/getDSIForSession
- src/utils/SnapshotCalorieReader.ts — getSessionCalories (snapshot-first)

## Tests run (summary)
- npx tsc --noEmit: PASS
- Protected Jest subset (explicit list in Phase 29): PASS — 11 suites, 102 tests
- Full Jest: 11 passed, 1 failed — fail is test harness/native module issue (RNGestureHandlerModule missing)

## Final Recommendation
No production code changes required. Phase 29 complete with result: NO VALID PRODUCTION ISSUE FOUND.

---

(If you'd like, I can now add the optional focused integration tests mentioned above and/or add a Jest mock for `react-native-gesture-handler` to allow the full suite to pass in this environment.)
