# Phase 4: Historical vs Live Calorie Consistency Audit

**Status:** Read-only audit (no production code changes)  
**Date:** Post-Phase 3B (API migration completed and merged)  
**Objective:** Trace and validate that historical stored calories remain unchanged while live-calculated calories use migrated `calculateCalories({ bodyWeightKg, ... })` API.

---

## Executive Summary

### Key Findings

1. **Historical Calorie Storage:**
   - Stored summaries **do NOT** currently save `calories` field; only `totalEstimatedKcal` (mock 7 kcal/min estimate).
   - No `activeCalories` field is written during session save (TimerScreen.tsx).
   - **Risk:** Historical data lacks a persisted calorie snapshot; all calorie displays are **live-computed**.

2. **Live Calorie Computation:**
   - All calorie displays use **live-calculated** values via `calculateCalories({ bodyWeightKg, ... })` with explicit body-weight parameter.
   - Body-weight is sourced from persisted `userBodyWeight` AsyncStorage key or fallback to `DEFAULT_BODY_WEIGHT_KG = 75`.
   - **Implication:** If user weight changes, all historical calorie displays will retroactively change.

3. **Aggregation & Display Patterns:**
   - **TrendsScreen:** Prefers stored `activeCalories` (not present); falls back to live calculation.
   - **MoveScreen:** Prefers stored `activeCalories` (not present); falls back to live calculation.
   - **SessionsScreen:** Computes live calories from all summaries; no stored calories used.
   - **SessionsCard:** Prefers stored `session.calories` (not present); falls back to live calculation.
   - **WorkoutSummaryScreen:** Uses live calculation in `SummaryCard` component.
   - **SharingScreen:** Uses live calculation with user weight.
   - **AddSummaryCardModal:** Computes live calories extensively for stats/charts.

4. **Body-Weight Sourcing:**
   - Consistent pattern: `parseStoredBodyWeight(AsyncStorage.getItem('userBodyWeight') ?? fallback)`.
   - Used in: TrendsScreen, MoveScreen, SessionsScreen, SessionsCard, WorkoutSummaryScreen, SharingScreen, AddSummaryCardModal.
   - All use explicit `bodyWeightKg` parameter passed to `calculateCalories({ ... })`.

---

## Detailed Caller Matrix

| File | Function/Component | Storage Strategy | Body-Weight Source | Issue / Notes |
|------|-------------------|------------------|-------------------|---------------|
| **TrendsScreen.tsx** | `loadTrendData()` | Prefers `s.activeCalories` (not stored); fallback live | Stored `userBodyWeight` via parseStoredBodyWeight() | Live-calculated with variable user weight. |
| **MoveScreen.tsx** | `loadData()` | Prefers `s.activeCalories` (not stored); fallback live | Stored `userBodyWeight` via parseStoredBodyWeight() + settings fallback | Live-calculated; uses `getCalories()` helper. |
| **SessionsScreen.tsx** | `loadSessions()` | Computes live only | Stored `userBodyWeight` via parseStoredBodyWeight() | No stored calories; all aggregates are live. |
| **SessionsCard.tsx** (Square mode) | `SessionsCard` | Prefers `session.calories` (not stored); fallback live | Stored `session.settings?.bodyWeight` or default 75 | Live with per-session weight. |
| **SessionsCard.tsx** (List mode) | `SessionsCard` map | Prefers n/a; computes live only | Stored `session.settings?.bodyWeight` or default 75 | Live with per-session weight. |
| **WorkoutSummaryScreen.tsx** | `SummaryCard` component | Computes live only | Stored `userBodyWeight` via parseStoredBodyWeight() + AsyncStorage fetch | Live in useEffect; state-based weight. |
| **SharingScreen.tsx** | `loadLastWorkoutData()` | Computes live only | Stored `userBodyWeight` via parseStoredBodyWeight(); attempts old `userWeight` key | Live with variable user weight. |
| **AddSummaryCardModal.tsx** | Data load loop | Computes live in aggregations | Stored `userBodyWeight` via parseStoredBodyWeight() | Live for today stats, trend aggregation, workout-specific metrics. |
| **DailySummaryDetailScreen.tsx** | `handleCompleteWorkout()` | Writes mock `totalEstimatedKcal` (7 kcal/min); no real calorie | n/a | Mock data; not real calorie computation. |
| **TimerScreen.tsx** | Completion handler | Writes mock `totalEstimatedKcal` (7 kcal/min); no real calorie | n/a | Mock data; final summary doesn't call `calculateCalories()`. |

---

## Lifecycle Analysis: Stored vs Live Calories

### Write Phase (Session Save)

**TimerScreen.tsx, lines ~336–371:**
```typescript
const summary = {
  date: new Date().toISOString(),
  workoutId: ...,
  workoutName: ...,
  settings: settings,
  elapsedTime: finalElapsedTime,
  completedSets: finalSets,
  completedReps: finalReps,
  totalVolume,
  totalEstimatedKcal,  // ← Mock: 7 kcal/min
  avgGreenLoopTime: ...,
  avgRedLoopTime: ...,
  greenLoopTimes: ...,
  redLoopTimes: ...,
  infiniteLoopTime: ...,
};
```

**Observation:**
- No `calories`, `activeCalories`, or real calorie field is saved.
- Mock `totalEstimatedKcal` is hardcoded (7 kcal/min × duration).
- Real calorie computation is **deferred to display/read phase**.

### Read Phase (Display)

**All read paths:**
1. Load summary from AsyncStorage.
2. Check for `s.activeCalories` (not present in saved data).
3. If not present, call `calculateCalories({ workoutId, durationSeconds, bodyWeightKg, liftedWeightKg, reps })`.
4. Use stored user weight (`userBodyWeight` AsyncStorage key) or `DEFAULT_BODY_WEIGHT_KG = 75`.

**Consequence:**
- Calorie display is **live-computed on every load**.
- Changing user weight retroactively changes all historical calorie displays.

---

## Risk Assessment

### **Risk 1: Historical Calorie Retroactivity (HIGH)**

**Description:**  
If a user changes their body weight, all historical workout calorie displays will retroactively show different values.

**Evidence:**
- No persisted calorie field in session summary (only mock `totalEstimatedKcal`).
- All reads use live `calculateCalories()` with current stored user weight.
- Example: User at 75 kg completes a run (50 min → ~500 kcal shown). Later, user changes weight to 60 kg. Running back to view same session shows ~400 kcal.

**Impact:**
- Calorie trends and aggregations become time-dependent; historical archives lose meaning.
- Analytics/reporting becomes unreliable if user weight changes.

**Recommendation:**
- Consider persisting real calorie at session save time (snapshot).
- Store in `summary.calories` field alongside new session data.
- Migrate reads to prefer persisted `calories` over live computation.

---

### **Risk 2: Aggregation Consistency (MEDIUM)**

**Description:**  
Multi-day/multi-week trends (TrendsScreen, MoveScreen, AddSummaryCardModal) aggregate live-calculated calories, making totals non-deterministic.

**Evidence:**
- TrendsScreen: `getPeriodData()` loop computes `kcal` live for each summary.
- MoveScreen: `getCalories()` helper computes live for monthly and weekly aggregates.
- AddSummaryCardModal: Trend stats computed by looping all summaries and calling `calculateCalories()` live.

**Impact:**
- Running the same query on different days (or with different user weight) produces different aggregate values.
- Cached or exported reports become stale immediately.

**Recommendation:**
- Persist calorie snapshots at save time.
- Use persisted values for historical aggregates (7-day, 30-day, 1-year trends).

---

### **Risk 3: Session-Level Body Weight Inconsistency (LOW)**

**Description:**  
SessionsCard and some other components attempt to use per-session `settings?.bodyWeight`, but this field is not consistently populated.

**Evidence:**
- SessionsCard.tsx: `const storedBodyWeight = parseStoredBodyWeight(session.settings?.bodyWeight ?? 75);`
- This fallback assumes session.settings.bodyWeight is set, but TimerScreen doesn't populate it in the summary write.

**Impact:**
- Per-session weight is unreliable; fallback to global default masks the issue.

**Recommendation:**
- Explicitly save body weight in session settings at save time.
- Ensure every session has a snapshot of the user's weight at the time the workout was logged.

---

## API Migration Validation

### **Positive Outcomes (Phase 3B):**

1. ✅ All `calculateCalories()` calls use object-only API: `calculateCalories({ workoutId, durationSeconds, bodyWeightKg, liftedWeightKg, reps })`.
2. ✅ Zero positional API callers (no legacy `calculateCalories(workoutId, duration, weight, ...)` calls).
3. ✅ Body-weight centralized: `parseStoredBodyWeight()` and `DEFAULT_BODY_WEIGHT_KG = 75` used consistently.
4. ✅ Formulas and logic preserved: MET values, cardio vs. strength branching, rounding intact.

### **Incomplete Aspects (Phase 4 findings):**

1. ❌ Historical calorie snapshots not persisted (only mock `totalEstimatedKcal` saved).
2. ❌ No per-session body-weight snapshot; global weight changes affect all historical displays.
3. ❌ Aggregations use live computation (trends/analytics non-deterministic).

---

## Caller Summary by Aggregation Type

### **Live-Only Calorie Aggregations:**

| Aggregation | File | Component | Scope | Issue |
|------------|------|-----------|-------|-------|
| **Today's Energy** | AddSummaryCardModal | Global stats | 24h | Live; retroactively changes. |
| **Weekly Trends** | MoveScreen, TrendsScreen, AddSummaryCardModal | Trend cards | 7d current vs. 7d previous | Live; loses determinism. |
| **Monthly Data** | MoveScreen | Yearly chart | 12m average per active day | Live; re-aggregates on each view. |
| **Last 90 Days** | MoveScreen | Rings/consistency | 90d active days goal | Live; goal met/not met depends on user weight. |
| **Sharing Card** | SharingScreen | Share session | 1 session | Live; can change if weight changes. |

---

## Recommendations for Phase 5 (Future Work)

### **Priority 1: Calorie Snapshot (Required for Data Integrity)**

**Action:**
1. Modify `TimerScreen.tsx` to compute real calories and persist in `summary.calories`:
   ```typescript
   const bodyWeightKg = parseStoredBodyWeight(await AsyncStorage.getItem('userBodyWeight') ?? DEFAULT_BODY_WEIGHT_KG);
   const calories = calculateCalories({
     workoutId,
     durationSeconds: finalElapsedTime,
     bodyWeightKg,
     liftedWeightKg: currentWeight,
     reps: finalReps,
   });
   const summary = { ..., calories };
   ```

2. Add session body-weight snapshot:
   ```typescript
   const summary = { ..., settings: { ...settings, bodyWeightKgSnapshot: bodyWeightKg } };
   ```

**Benefit:** Historical data becomes immutable; aggregations deterministic.

---

### **Priority 2: Prefer Persisted Calories (Backward Compatibility)**

**Action:**
Update all read paths to prefer stored `calories`:
```typescript
const kcal = summary.calories ? summary.calories : calculateCalories({ ... bodyWeightKg ... });
```

**Benefit:** New sessions use snapshots; old sessions degrade gracefully to live computation.

---

### **Priority 3: Audit Logging (Optional for Compliance)**

**Action:**
Log body-weight changes and which sessions' calorie displays were affected.

**Benefit:** Traceability for user support and data integrity investigations.

---

## Conclusion

**Phase 3B successfully migrated the calorie API to explicit-object-only and centralized body-weight handling.** However, the lack of persisted calorie snapshots creates a **retroactivity risk**: user weight changes alter all historical calorie displays retroactively.

**Current behavior is acceptable if:**
- Users do not frequently change their body weight, OR
- Calorie displays are treated as live estimates rather than archival facts.

**To address retroactivity risk, Phase 5 should:**
1. Persist real calories at session save time (no longer rely on live computation).
2. Store per-session body-weight snapshots.
3. Migrate reads to prefer persisted calories (graceful fallback to live for pre-Phase 5 sessions).

**No immediate production code changes are required.** Phase 3B is complete and shipped. This audit documents the technical debt for future prioritization.

---

## Appendix: File References

- **Calorie Calculation:** [src/utils/CalorieCalculator.ts](src/utils/CalorieCalculator.ts)
- **Body-Weight Constants:** [src/constants/bodyWeight.ts](src/constants/bodyWeight.ts)
- **Session Save:** [src/screens/TimerScreen.tsx](src/screens/TimerScreen.tsx#L336)
- **Trends Aggregation:** [src/screens/TrendsScreen.tsx](src/screens/TrendsScreen.tsx#L55)
- **Move Screen Data:** [src/screens/MoveScreen.tsx](src/screens/MoveScreen.tsx#L40)
- **Sessions Display:** [src/screens/SessionsScreen.tsx](src/screens/SessionsScreen.tsx#L57)
- **Session Card:** [src/components/Summary/SessionsCard.tsx](src/components/Summary/SessionsCard.tsx#L35)
- **Summary Modal:** [src/components/AddSummaryCardModal.tsx](src/components/AddSummaryCardModal.tsx#L85)
- **Sharing Screen:** [src/screens/SharingScreen.tsx](src/screens/SharingScreen.tsx#L380)
- **Workout Summary:** [src/screens/WorkoutSummaryScreen.tsx](src/screens/WorkoutSummaryScreen.tsx#L130)

---

**End of Audit Report**
