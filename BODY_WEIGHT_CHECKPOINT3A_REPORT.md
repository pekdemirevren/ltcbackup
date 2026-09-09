# BODY WEIGHT CHECKPOINT 3A — CALORIE INTEGRATION

## Objective
- Establish the exact production path from persisted `userBodyWeight` to calorie calculation without changing any production code.
- Separate the mathematical question from the product integration question.
- Verify whether the calorie system is actually user-body-weight aware or whether it is currently defaulting to `DEFAULT_BODY_WEIGHT_KG` and/or using lifted weight semantics.

## Executive Finding
The codebase currently does not pass the persisted user body weight into the calorie calculation function. The calorie math is body-weight-aware only in the sense that it internally hard-codes `DEFAULT_BODY_WEIGHT_KG = 75`, and it treats the third parameter as lifted resistance weight, not user profile body weight. The production flow for calorie reads and render paths does not tie `userBodyWeight` to `calculateCalories()`.

## Complete Calorie Data Flow

### 1) User body weight source
- File: `src/screens/AdjustMoveGoalScreen.tsx`
- Function: `loadTodayGoal()`, `saveTodayGoal()`
- Input: user selected body weight value from picker state
- Output: AsyncStorage writes and schedule/override writes
- Body weight source: screen state `bodyWeight`

### 2) Persistence layer
- File: `src/screens/AdjustMoveGoalScreen.tsx`
- Function: `saveTodayGoal()`
- Input: `bodyWeight`
- Output: `AsyncStorage.setItem('userBodyWeight', String(bodyWeight))`
- Body weight source: UI state

### 3) Read path on summary/report screens
- File: `src/screens/DailySummaryDetailScreen.tsx`
- Function: `loadData()`
- Input: persisted `userBodyWeight`
- Output: `setUserBodyWeight(bw)` and ratio/DSI calculations
- Body weight source: AsyncStorage `userBodyWeight`
- Important: this read path is for strength ratio / DSI logic, not the calorie function

### 4) Calorie function entry point
- File: `src/utils/CalorieCalculator.ts`
- Function: `calculateCalories(workoutId, durationSeconds, liftedWeightKg = 0, reps = 0)`
- Input: workout ID, duration, lifted weight, reps
- Output: kcal integer
- Body weight source: internal `DEFAULT_BODY_WEIGHT_KG` only
- Evidence: no `bodyWeight` parameter exists in the function signature

### 5) Display / storage of calories
- File: `src/screens/SummaryScreen.tsx`
- Function: screens compute a daily energy total from per-session calorie values
- Input: session workout data and weight values
- Output: displayed calories / stored summary field values
- Body weight source: not directly used in the calorie formula

## Calorie Callers

### Callers inspected
1. `src/screens/SummaryScreen.tsx`
   - Function: daily summary aggregation
   - Body weight available?: no explicit `userBodyWeight` read in the calorie aggregation block shown in the code inspected
   - Source: `item.settings.weight` or `weightVal`
   - Passed to calculator?: yes, but as the third parameter (`w`) or summary-specific weight, not the user body weight
   - Fallback: no user profile fallback appears in this path
   - Result usage: daily energy total displayed in summary UI

2. `src/screens/MoveScreen.tsx`
   - Function: `loadData()`
   - Body weight available?: yes, `userWeight` is read from `userSettings` and defaults to `70`
   - Source: `settings.weight` in AsyncStorage
   - Passed to calculator?: yes, but as the fourth positional parameter, not the body-weight-aware parameter
   - Fallback: `70`
   - Result usage: monthly/weekly calorie trend display

3. `src/screens/TrendsScreen.tsx`
   - Function: `getPeriodData()`
   - Body weight available?: yes, from local `userWeight`
   - Source: stored user settings / weight
   - Passed to calculator?: yes, but as the fourth positional parameter
   - Fallback: local user weight already loaded from settings
   - Result usage: daily trend aggregation

4. `src/screens/SessionsScreen.tsx`
   - Function: set summary session calories
   - Body weight available?: not from the profile `userBodyWeight` path; derived from session weight
   - Source: session settings weight or `weightVal`
   - Passed to calculator?: yes, via `weightVal`
   - Fallback: `0` if no session weight
   - Result usage: session row total

5. `src/screens/WorkoutSummaryScreen.tsx`
   - Function: session summary view
   - Body weight available?: only the session weight value, not the persisted profile body weight
   - Source: workout settings weight
   - Passed to calculator?: yes, as the third arg (`weightVal`)
   - Fallback: none visible in the code path inspected
   - Result usage: detail display

6. `src/components/Summary/SessionsCard.tsx`
   - Function: render session cards
   - Body weight available?: not from `userBodyWeight`; mostly from session weight
   - Source: `weightVal`
   - Passed to calculator?: yes, as `weightVal`
   - Fallback: session calories already in memory
   - Result usage: card calorie label

7. `src/components/AddSummaryCardModal.tsx`
   - Function: session generate modal
   - Body weight available?: not from `userBodyWeight` in the inspected code paths
   - Source: session setting weight or volume data
   - Passed to calculator?: yes, as `weightVal`
   - Fallback: `0` or previous values
   - Result usage: estimated calories in modal

8. `src/screens/WorkoutCategoryDetailScreen.tsx`
   - Function: category detail aggregation
   - Body weight available?: derived from workout weights
   - Source: `weightVal`, `wTodayVolume` / `wTodaySets` / `wTodayReps`
   - Passed to calculator?: yes, as a weight-like value
   - Fallback: derived from volume
   - Result usage: category energy totals

## Cardio Path
- File: `src/utils/CalorieCalculator.ts`
- Trigger: if `normalizedId` is in the cardio list (`outdoor_run`, `outdoor_walk`, etc.)
- Formula:
  - `calories = met * DEFAULT_BODY_WEIGHT_KG * durationHours`
- Actual flow:
  - Caller may know user body weight and store it in profile or settings
  - But in the inspected production path, the caller does not send it to the function as the body-weight parameter because there is no such parameter
  - The call path still resolves to the default weight `75`
- Data-flow diagram:
  - `userBodyWeight` in AsyncStorage
  - `MoveScreen` / `TrendsScreen` load `userWeight` from settings
  - `calculateCalories(workoutType, elapsedTime, intensity, userWeight)`
  - inside the cardio branch, `liftedWeightKg` is ignored and `DEFAULT_BODY_WEIGHT_KG` is used
  - result is `MET * 75 * hours`

## Strength Path
- File: `src/utils/CalorieCalculator.ts`
- Trigger: non-cardio workouts
- Formula:
  - `baseCalories = met * DEFAULT_BODY_WEIGHT_KG * durationHours`
  - `calories = baseCalories * (1 + liftedWeightKg / 200)`
- Distinction:
  - `liftedWeightKg` = someone’s lifted resistance / exercise weight
  - `userBodyWeight` = the profile body weight
- The current function does not model `userBodyWeight` at all in the strength path either.
- It only scales calories by the lifted weight passed in the third parameter.
- Therefore, `exercise weightKg` and `userBodyWeight` are not conflated in the current function, but the user profile body weight is also not connected anywhere.

## Mathematical Body Weight Dependency
The mathematical formula is not user-weight aware in its function signature. It is default-weight aware.

For cardio with identical MET / duration:
- 60 kg user intended value → result is still `3.8 * 75 * 1 = 285`
- 75 kg default → `3.8 * 75 * 1 = 285`
- 90 kg user intended value → still `3.8 * 75 * 1 = 285`

For strength with identical MET / duration:
- 60 kg as lifted weight → `6 * 75 * 1 * (1 + 60/200)` = `585`
- 75 kg as default → `6 * 75 * 1` = `450` before multiplier, and with no explicit lifted weight arg you still get `450` base output without the lifted-weight scaling
- 90 kg as lifted weight → `6 * 75 * 1 * (1 + 90/200)` = `653`

These values are independent, deterministic, and derived from the current code contract.

## Production Integration

### Case A — `userBodyWeight = 60`
- Persisted value: `60 kg`
- Actual calorie calculation input: default `75 kg` in the function body, or the lifted-weight parameter if a caller passes a real resistance value 
- Integration: missing

### Case B — `userBodyWeight = 90`
- Persisted value: `90 kg`
- Actual calorie calculation input: default `75 kg` in the function body, or exercise/lifted weight if a caller passes it
- Integration: missing

This is proven by the actual function signatures and call sites.

## Integration Gap Evidence
Evidence in code:
- `src/utils/CalorieCalculator.ts` signature has no `bodyWeight` param.
- The body-weight path is only `DEFAULT_BODY_WEIGHT_KG`.
- Callers such as `src/screens/MoveScreen.tsx` and `src/screens/TrendsScreen.tsx` pass `userWeight` in the final positional arg, which is `reps` in the current function signature, not a user-body-weight parameter.
- Therefore the application does not currently feed persisted `userBodyWeight` into the calorie math.

## Historical Calorie Storage
This is a design question, not an implementation detail.

Observed patterns:
- `workoutSummaries` contains session records including `totalEstimatedKcal`, `calories`, and similar fields in `TimerScreen.tsx` and other summary saves.
- Some screens compute calories live from workout stats and render them; some session records already include previous total estimates.
- The repository shows a mixed pattern: some values are stored as totals (`totalEstimatedKcal`), some are recalculated on render, and some screens fall back to `s.activeCalories` when present.

This means the historical policy is mixed and needs design confirmation.

## Cached / Persisted Calorie Values
Examples found:
- `src/screens/TimerScreen.tsx`
  - saves `totalEstimatedKcal` into `workoutSummaries`
- `src/components/Summary/SessionsCard.tsx`
  - may use `session.calories || calculateCalories(...)`
- `src/screens/TrendsScreen.tsx`
  - uses `s.activeCalories ? parseFloat(s.activeCalories) : calculateCalories(...)`

Therefore the current system is mixed between stored and live calorie values.

## Integration Options

### OPTION A — Caller reads `userBodyWeight` and passes it explicitly
- Correctness: would be the most direct if the function signature were changed to accept a body-weight argument.
- Testability: high, if done explicitly with a new parameter or a wrapper.
- Coupling: medium
- Architecture fit: reasonable, but current function contract does not support it without changing the production API.
- Risk: medium because it would alter the formula contract and historical semantics.

### OPTION B — A higher-level workout context supplies body weight
- Correctness: possible if the context is uniform across all calorie-producing code paths.
- Testability: medium
- Coupling: medium/high
- Architecture fit: possible if there is a central app layer for workout metadata, but current code does not show one clearly.
- Risk: medium/high because it must be propagated consistently via every caller.

### OPTION C — Calculator itself reads persistence
- Correctness: possible but poor separation of concerns
- Testability: low without mocking storage
- Coupling: high
- Architecture fit: poor for a pure utility function and contrary to the current structure
- Risk: high

## Recommended Architecture
Observed fact:
- the current utility is a pure function in `src/utils/CalorieCalculator.ts`
- the app passes the parameters at call sites
- the persisted user profile is read in screens and summary logic, not in the utility itself

Recommendation:
- The most natural future architecture is a caller-level, explicit `bodyWeightKg` or `userBodyWeight` parameter passed into calorie calculation from a central workout/session context.
- This is a recommendation only; it is not implemented in this checkpoint.

## Historical Calorie Policy
This is a design decision required before any integration change.

Observed facts:
- some calories are saved and reused
- some are recalculated live
- some are treated as already-computed historical values

Therefore:
- `HISTORICAL CALORIE POLICY: DESIGN DECISION REQUIRED`

## Tests Added
- `__tests__/bodyWeightCalorieIntegration.test.ts`

Test coverage:
1. 60 kg mathematical calorie outcome for cardio using default weight contract
2. 75 kg mathematical baseline
3. 90 kg mathematical calorie outcome for cardio using default weight contract
4. actual production caller pattern with `calculateCalories(..., 'Medium', 60)` showing `userWeight` not used
5. strength path showing the third argument is treated as lifted weight, not user body weight
6. explicit demonstration that current API is not user-body-weight-aware

## Test Results
Command run:
- `npm test -- --runInBand __tests__/bodyWeightCalorieIntegration.test.ts __tests__/bodyWeightPersistence.test.ts __tests__/calculateOVR.test.ts`

Result:
- `3 passed, 3 total`
- `56 passed, 56 total`

## TypeScript
- Result: PASS
- Command run: `npx tsc --noEmit`

## Lint
- Result: FAIL
- This repository has a large lint debt unrelated to the calorie audit.

## Full Suite
- Result: BLOCKED
- `App.test.tsx` fails before app logic due to:
  - `TurboModuleRegistry.getEnforcing(...): 'RNGestureHandlerModule' could not be found`

## Git Safety Check
This checkpoint created only the test file and the report file. No production source file was edited as part of this checkpoint.

However, the repository already contains earlier modified tracked production files from previous checkpoints. Those were not touched in this design-only review.

## Files Added
- `__tests__/bodyWeightCalorieIntegration.test.ts`
- `BODY_WEIGHT_CHECKPOINT3A_REPORT.md`

## Production Files Modified
- This checkpoint: `NONE`
- Repo working tree: pre-existing tracked production edits remain from earlier checkpoint work and were not altered in this step

BODY WEIGHT CHECKPOINT 3A

Formula:
UNCHANGED

Mathematical Body Weight dependency:
PRESENT

Cardio integration:
ABSENT

Strength integration:
PARTIAL

User Body Weight integration:
ABSENT

Integration gap:
PROVEN

Historical calorie behavior:
MIXED

Historical policy:
DESIGN DECISION REQUIRED

Tests:
PASS

TypeScript:
PASS

Lint:
FAIL

Full suite:
BLOCKED

Production files modified:
NONE in this checkpoint

OVERALL:
READY FOR HUMAN REVIEW
