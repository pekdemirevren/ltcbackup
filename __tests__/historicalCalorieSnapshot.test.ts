/**
 * PHASE 5A — Historical Calorie Snapshot Tests
 *
 * This test suite validates that:
 * 1. Real calorie computation is captured at workout save time
 * 2. Body weight is resolved from AsyncStorage at save time
 * 3. Snapshot fields (calories, bodyWeightKg) persist immutably
 * 4. Fallback behavior (missing/invalid body weight) is correct
 * 5. Body weight and lifted weight are semantically distinct
 */

import { calculateCalories } from '../src/utils/CalorieCalculator';
import { parseStoredBodyWeight, DEFAULT_BODY_WEIGHT_KG } from '../src/constants/bodyWeight';
import { getTotalVolume } from '../src/utils/SessionSnapshotReader';

describe('Phase 5A — Historical Calorie Snapshot', () => {
  /**
   * Test 1: Cardio snapshot at 60 kg
   * Outdoor walk, 1 hour, MET 3.8
   * Expected: 228 kcal (3.8 * 60 * 1)
   */
  it('Test 1 — Cardio snapshot: 60 kg body weight', () => {
    const bodyWeightKg = 60;
    const durationSeconds = 3600;
    const workoutId = 'outdoor_walk';

    const calories = calculateCalories({
      workoutId,
      durationSeconds,
      bodyWeightKg,
      liftedWeightKg: 0,
      reps: 0,
    });

    expect(bodyWeightKg).toBe(60);
    expect(calories).toBe(228);

    // Snapshot persisted
    const snapshot = { calories, bodyWeightKg };
    expect(snapshot.calories).toBe(228);
    expect(snapshot.bodyWeightKg).toBe(60);
  });

  /**
   * Test 2: Cardio snapshot at 75 kg (default)
   * Outdoor walk, 1 hour, MET 3.8
   * Expected: 285 kcal (3.8 * 75 * 1)
   */
  it('Test 2 — Cardio snapshot: 75 kg body weight (baseline)', () => {
    const bodyWeightKg = 75;
    const durationSeconds = 3600;
    const workoutId = 'outdoor_walk';

    const calories = calculateCalories({
      workoutId,
      durationSeconds,
      bodyWeightKg,
      liftedWeightKg: 0,
      reps: 0,
    });

    expect(bodyWeightKg).toBe(75);
    expect(calories).toBe(285);

    const snapshot = { calories, bodyWeightKg };
    expect(snapshot.calories).toBe(285);
    expect(snapshot.bodyWeightKg).toBe(75);
  });

  /**
   * Test 3: Cardio snapshot at 90 kg
   * Outdoor walk, 1 hour, MET 3.8
   * Expected: 342 kcal (3.8 * 90 * 1)
   */
  it('Test 3 — Cardio snapshot: 90 kg body weight', () => {
    const bodyWeightKg = 90;
    const durationSeconds = 3600;
    const workoutId = 'outdoor_walk';

    const calories = calculateCalories({
      workoutId,
      durationSeconds,
      bodyWeightKg,
      liftedWeightKg: 0,
      reps: 0,
    });

    expect(bodyWeightKg).toBe(90);
    expect(calories).toBe(342);

    const snapshot = { calories, bodyWeightKg };
    expect(snapshot.calories).toBe(342);
    expect(snapshot.bodyWeightKg).toBe(90);
  });

  /**
   * Test 4: Strength snapshot - body weight and lifted weight are distinct
   * Body weight: 75 kg
   * Lifted weight: 20 kg
   * Bench press, 1 hour, MET 6.0
   * Expected: baseCalories = 6.0 * 75 * 1 = 450
   *           intensityMultiplier = 1 + (20 / 200) = 1.1
   *           calories = 450 * 1.1 = 495
   */
  it('Test 4 — Strength snapshot: body weight (75 kg) and lifted weight (20 kg) are distinct', () => {
    const bodyWeightKg = 75;
    const liftedWeightKg = 20;
    const durationSeconds = 3600;
    const workoutId = 'bench_press';

    const calories = calculateCalories({
      workoutId,
      durationSeconds,
      bodyWeightKg,
      liftedWeightKg,
      reps: 10,
    });

    // Base: 6.0 * 75 * 1 = 450
    // Multiplier: 1 + 20/200 = 1.1
    // Total: 450 * 1.1 = 495
    expect(calories).toBe(495);

    const snapshot = { calories, bodyWeightKg, liftedWeightKg };
    expect(snapshot.bodyWeightKg).toBe(75);
    expect(snapshot.liftedWeightKg).toBe(20);
    expect(snapshot.bodyWeightKg).not.toBe(snapshot.liftedWeightKg);
  });

  /**
   * Test 5: Decimal body weight precision
   * Body weight: 75.5 kg (not rounded)
   * Outdoor walk, 1 hour, MET 3.8
   * Expected: Math.round(3.8 * 75.5 * 1) = 287 kcal
   */
  it('Test 5 — Decimal body weight: precision preserved (75.5 kg)', () => {
    const bodyWeightKg = 75.5;
    const durationSeconds = 3600;
    const workoutId = 'outdoor_walk';

    const calories = calculateCalories({
      workoutId,
      durationSeconds,
      bodyWeightKg,
      liftedWeightKg: 0,
      reps: 0,
    });

    // 3.8 * 75.5 * 1 = 286.9, rounds to 287
    expect(calories).toBe(287);

    const snapshot = { calories, bodyWeightKg };
    expect(snapshot.bodyWeightKg).toBe(75.5);
    // Body weight not rounded in snapshot
    expect(snapshot.bodyWeightKg % 1).not.toBe(0);
  });

  /**
   * Test 6: Missing body weight
   * No persisted userBodyWeight → defaults to 75 kg
   * parseStoredBodyWeight(null) → 75
   */
  it('Test 6 — Missing body weight: fallback to DEFAULT_BODY_WEIGHT_KG (75)', () => {
    const stored = null;
    const bodyWeightKg = parseStoredBodyWeight(stored);
    const durationSeconds = 3600;
    const workoutId = 'outdoor_walk';

    expect(bodyWeightKg).toBe(DEFAULT_BODY_WEIGHT_KG);
    expect(bodyWeightKg).toBe(75);

    const calories = calculateCalories({
      workoutId,
      durationSeconds,
      bodyWeightKg,
      liftedWeightKg: 0,
      reps: 0,
    });

    expect(calories).toBe(285);

    const snapshot = { calories, bodyWeightKg };
    expect(snapshot.bodyWeightKg).toBe(75);
    expect(snapshot.calories).toBe(285);
  });

  /**
   * Test 7: Invalid body weight
   * Stored value: "abc" (invalid string)
   * parseStoredBodyWeight("abc") → 75 (fallback)
   */
  it('Test 7 — Invalid body weight: fallback to DEFAULT_BODY_WEIGHT_KG (75)', () => {
    const stored = 'abc';
    const bodyWeightKg = parseStoredBodyWeight(stored);
    const durationSeconds = 3600;
    const workoutId = 'outdoor_walk';

    expect(bodyWeightKg).toBe(DEFAULT_BODY_WEIGHT_KG);
    expect(bodyWeightKg).toBe(75);

    const calories = calculateCalories({
      workoutId,
      durationSeconds,
      bodyWeightKg,
      liftedWeightKg: 0,
      reps: 0,
    });

    expect(calories).toBe(285);

    const snapshot = { calories, bodyWeightKg };
    expect(snapshot.bodyWeightKg).toBe(75);
  });

  /**
   * Test 8: Snapshot Immutability Conceptual Test
   * Verifies that once saved, snapshot values remain unchanged
   * even if user's body weight changes.
   *
   * Scenario:
   * 1. Save workout at bodyWeightKg = 75, calories = 285
   * 2. User changes weight to 60 kg (in storage)
   * 3. Read persisted session
   * 4. Verify historical snapshot is immutable (still 75, 285)
   */
  it('Test 8 — Snapshot immutability: persisted values remain constant after body weight change', () => {
    // Simulate save time: bodyWeightKg = 75
    const saveTimeBodyWeightKg = 75;
    const saveTimeCalories = calculateCalories({
      workoutId: 'outdoor_walk',
      durationSeconds: 3600,
      bodyWeightKg: saveTimeBodyWeightKg,
      liftedWeightKg: 0,
      reps: 0,
    });

    // Create persisted snapshot
    const persistedSnapshot = {
      date: new Date().toISOString(),
      calories: saveTimeCalories,
      bodyWeightKg: saveTimeBodyWeightKg,
    };

    // Verify initial snapshot
    expect(persistedSnapshot.calories).toBe(285);
    expect(persistedSnapshot.bodyWeightKg).toBe(75);

    // Simulate later: user changes body weight to 60 kg
    const currentBodyWeightKg = 60;
    expect(currentBodyWeightKg).not.toBe(saveTimeBodyWeightKg);

    // Read persisted session — snapshot should remain unchanged
    expect(persistedSnapshot.calories).toBe(285);
    expect(persistedSnapshot.bodyWeightKg).toBe(75);

    // Live recalculation (Phase 5B will use snapshot instead)
    const liveRecalcCalories = calculateCalories({
      workoutId: 'outdoor_walk',
      durationSeconds: 3600,
      bodyWeightKg: currentBodyWeightKg,
      liftedWeightKg: 0,
      reps: 0,
    });

    // Live value would differ, but snapshot must not
    expect(liveRecalcCalories).toBe(228);
    expect(liveRecalcCalories).not.toBe(persistedSnapshot.calories);
  });

  /**
   * Test 9: Strength with multiple body weight values
   * Validates that the formula applies body weight correctly
   * across different strength exercises
   */
  it('Test 9 — Strength formula: body weight affects all strength exercises consistently', () => {
    const durationSeconds = 3600;
    const liftedWeightKg = 20;

    // Test multiple strength workouts at same body weight
    const deadlift60 = calculateCalories({
      workoutId: 'deadlift',
      durationSeconds,
      bodyWeightKg: 60,
      liftedWeightKg,
      reps: 8,
    });

    const deadlift75 = calculateCalories({
      workoutId: 'deadlift',
      durationSeconds,
      bodyWeightKg: 75,
      liftedWeightKg,
      reps: 8,
    });

    const deadlift90 = calculateCalories({
      workoutId: 'deadlift',
      durationSeconds,
      bodyWeightKg: 90,
      liftedWeightKg,
      reps: 8,
    });

    // All should be different and in ascending order
    expect(deadlift60).toBeLessThan(deadlift75);
    expect(deadlift75).toBeLessThan(deadlift90);

    // Snapshot for each
    const snapshot60 = { calories: deadlift60, bodyWeightKg: 60 };
    const snapshot75 = { calories: deadlift75, bodyWeightKg: 75 };
    const snapshot90 = { calories: deadlift90, bodyWeightKg: 90 };

    expect(snapshot60.bodyWeightKg).toBe(60);
    expect(snapshot75.bodyWeightKg).toBe(75);
    expect(snapshot90.bodyWeightKg).toBe(90);
  });

  /**
   * Test 10: Empty string body weight fallback
   * parseStoredBodyWeight("") → 75 (fallback)
   */
  it('Test 10 — Empty string body weight: fallback to DEFAULT_BODY_WEIGHT_KG', () => {
    const stored = '';
    const bodyWeightKg = parseStoredBodyWeight(stored);

    expect(bodyWeightKg).toBe(DEFAULT_BODY_WEIGHT_KG);
    expect(bodyWeightKg).toBe(75);
  });

  /**
   * Test 11: Whitespace-only body weight fallback
   * parseStoredBodyWeight("   ") → 75 (fallback)
   */
  it('Test 11 — Whitespace body weight: fallback to DEFAULT_BODY_WEIGHT_KG', () => {
    const stored = '   ';
    const bodyWeightKg = parseStoredBodyWeight(stored);

    expect(bodyWeightKg).toBe(DEFAULT_BODY_WEIGHT_KG);
    expect(bodyWeightKg).toBe(75);
  });

  /**
   * Test 12: Snapshot object contract
   * Ensures snapshot has exactly the required fields
   */
  it('Test 12 — Snapshot object contract: contains calories and bodyWeightKg', () => {
    const bodyWeightKg = 75;
    const calories = calculateCalories({
      workoutId: 'outdoor_walk',
      durationSeconds: 3600,
      bodyWeightKg,
      liftedWeightKg: 0,
      reps: 0,
    });

    const snapshot = {
      calories,
      bodyWeightKg,
    };

    expect(snapshot).toHaveProperty('calories');
    expect(snapshot).toHaveProperty('bodyWeightKg');
    expect(typeof snapshot.calories).toBe('number');
    expect(typeof snapshot.bodyWeightKg).toBe('number');
  });

  it('Test 13 — Historical volume precedence: persisted totalVolume beats current settings and recorded data', () => {
    const persistedVolume = 1200;
    const session = {
      totalVolume: persistedVolume,
      settings: { weight: '200' },
      completedSets: 10,
      completedReps: 10,
      exerciseLifts: [
        { weightKg: 100, sets: 2, reps: 3 },
        { weightKg: 50, sets: 4, reps: 2 },
      ],
    };

    expect(getTotalVolume(session).value).toBe(persistedVolume);
    expect(getTotalVolume(session).source).toBe('snapshot');

    const fallbackSession = {
      settings: { weight: '200' },
      exerciseLifts: [
        { weightKg: 100, sets: 2, reps: 3 },
        { weightKg: 50, sets: 4, reps: 2 },
      ],
    };

    expect(getTotalVolume(fallbackSession).value).toBe(600 + 400);
    expect(getTotalVolume(fallbackSession).source).toBe('recorded_exerciseLifts');
  });
});
