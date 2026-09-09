# PHASE_6B_CALCULATION_PROGRESSION_SPEC

Date: 2026-09-08

This is a design-only technical specification for Phase 6B. It defines authoritative contracts and architecture for Workout → Actual Performance → Strength/Volume/DSI → Character Gains → XP/Level → Boosted Stats → OVR. No production code or tests are changed in this phase.

Refer to: `PHASE_6A_WORKOUT_CHARACTER_CALCULATION_AUDIT.md`, `PHASE_5_FINAL_RELEASE_AUDIT.md`, `PHASE_5A_IMPLEMENTATION_REPORT.md`, `PHASE_5B_READER_MIGRATION_REPORT.md`, `PHASE_5C_CONTRACT_HARDENING_REPORT.md`, `PHASE_5D_FINAL_HISTORICAL_CALORIE_AUDIT.md`, `PHASE_5D_FINAL_HISTORICAL_CALORIE_CONSISTENCY_REPORT.md`.

All file/function references below are to existing repository artifacts discovered in Phase 6A.

## 1. Executive Summary

Goal: define a minimal, unambiguous calculation architecture that guarantees historical immutability for completed workouts while leaving planned/preview calculations flexible. This spec produces the Phase 6C contract (exact files/functions to change) once approved.

Top-level recommendations (preview):
- Enforce a Snapshot-First Reader layer (SessionSnapshotReader) that all UI readers call.
- For historical metrics (calories, volume, bodyWeight, 1RM, DSI, character gains, progression), prefer persisted snapshot fields; fall back only to recomputation from persisted session fields (completedSets/completedReps/recorded weights) — never use current workout settings for historical displays.
- Keep existing formulas intact (protected): calorie METs, StrengthCalculator formulas (Epley), OVR authoritative formula.
- Mark ambiguous UX/game design choices as DESIGN DECISION REQUIRED; do not implement without approval.


## 2. Current Architecture

Sources (files discovered in Phase 6A):
- calorie: `src/utils/CalorieCalculator.ts` (`calculateCalories`)
- snapshot helper: `src/utils/SnapshotCalorieReader.ts` (`getSessionCalories`)
- strength/volume/DSI: `src/utils/StrengthCalculator.ts` (multiple functions: `calculate1RM`, `calculateVolume`, `calculateDSI`, `calculateWSI`)
- character/main-card: `src/utils/MainCardEngine.ts` (`metricsToAttr`, `processMainCardRun`)
- level/xp: `src/utils/LevelSystem.ts` (`addWorkoutXP`, `getXPForLevel`)
- collectible/OVR: `src/constants/collectibleWorkouts.ts` (`calculateOVR`) and `src/utils/collectibleStatEngine.ts` (`calculateOVRV2`, `getStatsWithBoostV2`)
- screens/readers: `src/screens/TimerScreen.tsx`, `DailySummaryDetailScreen.tsx`, `TrendsScreen.tsx`, `WorkoutSummaryScreen.tsx`, `WorkoutCategoryDetailScreen.tsx`, `SessionsScreen.tsx`, `MainCardCardNew.tsx`, `CollectibleCardNew.tsx`, etc.

Observed behavior (Phase 6A):
- `TimerScreen` persists `calories` (Math.round), `bodyWeightKg`, `totalVolume`, loop timing fields, and session metadata into `workoutSummaries`.
- Many readers prefer snapshot calories via `getSessionCalories`; however, for other metrics (volume, 1RM, DSI), readers sometimes recompute using `session.settings` or current workout defaults leading to drift.
- OVR: authoritative `calculateOVR` exists and is well-tested; `calculateOVRV2` is an alternate algorithm used in some boost flows.


## 3. Canonical Data Model (Authoritative `workoutSummaries` schema)

Below is the canonical historical schema recommended for `workoutSummaries`. Each field row indicates current meaning, whether the field is authoritative for historical displays, whether it is persisted today (Phase 6A inspection), fallback logic, and Phase 6 recommendation.

| Field | Current meaning | Historical authoritative? | Persisted? | Fallback | Phase 6 recommendation |
|---|---:|---|---:|---|---|
| `workoutId` | Workout template id | YES | YES | N/A | Keep (authoritative)
| `date` | completion timestamp (ISO) | YES | YES | N/A | Keep (authoritative)
| `settings` | workout settings snapshot or template reference | NO (metadata only) | YES | N/A | Keep, but readers must not use `settings` as authoritative for historical values unless explicit missing persisted fields
| `elapsedTime` | total elapsed time during run (seconds) | YES | YES | compute from loop times if missing | Persisted; authoritative when present
| `completedSets` | total completed sets | YES | YES (partial) | compute from saved per-exercise lines if present | Persisted where available; readers prefer persisted
| `completedReps` | total completed reps | YES | YES (partial) | compute from saved per-exercise lines if present | Persisted where available
| `totalVolume` | sum(sets*reps*weight) | YES | YES (Phase 5 TimerScreen persists) | compute from saved `exerciseLifts` (weights/sets/reps) — do NOT use current workout settings | Persist if available; readers: use persisted `totalVolume` first; else compute from recorded lifts in session
| `calories` | save-time calorie snapshot (kcal) | YES (authoritative) | YES | compute via `calculateCalories` only if snapshot missing | Keep snapshot contract (Phase 5). Readers must call `getSessionCalories(session)` that prefers snapshot.
| `bodyWeightKg` | user's body weight used during session | YES | YES (Phase 5 save-time) | `session.settings?.bodyWeight` or `parseStoredBodyWeight()` — but considered non-authoritative fallback | Persist at save-time - authoritative when present
| `avgGreenLoopTime` | average active loop time saved at run | YES | YES | compute from `greenLoopTimes` | Persisted; canonical name mapping to `activeTime` via accessor
| `avgRedLoopTime` | average rest loop time | YES | YES | compute from `redLoopTimes` | Persisted; canonical mapping to `restTime`
| `greenLoopTimes` | array of active loop durations | YES (raw) | YES | N/A | Persisted raw array for diagnostic and recomputation
| `redLoopTimes` | array of rest durations | YES (raw) | YES | N/A | Persisted raw array for diagnostic and recomputation
| `activeTime` | canonical aggregated active time (seconds) | YES | NO (some readers expect it) | compute from `avgGreenLoopTime` or `greenLoopTimes` | PROPOSED — NOT IMPLEMENTED: provide accessor `getSessionActiveTime(session)` that normalizes fields
| `restTime` | canonical aggregated rest time (seconds) | YES | NO | compute from `avgRedLoopTime` or `redLoopTimes` | PROPOSED — NOT IMPLEMENTED: accessor `getSessionRestTime(session)`
| `liftedWeightKg` | (per-exercise) recorded lifted weight(s) | YES | PARTIAL (per-exercise objects may exist) | N/A | Persist per-exercise lifts as `exerciseLifts: [{exerciseId, sets, reps, weightKg}]` when available (PROPOSED - ONLY IF not duplicative)
| `exerciseLifts` | per-exercise recorded lifts array | YES if present | PARTIAL/LEGACY | derive `totalVolume` from here if missing | Recommended: prefer recorded `exerciseLifts` when present
| `strengthMeta` | PROPOSED — NOT IMPLEMENTED: explicit saved computed metrics (e.g., per-exercise 1RM) | YES if present | NO | compute from `exerciseLifts` | DESIGN DECISION REQUIRED — optional: store derived 1RM per exercise at save-time to simplify historical queries
| `mainCardProcessed` | whether session contributed to main-card processing | YES | PARTIAL | N/A | Persist boolean; used to avoid double-processing (DESIGN DECISION REQUIRED)

Notes:
- Avoid introducing many new persisted fields. Prefer to normalize and add small compatibility accessors.
- `PROPOSED — NOT IMPLEMENTED` rows indicate fields that would be helpful for Phase 6C but must be reviewed before any writes.


## 4. Snapshot vs Live Policy (classification + authoritative source)

For each metric: classify and declare authoritative source.

- `calories`: SNAPSHOT — authoritative: `session.calories` (persisted integer) via `getSessionCalories(session)` (see `src/utils/SnapshotCalorieReader.ts`). If missing, fall back to `calculateCalories(...)` using persisted `session.bodyWeightKg` if present, else use `parseStoredBodyWeight()`.

- `bodyWeightKg`: SNAPSHOT (if present) — authoritative: `session.bodyWeightKg`. Fallback: `session.settings?.bodyWeight` → global `userBodyWeight` read via `parseStoredBodyWeight()`.

- `totalVolume`: SNAPSHOT if persisted (`session.totalVolume`) — authoritative: persisted `totalVolume`. If missing, LIVE recompute from saved per-exercise lifts (`session.exerciseLifts` or `completedSets/completedReps` with recorded weights). Do NOT recompute from current workout settings.

- `1RM` per-exercise: MIXED (derived) — authoritative derivation: compute from recorded exercise lifts (`exerciseLifts`) using `calculate1RM(weight,reps)` (Epley) at read-time when explicit per-exercise saved 1RM not persisted. If per-exercise 1RM is stored in `strengthMeta` (PROPOSED), use stored value.

- `strength ratio` (oneRM/bodyWeight): MIXED — authoritative: computed from authoritative 1RM and authoritative `bodyWeightKg`.

- `DSI`: MIXED — authoritative historical DSI: compute from recorded lifts in the session and historical day-lifts (for daily aggregation) using `calculateDSI`. For daily/WSI views use persisted historical sessions to compute DSI window. Planned DSI (for preview) computed from planned workout settings only and must be labelled clearly.

- `WSI` (7-day): MIXED — authoritative: compute over 7 historical DSI values derived from past sessions (where sessions have recorded lifts). If insufficient history, WSI = average of available historical DSI values; do not use planned values.

- `activeTime`, `restTime`: SNAPSHOT (if persisted fields present). Authoritative: `session.activeTime` if present, else `session.avgGreenLoopTime`, else computed average of `greenLoopTimes`.

- `character gains` (main-card `state.gains`): SNAPSHOT — authoritative: persisted main-card state (`main_card_state_<id>` persisted by `processMainCardRun` in `src/utils/MainCardEngine.ts`). Historical readers must use persisted gains. Reprocessing a historical session must not silently change persisted gains.

- `XP` and `level`: SNAPSHOT — authoritative: persisted LevelSystem entries (e.g., `collectible_level_<id>`, `collectible_xp_<id>`). Level-up events must be durable and recorded at the time `addWorkoutXP` executes.

- `boosted stats`: MIXED — authoritative for a UI depends on whether the UI intends to show baseStats or boosted stats. Recommendation: define authoritative OVR path and explicitly document which screens show boosted stats.

- `OVR`: LIVE (base) / MIXED (boosted) — authoritative base OVR: `calculateOVR` from `src/constants/collectibleWorkouts.ts`. Boosted OVR computed by `calculateOVRV2` or `getStatsWithBoostV2` when the UI intends to show boosted values — use a single authoritative boosted path if applying boosts.


## 5. Strength Contract (canonical input/outputs)

Do not change formulas. This section defines canonical input contract for strength calculations.

Canonical functions (documented):
- `calculate1RM(weightKg:number, reps:number): number` — canonical: Epley 1RM = weight * (1 + reps/30). Preconditions: weightKg > 0 and reps > 0; otherwise return 0.
- `calculateVolume(sets:number, reps:number, weightKg:number): number` — canonical: sets * reps * weightKg; return 0 for any non-positive inputs.
- `calculateDSI(lifts: LiftData[], bodyWeightKg:number): number` — canonical: per-lift 1RM via `calculate1RM`, ratio = 1RM / bodyWeightKg; DSI = average ratio over lifts with valid weight/reps. Return 0 if no valid lifts.
- `calculateWSI(dsiHistory:number[]): number` — canonical: mean of last 7 non-zero DSI values; if fewer than 7, mean of available values; if none, return 0.

Authoritative data order for computing 1RM for a historical workout (explicit):
1. If `session.exerciseLifts` contains per-exercise `weightKg` and `reps` for the exercise instance, compute 1RM from that recorded lift.
2. Else if `session.completedSets`/`session.completedReps` and per-exercise weight is available in session-level fields (`liftedWeightKg` or `settings.weight` persisted in session.settings at save-time), compute 1RM from those saved numbers.
3. Else if only `session.settings` available (no recorded completed data), DO NOT treat this as authoritative historical 1RM — classify as PLANNED ONLY and mark accordingly in UI (DESIGN DECISION REQUIRED if UI should show planned fallback).

Definition: "Actual 1RM" = computed from recorded session lifts (step 1 or 2). "Planned 1RM" = computed from `session.settings` (only for preview/forecast).


## 6. DSI / WSI Contract

Problem addressed: Phase 6A found `DailySummaryDetailScreen` computing DSI from planned settings (F1). This is incorrect for historical displays.

Contracts:
- Actual DSI (for historical/day views): computed from recorded lifts across sessions that occurred on the same day. Primary source: `session.exerciseLifts` per session; fallback: compute per-exercise 1RM from `session.completedSets/completedReps` and recorded weights in the session.
- Planned DSI (preview): computed from `workout.settings` and must be labelled as PLANNED in any UI. Do not use planned DSI for historical aggregates.
- Historical DSI aggregation (for WSI): use only Actual DSI values derived from past sessions (do not include planned or forecast DSI values).

Fallback policy: If a historical session lacks sufficient lift data to compute DSI, the reader must:
1. Indicate insufficient data (UI shows "insufficient data" or similar) AND
2. Optionally show a PLANNED DSI computed from `session.settings` but clearly marked "Planned/Estimate". This must be a UI-only augmentation — NOT considered authoritative for historical metrics or progression.

Phase 6C implementation contract (design only):
- Replace `DailySummaryDetailScreen` consumption to call `SessionSnapshotReader.getDSIForSession(session)` which follows the algorithm above.
- If `getDSIForSession` cannot compute actual DSI, return { value: null, source: 'insufficient' } and `PlannedDSI` as optional separate call.


## 7. Volume Contract

Canonical formula: `totalVolume = sum(exerciseSets * exerciseReps * exerciseWeightKg)`.

Authoritative precedence for historical volume:
1. `session.totalVolume` if present: use as authoritative persisted value (Phase 5 TimerScreen persisted this field for modern sessions).
2. Else, compute from `session.exerciseLifts` (per-exercise recorded weights/sets/reps) — this yields historical-consistent recomputation.
3. Else, compute from `session.completedSets`/`session.completedReps` combined with saved `liftedWeightKg` if present in session-level fields (rare).
4. DO NOT use `session.settings.weight` or current workout defaults for historical volume unless explicitly rendering a PLANNED estimate.

Adoption guidance:
- `calculateVolume` in `src/utils/StrengthCalculator.ts` is the canonical helper for recomputation. All inline `weight * sets * reps` occurrences must be replaced in Phase 6C by calls to `calculateVolume` (design-only mapping now).
- For legacy sessions that lack `totalVolume` and have minimal data, UI should show "volume unavailable" or approximate with clear labelling.


## 8. Active / Rest Time Schema

Observed fields: `avgGreenLoopTime`, `avgRedLoopTime`, `greenLoopTimes`, `redLoopTimes`, and some readers expecting `activeTime`/`restTime`.

Canonical representation (read-only accessor contract):
- Canonical fields: `activeTime` (seconds), `restTime` (seconds), plus raw arrays `greenLoopTimes[]`, `redLoopTimes[]`.
- Do NOT rename persisted fields in Phase 6B. Instead define a compatibility accessor layer (design-only):

  - `getSessionActiveTime(session)` precedence:
    1. If `session.activeTime` is finite → return it
    2. Else if `session.avgGreenLoopTime` is finite → return it
    3. Else if `session.greenLoopTimes` array present → return average(session.greenLoopTimes)
    4. Else if `session.elapsedTime` and `session.restTime` present → return session.elapsedTime - session.restTime
    5. Else → return null (insufficient data)

  - `getSessionRestTime(session)` precedence:
    1. If `session.restTime` is finite → return it
    2. Else if `session.avgRedLoopTime` is finite → return it
    3. Else if `session.redLoopTimes` array present → return average(session.redLoopTimes)
    4. Else → return null

Readers must use these accessors (Phase 6C will replace ad-hoc field reads with accessors). Accessors label returned values with `source` metadata for debugging (e.g., `{ value: 12.34, source: 'avgGreenLoopTime' }`).


## 9. Character Stats Contract

Current system (observed):
- `PrimaryStats` (STR, VOL, TMP, END, PHY, HYP) defined in `src/constants/collectibleWorkouts.ts`.
- `processMainCardRun` in `src/utils/MainCardEngine.ts` converts session metrics into `state.gains` and persists `main_card_state_<id>`.
- `LevelSystem` (`src/utils/LevelSystem.ts`) persists XP/level in AsyncStorage keys like `collectible_xp_<id>` and `collectible_level_<id>`.

What each stat represents (canonical mapping — align with existing code intent):
- STR: strength-related gains (driven primarily by heavy-weight volume metrics)
- VOL: total training volume (driven by totalVolume)
- TMP: tempo/cadence (driven by cadence/density metrics)
- END: endurance (driven by elapsed active time and cardio minutes)
- PHY: physicality / power (multi-factor: volume + intensity)
- HYP: hypertrophy (driven by repetitions and moderate weight volume)

Which workout metrics influence which stat (summary derived from `metricsToAttr` mapping in `MainCardEngine`):
- volumeKg → VOL
- enduranceMin / activeTime → END
- intensityRatio / liftedWeightKg → STR/PHY
- densityPct / cadence → TMP
- repetition counts in a hypertrophy band → HYP

Character gains lifecycle (canonical):
- Gains are calculated during `processMainCardRun` (existing) from aggregated session metrics and persisted to `main_card_state_<id>`.
- Authoritative display for character gains: persisted `state.gains` in main-card state.
- Replaying or re-opening a historical workout MUST NOT retroactively modify persisted `state.gains` unless an explicit reprocess action is invoked (DESIGN DECISION REQUIRED: whether reprocess is allowed and by whom).

Edge cases / behaviors:
1. Same workout processed twice: MUST be prevented or made idempotent. Current repo does not clearly prevent double-processing; recommended persisted flag `mainCardProcessed` or dedup by session id — DESIGN DECISION REQUIRED.
2. Partial workouts: `processMainCardRun` currently consumes session metrics; if session.metrics indicate incomplete attempt, behavior should map to partial gains proportionally. If current behavior is ambiguous, mark DESIGN DECISION REQUIRED. However `addWorkoutXP` gating indicates progression gating exists for incomplete runs.
3. Failed/incomplete workouts: XP gating suggests incomplete workouts may store XP but not apply level-up; canonical contract: persist XP but mark `levelUpGated=true` until fully-completed requirements met (aligns with `addWorkoutXP` observed behavior).
4. MainCard gains vs collectible stats: `main_card_state` persists gains per main-card; collectible baseStats remain static. Boosted stats are computed from baseStats + gains + level-based boosts via `getStatsWithBoostV2`. Relationship: `main_card_state.gains` contributes to boosted stats via the boost engine.

If any of the above behavior is not explicit in code, mark as DESIGN DECISION REQUIRED.


## 10. XP / Level Contract

Observed behavior (Phase 6A): `addWorkoutXP` awards XP per workout (base 1) and `getXPForLevel` uses an incremental threshold; `addWorkoutXP` gates level up based on completion.

Canonical progression contract:
- XP award: awarding happens only during `processMainCardRun` or `addWorkoutXP` invocation when a workout is recorded and meets completion criteria.
- XP per workout: default 1 XP per qualifying workout (existing behavior) — do not change.
- Level threshold: `getXPForLevel(level)` remains authoritative.
- Level up: when persisted xp >= threshold, persist level increment and persist a level-up event in LevelSystem storage.
- Partial/incomplete: award XP only if completion criteria met; otherwise persist pending XP but mark as gated (existing `levelUpGated` behavior).

Historical recomputation rule:
- Historical workout re-open MUST NOT automatically recompute and change past XP/level state. Answer: NO, do not recompute. Any reprocessing must be explicit and require human/QA approval. Rationale: preserve historical immutability and auditability.


## 11. OVR Contract

Algorithmic difference (observed):
- `calculateOVR(stats, position)` (`src/constants/collectibleWorkouts.ts`) — weighted sum of primary stats using `SPLIT_WEIGHTS` per position, normalized and rounded, capped at 99. (Authoritative & tested)
- `calculateOVRV2(boostedStats)` (`src/utils/collectibleStatEngine.ts`) — alternate approach (simple average of boosted stats), used in boost pipeline.

Recommendation:
- AUTHORITATIVE OVR: `calculateOVR` (position-weighted) — used for ranking, collection lists, and core UI where historical consistency matters.
- ALTERNATE / BOOSTED OVR: `calculateOVRV2` may be used only in internal boosted-stat preview flows and where the product requires an alternate balancing calculation, but it must be explicitly labelled in UI as "boosted" or "alternate".

Which inputs affect OVR:
- Base stats (`workout.baseStats`) ⇒ always used for AUTHORITATIVE OVR
- Level / XP / `main_card_state.gains` ⇒ used to compute boosted stats via `getStatsWithBoostV2` and then passed to boosted OVR calculations
- DSI/1RM/strength ⇒ indirectly affect gains which then may affect boosted stats, not direct inputs to `calculateOVR`

UI mapping:
- Screens that present collections, lists, leaderboards: use AUTHORITATIVE OVR (`calculateOVR`) unless explicitly showing boosted preview.
- Screens that present the user's own boosted card: may show boosted OVR but must state that it's boosted and which boost algorithm is used.

Design decision required: whether boosted OVR should replace AUTHORITATIVE OVR in any core UI — mark as DESIGN DECISION REQUIRED.


## 12. Boosted Stats Contract

Observed inconsistency (Phase 6A F5): some UIs show `workout.baseStats` while others call `getStatsWithBoostV2`.

Two plausible approaches:
- A) Static base stats with separate progression display: UIs default to baseStats; a dedicated screen shows boosted stats/OVR.
- B) Persisted Level/XP → boosted stats applied and shown in main UI where user expects progression to be visible.

Repository fit: the presence of `getStatsWithBoostV2` and LevelSystem suggests boosts are intended; however many UIs render baseStats only (likely temporary or for performance). Recommendation: default to A for conservative rollout, but provide a clear plan to adopt B with explicit migration and tests.

Recommendation:
- Phase 6B: Document current behavior and classify screens that show base vs boosted stats. Do not change runtime behavior.
- Phase 6C (after approval): If opting for B, implement a single authoritative boost pipeline (use `getStatsWithBoostV2` consistently) and toggle per-screen via feature flag.

Decision marker: DESIGN DECISION REQUIRED — choose between A and B.


## 13. Rounding / Precision Policy

Current facts (Phase 6A):
- `calculateCalories` rounds to integer (Math.round) before persistence.
- `calculateOVR` rounds at final step.
- `MainCardEngine` persists some gains with `.toFixed(2)`.
- Other metrics often persisted as floats; UI rounds for display as needed.

Phase 6B policy (non-invasive):
- Preserve existing persisted rounding where code currently does it (calories integer, current gains formatting). Do not change persistence formats in Phase 6B.
- Define canonical policy for Phase 6C (for later implementation):
  - Raw precision: keep full JS Number precision in memory computations.
  - Persistence precision: store `calories` as integer (existing). For other numeric persisted metrics aim for 3-4 decimal places where necessary, but this requires code changes in Phase 6C.
  - Aggregation precision: perform aggregation on raw unrounded numbers when available; avoid double-rounding.
  - Display precision: round only at the point of rendering the UI; show units and tooltips for differences.

In this spec, list current persisted rounding behaviors explicitly so Phase 6C tests can assert parity.


## 14. Historical Immutability Contract

Acceptance principle: Once a workout is completed and recorded, historical metrics displayed later must reflect the state as-of save-time, not current user settings, except when explicit reprocessing is requested.

Scenarios and acceptance (per required list):

Scenario A: body weight changed after workout
- `calories`: must remain the persisted `session.calories` value. (PASS)
- `volume`: use persisted `session.totalVolume` or recomputed from recorded lifts. (PASS)
- `1RM`, `DSI`: computed from recorded lifts at historical time — do not change with updated `userBodyWeight` except if `session.bodyWeightKg` absent, then DSI used `parseStoredBodyWeight()` at read-time — acceptance requires `session.bodyWeightKg` exists for modern sessions. (FAIL if relying on current user profile)
- `character gains` & `progression`: do not change retroactively. (PASS)

Scenario B: workout weight settings changed after workout
- Same as A: historical displays must use recorded weights / persisted fields, not current `settings`. (PASS)

Scenario C: character level increased after workout
- `calories`, `volume`, `1RM`, `DSI`: historical metrics unchanged. (PASS)
- Displays of boosted OVR may reflect current level only if UI intentionally shows live-boosted preview; authoritative historical OVR for the session should be computed from persisted stats at the time (DESIGN DECISION REQUIRED if permanent retroactive boost desired). Recommended default: do not retroactively alter historical OVR or gains.

Scenario D: workout reopened
- Unless explicit "reprocess" action invoked, do not change persisted `main_card_state` or `level` derived from that workout. Re-opening is read-only. (PASS)

Scenario E: legacy workout lacking persisted fields
- Attempt to compute historical metrics from recorded fields; if not possible, show "insufficient data" and optional planned estimate labelled accordingly. (PASS)

Acceptance criteria summary:
- Readers must use snapshot-first precedence per `Snapshot vs Live Policy` above.
- No silent retroactive changes to persisted character gains or levels.


## 15. Cross-Screen Consistency Contract

Minimum architecture: a small reader/accessor layer to centralize precedence and avoid duplication. Proposed conceptual readers (design only):

- `SessionSnapshotReader` (primary): functions
  - `getCalories(session): { value:number, source:'snapshot'|'computed'|'missing' }` — already exists as `getSessionCalories` in `src/utils/SnapshotCalorieReader.ts` for calories; extend conceptually for other metrics.
  - `getTotalVolume(session): { value:number|null, source }`
  - `getBodyWeight(session): { value:number|null, source }`
  - `get1RM(session, exerciseId): { value:number|null, source }`
  - `getDSIForSession(session): { value:number|null, source }`
  - `getActiveTime(session): { value:number|null, source }`

- `StrengthReader` (thin wrapper): leverages `SessionSnapshotReader` and `StrengthCalculator` to provide canonical strength metrics.

UI screens mapping: all historical viewers must call `SessionSnapshotReader` functions rather than directly reading fields or recomputing from `session.settings`.

Minimum changes for parity (Phase 6C): replace ad-hoc reads in the list of screens (`DailySummaryDetailScreen`, `StrengthTrendScreen`, `TrendsScreen`, `WorkoutSummaryScreen`, `WorkoutCategoryDetailScreen`, `MainCardCardNew`, `CollectibleCardNew`, etc.) to call these readers.


## 16. Legacy Compatibility

Fallback precedence for legacy sessions (explicit):
1. Persisted snapshot field (e.g., `session.calories`, `session.totalVolume`, `session.bodyWeightKg`) — used if present.
2. Recompute from recorded session fields (`exerciseLifts`, `completedSets`, `completedReps`, per-exercise `weightKg`).
3. If (1) & (2) missing, do NOT use `session.settings` for historical authoritative displays. Instead show "insufficient data" and optionally a PLANNED/ESTIMATE computed from `session.settings` but labelled clearly.
4. Safe default: zero or null depending on display semantics; prefer showing "—"/"N/A" to avoid misleading numbers.

If migrations are deemed necessary (e.g., to backfill `totalVolume`), document migration design in Phase 6C; DO NOT run migrations in Phase 6B.


## 17. Test Strategy (Phase 6C tests to be written)

Test categories and representative tests (design-only):

A) StrengthCalculator
- Unit: `calculate1RM(100,10)` -> expected `100*(1+10/30)=133.333...` invariant: monotonic in weight and reps.
- Edge: `calculate1RM(0,5)` -> 0; `calculate1RM(100,0)` -> 0.

B) DSI
- Scenario: session with `exerciseLifts` [{w:100,r:5},{w:80,r:8}], bodyWeight 80kg -> expected DSI computed via Epley then ratio average.
- Invariant: DSI should not change if `userBodyWeight` changes after session when `session.bodyWeightKg` present.

C) Volume
- Test: `calculateVolume(3,8,50)` == 1200 and UI reader uses `session.totalVolume` preferentially.
- Legacy fallback: missing `totalVolume` but `exerciseLifts` exists -> recomputed value matches sum.

D) Historical immutability
- Changing `userBodyWeight` or workout settings after writing session must not alter `getSessionCalories(session)` result if `session.calories` present.

E) Character gains / MainCardEngine
- Given deterministic `metricsList`, `processMainCardRun` yields expected `state.gains` persisted.
- Idempotency: processing same `metricsList` twice must either be prevented or produce same net effect once (test to assert chosen behavior).

F) LevelSystem / XP gating
- Partial workout (not meeting completion criteria) persists xp but does not level up; full completion triggers level up as expected.

G) OVR
- `calculateOVR` tests confirm weighted average and capping at 99 (existing tests should remain passing).

H) Cross-screen parity
- For a saved session, display components (DailySummaryDetailScreen, TrendsScreen, WorkoutSummaryScreen) must read identical numbers for calories/volume/1RM/DSI using `SessionSnapshotReader`.

I) Rounding
- Tests to assert persisted rounding parity: `calculateCalories` persisted int equals saved field; aggregated displays match expected rounding policy.

Property-based / invariants to test:
- Historical immutability: for any write-only change to `userBodyWeight` or `workout.settings`, historical reader outputs remain unchanged for sessions with persisted snapshot fields.
- Reader precedence: snapshot > recorded fields > planned estimate.


## 18. Phase 6C Implementation Plan (design-only, prioritized)

P0 (HIGH)
- Replace ad-hoc reads in historical UI screens with `SessionSnapshotReader` calls.
  - Files: `src/screens/DailySummaryDetailScreen.tsx`, `src/screens/TrendsScreen.tsx`, `src/screens/WorkoutSummaryScreen.tsx`, `src/screens/WorkoutCategoryDetailScreen.tsx`, `src/components/AddSummaryCardModal.tsx`
  - Functions: Historical display render paths that compute calories/volume/DSI/1RM.
  - Behavior change: Readers use snapshot-first precedence; MUST NOT change persisted snapshot values.
  - Tests required: cross-screen parity tests, historical immutability tests.
  - Risk: medium — need to ensure no UI regressions; preserve existing null/legacy displays.

- Centralize active/rest accessors.
  - Files: reader utilities (new `src/utils/SessionSnapshotReader.ts` design), replace ad-hoc field reads across screens.
  - Tests: accessor precedence tests.
  - Risk: low.

P1 (MEDIUM)
- Consolidate volume calculation usages to `calculateVolume`.
  - Files: `src/utils/StrengthCalculator.ts` (exists), update references in screens (design-only mapping list).
  - Tests: unit tests for `calculateVolume` and integration parity.
  - Risk: low.

- Explicitly document/mark `mainCardProcessed` semantics or implement a persisted dedup flag.
  - Files: `src/utils/MainCardAttemptManager.ts`, `src/utils/MainCardEngine.ts` (design-only changes).
  - Tests: idempotency tests.
  - Risk: medium.

P2 (LOW)
- Decide & implement boosted OVR canonicalization (if decision B accepted).
  - Files: `src/constants/collectibleWorkouts.ts`, `src/utils/collectibleStatEngine.ts`, UI mapping updates.
  - Tests: ensure `calculateOVR` parity and boosted variant tests.
  - Risk: medium-high (game balance). Requires explicit approval.

Notes: All Phase 6C code patches must include tests ensuring parity and must not change protected formulas without explicit approval.


## 19. Protected Areas

The following are protected and require explicit approval before change (DONT change in Phase 6C without sign-off):
- Calorie formulas and MET table in `src/utils/CalorieCalculator.ts`
- Strength formulas (Epley) in `src/utils/StrengthCalculator.ts`
- OVR formula in `src/constants/collectibleWorkouts.ts` (authoritative) unless explicitly approved
- XP rules in `src/utils/LevelSystem.ts` (award/per-workout thresholds)
- Any writes to AsyncStorage legacy keys (`workoutSummaries`, `main_card_state_<id>`, `collectible_xp_<id>`) without migration design and approval


## 20. Architecture Diagram (textual)

PLANNED WORKOUT (template/settings)
      ↓ (user starts)
WORKOUT EXECUTION (TimerScreen saves recorded lifts, loop times, elapsed)
      ↓ (save-time snapshot)
ACTUAL SESSION METRICS (persisted `workoutSummaries`) — contains `calories`, `totalVolume`, `bodyWeightKg`, `exerciseLifts`, `avgGreenLoopTime` ...
      ↓
PERSISTED HISTORICAL SNAPSHOT (authoritative)
      ↓
┌───────────────┬────────────────┬─────────────────┐
│ Strength      │ Character      │ Progression     │
│ Engine        │ Engine         │ Engine          │
│ (`StrengthCal.`) │ (`MainCardEngine`) │ (`LevelSystem`) │
└───────────────┴────────────────┴─────────────────┘
      ↓
Snapshot Readers / UI (DailySummary, Trends, Collectible screens)

Notes: All readers must go through `SessionSnapshotReader` which implements snapshot-first precedence.


## 21. Design Decisions Requiring Approval

List of items that need explicit user/PM approval before Phase 6C changes or policy shifts:

D1 — Should boosted OVR be authoritative in all UI where OVR is shown?
- CURRENT: mixed (some UIs show base stats)
- OPTIONS: (A) Base-only by default + separate boosted preview; (B) show boosted stats everywhere
- RECOMMENDATION: Default to (A) to preserve clarity and avoid unintended game balance changes
- IMPACT: high (game balance & UX)

D2 — Should historical session store explicit per-exercise 1RM (`strengthMeta`) at save-time?
- CURRENT: not consistently stored
- OPTIONS: (A) store derived 1RM per-exercise at save-time (PROPOSED), (B) compute on read from recorded lifts
- RECOMMENDATION: (B) preferred for minimal migration cost; (A) useful but needs migration/backfill
- IMPACT: medium (space & migration)

D3 — Should reprocessing historical sessions be allowed to retroactively change `main_card_state` or Level XP?
- CURRENT: ambiguous; code persists gains during processing
- OPTIONS: (A) disallow reprocessing without explicit admin/QA; (B) allow reprocess via tooling that records audit trail
- RECOMMENDATION: (A) — preserve immutability unless a controlled reprocess mechanism exists
- IMPACT: high (auditability)

D4 — Should `totalVolume` be backfilled via migration for legacy sessions?
- CURRENT: some legacy sessions missing `totalVolume`
- OPTIONS: backfill via recompute from available session fields or leave as-is and show "N/A" for legacy sessions
- RECOMMENDATION: (DESIGN DECISION REQUIRED) depending on analytics needs. Backfill increases coverage but must be opt-in and reversible.

D5 — Should UI default to showing boosted stats (getStatsWithBoostV2) or baseStats?
- See D1. Recommend (A) base-only for collection screens; boosted on player profile screens only.

D6 — Should canonical fields `activeTime`/`restTime` be written to persisted sessions going forward?
- CURRENT: `avgGreenLoopTime` and `avgRedLoopTime` exist
- OPTIONS: (A) keep existing names but provide accessor normalization (recommended), (B) migrate to canonical names (harder)
- RECOMMENDATION: (A) accessor layer first, evaluate for migration later.


## 22. Acceptance Criteria

Phase 6B deliverable (this spec) is accepted when:
- The `PHASE_6B_CALCULATION_PROGRESSION_SPEC.md` is approved by product/engineering stakeholders.
- All DESIGN DECISION REQUIRED items are either resolved or accepted to remain as decisions for Phase 6C.

Phase 6C readiness criteria (design-only checklist):
- A small `SessionSnapshotReader` design exists with listed functions and precedence rules.
- A per-screen mapping of changes is produced (which call sites to update) — design-only list.
- Test plan items above have a mapping to concrete test files and jest tests.
- No protected-area formula or persistence format changes are included without explicit approval.


---

If you approve this Phase 6B specification I will:
- mark the spec draft todo as completed, and
- produce the Phase 6C per-file hunk list (design-only) and the exact tests to implement.

If you want changes now, tell me which DESIGN DECISION items to resolve and I will update the spec accordingly.
