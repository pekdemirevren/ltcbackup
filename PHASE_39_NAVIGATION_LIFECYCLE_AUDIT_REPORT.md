# PHASE 39 — Navigation Lifecycle & Focus-Refresh Audit

Date: 2026-09-09

## Goal
Validate that Phase 38 focus-refresh changes behave correctly on real navigation lifecycles and do not create infinite loops, stale closures, or unnecessary AsyncStorage/read/re-render churn. Follow the real user flow:
Main Card → Workout → Timer → Completion → Back → Main Card / Workout detail (fast navigation / repeated focus scenarios included).

## Files audited
- src/components/MainCardCardNew.tsx
- src/screens/MainCardDetailScreen.tsx
- src/screens/CollectibleWorkoutDetailScreen.tsx
- src/screens/WorkoutScreen.tsx
- src/contexts/TimerContext.tsx
- src/utils/MainCardAttemptManager.ts
- src/utils/MainCardEngine.ts

## Checks performed
1. Confirm useFocusEffect usage and dependency arrays.
2. Trace which AsyncStorage reads run on screen focus and on mount.
3. Ensure state setters used in focus callbacks do not re-trigger focus effects.
4. Trace navigation path when Timer saves (TimerScreen -> saveWorkoutSummary -> recordWorkoutInAttempt -> processMainCardRun -> AsyncStorage writes) and subsequent navigation back to Main / Detail screens.
5. Test TypeScript and full Jest suite.

## Findings (evidence + analysis)
1) MainCardCardNew.tsx
- Uses `useFocusEffect(React.useCallback(..., [card.id]))` to call `getMainCardState(card.id)` and set local component state.
- No mounting-only `useEffect` remains (we replaced it in Phase 38).
- This ensures the card tile reloads state on screen focus and avoids duplicate mount+focus reads.
- Setting local state does not cause any navigation; light re-render only. No loops.

2) MainCardDetailScreen.tsx
- Calls `loadData()` both from `useEffect(() => loadData(), [cardId])` and from `useFocusEffect(React.useCallback(() => { void loadData(); }, [cardId]))`.
- Outcome: on first mount + focus there will be two calls to `getMainCardState()`/`getCurrentAttempt()`. Subsequent focus events (re-entering the screen) trigger only the `useFocusEffect` call.
- The duplicated initial read is redundant but not a navigation/focus loop; it is a small performance inefficiency (two reads and two setState calls on initial show).

3) CollectibleWorkoutDetailScreen.tsx
- Uses `useFocusEffect` to reload: levels, exercise settings (via `loadWorkoutSettings`), and completion summaries (reads `workoutSummaries`). Also retains existing mount `useEffect` variants that run the same loads on mount.
- Same behavior as MainCardDetail: initial mount+focus may cause duplicated reads. No infinite loop; re-renders are local and do not re-navigate.

4) WorkoutScreen.tsx
- Retained mount `useEffect` that loads levels/sorted workouts and added `useFocusEffect` to re-run the same loader on focus. This intentionally refreshes level/xp lists when the screen regains focus.
- When focused repeatedly, the loader runs once per focus event — expected to reflect persisted changes. It does not re-trigger navigation.

5) TimerContext.tsx and TimerScreen.tsx
- `TimerContext.startTimerWithWorkoutSettings` dynamically loads saved workout settings, sets in-context state, and navigates to the `Timer` screen with params (including mainCardId and attemptId when present).
- `TimerScreen` runs the workout and on completion calls `saveWorkoutSummary()`, which (a) writes an immutable historical summary to `workoutSummaries`, (b) conditionally calls `recordWorkoutInAttempt()` which updates the attempt object and may call `processMainCardRun()` which updates `main_card_state_*` in AsyncStorage.
- `TimerScreen` then navigates to `WorkoutSummaryScreen`. From there user navigates back to Main / Detail screens and those screens' `useFocusEffect` handlers read the updated AsyncStorage values.
- This lifecycle is linear; there are no back-and-forth navigations initiated by the persistence write itself, so no infinite focus/read loops are introduced.

6) MainCardAttemptManager & MainCardEngine
- `recordWorkoutInAttempt` guards against duplicate metric pushes and duplicate `completedWorkouts` (checked in existing tests).
- `processMainCardRun` checks `processedAttemptIds` and completion-rate threshold before applying a run. These protect historical/award contracts.
- No change in Phase 38 altered these protections.

7) Concurrency / race scenarios
- `TimerScreen.saveWorkoutSummary` sets a `workoutSavedRef` to prevent duplicate saves; `recordWorkoutInAttempt` uses idempotency for attempt updates. These minimize races.

8) Performance/reads
- Focus-refresh behavior causes a read per focus event on the audited screens. This is expected and necessary to surface saved state changes after a workout completes.
- Minor inefficiency: three screens (MainCardDetail, CollectibleWorkoutDetail, WorkoutScreen) have both mount `useEffect` loaders and `useFocusEffect` loaders -> initial mount+focus causes duplicate reads on first display. This is not a correctness bug, but a small optimization opportunity.

## Conclusion and Decision
- The Phase 38 focus-refresh changes correctly reload persisted progress on navigation focus and do not produce infinite loops, stale-closure bugs, or reward/idempotency failures.
- The only measurable issue is redundant duplicate read on first mount for some screens (mount + focus). This is a performance optimization, not a production correctness bug, and it was intentionally left to avoid over-changing the code in this audit phase.

Decision: NO VALID PRODUCTION ISSUE FOUND that requires a production code change. Recommend a future minor optimization to remove duplicate mount loaders where `useFocusEffect` already handles initial focus; do not change production code now under Phase 39 rules.

## Validation performed
- TypeScript: `npx tsc --noEmit` — PASS
- Protected Jest suite: Ran full test suite used in Phase 35 baseline — PASS
  - Jest result: 14/14 suites, 113/113 tests passed (no regressions)

## Phase 35 baseline status
- Baseline preserved; full suite green post-change. No evidence of Phase 35 regression.

## Recommended follow-ups (non-blocking)
- Optional: remove the mount-time `useEffect` where `useFocusEffect` already reloads state (MainCardDetailScreen, CollectibleWorkoutDetailScreen, WorkoutScreen) to avoid the duplicate initial read. Add a small smoke test if implemented.
- Monitor heavy navigation patterns on low-end devices; if observed cost is non-trivial, apply debounce/throttle or a focused in-memory change-notification bus.

## Artifacts
- This audit updated UI files in Phase 38 and validated them here.
- No production code changes were made in Phase 39.


---

PHASE 39 audit complete.
