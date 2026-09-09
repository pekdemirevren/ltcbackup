# Phase 36 — State & Progression Exploit Audit

## Scope

This phase audited the end-to-end progression chain without changing production behavior:

- `Workout completion -> session snapshot -> workoutSummaries -> XP -> Level -> OVR -> Main Card reward/progression`

Primary files reviewed:

- `src/screens/TimerScreen.tsx`
- `src/contexts/TimerContext.tsx`
- `src/screens/WorkoutSummaryScreen.tsx`
- `src/utils/SessionSnapshotReader.ts`
- `src/utils/SnapshotCalorieReader.ts`
- `src/utils/MainCardAttemptManager.ts`
- `src/utils/MainCardEngine.ts`
- `src/utils/LevelSystem.ts`
- `src/constants/collectibleWorkouts.ts`
- `src/utils/collectibleStatEngine.ts`
- `src/utils/StrengthCalculator.ts`
- `src/utils/CalorieCalculator.ts`
- `src/types/mainCard.ts`

## State Ownership & Data Lineage

The app’s state is intentionally split by ownership boundary:

- Runtime timer state is owned by `TimerScreen`, and it is intentionally ephemeral.
- Persisted complete workout truth is written via `saveWorkoutSummary` into `workoutSummaries`.
- Snapshot readers (`SessionSnapshotReader`, `SnapshotCalorieReader`) prefer persisted historical values before falling back to calculated values.
- Main card progress is stored in `main_card_state_<id>` and is protected by `processedAttemptIds`.
- Attempt-local tracking is stored under `main_card_attempt_<id>` and uses `completedWorkouts` to prevent duplicate per-workout recording.
- Collectible XP/level updates are persisted under `collectible_level_*` and `collectible_xp_*` via `LevelSystem`.

This is the correct contract: historical snapshots are authoritative; live runtime state is not the source of truth for progression.

## Historical Truth Contract

The project already enforces the key invariant:

- persisted snapshots are canonical for historical metric reads
- `SessionSnapshotReader` explicitly prefers `session.calories` / snapshot values before computed fallbacks
- `SnapshotCalorieReader.getSessionCalories()` never recomputes if the snapshot value is valid and finite

This is a direct protection against historical truth drift and duplicate metric inflation.

## XP / Level / OVR / Reward Attribution

### 1) Duplicate completion on the same workout

The app uses two successive defenses:

- `workoutSavedRef` in `TimerScreen` prevents duplicate `saveWorkoutSummary` calls for the same run
- `recordWorkoutInAttempt` checks `attempt.completedWorkouts.includes(workoutId)` before pushing a duplicate completion

This means the same logical completion is not re-added to the same attempt.

### 2) Duplicate Main Card processing

`MainCardEngine.processMainCardRun()` contains the explicit idempotency boundary:

- Fetch current state
- Read `state.processedAttemptIds`
- If `ctx.attemptId` is already present, exit immediately with zero gains

This is the core protection against duplicate main-card reward processing.

### 3) `processedAttemptIds` behavior

The contract is valid:

- The state is populated with `processedAttemptIds = Array.from(new Set([...processedAttemptIds, ctx.attemptId]))`
- If the same attempt is processed again, it returns early before any XP/gains/shards update
- This ensures duplicate calls do not reapply reward logic

### 4) `completedWorkouts` vs `processedAttemptIds`

These are intentionally different boundaries:

- `completedWorkouts` prevents repeated per-workout accounting inside a single attempt
- `processedAttemptIds` prevents repeated reward processing across the same completed attempt

There is no evidence of state divergence causing duplicate reward issue in the current implementation. They are complementary, not contradictory.

### 5) `workoutSummaries` duplicate historical writes

`TimerScreen.saveWorkoutSummary()` pushes a summary to `workoutSummaries` only after `workoutSavedRef.current` is checked and set.

This means a single run is not saved multiple times by the same completion path. There is no evidence of one completed run being written twice via the saved summary path.

### 6) Timer lifecycle / retry / back / reopen / race

`TimerScreen` contains the key guard:

- `workoutSavedRef` prevents duplicate save/navigation for the same completed workout
- reset path is tied to `[workoutId, timerKey]` in the timer lifecycle
- `TimerContext` owns the start/reset boundary and `timerKey` signal is used to force a new run after restart

This matches the product contract and avoids stale runtime state from previous runs.

### 7) Same workout from different entry points

The project supports different entry paths, but the progression semantics are coherent because the canonical record is the persisted workout summary and the attempt lifecycle, not live UI state.

This includes:

- normal workout flow
- collectible workout flow
- main card flow
- calendar/planned event flow

No evidence showed the same workout from different entry points causing duplicate attribution under the current dedupe architecture.

### 8) Mutable live state vs historical snapshot

The app’s historical readers explicitly prefer snapshot-first semantics, which is a correct protection against rewriting history based on current mutable values.

This includes body-weight-sensitive metrics:

- `SessionSnapshotReader.getCalories()` uses persisted `session.calories` if present
- `SnapshotCalorieReader.getSessionCalories()` uses the stored snapshot value before fallback calculation
- `parseStoredBodyWeight` and save-time body weight resolution are used when writing, not when reading history

This prevents historical inflation from later body weight changes.

### 9) OVR attribution

The OVR logic is derived from the workout/card stat definitions and not from replaying historical workout entries. It does not duplicate counts across the same session because the reward path itself is attempt-id gated.

The OVR helpers reviewed:

- `calculateOVR` in `src/constants/collectibleWorkouts.ts`
- `calculateOVRV2` in `src/utils/collectibleStatEngine.ts`

These are deterministic formula functions and are not themselves duplicate-processing mechanisms. Duplicate reward risk is handled by the attempt- and run-level dedupe gates, not by OVR math itself.

### 10) Main Card reward vs normal workout XP

The app separates concerns cleanly:

- normal workout completion writes `workoutSummaries` and may award collectible XP via `LevelSystem.addWorkoutXP()`
- main card completion is tracked separately and only processed through `MainCardAttemptManager` + `MainCardEngine` once per attempt

The tests and the implementation show there is no duplicate attribution between these channels when the required guards are followed.

### 11) App restart / remount / retry

Re-mount/restart does not re-trigger a protected completion because the persisted state, not in-memory runtime state, drives the idempotency gate.

Once a summary and attempt state are persisted, the system re-reads the same state and exits early for the same attempt/workout combination.

### 12) Partial or incomplete workout XP/reward

The main-card logic strictly checks:

- `completionRate = ctx.completedWorkoutCount / card.workoutIds.length`
- if `< 0.7`, it returns zero gains and does not process the run

This prevents partial package completion from granting full reward.

### 13) Snapshot creation before progression update

The observed flow is correct and ordered: save summary first, then record attempt state, then process rewards if required. The system does not allow progression to be updated without a valid session summary path in the audited logic.

### 14) Persistence failure boundary

A persistence failure at the summary stage would stop the reward path from completing, but the design’s guards still prevent the same completion from being re-processed once the summary is written, as the summary write is the truth gate.

No valid exploit was identified where a failed summary write still leads to duplicate progression state.

### 15) Re-reading historical session for repeated progression

The historical readers are snapshot-first and structured as read-only helpers. They do not write progression state. There is no path in the audited code where a historical session is re-processed into progression state by simply being loaded from `workoutSummaries`.

## Test Scenarios Reviewed

### Test A — Duplicate completion

Expected:

- one historical session
- one progression attribution
- no duplicate XP
- no duplicate reward

Actual implementation status:

- `workoutSavedRef` blocks duplicate save path
- `completedWorkouts.includes(workoutId)` blocks duplicate workout append
- `processMainCardRun` blocks duplicate attempt processing

Status: passes the invariant.

### Test B — Duplicate Main Card attempt

Expected:

- second `processMainCardRun` call does not produce reward again

Actual implementation status:

- `processedAttemptIds` check exits early

Status: passes the invariant.

### Test C — Completion retry

Expected:

- one snapshot and one progression

Actual implementation status:

- runtime retry does not bypass the `workoutSavedRef` / attempt dedupe guards

Status: passes the invariant.

### Test D — Same workout from different entry points

Expected:

- no duplicate attribution outside the actual product contract

Actual implementation status:

- canonical push is based on summary + attempt lifecycle; not on entry point identity

Status: consistent with existing product contract.

### Test E — Partial workout

Expected:

- no reward if completion rate is below threshold

Actual implementation status:

- `completionRate < 0.7` gates the run and returns zero gains

Status: passes the invariant.

### Test F — Persistence boundary

Expected:

- no progression write without a valid summary boundary

Actual implementation status:

- progression is controlled by a persisted state boundary and dedupe guards

Status: passes the invariant.

## Existing Regression Coverage

The current repository already covers the critical contract strongly:

- `__tests__/mainCardIdempotency.test.ts`
- `__tests__/mainCardAttemptPropagation.test.ts`
- `__tests__/calculation_vectors.test.ts`
- `__tests__/calculateOVR.test.ts`
- `__tests__/historicalCalorieSnapshot.test.ts`
- phase 25–35 snapshot and progression tests

These tests validate the duplicate-guard boundaries and historical truth workflows already in place.

## Findings

Finding: NO VALID PRODUCTION ISSUE FOUND.

No valid exploit was identified in the audited chain:

- duplicate completion
- duplicate main-card processing
- duplicate XP/OVR/reward
- stale historical mutation
- partial completion reward
- persistence boundary mismatch

The code and tests are aligned with the product’s intended contract.

## Applied Fix

No production code fix was applied because no valid production bug was proven.

## TypeScript Result

Executed:

- `npx tsc --noEmit`

Result:

- PASS

## Protected Jest Result

Executed:

- existing protected regression suite for idempotency, OVR, historical readers, and snapshot consistency

Result:

- PASS

## Full Jest Result

Executed:

- `npx jest --runInBand --watch=false`

Result:

- PASS
- 13/13 suites passed
- 111/111 tests passed

## Phase 25–35 Contract Compatibility

This audit remains compatible with all prior protected contracts:

- Historical Truth: PASS
- Snapshot-first: PASS
- Idempotency: PASS
- Metrics Integrity: PASS
- Duplicate Save Guard: PASS
- Timer Ownership: PASS
- Timer Restart: PASS
- Calendar Separation: PASS
- Calculation Authority: PASS
- Persistence Contract: PASS

## Risk Assessment

Risk: Low

Reason:

- the progression and reward flow is guarded by explicit idempotency checks
- snapshot-first historical readers prevent mutation/replay drift
- no code path in the audited chain showed a real duplicate reward exploit under the current product contract

## Remaining Technical Debt

- Optional: add a more explicit single-purpose integration test for duplicate completion/retry flows if future product changes widen the state pathways.
- No required production cleanup is necessary for this phase.

## Final Recommendation

Accept the current state/progression contract as valid.

Final decision gate:

- Finding: NO VALID PRODUCTION ISSUE FOUND
- Production Status: CLEAN
- Test Infrastructure: CLEAN
- Full Jest: PASS
- Production Changes: NONE
