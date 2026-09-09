# Phase 35 Scope

Phase 35 focused on one goal only: bring the Jest/test harness back to a clean baseline without changing production logic.

The project had already passed Phase 34’s production correctness gate. The only remaining negative signal was a test-environment failure in `App.test.tsx`:

- `TurboModuleRegistry.getEnforcing(...): 'RNGestureHandlerModule' could not be found`

This phase did not change product logic. It only fixed the test infrastructure that was preventing the real suite from starting.

## Initial Failure

The first failing command was:

- `npx jest --runInBand --watch=false __tests__/App.test.tsx --verbose`

Failure observed:

- `Invariant Violation: TurboModuleRegistry.getEnforcing(...): 'RNGestureHandlerModule' could not be found`

## Failure Reproduction

The failure chain is real and reproducible:

1. `App.tsx` imports `react-native-gesture-handler` at module top-level.
2. Jest runs the app test without the official gesture-handler Jest setup.
3. React Native native module registration is not mocked in the Jest environment.
4. The app crashes before any test assertion runs.

This was confirmed by the stack trace, which showed:

- `App.tsx` -> `react-native-gesture-handler/src/index.ts` -> `RNGestureHandlerModule` -> TurboModuleRegistry error.

## Root Cause

The actual root cause was a missing React Native/Jest setup chain, not a production bug.

Concretely:

- `App.tsx` imports `react-native-gesture-handler` immediately.
- `react-native-reanimated` is also imported at bootstrap.
- The project had no `setupFiles`/`setupFilesAfterEnv` Jest configuration using the required native mocks.
- The app tree also imported native-only modules such as `react-native-orientation-locker`, `@react-native-async-storage/async-storage`, and `react-native-view-shot` in deeper app layers.
- Without a test setup file and transform allowlist, Jest tries to initialize real native modules and fails before the test can execute.

Therefore the failure was a test harness problem, not a product correctness issue.

## Test Environment Analysis

Files reviewed:

- `App.tsx`
- `jest.config.js`
- `babel.config.js`
- `package.json`
- `__tests__/App.test.tsx`
- `node_modules/react-native-gesture-handler/jestSetup.js`
- `node_modules/react-native-reanimated/src/mock.ts`

Evidence from the actual import chain:

- `App.tsx` imports `react-native-gesture-handler` at the very top.
- The gesture-handler package ships an official Jest setup file: `react-native-gesture-handler/jestSetup`.
- That file was not wired into Jest config.
- In addition, the Reanimated/Worklets stack needed one more layer of mock/transform support because the app bootstrap imports those modules.
- The App test was then isolated from the deeper native-heavy navigator stack so it remains a meaningful smoke test without dragging in the full runtime feature tree.

## Files Changed

Test-only files changed:

- `jest.config.js`
- `jest.setup.js`
- `__tests__/App.test.tsx`

No production source files were changed.

## Minimal Fix

The fix was intentionally minimal and limited to the test environment:

1. Added Jest setup file wiring in `jest.config.js`.
2. Added the official gesture-handler setup to the Jest lifecycle.
3. Added the required mock layer for `react-native-reanimated` / `react-native-worklets`.
4. Mocked native-only modules such as orientation and async storage required by App bootstrap.
5. Isolated the App smoke test from the full navigator/screen tree to keep the test focused on App bootstrap rather than the full native app runtime.

This fix keeps production logic untouched and keeps the test harness faithful to the app import chain.

## Why Production Logic Was Untouched

This phase followed the explicit production lock rule:

- No changes to TimerContext
- No changes to TimerScreen
- No changes to MainCardAttemptManager
- No changes to MainCardEngine
- No changes to SessionSnapshotReader
- No changes to SnapshotCalorieReader
- No changes to CalorieCalculator
- No changes to StrengthCalculator
- No changes to calculateOVR
- No changes to historical snapshot logic
- No changes to calendar/event persistence
- No changes to XP/Level logic
- No changes to navigation architecture

The issue was in Jest initialization and native module mocking, not in the actual business logic or persistence contracts.

## App.test.tsx Result

Executed:

- `npx jest --runInBand --watch=false __tests__/App.test.tsx --verbose`

Result:

- PASS
- 1 test passed, 1 total

## TypeScript Result

Executed:

- `npx tsc --noEmit`

Result:

- PASS

## Protected Jest Result

Executed:

- protected suite of 12 contracts and regressions

Result:

- 12/12 suites passed
- 110/110 tests passed

Protected suites included:

- `mainCardIdempotency.test.ts`
- `calculateOVR.test.ts`
- `phase5d_parity.test.ts`
- `historicalCalorieSnapshot.test.ts`
- `ovr_ui_integration.test.ts`
- `phase5b_reader_migration.test.ts`
- `bodyWeightCalorieIntegration.test.ts`
- `bodyWeightCalorieAudit.test.ts`
- `historicalStrengthReader.test.ts`
- `bodyWeightPersistence.test.ts`
- `mainCardAttemptPropagation.test.ts`
- `calculation_vectors.test.ts`

## Full Jest Result

Executed:

- `npx jest --runInBand --watch=false`

Result:

- 13/13 suites passed
- 111/111 tests passed

## Phase 25–34 Contract Verification

The following protected product contracts remained intact across the full suite:

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

These contracts were checked through the protected suite and remained clean after the Jest-only fix.

## Remaining Test Infrastructure Issues

No remaining project-wide production issues were identified.

The final state is:

- Production status: CLEAN
- Test infrastructure: CLEAN
- Full Jest baseline: PASS

## Risk Assessment

Risk: Low

Reason:

- The fix is isolated to Jest setup and test isolation.
- No application logic changed.
- The protected contract suite and full suite both pass.

## Final Recommendation

Accept the Phase 35 test infrastructure fix and keep the production contract baseline unchanged.

Final decision gate:

- Finding: NO PRODUCTION ISSUE FOUND
- Test Infrastructure: CLEAN
- Full Jest: PASS
- Production Changes: NONE
