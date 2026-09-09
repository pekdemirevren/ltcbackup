# BODY WEIGHT CHECKPOINT 2 — CALORIE INTEGRATION

## Objective
- Audit the actual calorie code path without changing formula behavior.
- Distinguish the math question from the application integration question.
- Confirm whether the user’s stored body weight is connected to calorie calculation at runtime.
- Keep the production calorie formula unchanged during this checkpoint.

## Calorie Calculation Paths

### 1) `calculateCalories(...)`
- File: `src/utils/CalorieCalculator.ts`
- Signature: `calculateCalories(workoutId: string, durationSeconds: number, liftedWeightKg: number = 0, reps: number = 0): number`
- Inputs:
  - `workoutId` — exercise name / workout ID
  - `durationSeconds` — elapsed seconds
  - `liftedWeightKg` — third positional argument, used as resistance weight in strength logic
  - `reps` — fourth positional argument, not used in the formula body for cardio and only used as a non-critical parameter in the current implementation
- Body weight input:
  - No explicit `bodyWeight` argument exists.
  - The function uses the default constant `DEFAULT_BODY_WEIGHT_KG` internally.
- Default body weight:
  - `DEFAULT_BODY_WEIGHT_KG = 75` from `src/constants/bodyWeight.ts`
- Formula:
  - Cardio path: `calories = MET * DEFAULT_BODY_WEIGHT_KG * durationHours`
  - Strength path: `baseCalories = MET * DEFAULT_BODY_WEIGHT_KG * durationHours`, then `calories = baseCalories * (1 + liftedWeightKg / 200)`
  - Final output: `Math.round(calories)`
- Unit:
  - kcal (rounded integer)
- Callers:
  - `src/screens/SummaryScreen.tsx`
  - `src/screens/MoveScreen.tsx`
  - `src/screens/TrendsScreen.tsx`
  - `src/screens/SessionsScreen.tsx`
  - `src/screens/WorkoutSummaryScreen.tsx`
  - `src/screens/WorkoutCategoryDetailScreen.tsx`
  - `src/components/Summary/SessionsCard.tsx`
  - `src/components/AddSummaryCardModal.tsx`
  - `src/screens/SharingScreen.tsx`

### 2) `getCalorieIntensityLevel(...)`
- File: `src/utils/CalorieCalculator.ts`
- Purpose: returns a label (`Low`, `Medium`, `High`, `Very High`) based on MET value.
- Body weight input:
  - none
- Default body weight:
  - none
- Formula:
  - not a calorie calculation; it maps MET to a label only.
- Unit:
  - textual label
- Callers:
  - not used in the body-weight integration path for this checkpoint

## Cardio Path
- File: `src/utils/CalorieCalculator.ts`
- Trigger: exercise is in the cardio list (`outdoor_run`, `outdoor_walk`, `outdoor_cycle`, `biking`, `cross_trainer`, `jump_rope`, `swinging_the_rope`)
- Formula used:
  - `calories = met * DEFAULT_BODY_WEIGHT_KG * durationHours`
- Important finding:
  - The third positional argument (`liftedWeightKg`) is ignored in the cardio branch.
  - The function does not pull any `userBodyWeight` from storage or profile state.

## Strength Path
- File: `src/utils/CalorieCalculator.ts`
- Trigger: non-cardio exercise ID
- Formula used:
  - `baseCalories = met * DEFAULT_BODY_WEIGHT_KG * durationHours`
  - then `calories = baseCalories * (1 + liftedWeightKg / 200)`
- Important finding:
  - This is not “user body weight aware”; it is “lifted resistance weight aware.”
  - It uses the configured weight parameter, not the persisted profile weight.

## Mathematical Body Weight Dependency
- The calorie math is body-weight dependent only in the sense that it internally uses `DEFAULT_BODY_WEIGHT_KG = 75`.
- The function does not accept a user profile body weight parameter.
- Therefore the current formula has a hard-coded default dependency, not a user-profile dependency.

## Application Body Weight Integration
- Current production callers do not pass the stored `userBodyWeight` into `calculateCalories(...)` as a formal body-weight argument.
- Many callers pass values such as:
  - `weightVal` (session weight or exercise weight)
  - `s.intensity` (string, e.g. `Medium`)
  - `userWeight` in some screens, but that still gets passed as the fourth positional parameter (`reps`), not the body-weight parameter
- Because the function signature is `(workoutId, durationSeconds, liftedWeightKg, reps)`, the application is currently not wiring the persisted profile body weight into the calorie math.

This resolves to:
- CALCULATOR: BODY WEIGHT AWARE (via default constant)
- APPLICATION INTEGRATION: NOT CONNECTED TO `userBodyWeight`

## Current Data Flow

### Example 1: SummaryScreen path
- `src/screens/SummaryScreen.tsx`
- Code pattern:
  - `calculateCalories(item.workoutId, item.elapsedTime, w, item.completedReps)`
- `w` is the item’s exercise/session weight, not the user’s body weight.
- `userBodyWeight` is not injected here.

### Example 2: MoveScreen path
- `src/screens/MoveScreen.tsx`
- Code pattern:
  - `calculateCalories(s.workoutType || 'Strength', s.elapsedTime || 0, s.intensity || 'Medium', userWeight)`
- Here `s.intensity` is passed as the third argument, which is not body weight in the function signature.
- `userWeight` is passed as the fourth argument, which is the `reps` parameter in the current function contract.
- This demonstrates an integration gap rather than a formula bug.

### Example 3: TrendsScreen path
- `src/screens/TrendsScreen.tsx`
- Code pattern:
  - `calculateCalories(s.workoutType || 'Strength', s.elapsedTime || 0, s.intensity || 'Medium', userWeight)`
- Same issue: positional mismatch between application intent and function signature.

## Tests Added
File created: `__tests__/bodyWeightCalorieAudit.test.ts`

Tests included:
1. `cardio uses the default 75 kg when no explicit body-weight value is supplied`
2. `cardio ignores a numeric lifted-weight argument and still uses the default body weight`
3. `strength calories scale with lifted weight and not with user body weight`
4. `passing a body-weight value in the final positional slot does not change cardio output`
5. `different intended user weights do not change the current calorie output for the same cardio call shape`

## Expected Values
These values are computed independently from the current formula and documented explicitly:

### Example A — Cardio default behavior
- Exercise: `outdoor_walk`
- MET: `3.8`
- Duration: `3600s = 1 hour`
- Weight used in formula: `75 kg`
- Expected value: `3.8 * 75 * 1 = 285`
- Result: `285`

### Example B — Strength lifted weight behavior
- Exercise: `bench_press`
- MET: `6.0`
- Duration: `3600s = 1 hour`
- Weight used in formula: `75 kg`
- Lifted weight: `60 kg`
- Intensity multiplier: `1 + 60/200 = 1.3`
- Expected value: `6.0 * 75 * 1 * 1.3 = 585`
- Result: `585`

## Regression Results
Command run:
- `npm test -- --runInBand __tests__/bodyWeightCalorieAudit.test.ts __tests__/bodyWeightPersistence.test.ts __tests__/calculateOVR.test.ts`

Result:
- `3 passed, 3 total`
- `54 passed, 54 total`

This confirms:
- the new calorie-body-weight audit tests pass
- the earlier body-weight persistence regression remains safe
- OVR tests continue to pass

## Integration Gaps
- `userBodyWeight` is not passed as a parameter to `calculateCalories()` anywhere in the inspected production call chain.
- The code is effectively using default body weight in the formula and separate weight values in the caller.
- The application is currently not integrating the user profile body weight into calorie math.
- This is a product/integration gap, not a formula bug in this checkpoint.

## Design Decisions Required
These remain intentionally out of scope for this checkpoint:
- whether calories should use the user’s stored body weight for all workout paths
- whether every workout type should be body-weight aware
- whether historical workout summaries should be recalculated
- whether calorie UI should change
- whether saved calorie totals should be migrated

## TypeScript
- Result: PASS
- Command run: `npx tsc --noEmit`

## Lint
- Result: FAIL
- Repository-wide lint remains failing with many unrelated files and old code issues.
- This checkpoint did not attempt to fix the lint debt.
- Status: not attributable to the calorie audit tests or the formula itself.

## Full Suite
- Result: BLOCKED
- Earlier project-wide Jest run remains blocked by the known native-module issue:
  - `TurboModuleRegistry.getEnforcing(...): 'RNGestureHandlerModule' could not be found`
- This is a runtime/app-test setup blocker, not a calorie formula failure.

## Files Changed
- `__tests__/bodyWeightCalorieAudit.test.ts` — new audit tests
- `BODY_WEIGHT_CHECKPOINT2_CALORIE_REPORT.md` — new report

No production calorie formula files were modified in this checkpoint.

## Risk
- Low risk to the current checkpoint because the formula remained unchanged and the audit tests only characterize behavior.
- Medium risk if future work mistakenly interprets `liftedWeightKg` as user body weight without preserving the current API contract.

## Recommendation
- Keep the calorie formula unchanged for this checkpoint.
- Treat the body-weight integration issue as a product decision and integration gap, not as a formula fix.
- In a future checkpoint, decide explicitly whether calorie math should use:
  - user profile body weight,
  - lifted resistance weight,
  - both,
  - or neither for specific workout categories.

BODY WEIGHT CHECKPOINT 2

Calorie formula:
UNCHANGED

Mathematical Body Weight dependency:
PRESENT

User Body Weight integration:
ABSENT

Cardio:
PASS

Strength:
PASS

Default behavior:
PASS

Regression tests:
PASS

TypeScript:
PASS

Lint:
FAIL

Full suite:
BLOCKED

OVR:
UNCHANGED

Production formula:
UNCHANGED

DESIGN DECISION REQUIRED:
YES

OVERALL:
READY FOR HUMAN REVIEW
