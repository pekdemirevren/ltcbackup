# Body Weight Re-Audit Report

## Executive summary
- This is a read-only audit of how "body weight" is defined, stored, displayed, and used across the codebase. No code or tests were changed.
- Authoritative default: DEFAULT_BODY_WEIGHT_KG = 75 (declared in `src/utils/StrengthCalculator.ts` and duplicated in `src/utils/CalorieCalculator.ts`).
- Persistent user value: AsyncStorage key `userBodyWeight` (written by `AdjustMoveGoalScreen`, read by `DailySummaryDetailScreen` and others).
- Primary calculations using body weight: 1RM (Epley), Strength Ratio (1RM / BW), DSI (avg 1RM/BW), WSI (7-day avg), Calories (MET * BW * hours).

## Authoritative body-weight concept
- Default constant(s):
  - `src/utils/StrengthCalculator.ts` exports `export const DEFAULT_BODY_WEIGHT_KG = 75;` and uses it as the default parameter for `calculateStrengthRatio()` and `calculateDSI()`.
  - `src/utils/CalorieCalculator.ts` also defines `const DEFAULT_BODY_WEIGHT_KG = 75;` (local file-level constant; not imported from StrengthCalculator).
- Persisted user value key: `userBodyWeight` (AsyncStorage). This is the canonical persisted user body weight.
- Unit: kilograms (kg) throughout. UI labels vary in casing (`KG` vs `kg`).

## Inventory of source locations (read/write/use)
- Persistence & settings:
  - `src/screens/AdjustMoveGoalScreen.tsx`
    - State: `const [bodyWeight, setBodyWeight] = useState(75);`
    - Saves: `await AsyncStorage.setItem('userBodyWeight', String(bodyWeight));`
    - Also stores `bodyWeight` inside `dailyMoveGoalOverride` and `moveGoalSchedule` entries.
  - `src/screens/DailySummaryDetailScreen.tsx`
    - Reads: `const storedBodyWeight = await AsyncStorage.getItem('userBodyWeight'); const bw = storedBodyWeight ? parseInt(storedBodyWeight, 10) : DEFAULT_BODY_WEIGHT_KG; setUserBodyWeight(bw);`
    - Uses `bw` in `calculateDSI(lifts, bw)` and `calculateStrengthRatio(dayMax1RM, bw)`.
- Calculation utilities:
  - `src/utils/StrengthCalculator.ts`
    - `DEFAULT_BODY_WEIGHT_KG = 75`
    - `calculate1RM(weight, reps)` — Epley formula: weight * (1 + reps/30)
    - `calculateStrengthRatio(oneRM, bodyWeight = DEFAULT_BODY_WEIGHT_KG)` — returns `oneRM / bodyWeight` (returns 0 if bodyWeight <= 0)
    - `calculateDSI(lifts, bodyWeight = DEFAULT_BODY_WEIGHT_KG)` — average of (1RM / BW) across lifts; uses defaults.
    - `calculateWSI(dsiValues)` — 7-day moving average (no bodyWeight param).
  - `src/utils/CalorieCalculator.ts`
    - `DEFAULT_BODY_WEIGHT_KG = 75` (file-level)
    - Cardio calories: `calories = MET * DEFAULT_BODY_WEIGHT_KG * durationHours` (if stored user weight not provided here, uses default)
    - Strength calories: `baseCalories = met * DEFAULT_BODY_WEIGHT_KG * durationHours; intensityMultiplier = 1 + (liftedWeightKg / 200); calories = baseCalories * intensityMultiplier` then rounded via `Math.round`.
  - `src/utils/WorkoutCalculator.ts`
    - Classifies exercises into `BODYWEIGHT_PLUS`/`BODYWEIGHT_MINUS` categories; bodyweight-specific branches (assisted/modified) and flags `isBodyweight` used downstream.
  - `src/utils/MainCardEngine.ts`
    - `calcSessionMetrics({ weightKg?: number, ... })` computes `volumeKg = weight * sets * reps` and other metrics used in higher-level systems (body-weight influences volume when weightKg is provided).
- UI and screens that display or use body weight in calculations:
  - `src/screens/AdjustMoveGoalScreen.tsx` — external UI for user to set `bodyWeight`; displays unit `KG`.
  - `src/screens/DailySummaryDetailScreen.tsx` — displays `userBodyWeight` (text: `x{userBodyWeight}kg`) and uses it for DSI/strength ratio calculations.
  - `src/screens/TimerScreen.tsx` — when saving workout summaries, stores `settings.weight` / `weightKg` in saved summaries; these are used by DailySummary calculations (indirect relation to body weight).
  - `src/screens/ProgressionTrendScreen.tsx`, `src/screens/SummaryScreen.tsx`, `src/screens/OneRMTrendScreen.tsx` — import `DEFAULT_BODY_WEIGHT_KG` and use it as fallback when computing ratios in their displays (i.e., they assume default if user value not present).
- Other occurrences (helpers/constants):
  - `src/utils/StrengthCalculator.ts` functions used widely across screens; central place for strength-related formulas.
  - Exercise categorization (bodyweight detection) is in `WorkoutCalculator.ts` and affects generated suggested weights.

## Tests & coverage
- No unit or integration tests in `__tests__/**` were found that target `userBodyWeight` or body-weight persistence specifically.
- Existing tests that exercise strength/OVR functions are not present for body-weight paths (audit note: add tests that validate parse/rounding/edge cases when allowed).

## Calculations, formulas, units, rounding behavior
- 1RM: Epley formula: 1RM = weight * (1 + reps/30). Units: kg.
- Strength Ratio: oneRM / bodyWeight. Body weight default: 75 kg when not supplied.
- DSI: average of (1RM / BW) across lifts. Uses DEFAULT_BODY_WEIGHT_KG as fallback.
- WSI: 7-day moving average of DSI values; no BW param (uses precomputed DSI values).
- Calories:
  - Cardio: calories = MET * BodyWeight(kg) * durationHours. Uses DEFAULT_BODY_WEIGHT_KG if no user weight supplied to the function.
  - Strength: baseCalories = met * DEFAULT_BODY_WEIGHT_KG * durationHours; intensityMultiplier = 1 + (liftedWeightKg / 200); calories = baseCalories * intensityMultiplier; final value rounded with Math.round.
- Rounding / parsing:
  - `calculateCalories` uses Math.round to return integer kcal.
  - `DailySummaryDetailScreen` reads stored `userBodyWeight` via `parseInt(storedBodyWeight, 10)` which truncates decimals (e.g., "75.5" -> 75).
  - When saving `userBodyWeight`, `AdjustMoveGoalScreen` uses `String(bodyWeight)` (value may be an integer from Picker). No enforced decimal preservation.

## Data flow & persistence notes
- Write path: AdjustMoveGoalScreen -> AsyncStorage.setItem('userBodyWeight', String(bodyWeight)) and also embedded into schedule/override entries.
- Read path: DailySummaryDetailScreen -> AsyncStorage.getItem('userBodyWeight') -> parseInt(..., 10) -> used in calculations and UI display `setUserBodyWeight(bw)`.
- Fall back: if stored value missing, code falls back to DEFAULT_BODY_WEIGHT_KG (75) in calculators and displays.
- Derived data: Workout summaries saved by TimerScreen include `settings.weight` and are used to compute per-session volume; bodyweight is not automatically applied to those summaries unless the user sets it via AdjustMoveGoal.

## Edge cases, potential issues (read-only findings)
1. parseInt truncation: stored values are read with `parseInt` in at least `DailySummaryDetailScreen`. If user weight is saved as a decimal (e.g., 75.5), parseInt returns 75, losing fractional precision.
2. No validation on write: `AdjustMoveGoalScreen` saves whatever `bodyWeight` state has (String). If picker/input allows non-numeric values or out-of-range values, there is no clamp or validation prior to storage.
3. Duplicate default constant: `DEFAULT_BODY_WEIGHT_KG` is defined in `StrengthCalculator.ts` and duplicated in `CalorieCalculator.ts` (local const). This risks drift if one file is changed but not the other.
4. Unit label inconsistency: UI shows `KG` in some places and `kg` in others—cosmetic but potentially confusing.
5. No centralized API: reading/writing `userBodyWeight` is done directly via AsyncStorage in multiple screens, increasing coupling and duplication (e.g., keys and parsing logic repeated).
6. No tests observed: lack of unit tests around persistence/parsing means regressions (e.g., switching parseInt -> parseFloat) may go unnoticed.
7. Fallback behavior: many calculations silently fall back to default 75 kg; if users expect calculations to require an explicit profile weight, this behavior may be surprising.

## Low-risk recommendations (no code changes performed in this audit)
- Replace parseInt(...) with parseFloat(...) when reading stored body weight to preserve decimals and use Number.parseFloat with validation.
- Centralize the DEFAULT_BODY_WEIGHT_KG constant into a single exported module (e.g., `src/constants/userDefaults.ts`) and import where needed (CalorieCalculator currently duplicates it).
- Centralize AsyncStorage access for `userBodyWeight` behind a small helper (getUserBodyWeight/setUserBodyWeight) that performs parsing, validation, clamping, and returns a number. This reduces duplication and improves testability.
- Add input validation and clamping (e.g., allow 30–300 kg) when saving user body weight.
- Add unit tests for: read/write helpers, handling of decimal weights, fallback behavior when no value present, and UI formatting.
- Normalize UI unit labels to `kg` (lowercase) across screens for consistency.

## Suggested audit checks for follow-up (if user authorizes changes later)
- Search-and-replace occurrences of `parseInt(..., 10)` for body weight reads and convert to parseFloat with fallback and clamping.
- Add `src/utils/UserProfileStorage.ts` with typed helpers and unit tests.
- Add tests in `__tests__` verifying calorie calculations when user weight is provided vs default.

## Appendices
- Key files referenced (primary):
  - `src/utils/StrengthCalculator.ts` (DEFAULT_BODY_WEIGHT_KG, calculate1RM, calculateStrengthRatio, calculateDSI, calculateWSI)
  - `src/utils/CalorieCalculator.ts` (DEFAULT_BODY_WEIGHT_KG, calculateCalories)
  - `src/screens/AdjustMoveGoalScreen.tsx` (saves `userBodyWeight`, UI for pick/save)
  - `src/screens/DailySummaryDetailScreen.tsx` (reads `userBodyWeight`, uses in DSI/ratio, displays value)
  - `src/screens/TimerScreen.tsx` (saves per-workout `weightKg` in summaries; used by daily aggregates)
  - `src/utils/WorkoutCalculator.ts` (categorizes bodyweight exercises)
  - `src/utils/MainCardEngine.ts` (consumes weightKg to compute volumeKg)

Prepared by: GitHub Copilot (GPT-5 mini) — body-weight re-audit (read-only)


