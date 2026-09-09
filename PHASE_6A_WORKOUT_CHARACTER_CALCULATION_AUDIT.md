# PHASE_6A_WORKOUT_CHARACTER_CALCULATION_AUDIT

Date: 2026-09-08

## 1. Executive Summary

This is a read-only audit of workout, strength, progression, character, OVR and DSI calculations across the repository. No production code was changed.

High-level outcomes (summary):
- Calories system: snapshot-based (Phase 5) — GOOD (persisted at save-time and readers prefer snapshot)
- Strength/Volume/1RM/DSI: mixed — many calculations are derived from saved session fields but multiple screens recompute from current settings or ad-hoc fields (risk of cross-screen mismatch)
- OVR: two implementations present (authoritative position-weighted OVR and an alternate boosted-stat OVR). Both are deterministic; duplication exists.
- Progression/Leveling: implemented and persisted (AsyncStorage) but some UIs use live recomputation or planned-settings for display causing potential drift.
- Rounding: multiple rounding points exist (save-time, engine, UI). No single documented rounding policy.
- Tests: good coverage for OVR and calorie persistence; partial coverage for DSI/strength; progression/LevelSystem/MainCard engine have limited unit tests.

Overall PHASE 6A verdict: NEEDS REVIEW — several areas where historical consistency and duplicated calculations can cause cross-screen mismatches.


## 2. Calculation Architecture (high-level)

Primary calculators discovered:
- src/utils/CalorieCalculator.ts — MET-based calorie estimator (calculateCalories)
- src/utils/StrengthCalculator.ts — 1RM (Epley), strength ratio, calculateVolume, DSI/WSI
- src/utils/WorkoutCalculator.ts — exercise metric generator (weight/sets/reps/rest) derived from character stats
- src/constants/collectibleWorkouts.ts — calculateOVR (position-weighted OVR) and getCalculatedOVRFromWorkout
- src/utils/collectibleStatEngine.ts — getStatsWithBoostV2, calculateOVRV2 (alternate OVR)
- src/utils/LevelSystem.ts — XP and level persistence
- src/utils/MainCardEngine.ts — session -> attribute mapping (metricsToAttr) and state.gains persistence
- src/utils/SnapshotCalorieReader.ts — snapshot precedence helper (getSessionCalories)

Typical data flow (summary):
Workout completion → TimerScreen saves a summary (AsyncStorage 'workoutSummaries') → historical readers (Trends, Sessions, Summary cards) read summaries and either prefer snapshot fields (calories, bodyWeightKg, totalVolume) or compute fallbacks using calculators (getSessionCalories → calculateCalories) or ad-hoc formulas.


## 3. Workout Calculation Map (findings)

Key functions and their inputs/outputs (representative):

- calculateCalories(options: CalculateCaloriesOptions) → number
  - File: `src/utils/CalorieCalculator.ts`
  - Inputs: { workoutId, durationSeconds, bodyWeightKg?, liftedWeightKg?, reps? }
  - Output: rounded integer kcal (Math.round)
  - Formula: cardio: calories = MET * bodyWeightKg * durationHours; strength: baseCalories * intensityMultiplier, where intensityMultiplier = 1 + (liftedWeightKg / 200) if liftedWeightKg>0
  - Callers: `TimerScreen.tsx` (save-time), `SnapshotCalorieReader.ts` (fallback), various historical readers (via getSessionCalories)

- calculate1RM(weight,reps) → number
  - File: `src/utils/StrengthCalculator.ts`
  - Formula: Epley: 1RM = weight * (1 + reps/30)
  - Callers: `DailySummaryDetailScreen.tsx`, `StrengthTrendScreen.tsx`, DSI calculation

- calculateVolume(sets,reps,weight) → number
  - File: `src/utils/StrengthCalculator.ts` (canonical)
  - Formula: sets × reps × weight
  - Observed ad-hoc duplicates: many places compute weight * sets * reps inline (TimerScreen, TrendsScreen, WorkoutCategoryDetailScreen, AddSummaryCardModal)

- calculateDSI(lifts, bodyWeight) → number
  - File: `src/utils/StrengthCalculator.ts`
  - Per-lift: 1RM (Epley) then ratio = 1RM / bodyWeight; DSI = average of these ratios
  - Callers: `DailySummaryDetailScreen.tsx` (used for daily DSI/WSI)

- calculateOVR(stats, position) → number
  - File: `src/constants/collectibleWorkouts.ts`
  - Formula: weighted sum of PrimaryStats based on SPLIT_WEIGHTS per position, normalized and rounded, capped at 99
  - Callers: `CollectibleCardNew.tsx`, `CollectibleWorkoutDetailScreen.tsx`, `WorkoutScreen.tsx`, tests

- calculateOVRV2(boostedStats) → number
  - File: `src/utils/collectibleStatEngine.ts`
  - Formula: simple average of boosted stat values (different approach / duplication)

- metricsToAttr(sessionMetrics) → gains
  - File: `src/utils/MainCardEngine.ts`
  - Uses softcap and transforms session metrics (volumeKg, enduranceMin, cadence, intensityRatio, densityPct) into attribute deltas and persists them to main card state (AsyncStorage)
  - Callers: MainCardAttemptManager (on attempt completion)


## 4. Strength Calculation (detailed)

Files: `src/utils/StrengthCalculator.ts`, callers in `DailySummaryDetailScreen.tsx`, `StrengthTrendScreen.tsx`, `MainCardEngine.ts`, `TimerScreen.tsx` (saves inputs)

- Inputs observed across callers:
  - weight (kg): from `session.settings.weight` or `TimerScreen` context
  - reps, sets: `session.completedReps`, `session.completedSets`
  - bodyWeight: saved `session.bodyWeightKg` or user storage (AsyncStorage 'userBodyWeight')
  - lifts arrays: { weight, reps } tuples for DSI

- Exact formulas (code-extracted):
  - 1RM (Epley): 1RM = weight * (1 + reps / 30)
  - Strength ratio: ratio = 1RM / bodyWeight
  - Volume: sets × reps × weight
  - DSI: average(1RM / bodyWeight) over compound lifts
  - WSI: mean of last 7 DSI values (ignoring zeros)

- Rounding and guards:
  - calculate1RM returns 0 for weight <=0 or reps <=0
  - calculateDSI guards: returns 0 for empty lifts or invalid bodyWeight
  - calculateVolume returns 0 if any input <= 0

- Call sites / UI consumers:
  - `DailySummaryDetailScreen.tsx` — computes planned 1RM from planned workout settings and calculates DSI from planned lifts (see finding below)
  - `StrengthTrendScreen.tsx`/`ProgressionTrendScreen.tsx` — aggregate volume/1RM across summaries
  - `MainCardEngine.ts` — maps session metrics to attribute gains (softcap formulas)


## 5. OVR Calculation (audit)

Two implementations found:
- `calculateOVR(stats, position)` in `src/constants/collectibleWorkouts.ts` — position-weighted average using SPLIT_WEIGHTS and rounding, capped at 99. This is used widely for collectible UI and tests.
- `calculateOVRV2(boostedStats)` in `src/utils/collectibleStatEngine.ts` — alternate method: simple average of boosted stats.

Both are deterministic and tested (authoritative one has comprehensive unit tests in `__tests__/calculateOVR.test.ts`). Duplication exists (different algorithms) and both are present in the codebase; usage varies per UI component. Evidence: import sites in `CollectibleCardNew.tsx`, `CollectibleWorkoutDetailScreen.tsx`, and `WorkoutScreen.tsx`.

Answers to OVR questions (code-derived):
1. OVR is computed from PrimaryStats and position-weight weights (SPLIT_WEIGHTS) — see `calculateOVR`.
2. Workout performance does not directly alter base collectible OVR (OVR is computed from baseStats unless boosted by other systems).
3. Strength results may feed into systems that boost stats (collectibleStatEngine), but collectible OVR uses base stats unless boost routines are invoked.
4. DSI is not used inside `calculateOVR`.
5. Character stats used for OVR are primarily the CollectibleWorkout.baseStats; level/boost functions exist but are not consistently applied across UIs.
6. Body weight does not affect OVR (OVR is stat-based), except DSI and strength ratio calculations use bodyWeight.
7. Progression (level/xp) may feed boosted stat generators (getStatsWithBoostV2), but those boosters are not consistently wired into all UIs.
8. Snapshot vs live: collectible OVR is live/deterministic from baseStats; boosted variants depend on level which is persisted. Some UIs render baseStats only.


## 6. DSI Calculation (audit)

- Implemented in `src/utils/StrengthCalculator.ts` (calculateDSI)
- Inputs: lifts: LiftData[] ({ weight, reps }), bodyWeight
- Formula: per-lift 1RM (Epley) → ratio = 1RM / bodyWeight → DSI = average ratio
- Consumers: `DailySummaryDetailScreen.tsx` computes daily DSI for planned lifts and displays DSI/WSI

Important observation: `DailySummaryDetailScreen.tsx` builds lifts for DSI primarily from *planned workout settings* (loadWorkoutSettings for the workout ids) and then calculates DSI, instead of reliably using actual saved session lifts when available. This can produce a mismatch between displayed DSI and metrics that were actually performed. See Findings.


## 7. Character Stats (collection and persistence)

Key types: `PrimaryStats` in `src/constants/collectibleWorkouts.ts` (STR, VOL, TMP, END, PHY, HYP)

Systems that persist character/progression data:
- `src/utils/LevelSystem.ts` — stores collectible level and xp in AsyncStorage per workout id
- `src/utils/MainCardEngine.ts` — stores `MainCardState` including `gains` (STR/VOL/TMP/END/PHY/HYP) in AsyncStorage per main-card id
- `processMainCardRun` computes gains from aggregated session metrics (metricsToAttr) and persists

Usage:
- UI components such as `MainCardCardNew.tsx` read `getMainCardState` and render persisted gains (state.gains) — i.e., these are snapshot/persistent
- `CollectibleCardNew.tsx` typically reads `workout.baseStats` and OVR; boosted stat functions exist but some UIs opt to render baseStats only

Conclusion: character gains and levels are persisted; however, UI application of those persisted boosts is inconsistent across components.


## 8. Workout → Character Data Flow (trace)

Representative chain (authoritative observed path):

1. TimerScreen (on workout completion) builds a summary object and writes to AsyncStorage 'workoutSummaries'. Key saved fields: `date`, `workoutId`, `settings`, `elapsedTime`, `completedSets`, `completedReps`, `totalVolume`, `avgGreenLoopTime`, `avgRedLoopTime`, `greenLoopTimes`, `redLoopTimes`, `calories`, `bodyWeightKg`, etc.

2. For Main Card attempts: TimerScreen/other calls `recordWorkoutInAttempt(mainCardId, workoutId, { weightKg, completedSets, completedReps, elapsedSec, activeSec, restSec })`. `MainCardAttemptManager` stores per-attempt metrics and when attempt completes it calls `processMainCardRun(card, metricsList, ctx)`.

3. `processMainCardRun` calls `metricsToAttr` → computes main-card gains and persists `main_card_state_<id>` (state.gains) in AsyncStorage.

4. UI components (MainCard views, Collectible cards, Trends, Progression screens) read from AsyncStorage or `workoutSummaries` and either use persisted fields (calories, bodyWeightKg, totalVolume) or fallback to live calculation helpers (`getSessionCalories`, `calculateCalories`) or ad-hoc recomputation from `settings`.

Fields involved at each step:
- Save-time snapshot: `calories`, `bodyWeightKg`, `totalVolume`, `completedSets`, `completedReps`, `elapsedTime`, `greenLoopTimes`, `redLoopTimes`, `avgGreenLoopTime`, `avgRedLoopTime`.
- Derived/peristed: `main_card_state_<id>`: { gains: { STR,VOL,TMP,END,PHY,HYP }, level, xp }
- Derived live: UI-level aggregations (Trends) can recompute averages from `workoutSummaries`.


## 9. Workout Progression (audit)

- Progression XP & levels: `src/utils/LevelSystem.ts` persists per-workout level and xp in AsyncStorage keys `collectible_level_<id>` and `collectible_xp_<id>`.
- XP logic: getXPPerWorkout returns 1 per workout; getXPForLevel returns the level number as threshold; addWorkoutXP implements gating (require all exercises completed to actually level up; else store XP but mark levelUpGated)

Determinism: addWorkoutXP is deterministic given persisted state. No randomness.

Observations: progression state is persisted and deterministic; however, UI elements that display progression or expected gains sometimes compute planned metrics from current settings rather than relying on persisted run data (see Findings). Tests for LevelSystem exist only indirectly (limited).


## 10. Historical Consistency (classification)

For each metric classify as SNAPSHOT, LIVE RECALCULATION, MIXED, or UNKNOWN based on code inspection:

- Calories: SNAPSHOT
  - Evidence: `TimerScreen.tsx` persists `calories` at save-time using `calculateCalories` and `SnapshotCalorieReader.getSessionCalories` prefers persisted number whenever finite. Many readers call `getSessionCalories`.

- Body weight used in workouts: MIXED/SNAPSHOT
  - Evidence: `TimerScreen` saves `bodyWeightKg` with the summary. Many readers use `session.bodyWeightKg ?? session.settings?.bodyWeight ?? DEFAULT_BODY_WEIGHT_KG` — so snapshots are used when available but fallbacks exist.

- Volume (sets × reps × weight): MIXED
  - Evidence: `TimerScreen` saves `totalVolume` at save-time. However multiple readers compute `weight * sets * reps` ad-hoc when `totalVolume` absent or when using `settings.weight`. This can yield mismatches if `settings` changed after the session.

- 1RM / Strength-derived metrics: MIXED
  - Evidence: some screens compute planned 1RM from current workout settings (`DailySummaryDetailScreen.tsx`), while others derive 1RM from saved session fields and/or from MainCard metrics.

- DSI: MIXED/UNKNOWN
  - Evidence: `DailySummaryDetailScreen.tsx` computes DSI from planned lifts (loadWorkoutSettings) for events rather than reliably using actual lift data captured in saved summaries.

- Character gains (MainCard state.gains): SNAPSHOT
  - Evidence: `MainCardEngine.processMainCardRun` persists state.gains; UI reads persisted main card state.

- OVR (collectible base OVR): LIVE (deterministic from baseStats)
  - Evidence: `calculateOVR` computes OVR from collectible baseStats each time; stored baseStats are static.

- OVR (boosted): MIXED
  - Evidence: boosted stat pipeline exists (getStatsWithBoostV2, calculateOVRV2), but not consistently applied to UIs; boost state (levels) is persisted via LevelSystem.


## 11. Body Weight Dependencies

Searches: `parseStoredBodyWeight`, `DEFAULT_BODY_WEIGHT_KG`, `bodyWeightKg`, `userBodyWeight` show consistent patterns:
- `parseStoredBodyWeight` centralizes parsing and fallback to `DEFAULT_BODY_WEIGHT_KG`.
- Save-time: `TimerScreen` saves `bodyWeightKg` in summary (Phase 5A).
- Readers: most readers use `session.bodyWeightKg ?? session.settings?.bodyWeight ?? DEFAULT_BODY_WEIGHT_KG` and many pass `bodyWeightKg` into `calculateCalories`/DSI calculations.

Potential risk: Some code paths compute DSI/1RM/volume from *current* workout settings rather than `session.settings`/`session.bodyWeightKg`, which can cause a historical mismatch when the user changes their profile or workout settings after the session.


## 12. Rounding / Precision

Noted rounding locations (non-exhaustive):
- `calculateCalories` → Math.round(calories) before returning (saved as integer)
- `StrengthCalculator.getStatsWithBoostV2` → Math.round values when boosting
- `calculateOVR` → Math.round(weightedAvg)
- `MainCardEngine.processMainCardRun` → `.toFixed(2)` for gains persisted
- `TimerScreen.saveWorkoutSummary` → `avgGreenLoopTime` and `avgRedLoopTime` rounded to 2 decimals
- Many UI aggregators round for display (Math.round, toFixed) at their own level

Implication: rounding occurs both before persistence (calories, gains rounded) and at display-time. Where rounding occurs pre-persistence, aggregation across sessions uses the rounded values which may increase small inconsistencies. No single documented policy exists.


## 13. Edge Cases

Checked handling of: 0, null, undefined, NaN, Infinity, negative values, numeric strings.

- `parseStoredBodyWeight` covers null/undefined/empty/invalid strings and returns default (except '0' returns 0). Tests ensure this behavior.
- `SnapshotCalorieReader.getSessionCalories` uses typeof number && Number.isFinite to only accept finite numeric snapshots — 0 is preserved.
- `CalorieCalculator` uses Number.isFinite for bodyWeight and falls back to default if not finite.
- `StrengthCalculator` functions guard against weight/reps <= 0 and return 0 where appropriate.

Potential gaps:
- Some readers assume `session.activeTime` and `session.restTime` fields; `TimerScreen` saves `greenLoopTimes`/`redLoopTimes` and `avgGreenLoopTime`/`avgRedLoopTime` — code paths that expect different key names may treat missing data as 0 and skew aggregates.


## 14. Legacy Compatibility

- Old session schemas are handled via fallbacks: readers compute values from `session.settings` or defaults when persisted snapshot fields missing.
- No migration or destructive edits were found; legacy sessions will fallback to live calculation for calories when `session.calories` is not present.
- However, inconsistency in naming (e.g., `activeTime` vs `avgGreenLoopTime`) introduces fragility in display aggregation for older/newer sessions.

Classification (examples):
- Calories: SNAPSHOT for new sessions, legacy fallback LIVE calc for older sessions
- Strength/DSI: MIXED — older sessions without full active/rest metadata may produce different derived metrics when recomputed live


## 15. Cross-Screen Consistency

Screens examined (representative):
- `TimerScreen`, `WorkoutSummaryScreen`, `WorkoutCategoryDetailScreen`, `SessionsScreen`, `Summary` components, `TrendsScreen`, `DailySummaryDetailScreen`, `AddSummaryCardModal`, collectible/card screens

Findings:
- Most readers now prefer snapshot calories (Phase 5 helper `getSessionCalories`) — consistent for calories
- Volume and strength are sometimes recomputed inline from available fields or from `session.settings`, causing potential drift if `settings` changed after save. Example: `TrendsScreen` uses `s.totalVolume || (weight * sets * reps)` — if `totalVolume` missing and current `settings.weight` changed, the computed volume may not reflect the saved session.
- `DailySummaryDetailScreen` uses planned workout settings to compute planned 1RM and DSI rather than actual completed lifts, which can show values that differ from saved summaries.


## 16. Duplicated Formulas

Detected duplicated or ad-hoc implementations of the same calculations:
- Volume: canonical `calculateVolume(sets,reps,weight)` exists, but many components compute `weight * sets * reps` inline.
- OVR: `calculateOVR` (position-weighted) and `calculateOVRV2` (boosted average) both exist.
- Calorie heuristics: authoritative `calculateCalories` exists, but `TimerScreen` also computes a legacy `totalEstimatedKcal = Math.round(durationMins * 7)` as a lightweight estimate (legacy UI field).

Classification: DUPLICATED FORMULA — medium priority to harmonize for maintainability.


## 17. Test Coverage

Located test files relevant to calculations:
- `__tests__/calculateOVR.test.ts` — comprehensive OVR unit tests (GOOD)
- `__tests__/bodyWeightPersistence.test.ts` — body weight parsing + small DSI/ratio checks (PARTIAL)
- Phase 5 calorie tests: `__tests__/historicalCalorieSnapshot.test.ts`, `phase5b_reader_migration.test.ts`, `phase5d_parity.test.ts` (GOOD coverage for calories)
- Other tests: `ovr_ui_integration.test.ts` (UI coverage), not many tests for LevelSystem edge-cases, MainCardEngine metrics-to-attr mapping, or end-to-end DSI correctness across varied real sessions (PARTIAL/NEEDS IMPROVEMENT)

Summary classification:
- Calories: HAS TEST
- OVR: HAS TEST
- Strength/DSI: PARTIAL (basic checks exist but not exhaustive)
- MainCardEngine / progression: PARTIAL/NO targeted unit tests for edge cases (e.g., attempts gating, partial attempts, metrics rounding)


## 18. Findings (ID, Severity, File, Function, Current Behavior, Concern, Evidence, Recommendation)

F1
- ID: F1
- Severity: HIGH
- File: `src/screens/DailySummaryDetailScreen.tsx`
- Function/Area: DSI / daily DSI calculation
- Current Behavior: DSI is computed from the *planned* lifts (loaded via `loadWorkoutSettings` for workoutIds) rather than reliably using actual saved session lift data.
- Concern: Displays DSI/WSI driven by planned settings rather than actual completed lifts — can mislead user and break historical consistency.
- Evidence: `DailySummaryDetailScreen.tsx` lines ~150-220 build `lifts` array from `loadWorkoutSettings` and then call `calculateDSI(lifts, bw)`.
- Recommendation: (Phase 6B) Prefer authoritative session-derived lifts when present (saved summary fields: completedSets/completedReps and stored weight or recorded lifts). Only use planned settings for forecasts, not historical DSI.

F2
- ID: F2
- Severity: MEDIUM
- File(s): `src/utils/StrengthCalculator.ts`, `src/screens/TrendsScreen.tsx`, `src/screens/TimerScreen.tsx`, `src/components/AddSummaryCardModal.tsx`, `src/screens/WorkoutCategoryDetailScreen.tsx`
- Function: Volume calculation
- Current Behavior: Volume is computed ad-hoc in multiple places (`weight * sets * reps`), while a canonical `calculateVolume` exists.
- Concern: Duplication increases maintenance risk and subtle inconsistencies if formula changes.
- Evidence: occurrences of inline `weight * sets * reps` in `TimerScreen`, `DailySummaryDetailScreen`, `TrendsScreen` and `AddSummaryCardModal` vs `calculateVolume` in `StrengthCalculator.ts`.
- Recommendation: (Phase 6B) Consolidate to `calculateVolume` and prefer persisting `totalVolume` at save-time. Where legacy sessions lack totalVolume, compute using `session.settings` and persisted session fields only.

F3
- ID: F3
- Severity: MEDIUM
- File(s): `src/screens/TimerScreen.tsx`, `src/screens/TrendsScreen.tsx`, other readers
- Function: Active/Rest time field naming & use
- Current Behavior: `TimerScreen` saves `avgGreenLoopTime`, `avgRedLoopTime`, `greenLoopTimes`, `redLoopTimes`; other readers (e.g., `TrendsScreen`) expect fields named `activeTime` and `restTime`.
- Concern: Inconsistent field names cause readers to treat values as 0 or recalculate fallbacks leading to mismatched displays across screens.
- Evidence: `TimerScreen.saveWorkoutSummary` persists `avgGreenLoopTime`, while `TrendsScreen` reads `s.activeTime || 0` and `s.restTime || 0`.
- Recommendation: (Phase 6B) Standardize persisted field names (document schema) and provide helper accessor wrappers (like Phase 5's getSessionCalories) to normalize legacy/new keys.

F4
- ID: F4
- Severity: LOW–MEDIUM
- File(s): `src/constants/collectibleWorkouts.ts`, `src/utils/collectibleStatEngine.ts`
- Function: OVR duplication
- Current Behavior: Two OVR implementations exist (`calculateOVR` and `calculateOVRV2`) with different formulas and slight differences in usage.
- Concern: Duplication can cause developer confusion and inconsistent UI if different code paths use different OVRs.
- Evidence: Both functions present and imported in different places (`CollectibleCardNew`, `CollectibleWorkoutDetailScreen`), tests target `calculateOVR`.
- Recommendation: (Phase 6B) Document rationale for both versions; consolidate or clearly route UI usage to authoritative function.

F5
- ID: F5
- Severity: MEDIUM
- File(s): `src/components/CollectibleCardNew.tsx` and related
- Function: Boosted stats / level application
- Current Behavior: Boosting functions exist (`getStatsWithBoostV2`) and LevelSystem persists levels, but many UI components render baseStats and do not apply persisted boosts (CollectibleCardNew returns boostedStats := workout.baseStats and a comment indicates calculation is disabled).
- Concern: Users may expect level/XP to affect character stats/OVR in all UIs but current application is inconsistent.
- Evidence: `CollectibleCardNew.tsx` memo sets `boostedStats: _stats` (base stats) and a comment showing author disabled calculations.
- Recommendation: (Phase 6B) Decide canonical design (live-boosted vs static visuals), then apply persisted boosts consistently or document that boosts are only applied in specific areas.

F6
- ID: F6
- Severity: LOW–MEDIUM
- File(s): multiple (CalorieCalculator, MainCardEngine, UI components)
- Function: Rounding and precision
- Current Behavior: Rounding occurs at engines (calories rounded before persist), at attribute aggregation (toFixed(2)), and at many UI display points.
- Concern: Mixed rounding points can cause small aggregation mismatches across screens.
- Evidence: `calculateCalories` uses Math.round; `MainCardEngine` uses toFixed(2); Trends and Strength cards round for display.
- Recommendation: (Phase 6B) Document rounding policy: what is rounded before persistence vs only at display. Prefer storing granular raw values where reasonable and round at display.

F7
- ID: F7
- Severity: MEDIUM
- File(s): `src/screens/*` (various), `MainCardEngine.ts` (processMainCardRun)
- Function: Historical recomputation risk (live vs snapshot)
- Current Behavior: Some UI code recomputes metrics from `settings` (which may have changed) or current workout defaults when saved summary lacks an explicit persisted value.
- Concern: After user edits a workout's settings or weight, previously saved sessions may show different derived metrics because screens recompute from current settings rather than only using persisted session data.
- Evidence: `TrendsScreen` computes kcal/volume using session.settings when `totalVolume` missing; `DailySummaryDetailScreen` computes planned metrics from loadWorkoutSettings.
- Recommendation: (Phase 6B) Make readers prefer persisted snapshot fields (session.*) when available, and only use current settings for planned/future displays. Consider a thin compatibility layer to normalize old/new schema.

F8
- ID: F8
- Severity: LOW–MEDIUM
- File(s): `src/utils/LevelSystem.ts`, `src/utils/MainCardEngine.ts`
- Function: Test coverage gaps
- Current Behavior: LevelSystem and MainCardEngine have limited unit tests covering edge cases (gating, partial attempts, multi-run math, persistence failure modes).
- Concern: Regressions in progression logic could silently change leveling behavior; low test coverage on edge cases increases risk.
- Evidence: test files include OVR and some bodyWeight/DSI checks, but not deep MainCard run processing.
- Recommendation: (Phase 6B/6C) Add unit tests for `processMainCardRun`, gating logic, `addWorkoutXP` edge cases, and historical replays.

F9
- ID: F9
- Severity: INFO
- File: `src/screens/TimerScreen.tsx`
- Function: Legacy calorie heuristic
- Current Behavior: `totalEstimatedKcal = Math.round(durationMins * 7)` is computed as a lightweight estimate in the summary in addition to authoritative `calories`.
- Concern: Might confuse maintainers; ensure UI intentionally shows which value is authoritative (use `calories` saved snapshot as canonical).
- Recommendation: Document the legacy field and avoid using it where authoritative snapshot exists.


## 19. Most important findings (short list)

- Historical recalculation risk (F7) — multiple screens recompute from live/current settings rather than authoritative persisted session fields → Severity: MEDIUM
- DSI computed from planned settings (F1) — can misrepresent actual daily strength (HIGH)
- Duplicated volume and OVR formulas (F2, F4) — maintainability concern (MEDIUM)
- Inconsistent persisted field names for active/rest time (F3) — can cause cross-screen mismatch (MEDIUM)
- Rounding inconsistencies (F6) — small but systemic (LOW–MEDIUM)
- Tests: OVR & calorie snapshots are covered; MainCard/Progression and DSI need better coverage (F8)


## 20. Recommendations & Phase 6B priority list

Order of remediation (recommended Phase 6B priorities):
1. (HIGH) F1: Fix DSI source-of-truth — ensure DSI uses authoritative session-derived lifts when present; planned settings only for forecasts.
2. (MEDIUM) F7: Normalize readers to prefer persisted session fields; introduce a compatibility accessor (like getSessionField) to bridge old/new keys and reduce live recomputation.
3. (MEDIUM) F3: Standardize persisted schema for active/rest/activeTime fields; document schema and add small read-only compatibility helpers.
4. (MEDIUM) F2/F4: Consolidate duplicated formulas (volume and OVR) and document which function is authoritative for each formula.
5. (MEDIUM) F6: Define a rounding policy; prefer storing raw numeric values and round only at UI presentation where possible.
6. (MEDIUM) F5: Decide how collectible level/XP boosts are applied to UI; make boosted stats application consistent or intentionally limited.
7. (LOW–MEDIUM) F8: Add unit tests for progression and main-card run processing, and tests that verify historical consistency (changing settings does not retroactively change snapshots).
8. (INFO) F9: Document legacy calorie fields and ensure UIs use `calories` snapshot as canonical.

For each remediation, Phase 6B should be read-only design and spec changes (document field names, canonical functions). Phase 6C can include minimal, surgical code changes and tests.


## 21. Counts and summary (quick)

- Calculation functions located: ~8 major calculators (Calorie, Strength, WorkoutCalculator, collectibleStatEngine, LevelSystem, MainCardEngine, Snapshot helper, Workout metric generators).
- Potential problems flagged: 9 findings (F1..F9) with 1 HIGH, several MEDIUM, rest LOW/INFO
- Historical consistency problems located: multiple (F1, F3, F7) — recommend Phase 6B attention
- Duplicated formulas found: 2 primary classes (volume ad-hoc vs calculateVolume; OVR vs OVRv2)
- Test coverage: OVR & calorie snapshot tests present; DSI/Progression/MainCardEngine partial or missing deeper edge-case tests


## 22. Next steps (after your approval)

Per your instructions I will wait for sign-off. Suggested immediate follow-ups you can assign to Phase 6B in order:
1. Draft schema normalization for `workoutSummaries` (canonical keys list) and compatibility helper
2. Replace DSI planned-lifts usage with authoritative session-lifts (spec only)
3. Consolidate volume usage into single helper (spec)
4. Expand tests for `processMainCardRun` and `addWorkoutXP`


---

If you want, I will now:
- produce a per-file hunk list that isolates only read-only findings references (no code edits), or
- start drafting Phase 6B specification patches (design-only changes in markdown) that you can approve before implementation.

I will now update the todo list and stop for your approval before moving to Phase 6B.
