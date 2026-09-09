# BODY WEIGHT CHECKPOINT 1

## Objective
- Validate body-weight persistence parsing truthfully and with a failing decimal regression first.
- Preserve the existing formula behavior for strength and DSI logic.
- Centralize the default body-weight value to a single source of truth without changing calorie formula logic.
- Keep the scope locked to `userBodyWeight` and not to exercise weight / `weightKg` semantics.

## Tests Added
- `__tests__/bodyWeightPersistence.test.ts`
  - Integer parse: `"75" -> 75`
  - Decimal parse: `"75.5" -> 75.5`
  - Missing value fallback: `null/undefined/"" -> DEFAULT_BODY_WEIGHT_KG`
  - Decimal round trip via `String(75.5)`
  - Zero value behavior: `"0" -> 0`
  - Invalid value fallback: `"abc" -> DEFAULT_BODY_WEIGHT_KG`
  - Strength Ratio default regression: `calculateStrengthRatio(150)` remains `2`
  - DSI default regression: default body-weight fallback remains active

## Failing Test Before Fix
- Before production changes, the new regression suite failed because the canonical default module did not exist and the decimal-safe parser was not implemented.
- Command run:
  - `npm test -- --runTestsByPath __tests__/bodyWeightPersistence.test.ts --runInBand`
- Failure observed:
  - `Cannot find module '../src/constants/bodyWeight'`

## Production Changes
- Added `src/constants/bodyWeight.ts`
  - `DEFAULT_BODY_WEIGHT_KG = 75`
  - `parseStoredBodyWeight(value)` parses safely with `Number.parseFloat`, preserving decimals
  - Returns default value for null/undefined/empty/invalid values
  - Preserves `0` as `0`
- Updated `src/utils/StrengthCalculator.ts`
  - Imports the single default constant and re-exports it to retain compatibility with existing imports
  - Formula logic remains untouched
- Updated `src/utils/CalorieCalculator.ts`
  - Uses the centralized body-weight default constant
  - Formula remains unchanged
- Updated `src/screens/DailySummaryDetailScreen.tsx`
  - Replaced `parseInt(...)` with `parseStoredBodyWeight(...)`
  - Preserves decimals in UI and calculations
- Updated `src/screens/AdjustMoveGoalScreen.tsx`
  - Reads stored/override schedule values with decimal-safe parsing
  - Preserves zero without converting it to the default

## Persistence Behavior
- Canonical persisted key remains:
  - `AsyncStorage key = userBodyWeight`
- Write path remains as before:
  - `AdjustMoveGoalScreen` writes `String(bodyWeight)`
- Read path now uses a safe parser instead of `parseInt`:
  - `parseStoredBodyWeight(storedValue)`
- This preserves decimal precision while still defaulting on missing or broken values.

## Decimal Precision
- Fixed the bug that was causing decimal loss: `parseInt("75.5", 10)` produces `75`.
- The new flow preserves the decimal value: `75.5` remains `75.5`.
- Regression matrix validated:
  - `"75" -> 75`
  - `"75.5" -> 75.5`
  - `"80.25" -> 80.25`
  - `null -> 75`

## Default Constant
- Before change: duplicate default values existed in `StrengthCalculator.ts` and `CalorieCalculator.ts`.
- After change: both use a single source of truth in `src/constants/bodyWeight.ts`.
- This preserves the contract while avoiding drift.
- No new storage abstraction was introduced in this checkpoint.

## Regression Results
- Targeted regression suite passed:
  - `npm test -- --runTestsByPath __tests__/bodyWeightPersistence.test.ts __tests__/calculateOVR.test.ts --runInBand`
- Result: `49 passed, 49 total`

## Strength Ratio Regression
- Confirmed existing default behavior remains unchanged.
- `calculateStrengthRatio(150)` still evaluates to `2` when body weight is omitted.
- This verifies the default of `75` still works without changing the formula.

## DSI Regression
- Confirmed existing DSI default behavior remains unchanged.
- `calculateDSI([{ weight: 100, reps: 5 }])` still uses the same default and returns the same value as before the patch.
- No formula alterations were made.

## Calorie Behavior
- The calorie logic was intentionally left unchanged.
- `calculateCalories()` still uses the current default body-weight behavior and continues to rely on the default value as before.
- This checkpoint does not change the formula; it only fixes the persistence/default source-of-truth issue.
- Important: this remains a business logic question for a future checkpoint and is reported as such.

## TypeScript
- Result: PASS
- Command run: `npx tsc --noEmit`

## Lint
- Result: FAIL
- Repository-wide lint remains failing due to many pre-existing unused-variable and hook-dependency warnings in unrelated files.
- This is not treated as a body-weight checkpoint regression.

## Full Suite
- Result: BLOCKED
- Command run: `npm test -- --coverage --runInBand`
- Current blocker: `App.test.tsx` fails before app logic due to native module resolution issue:
  - `TurboModuleRegistry.getEnforcing(...): 'RNGestureHandlerModule' could not be found`
- This is the same known native-module blocker encountered earlier and is unrelated to the body-weight fix.

## Files Changed
- `src/constants/bodyWeight.ts`
- `src/utils/StrengthCalculator.ts`
- `src/utils/CalorieCalculator.ts`
- `src/screens/DailySummaryDetailScreen.tsx`
- `src/screens/AdjustMoveGoalScreen.tsx`
- `__tests__/bodyWeightPersistence.test.ts`

## Known Issues
- Invalid stored values are currently treated as `DEFAULT_BODY_WEIGHT_KG` rather than throwing.
- This is a design decision and was intentionally chosen to preserve runtime resilience without introducing validation/clamping in this checkpoint.
- No new validation/clamping or storage abstraction was introduced as requested.
- Full lint is still red across unrelated screens/files.
- Full Jest run remains blocked by the gesture-handler native module issue in `App.test.tsx`.

## Design Decisions Remaining
- `"abc"` fallback to `75` is a deliberate design decision in this checkpoint.
- Validation/clamping for 30–300 kg remains intentionally out of scope.
- AsyncStorage abstraction centralization remains for a future checkpoint.
- User body weight remains intentionally decoupled from exercise/session weight (`weightKg`) semantics.

## Risk
- Low for the targeted fix because the change is narrow and formula-preserving.
- Medium only if a future checkpoint introduces body-weight validation or couples personal body weight to exercise weights without clear product intent.

## Status
- The persistence/default bug is fixed in a minimal, test-first way.
- Decimal precision is preserved.
- The default body weight now has one source of truth.
- OVR, progression, workout engine, and calorie formulas remain unchanged.

BODY WEIGHT CHECKPOINT 1

Persistence:
PASS

Decimal precision:
PASS

Default:
PASS

Strength Ratio:
PASS

DSI:
PASS

OVR:
UNCHANGED

Calories:
UNCHANGED

TypeScript:
PASS

Lint:
FAIL

Full suite:
BLOCKED

PRODUCTION CHANGES:
- Added `src/constants/bodyWeight.ts` with a single source of truth for `DEFAULT_BODY_WEIGHT_KG` and decimal-safe parsing.
- Updated `src/utils/StrengthCalculator.ts` to import and re-export the centralized default while preserving formulas.
- Updated `src/utils/CalorieCalculator.ts` to use the centralized default without changing formula logic.
- Updated `src/screens/DailySummaryDetailScreen.tsx` to stop using `parseInt` for user body weight reads.
- Updated `src/screens/AdjustMoveGoalScreen.tsx` to read schedule/override values with decimal-safe parsing.
- Added regression tests in `__tests__/bodyWeightPersistence.test.ts`.

OVERALL:
READY FOR HUMAN REVIEW
