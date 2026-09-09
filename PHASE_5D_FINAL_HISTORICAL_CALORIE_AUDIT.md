# PHASE 5D — FINAL HISTORICAL CALORIE CONSISTENCY AUDIT

Date: 2026-09-08

Purpose
-------
Read-only final audit of Phase 5A/5B/5C snapshot contract and current readers. No production files were modified.

Audit scope
-----------
- Classify every `calculateCalories(` call under `src/` and every historical-calorie reader/aggregator.
- Verify snapshot precedence, zero preservation, invalid-snapshot fallback, legacy fallback, and body-weight immutability at read time.
- Produce file/line-level findings and list any real consistency gaps that require surgical fixes.

Summary findings (short)
------------------------
- Session save: `TimerScreen.saveWorkoutSummary()` creates immutable `calories` and `bodyWeightKg` snapshots (Phase 5A) — OK.
- Most historical readers/aggregations prefer the snapshot via `getSessionCalories(session.calories, opts)` — OK.
- `totalEstimatedKcal` is only produced at save time and is not read by readers — OK (no accidental usage found).
- `0` snapshot is preserved by `getSessionCalories` and does NOT trigger fallback — OK.
- Invalid snapshots (NaN, Infinity, -Infinity, null, string) correctly fall back to live calculation — OK.
- One inconsistency found: a small set of aggregation codepaths calculate aggregated energy from summed durations via `calculateCalories(...)` instead of aggregating session snapshots. This may produce values that differ from the sum of authoritative snapshots. See details below.

Audit matrix (file-level)
-------------------------
- src/screens/TimerScreen.tsx — save-time snapshot
  - Lines: ~320–380 (saveWorkoutSummary)
  - Behavior: calculates real calories at save time using resolved `userBodyWeight` and stores `calories` and `bodyWeightKg` on the persisted summary object. Immutable snapshot contract satisfied.
  - Classification: Session save (Phase 5A implementation).

- src/utils/SnapshotCalorieReader.ts — snapshot helper
  - Lines: entire file
  - Behavior: authoritative helper: returns persisted `session.calories` only if typeof number && Number.isFinite(...), otherwise falls back to `calculateCalories(calculateOptions)`.
  - Classification: Historical reader helper (enforces snapshot precedence). Good: accepts 0, rejects numeric strings, Infinity, NaN, null, undefined.

- src/components/Summary/SessionsCard.tsx — small session displays (square/list)
  - Lines: use of `getSessionCalories(...)` at two places (square top and list items)
  - Behavior: uses `session.bodyWeightKg ?? session.settings?.bodyWeight ?? DEFAULT_BODY_WEIGHT_KG` when calculating fallback. Uses `getSessionCalories(session.calories, opts)`.
  - Classification: Historical session display → snapshot preferred.

- src/screens/WorkoutSummaryScreen.tsx — per-session summary card
  - Lines: SummaryCard uses `getSessionCalories(item.calories, {...})` (after fetching AsyncStorage `userBodyWeight` for fallback).
  - Classification: Historical session display → snapshot preferred.

- src/screens/SessionsScreen.tsx — sessions list + grouping
  - Lines: mapping in `loadSessions()` uses `getSessionCalories(item.calories, opts)` and rounds the returned value for display.
  - Classification: Historical session aggregation/display → snapshot preferred.

- src/components/AddSummaryCardModal.tsx — home/trends widgets aggregations
  - Lines: many (multiple aggregations use `getSessionCalories(s.calories, opts)` to accumulate hourly/day totals)
  - Classification: Aggregation/trends → snapshot preferred.

- src/screens/TrendsScreen.tsx — trend averages, grouped by day
  - Lines: `getSessionCalories(s.calories, opts)` inside `getPeriodData()` grouped aggregation; `s.activeCalories` used if present first. Grouped/day-level aggregation uses `getSessionCalories`.
  - Classification: Aggregation/trends → snapshot preferred.

- src/screens/MoveScreen.tsx — monthly/weekly/yearly aggregations
  - Lines: `getCalories(s)` uses `getSessionCalories(s.calories, opts)` (prefers `s.activeCalories` if present). Monthly/weekly aggregations use that helper.
  - Classification: Aggregation/trends → snapshot preferred.

- src/screens/SharingScreen.tsx — share last workout
  - Lines: `loadLastWorkoutData()` uses `getSessionCalories(lastSession.calories, opts)` and then `Math.round` before putting into share card.
  - Classification: Individual historical display → snapshot preferred.

- src/screens/WorkoutCategoryDetailScreen.tsx — per-category aggregations and weekly energy
  - Lines: session loop uses `const energy = Math.round(getSessionCalories(s.calories, opts))` when accumulating weekly/day totals (GOOD - snapshot precedence).
  - BUT: When building `setStats({ ... })` the `energy` field is computed with a direct call to `calculateCalories({ workoutId: ..., durationSeconds: wTodayElapsed, bodyWeightKg: userBodyWeightKg, liftedWeightKg: ..., reps })`. This computes an aggregated energy from summed duration/volume rather than summing session snapshots. See lines around `energy: Math.round(calculateCalories({ ... }))`.
  - Classification: Mixed — session-level snapshot usage is correct; top-level `energy` uses `calculateCalories` (live recomputation) → potential consistency gap.
  - Impact: For days where some sessions have authoritative snapshots, `weeklyEnergy` (which sums per-session snapshot `energy`) may not equal the `energy` field derived by `calculateCalories(...)` over aggregated duration. This can produce inconsistent numbers across screens.

- src/screens/SummaryScreen.tsx & src/screens/SummaryScreen2.tsx — sample/live preview widgets
  - Lines: each calls `calculateCalories({...})` with current stored `userBodyWeight` to show an example estimate (not reading persisted sessions).
  - Classification: Live preview / live calculation only — intentional and expected.

- src/utils/CalorieCalculator.ts — calculation implementation
  - Lines: implementation of `calculateCalories(options)` and exported `CalculateCaloriesOptions` type.
  - Classification: Calculation engine; used both for live calculation & as fallback in SnapshotCalorieReader.

- Other callers / findings via grep
  - `grep -R "calculateCalories(" src` matched only the files above (TimerScreen, SummaryScreen, SummaryScreen2, WorkoutCategoryDetailScreen, SnapshotCalorieReader, CalorieCalculator). All other historical readers use `getSessionCalories`.

Special fields check
--------------------
- `totalEstimatedKcal` — only assigned in `TimerScreen.saveWorkoutSummary()` and persisted. No readers reference it (grep shows no reads). Conclusion: legacy mock field exists but is not used.

- `activeCalories` — where present, readers prefer it before snapshot: e.g. `s.activeCalories ? parseFloat(s.activeCalories) : getSessionCalories(...)`. This behavior is preserved (activeCalories still takes precedence where used). This is a separate backward-compatibility detail; no change required here.

Contract behavior checks
------------------------
- `0` snapshot: `getSessionCalories(0, opts)` returns 0 — verified by tests and by implementation (typeof number && Number.isFinite). OK.
- Invalid snapshot types: numeric strings, NaN, Infinity, -Infinity, null, undefined, objects, arrays — all fall back to live calculation via `calculateCalories`. OK.
- Body-weight change immutability: readers use persisted `session.calories` when present; changing `userBodyWeight` in AsyncStorage only affects fallback calculations (legacy sessions). Verified by code and tests. OK.

Consistency gaps (real issues to fix)
-------------------------------------
1) WorkoutCategoryDetailScreen — top-level `energy` field uses `calculateCalories` applied to aggregated `wTodayElapsed` and aggregated estimated lifted weight (wTodayVolume derived) instead of summing per-session authoritative snapshots. This can create cross-screen inconsistencies between:
   - the per-session lists/trends that sum `getSessionCalories(session.calories, ...)` and
   - the category `energy` field which recomputes from aggregated duration/volume.

   Recommendation: replace the `energy: Math.round(calculateCalories(...))` line with a derived value that sums per-session `getSessionCalories(...)` (or prefer weeklyEnergyData that is already computed). Surgical fix: compute `energy` as `weeklyEnergyData.reduce((a,b)=>a+b,0)` or reuse the `weeklyEnergy` aggregate computed earlier. This keeps snapshot precedence and avoids recalculation drift.

2) Search for any other calculated aggregates that compute calories from summed durations rather than summing session snapshots. The grep results show no other `calculateCalories` calls in aggregation paths besides SummaryScreen (preview) and SummaryScreen2 (preview). So the above is the primary operational gap.

Cross-screen parity
-------------------
- With current code (read-only), the authoritative per-session displays (SessionsScreen, SessionsCard, WorkoutSummaryScreen, SharingScreen, MoveScreen, TrendsScreen, AddSummaryCardModal) use `getSessionCalories(session.calories, ...)` and will display persisted snapshot when present.
- The one stray aggregated `energy` field in `WorkoutCategoryDetailScreen` may differ from the sum of session snapshots for the same time window. This is the only cross-screen parity risk found in this audit.

Mixed historical data aggregation tests (scenario)
-------------------------------------------------
- The code paths that perform mixed aggregation (some sessions with snapshots, some legacy) use `getSessionCalories` per session; therefore mixed aggregation results are deterministic: snapshots are used when present and legacy sessions fallback to live calculation using current body weight. `0` snapshots are preserved.

Recommendations (read-only → implementation plan)
-------------------------------------------------
Phase 5D's goal is a final consistency gate. Based on the read-only audit, the minimal surgical change set is:

1. Fix: WorkoutCategoryDetailScreen energy field (one-line change)
   - Replace direct `calculateCalories({ durationSeconds: wTodayElapsed, ... })` with a sum of per-session snapshot energies already computed in the function (weeklyEnergyData or weeklyEnergy aggregate).
   - Rationale: ensures `energy` equals the sum of authoritative session snapshots or the sum of per-session fallbacks.

2. (Optional) Add a small code comment in any aggregation that computes energy to prefer per-session `getSessionCalories` sums rather than doing a one-shot `calculateCalories` on aggregated duration. This avoids future regressions.

3. Add cross-screen parity Jest tests (Phase 5D test suite) that create a persisted session object with `calories` and `bodyWeightKg` and assert that all historical readers (SessionsCard, WorkoutSummaryScreen, Trends, Move, Sharing, Category, Dashboard) show identical calorie values for that session. Also test the mixed legacy/new aggregation scenario including a `0` snapshot.

Next actions (per your requested workflow)
-----------------------------------------
- I created this read-only audit and classified every calorie reader/call under `src/`.
- I located one real consistency gap (WorkoutCategoryDetailScreen `energy` recompute). All other readers prefer snapshots via `getSessionCalories`.

If you want, next I will:
- Create the `PHASE_5D_FINAL_HISTORICAL_CALORIE_AUDIT.md` file (this file) — done.
- Create a short branch-limited patch suggestion for the single surgical fix in `WorkoutCategoryDetailScreen.tsx` (only if you approve making a change). I will not change code until you say so.
- Or I can add the cross-screen parity Jest tests (read-only changes to test files only) to demonstrate parity before any production change.

Status & todo update
--------------------
I updated the Phase 5D todo list; current state:
- Code search: completed
- Open reader files: completed
- Classification: completed
- Create audit report: completed (this file)
- Next (awaiting your instruction): implement fixes or add parity tests.

End of audit. 

