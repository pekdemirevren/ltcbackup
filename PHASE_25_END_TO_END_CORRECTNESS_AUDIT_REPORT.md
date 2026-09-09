# PHASE 25 — END-TO-END WORKOUT CORRECTNESS AUDIT

## Phase 25 Status

Status: FIXED (one real production correctness bug found and minimally fixed).

This phase audited the Main Card → Timer → completion → attempt propagation → recordWorkflowInAttempt → persistence chain end-to-end following prior phase methodology. No Git/GitHub operations performed. Protected contracts preserved.

## Audit Scope

Files inspected:
- `src/screens/MainCardDetailScreen.tsx` — start path and attempt creation
- `src/contexts/TimerContext.tsx` — timer start ownership and navigation params
- `src/screens/TimerScreen.tsx` — saveWorkoutSummary (completion/persistence)
- `src/utils/MainCardAttemptManager.ts` — `recordWorkoutInAttempt`
- `src/utils/MainCardEngine.ts` — `processMainCardRun`, `processedAttemptIds`

Protected areas respected: historical snapshot semantics, `processedAttemptIds`, `MainCardEngine` formulas and logic, persistence schema.

## Findings (Primary)

Real production issue found (single bug):

- Symptom: If a workout save path invoked `recordWorkoutInAttempt` multiple times for the same workout (e.g., due to double-tap, duplicate navigation, or reentrant saves), the attempt's metrics list could contain duplicate SessionMetrics entries. This inflates the `workoutMetrics` array passed into `processMainCardRun` and can cause incorrect gains/XP calculations when a full run is processed.

- Root cause: `recordWorkoutInAttempt` always pushed a new metrics entry into the attempt's metrics list (`*_metrics`) regardless of whether `attempt.completedWorkouts` already included the `workoutId`. The function did protect double-add of `completedWorkouts`, but metrics push was unconditional, allowing duplicate metric records for the same workout.

- Why this is production-impacting: Duplicated metrics will over-count the contribution of repeated (or double-saved) workouts when `processMainCardRun` aggregates metrics for the attempt. That can lead to inflated gains, XP/leveling discrepancies, and historical inconsistency — a correctness issue.

## Secondary audit points (checked)

- `MainCardDetailScreen` correctly creates/starts attempts via `startMainCardAttempt` and passes `mainCardId` and `attemptId` to `TimerContext.startTimerWithWorkoutSettings`.
- `TimerContext` correctly forwards `mainCardId` and `attemptId` into `navigation.navigate('Timer', params)`.
- `TimerScreen` reads `mainCardId` and `attemptId` from `route.params` and conditionally calls `recordWorkoutInAttempt` when `mainCardId` is present.
- `MainCardEngine.processMainCardRun` honors `ctx.attemptId` and uses `processedAttemptIds` to avoid double-processing of the same attempt; tests already existed for this contract and remain passing.
- Potential double-save vectors exist (UI double-tap, reentrant navigation), so backend dedup of persisted metrics is necessary.

## Selected Fix (minimal)

Applied a single, minimal change to `recordWorkoutInAttempt` in `src/utils/MainCardAttemptManager.ts`:

- Compute whether this call is the first completion of `workoutId` for the attempt (isNewCompletion).
- Only push the session metrics into the attempt's metrics list when `isNewCompletion` is true.
- Still update `attempt.completedWorkouts` and preserve `processMainCardRun` invocation logic.

Rationale: This prevents duplicate metric entries without changing persisted schema or adding new fields. It is minimal and preserves idempotency semantics and protected contracts.

Patch applied:
- File changed: `src/utils/MainCardAttemptManager.ts` — conditionalize metrics push on new completion.

## Tests Added

A focused integration test was added to validate the fix and the attempt propagation behavior:
- `__tests__/mainCardAttemptPropagation.test.ts`
  - Seeds a fake main-card attempt and main_card_state in mocked AsyncStorage.
  - Calls `recordWorkoutInAttempt('cardA', 'w1', sessionData)` twice.
  - Asserts that the metrics list (`main_card_attempt_<attemptId>_metrics`) contains only one entry (no duplicate metrics pushed) and that `completedWorkouts` contains `w1` only once.

Existing protected tests that verify `processMainCardRun` idempotency were also run.

## Validation

Commands executed (local development):

- TypeScript compile

  npx tsc --noEmit

  Result: PASS (no compile errors)

- Protected Jest suite + new focused test

  npx jest --runInBand --watch=false [protected tests list + new test]

  Result: PASS — all protected suites passed (11/11, 102 tests)

- Full Jest suite: not run in this phase (unchanged). If `__tests__/App.test.tsx` environment-only failure appears, treat as environment issue and do not modify production code to silence it.

## Behavior Changed

- Before: `recordWorkoutInAttempt` unconditionally appended a metrics entry; duplicate saves could create duplicate metrics entries.
- After: metrics appended only the first time the workout is recorded for that attempt — prevents duplicate metrics without changing schema.

Functional surface preserved: `processMainCardRun` still receives metrics for each completed workout in the attempt; idempotency of run processing via `processedAttemptIds` remains unchanged.

## Historical / Persistence Integrity

- No persisted schema changed.
- No migrations executed.
- `workoutSummaries` snapshots are untouched.
- `processedAttemptIds` semantics preserved.

## Risk Assessment

Risk: Low — the change is localized and conservative. Covered by new and existing tests.

## Remaining Technical Debt / Recommendations

- Consider adding a brief guard in `TimerScreen.saveWorkoutSummary` to ensure `recordWorkoutInAttempt` is not called concurrently (e.g., set a local in-progress flag) to reduce DB churn and avoid racing writes. This is optional because the manager now prevents duplicate metrics, but it would reduce write volume.
- Consider enriching stored metrics entries with a `workoutId` tag in the future (schema change + migration) to make metric provenance explicit.

## Final Recommendation

Keep the fix. It restores end-to-end correctness for the Main Card run path and prevents duplicate metric inflation while keeping protected contracts intact.

---

If you want, I can also add the small `TimerScreen`-side guard to prevent concurrent save calls (UI-level protection). That would be an additional, small change but is not required given this fix.
