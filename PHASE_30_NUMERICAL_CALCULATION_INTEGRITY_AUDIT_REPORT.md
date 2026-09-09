# PHASE 30 — NUMERICAL & CALCULATION INTEGRITY AUDIT

Date: 2026-09-09

Status: NO VALID PRODUCTION ISSUE FOUND (see details). Protected suites + numeric vectors: PASS. Full Jest: environment-level failure (RNGestureHandlerModule) — classified as test-harness/environment issue, not production logic.

Summary of actions performed
- Ran TypeScript compile: `npx tsc --noEmit` — PASS
- Ran protected Jest subset (Phase 25–29 suites) plus new numeric vectors test `__tests__/calculation_vectors.test.ts` — PASS (11/11 protected suites; 109 tests passed)
- Ran full Jest smoke run — 12 suites passed, 1 suite failed (`__tests__/App.test.tsx`) due to missing native module `RNGestureHandlerModule` (environment/test-harness issue)
- Added focused numeric verification tests: `__tests__/calculation_vectors.test.ts` (8 numeric assertions) and executed them successfully.

What I tested (scope)
- Calorie calculation: `src/utils/CalorieCalculator.ts` (`calculateCalories`) — cardio vs strength branches, MET lookup, intensity multiplier when `liftedWeightKg` provided, default MET fallback, rounding behavior.
- 1RM / strength calculations: `src/utils/StrengthCalculator.ts` (`calculate1RM`, `calculateAdjusted1RM`, `calculateStrengthRatio`) — Epley formula behavior, zero-edge cases.
- Total volume: `src/utils/StrengthCalculator.ts` (`calculateVolume`) and `SessionSnapshotReader` callers — preference for persisted `session.totalVolume` then recompute from `exerciseLifts` when snapshot missing (snapshot-first contract inspected across screens).
- DSI: `src/utils/StrengthCalculator.ts` (`calculateDSI`) — per-lift 1RM→ratio averaging; behavior for multiple lifts and body-weight defaults.
- OVR: `src/constants/collectibleWorkouts.ts` (`calculateOVR`) — weighted sum using `SPLIT_WEIGHTS` per position, normalization and rounding; authoritative function for base OVR.
- Snapshot-derived historical values: `src/utils/SnapshotCalorieReader.ts` and `src/utils/SessionSnapshotReader.ts` — confirmed snapshot-first precedence used by UI readers.
- Active/rest time: inspected `TimerScreen` persistence (avgGreenLoopTime/avgRedLoopTime, greenLoopTimes/redLoopTimes) and `getActiveTime`/`getRestTime` accessors that normalize precedence.

Numeric vectors executed
- `calculate1RM(100,10)` → ~133.3333 (Epley) — PASS
- `calculate1RM(0,5)` and `calculate1RM(100,0)` → 0 (edge) — PASS
- `calculateVolume(3,8,50)` → 1200 — PASS
- `calculateCalories({workoutId:'outdoor_run', durationSeconds:3600, bodyWeightKg:70})` → 686 (MET 9.8) — PASS
- `calculateCalories` strength example (`bench_press`, 1h, 80kg body, liftedWeightKg=100) → 720 — PASS
- `calculateCalories` unknown activity fallback for 30min @70kg → 158 (rounded) — PASS
- `calculateDSI` example with two lifts → ~1.3625 — PASS
- `calculateOVR` for provided `push_chaos` baseStats → 92 (rounded weighted) — PASS

Protected test results
- Protected subset (listed as Phase 25–29 protected suites) plus new numeric vectors: ALL PASSED.
  - Test suites run: `mainCardIdempotency`, `calculateOVR`, `phase5d_parity`, `historicalCalorieSnapshot`, `ovr_ui_integration`, `phase5b_reader_migration`, `bodyWeightCalorieIntegration`, `bodyWeightCalorieAudit`, `historicalStrengthReader`, `bodyWeightPersistence`, and `calculation_vectors`.
  - Outcome: 11/11 protected suites passed; 109 tests passed in total.

Full Jest smoke run
- Outcome: 12 suites passed, 1 failed (`__tests__/App.test.tsx`). Failure is:
  - Invariant Violation: TurboModuleRegistry.getEnforcing(...): 'RNGestureHandlerModule' could not be found.
  - This indicates a missing native module in the Jest/native test harness (react-native-gesture-handler native integration) rather than a production JS logic regression.
- Classification: environment/test-harness issue. Do NOT modify production code to silence this harness failure.

Evaluation of calculation areas (detailed)

1) Calorie calculation
- Authority: `calculateCalories` in `src/utils/CalorieCalculator.ts` is the canonical implementation and is widely used by UI readers as a fallback when `session.calories` is missing.
- Observations: cardio activities use MET table; strength activities apply intensity multiplier when `liftedWeightKg` provided; final value rounded via `Math.round` before persisted. Tests confirm expected numeric outputs and rounding.
- Risk: low. No discrepancy found between implementation and documented formulas or expected hand calculations.

2) 1RM / strength calculation
- Authority: `calculate1RM` (Epley) in `src/utils/StrengthCalculator.ts`.
- Observations: handles zero/invalid inputs by returning 0; adjusted 1RM via RPE uses `calculateAdjusted1RM`. Numeric vectors confirm Epley outputs.
- Risk: low. No production bug found.

3) Total volume
- Authority: persisted `session.totalVolume` (Timer save) is authoritative for historical views; when missing readers recompute using `exerciseLifts` via `calculateVolume`.
- Observations: code bases and readers follow snapshot-first precedence. Numeric checks of `calculateVolume` passed.
- Risk: medium-low for legacy sessions missing `totalVolume` (policy) but this is a design/data-migration concern, not a calculation bug.

4) DSI
- Authority: `calculateDSI` in `src/utils/StrengthCalculator.ts`.
- Observations: DSI computed as average of per-lift (1RM/bodyWeight). Numeric vector validated expected behavior.
- Edge: returns 0 when lifts empty or body weight invalid — tests confirm.

5) OVR
- Authority: `calculateOVR` in `src/constants/collectibleWorkouts.ts` (SPLIT_WEIGHTS per position). This is the authoritative function for base OVR used across UI and ranking.
- Observations: function applies weighted sum and rounding, capping at 99. Numeric vector for `push_chaos` matched expected rounding.

6) Snapshot-derived historical values
- Authority: `TimerScreen.saveWorkoutSummary` creates snapshots; `SnapshotCalorieReader.getSessionCalories` and `SessionSnapshotReader` helpers are the canonical readers.
- Observations: snapshot-first precedence holds across UI. Tests and code review confirm readers prefer persisted snapshot fields and only recompute when snapshot missing.
- Risk: low. No evidence of recomputation accidentally overwriting historical truth.

7) Active/rest time
- Authority: `avgGreenLoopTime`/`avgRedLoopTime`, `greenLoopTimes`/`redLoopTimes`, and accessor `getActiveTime`/`getRestTime` in `SessionSnapshotReader`.
- Observations: accessors provide fallback precedence (persisted `activeTime` → `avgGreenLoopTime` → average of `greenLoopTimes`). No calculation bug found; loop-average math validated in Timer save code and tests.

8) Duplicate calculation risk / edge cases
- Reviewed code for places where calculations might use current workout settings instead of saved snapshot values. Confirmed most UI readers call snapshot accessors and avoid using current mutable settings for historical values.
- Edge cases (zero weights, zero reps, missing body weight) are handled defensively in strength and calorie helpers (return 0 or fallback default body weight where appropriate).

9) Calculation authority ownership
- Ownership map verified: `calculateCalories`, `calculate1RM`, `calculateVolume`, `calculateDSI`, and `calculateOVR` are authoritative single-source helpers. `TimerScreen` is owner of snapshot creation. `SessionSnapshotReader` and `SnapshotCalorieReader` are the canonical readers for historical displays.

Conclusion — production bug hunt
- Result: No failing numeric vectors or protected test assertions exposed a real, provable production calculation/integrity bug.
- Therefore: NO VALID PRODUCTION ISSUE FOUND for numerical/calculation integrity in Phase 30.

Actions taken
- Added `__tests__/calculation_vectors.test.ts` (8 targeted numeric assertions) and executed it.
- Executed TypeScript compile and protected Jest subset; all passed.
- Executed full Jest smoke; saw one environment-level failure. Classified it as a test harness/native module issue. No production code changes made to address that.

If a real production calculation bug is later reported
- Procedure to follow (kept as guardrail): choose a single provable issue, add minimal fix + regression test, run tsc + protected Jest + full Jest, and document thoroughly.

Phase 30 final risk assessment
- Overall risk to numeric integrity: Low.
  - Calorie, strength, volume, DSI, and OVR functions behave according to documented formulas and passed numeric vectors.
  - Snapshot-first contract is respected by readers; historical truth preserved.
  - Edge cases handled defensively.
- Remaining recommendations (non-blocking):
  - Consider adding an automated integration test to simulate Timer start → back → start same workout to assert `timerKey` reset behavior (Phase 28 change already applied).
  - Consider documenting or backfilling `totalVolume` for legacy sessions if product team desires uniform historical availability (design decision, not a bug fix).

Artifacts created
- `__tests__/calculation_vectors.test.ts` — small numeric vector suite (added and executed)
- `PHASE_30_NUMERICAL_CALCULATION_INTEGRITY_AUDIT_REPORT.md` (this file)

Signed-off-by: Phase 30 audit runner
