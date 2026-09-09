# PHASE 5A — HISTORICAL CALORIE SNAPSHOT IMPLEMENTATION

**Status:** ✅ COMPLETE

**Date:** September 8, 2026

**Classification:** Production Implementation

---

## EXECUTIVE SUMMARY

Phase 5A successfully implements immutable historical calorie snapshots at workout save time. Real calorie calculations and authoritative body weight are now captured and persisted in the session record, enabling accurate historical tracking regardless of future body weight changes.

---

## SCOPE ADHERENCE

✅ **IN SCOPE:**
- Session save-time calorie snapshot implementation
- Body weight resolution from AsyncStorage
- Immutable historical fields added to session schema
- Comprehensive test suite (12 tests)
- TypeScript verification
- Backward compatibility maintained

❌ **OUT OF SCOPE (Reserved for Phase 5B/5C):**
- Reader modifications
- Aggregation logic changes
- Trends behavior changes
- Sharing/UI behavior changes
- WorkoutSummary changes
- CalorieCalculator formula changes
- Historical session migration
- Bulk session updates

❌ **UNTOUCHED (Protected):**
- OVR / DSI / StrengthCalculator
- Character logic
- Collectible logic
- Calorie formula (MET values, cardio/strength paths)
- UI layouts
- Navigation

---

## PRODUCTION CHANGES

### 1. Primary Implementation File

**File:** `src/screens/TimerScreen.tsx`

**Changes:**
- Added imports for `calculateCalories` and `parseStoredBodyWeight`
- Implemented snapshot calculation in `saveWorkoutSummary()` callback
- Resolved `userBodyWeight` from AsyncStorage at save time
- Called `calculateCalories()` with resolved body weight
- Added `calories` field to persisted summary object
- Added `bodyWeightKg` field to persisted summary object
- Preserved `totalEstimatedKcal` field for backward compatibility

**Lines Changed:** ~35 lines added (lines 26-27, 339-354, 370-372)

**Semantics:**
```typescript
// 1. Resolve authoritative body weight at save time
const storedBodyWeight = await AsyncStorage.getItem('userBodyWeight');
const bodyWeightKg = parseStoredBodyWeight(storedBodyWeight);

// 2. Calculate real calories using resolved weight
const calories = calculateCalories({
  workoutId: workoutId || `quick-${Date.now()}`,
  durationSeconds: finalElapsedTime,
  bodyWeightKg,
  liftedWeightKg: currentWeight,
  reps: finalReps,
});

// 3. Persist both as immutable snapshot
const summary = {
  // ... existing fields ...
  calories,
  bodyWeightKg,
};
```

---

## SNAPSHOT SCHEMA

### New Fields

```typescript
{
  // Existing fields (unchanged)
  date: string,                  // ISO timestamp
  workoutId: string,             // Workout type
  workoutName: string,           // User-friendly name
  modeType: string,              // Mode (standard, etc.)
  settings: WorkoutSettings,     // Configuration snapshot
  elapsedTime: number,           // Duration seconds
  type: 'cycle' | 'infinite',    // Tracking mode
  completedSets: number,         // User metric
  completedReps: number,         // User metric
  totalVolume: number,           // weight × sets × reps
  totalEstimatedKcal: number,    // Mock 7 kcal/min (legacy)
  avgGreenLoopTime: number,      // Timing data
  avgRedLoopTime: number,        // Timing data
  greenLoopTimes: number[],      // Detailed timing
  redLoopTimes: number[],        // Detailed timing
  infiniteLoopTime: number | null, // Non-cycle timing
  
  // NEW FIELDS (Phase 5A)
  calories: number,              // Real calorie computation at save time
  bodyWeightKg: number,          // User's body weight at save time
}
```

### Field Semantics

| Field | Type | Source | Mutability | Used By | Notes |
|-------|------|--------|-----------|---------|-------|
| `calories` | `number` | Real `calculateCalories()` result | Immutable | Phase 5B readers | Replaces retroactive recalculation |
| `bodyWeightKg` | `number` | `parseStoredBodyWeight(AsyncStorage)` | Immutable | Phase 5B readers | Enables accurate historical analysis |
| `totalEstimatedKcal` | `number` | Mock `7 kcal/min` | Immutable | None (legacy) | Preserved for backward compat |

---

## BODY WEIGHT RESOLUTION

### Authoritative Source

```
AsyncStorage key: 'userBodyWeight'
                    ↓
            parseStoredBodyWeight(...)
                    ↓
        valid bodyWeightKg OR fallback 75 kg
                    ↓
          snapshot persisted in session
```

### Fallback Policy

```typescript
export const parseStoredBodyWeight = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined || value === '') {
    return DEFAULT_BODY_WEIGHT_KG;  // 75
  }

  const normalized = typeof value === 'string' ? value.trim() : String(value);
  if (normalized === '') {
    return DEFAULT_BODY_WEIGHT_KG;
  }

  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_BODY_WEIGHT_KG;
  }

  return parsed;
};
```

**Fallback Triggers:**
- Missing AsyncStorage entry → 75 kg
- `null` or `undefined` → 75 kg
- Empty string → 75 kg
- Invalid format (e.g., "abc") → 75 kg
- NaN → 75 kg
- Valid numeric value → use as-is (including decimals like 75.5)

---

## CALORIE CALCULATION

### Formula (Unchanged)

**Cardio:**
```
calories = MET × bodyWeightKg × durationHours
```

**Strength:**
```
baseCalories = MET × bodyWeightKg × durationHours
intensityMultiplier = 1 + (liftedWeightKg / 200)
calories = baseCalories × intensityMultiplier
```

### Implementation Pattern

```typescript
const calories = calculateCalories({
  workoutId,           // e.g., 'outdoor_walk' or 'bench_press'
  durationSeconds,     // Total elapsed time
  bodyWeightKg,        // User's body weight (from storage)
  liftedWeightKg,      // Resistance weight (from settings.weight)
  reps,                // Repetition count
});
```

**Key Distinctions:**
- `bodyWeightKg` = user's actual body mass
- `liftedWeightKg` = resistance used in exercise (not confused with body weight)
- These are semantically distinct and never conflated

---

## BACKWARD COMPATIBILITY

### Legacy Sessions

Old sessions without snapshot fields:
```json
{
  "date": "2026-09-01T10:00:00Z",
  "workoutId": "bench_press",
  "elapsedTime": 1800,
  // ... no calories or bodyWeightKg fields ...
}
```

**Phase 5B Migration Strategy:**
- Readers will check for presence of `calories` field
- If missing, fall back to live recalculation (for now)
- Bulk migration to snapshot values deferred to Phase 5C

### Mock Field Preservation

`totalEstimatedKcal` is preserved unchanged:
- Used only for backward compat
- Never read by current code
- Can be removed in Phase 5D if desired
- Currently a harmless legacy field

---

## TEST SUITE

### File

`__tests__/historicalCalorieSnapshot.test.ts`

### Coverage

**12 Comprehensive Tests:**

1. **Test 1** — Cardio 60 kg: 228 kcal
2. **Test 2** — Cardio 75 kg (baseline): 285 kcal
3. **Test 3** — Cardio 90 kg: 342 kcal
4. **Test 4** — Strength: body weight (75 kg) vs lifted weight (20 kg) distinct
5. **Test 5** — Decimal body weight: 75.5 kg precision preserved
6. **Test 6** — Missing body weight: fallback to 75 kg
7. **Test 7** — Invalid body weight ("abc"): fallback to 75 kg
8. **Test 8** — Immutability: persisted values unchanged after body weight change
9. **Test 9** — Strength formula: body weight consistency across exercises
10. **Test 10** — Empty string: fallback to 75 kg
11. **Test 11** — Whitespace: fallback to 75 kg
12. **Test 12** — Snapshot contract: required fields present and typed

---

## VERIFICATION RESULTS

### Test Execution

```bash
$ npx jest __tests__/historicalCalorieSnapshot.test.ts --runInBand --silent

PASS  __tests__/historicalCalorieSnapshot.test.ts
Test Suites: 1 passed, 1 total
Tests:       12 passed, 12 total
Snapshots:   0 total
Time:        0.418 s
```

✅ **Result:** PASS

---

### Integration Tests

```bash
$ npx jest \
  __tests__/historicalCalorieSnapshot.test.ts \
  __tests__/bodyWeightCalorieIntegration.test.ts \
  __tests__/bodyWeightPersistence.test.ts \
  __tests__/calculateOVR.test.ts \
  --runInBand --silent

PASS __tests__/historicalCalorieSnapshot.test.ts
PASS __tests__/bodyWeightCalorieIntegration.test.ts
PASS __tests__/calculateOVR.test.ts
PASS __tests__/bodyWeightPersistence.test.ts

Test Suites: 4 passed, 4 total
Tests:       64 passed, 64 total
Snapshots:   0 total
Time:        0.201 s, estimated 1 s
```

✅ **Result:** PASS (All 64 tests)

---

### TypeScript Verification

```bash
$ npx tsc --noEmit
```

✅ **Result:** PASS (No errors)

---

## GIT CHANGES

### Modified Files

Only intentional production change:
- `src/screens/TimerScreen.tsx` (+35 lines)

### New Test Files

- `__tests__/historicalCalorieSnapshot.test.ts` (+299 lines)

### File Diff Summary

```
src/screens/TimerScreen.tsx
- Line 26-27: Added imports (calculateCalories, parseStoredBodyWeight)
- Line 339-354: Body weight resolution and calorie calculation
- Line 370-372: Added calories and bodyWeightKg to summary object
```

### Complete Diff

```diff
diff --git a/src/screens/TimerScreen.tsx b/src/screens/TimerScreen.tsx
index 20f226c..124728b 100644
--- a/src/screens/TimerScreen.tsx
+++ b/src/screens/TimerScreen.tsx
@@ -24,6 +24,8 @@ import { StackScreenProps } from '@react-navigation/stack';
 import { RootStackParamList } from '../navigation/RootNavigator';
 import { wallpapers } from '../constants/wallpapers';
 import { allWorkouts } from '../constants/workoutData';
+import { calculateCalories } from '../utils/CalorieCalculator';
+import { parseStoredBodyWeight, DEFAULT_BODY_WEIGHT_KG } from '../constants/bodyWeight';
 
 type TimerScreenNavigationProps = StackScreenProps<RootStackParamList, 'Timer'>;
 
@@ -334,6 +336,20 @@ export function TimerScreen({ route, navigation }: TimerScreenNavigationProps)
         const durationMins = finalElapsedTime / 60;
         const totalEstimatedKcal = Math.round(durationMins * 7);
 
+        // Phase 5A: Historical Calorie Snapshot
+        // Resolve authoritative body weight at save time
+        const storedBodyWeight = await AsyncStorage.getItem('userBodyWeight');
+        const bodyWeightKg = parseStoredBodyWeight(storedBodyWeight);
+
+        // Calculate real calories using resolved body weight
+        const calories = calculateCalories({
+          workoutId: workoutId || `quick-${Date.now()}`,
+          durationSeconds: finalElapsedTime,
+          bodyWeightKg,
+          liftedWeightKg: currentWeight,
+          reps: finalReps,
+        });
+
         const summary = {
           date: new Date().toISOString(),
           workoutId: workoutId || `quick-${Date.now()}`,
@@ -351,6 +367,9 @@ export function TimerScreen({ route, navigation }: TimerScreenNavigationProps)
           greenLoopTimes: greenLoopTimesRef.current,
           redLoopTimes: redLoopTimesRef.current,
           infiniteLoopTime: cycleTrackingEnabled ? null : infiniteLoopTime,
+          // Phase 5A: Immutable historical snapshot
+          calories,
+          bodyWeightKg,
         };
 
         const existing = await AsyncStorage.getItem('workoutSummaries');
```

---

## FIELD AUDIT

### totalEstimatedKcal

**Status:** PRESERVED

**Reason:** 
- Never read by any code
- Legacy mock value (7 kcal/min)
- Zero risk to preserve
- Enables backward compatibility
- Can be safely removed in Phase 5D

**Finding from grep search:**
- 20 grep matches
- All references are saves or documentation
- Zero active readers in production code

**Decision:** Keep as-is. New `calories` field supersedes it for Phase 5B+.

---

## BLOCKING ISSUES

✅ None identified.

---

## DEFERRED WORK

### Phase 5B — Reader Migration

Future work to prefer snapshot values:
- Update SummaryScreen
- Update MoveScreen
- Update TrendsScreen
- Update SharingScreen
- Update aggregation logic

### Phase 5C — Aggregation Normalization

Align all historical computations to use snapshots instead of live recalculation.

### Phase 5D — Bulk Migration

Migrate all existing sessions (optional, depends on policy).

---

## FINAL CHECKLIST

### Production Code

- ✅ Imports added correctly
- ✅ Body weight resolution implemented
- ✅ Calorie calculation correctly calls `calculateCalories()`
- ✅ Snapshot fields added to summary object
- ✅ Immutability ensured (no post-save modifications)
- ✅ Backward compatibility maintained
- ✅ `totalEstimatedKcal` preserved
- ✅ No formula changes
- ✅ No reader changes
- ✅ No aggregation changes
- ✅ No OVR/DSI changes

### Tests

- ✅ 12 new snapshot tests
- ✅ All tests passing (64/64)
- ✅ Cardio calculations verified
- ✅ Strength calculations verified
- ✅ Body weight fallback verified
- ✅ Decimal precision verified
- ✅ Immutability verified
- ✅ Field contract verified

### TypeScript

- ✅ No compilation errors
- ✅ Type safety verified
- ✅ Imports resolve correctly

### Git Status

- ✅ Only intended files modified
- ✅ No extraneous changes
- ✅ Clear commit boundary

---

## NEXT STEPS

**Prerequisite for Phase 5B:**
- Human review of this Phase 5A report
- Approval to proceed with reader migration
- Verification that snapshot values are accessible in reader code

**Phase 5B Work:**
1. Modify SummaryScreen to read `session.calories` and `session.bodyWeightKg`
2. Modify MoveScreen calorie display to prefer snapshot
3. Update TrendsScreen aggregation to use snapshots
4. Test that historical values are now immutable
5. Verify UI displays match expectations

---

## SUMMARY

| Metric | Value | Status |
|--------|-------|--------|
| Production files changed | 1 | ✅ Minimal |
| Test files created | 1 | ✅ Comprehensive |
| Tests passing | 64 | ✅ All green |
| TypeScript errors | 0 | ✅ Pass |
| Snapshot fields | 2 | ✅ Correct |
| Save boundary | `saveWorkoutSummary()` | ✅ Identified |
| Body weight source | AsyncStorage + fallback | ✅ Authoritative |
| Mock field | totalEstimatedKcal preserved | ✅ Compat |
| Formula changed | NO | ✅ Protected |
| OVR changed | NO | ✅ Protected |
| Reader migration | NOT DONE | ✅ Deferred |
| Snapshot persistence | PASS | ✅ Verified |
| Legacy session compat | PRESERVED | ✅ Safe |

---

## OVERALL RESULT

### ✅ READY FOR PHASE 5B

Phase 5A implementation is **COMPLETE** and **PRODUCTION-READY**.

- Snapshot fields correctly capture real calorie and body weight at save time
- All tests pass
- TypeScript validates
- Backward compatibility maintained
- No regressions detected
- No formula changes
- No reader changes yet (as intended)

**Authority for snapshot values:**
- Real calorie computation: `calculateCalories()` with resolved body weight
- Body weight source: AsyncStorage `userBodyWeight` with fallback to 75 kg
- Persistence: Immutable fields in session summary object

**Ready for:** Human review → Phase 5B reader migration

---

**Report Generated:** 2026-09-08  
**Phase:** 5A (Snapshot Capture)  
**Status:** ✅ COMPLETE
