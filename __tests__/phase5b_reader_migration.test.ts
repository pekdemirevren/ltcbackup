/**
 * PHASE 5B — Historical Calorie Snapshot Reader Migration Tests
 *
 * This test suite validates that:
 * 1. Readers prefer persisted snapshot calories when available
 * 2. Readers gracefully fallback to live calculation for legacy sessions
 * 3. Zero calories are preserved (not treated as falsy)
 * 4. Body weight changes after save don't alter historical display
 * 5. Aggregations use snapshots correctly
 */

import { getSessionCalories } from '../src/utils/SnapshotCalorieReader';
import { calculateCalories } from '../src/utils/CalorieCalculator';

describe('Phase 5B — Historical Calorie Snapshot Reader Migration', () => {
  /**
   * Test 1: Snapshot Precedence
   * 
   * When session.calories is a valid number, it should be used
   * regardless of current body weight or other factors.
   */
  it('Test 1 — Snapshot precedence: persisted calories take priority', () => {
    const sessionCalories = 500;
    const currentBodyWeightKg = 60; // Different from snapshot

    const result = getSessionCalories(sessionCalories, {
      workoutId: 'outdoor_walk',
      durationSeconds: 3600,
      bodyWeightKg: currentBodyWeightKg,
      liftedWeightKg: 0,
      reps: 0,
    });

    expect(result).toBe(500);
    // Verify it did NOT recalculate based on current body weight
    expect(result).not.toBe(228); // Would be 60kg value
  });

  /**
   * Test 2: Legacy Fallback
   * 
   * When session.calories is undefined (legacy session),
   * fallback to live calculation.
   */
  it('Test 2 — Legacy fallback: missing calories trigger recalculation', () => {
    const sessionCalories = undefined;
    const bodyWeightKg = 75;

    const result = getSessionCalories(sessionCalories, {
      workoutId: 'outdoor_walk',
      durationSeconds: 3600,
      bodyWeightKg,
      liftedWeightKg: 0,
      reps: 0,
    });

    // Should recalculate using current body weight
    expect(result).toBe(285);
  });

  /**
   * Test 3: Invalid Snapshot Fallback (null)
   */
  it('Test 3 — Invalid snapshot (null): fallback to calculation', () => {
    const sessionCalories = null;
    const bodyWeightKg = 75;

    const result = getSessionCalories(sessionCalories, {
      workoutId: 'outdoor_walk',
      durationSeconds: 3600,
      bodyWeightKg,
      liftedWeightKg: 0,
      reps: 0,
    });

    expect(result).toBe(285);
  });

  /**
   * Test 4: Invalid Snapshot Fallback (NaN)
   */
  it('Test 4 — Invalid snapshot (NaN): fallback to calculation', () => {
    const sessionCalories = NaN;
    const bodyWeightKg = 75;

    const result = getSessionCalories(sessionCalories, {
      workoutId: 'outdoor_walk',
      durationSeconds: 3600,
      bodyWeightKg,
      liftedWeightKg: 0,
      reps: 0,
    });

    expect(result).toBe(285);
  });

  /**
   * Test 5: Zero Calories Preservation
   *
   * CRITICAL: Zero is a valid numeric value.
   * Must NOT use truthy check (session.calories || fallback)
   * because that would incorrectly trigger fallback for 0.
   */
  it('Test 5 — Zero calories: must be preserved, not recalculated', () => {
    const sessionCalories = 0; // Valid snapshot, even if unexpected
    const bodyWeightKg = 75;

    const result = getSessionCalories(sessionCalories, {
      workoutId: 'outdoor_walk',
      durationSeconds: 3600,
      bodyWeightKg,
      liftedWeightKg: 0,
      reps: 0,
    });

    // Must return 0, not recalculate to 285
    expect(result).toBe(0);
    expect(result).not.toBe(285);
  });

  /**
   * Test 6: Invalid String Snapshot
   */
  it('Test 6 — Invalid snapshot (string): fallback to calculation', () => {
    const sessionCalories = 'invalid' as any;
    const bodyWeightKg = 75;

    const result = getSessionCalories(sessionCalories, {
      workoutId: 'outdoor_walk',
      durationSeconds: 3600,
      bodyWeightKg,
      liftedWeightKg: 0,
      reps: 0,
    });

    expect(result).toBe(285);
  });

  /**
   * Test 6b: Numeric string snapshot should NOT be treated as a valid numeric snapshot
   */
  it('Test 6b — Numeric string snapshot: fallback to calculation', () => {
    const sessionCalories = '228' as any; // numeric string
    const bodyWeightKg = 75;

    const result = getSessionCalories(sessionCalories, {
      workoutId: 'outdoor_walk',
      durationSeconds: 3600,
      bodyWeightKg,
      liftedWeightKg: 0,
      reps: 0,
    });

    // Should fallback because type is string
    expect(result).toBe(285);
  });

  /**
   * Test 6c: Infinity and -Infinity should fallback
   */
  it('Test 6c — Invalid snapshot (Infinity/-Infinity): fallback to calculation', () => {
    const plusInf = Infinity as any;
    const negInf = -Infinity as any;
    const bodyWeightKg = 75;

    const resultPos = getSessionCalories(plusInf, {
      workoutId: 'outdoor_walk',
      durationSeconds: 3600,
      bodyWeightKg,
      liftedWeightKg: 0,
      reps: 0,
    });

    const resultNeg = getSessionCalories(negInf, {
      workoutId: 'outdoor_walk',
      durationSeconds: 3600,
      bodyWeightKg,
      liftedWeightKg: 0,
      reps: 0,
    });

    expect(resultPos).toBe(285);
    expect(resultNeg).toBe(285);
  });

  /**
   * Test 7: Body Weight Change Immutability
   *
   * Scenario:
   * 1. Session saved at 75 kg → calories = 285
   * 2. User body weight changed to 60 kg
   * 3. Reader receives session.calories = 285
   * 4. Current bodyWeightKg param = 60 kg
   * 5. Result must still be 285
   */
  it('Test 7 — Body weight immutability: snapshot persists despite user weight change', () => {
    // Save-time: session has snapshot of 285 (from 75 kg)
    const snapshotCalories = 285;

    // Later: user changes to 60 kg
    const currentBodyWeightKg = 60;

    const result = getSessionCalories(snapshotCalories, {
      workoutId: 'outdoor_walk',
      durationSeconds: 3600,
      bodyWeightKg: currentBodyWeightKg,
      liftedWeightKg: 0,
      reps: 0,
    });

    // Must return snapshot, not recalculate
    expect(result).toBe(285);
    // Verify it's NOT the 60kg value
    expect(result).not.toBe(228);
  });

  /**
   * Test 8: Decimal Snapshot Preservation
   */
  it('Test 8 — Decimal snapshots: preserved exactly', () => {
    const sessionCalories = 287.5;
    const bodyWeightKg = 75;

    const result = getSessionCalories(sessionCalories, {
      workoutId: 'outdoor_walk',
      durationSeconds: 3600,
      bodyWeightKg,
      liftedWeightKg: 0,
      reps: 0,
    });

    expect(result).toBe(287.5);
  });

  /**
   * Test 9: Strength Snapshot Precedence
   *
   * Verify that snapshot preference works for strength exercises
   * and body weight vs lifted weight are not confused.
   */
  it('Test 9 — Strength snapshot: body weight and lifted weight semantically distinct', () => {
    // Saved at: body 75 kg, lifted 20 kg → calories = 495
    const snapshotCalories = 495;

    // User later at: body 60 kg
    const currentBodyWeightKg = 60;

    const result = getSessionCalories(snapshotCalories, {
      workoutId: 'bench_press',
      durationSeconds: 3600,
      bodyWeightKg: currentBodyWeightKg,
      liftedWeightKg: 20, // Correct lifted weight
      reps: 10,
    });

    // Must use snapshot
    expect(result).toBe(495);
    // Verify NOT recalculated at 60kg
    const recalc60 = calculateCalories({
      workoutId: 'bench_press',
      durationSeconds: 3600,
      bodyWeightKg: 60,
      liftedWeightKg: 20,
      reps: 10,
    });
    expect(result).not.toBe(recalc60);
  });

  /**
   * Test 10: Mixed Legacy and Snapshot Aggregation
   *
   * When aggregating multiple sessions:
   * - Session A: has snapshot → use 500
   * - Session B: no calories (legacy) → calculate 400 using current BW
   * - Session C: has snapshot → use 300
   * Total should be 1200, not recalculating A or C
   */
  it('Test 10 — Mixed aggregation: snapshots and legacy fallbacks coexist', () => {
    const currentBodyWeightKg = 75;

    // Session A: has snapshot
    const cal_A = getSessionCalories(500, {
      workoutId: 'outdoor_walk',
      durationSeconds: 3600,
      bodyWeightKg: currentBodyWeightKg,
      liftedWeightKg: 0,
      reps: 0,
    });

    // Session B: legacy, no snapshot
    const cal_B = getSessionCalories(undefined, {
      workoutId: 'outdoor_walk',
      durationSeconds: 1800, // 30 min
      bodyWeightKg: currentBodyWeightKg,
      liftedWeightKg: 0,
      reps: 0,
    });

    // Session C: has snapshot
    const cal_C = getSessionCalories(300, {
      workoutId: 'outdoor_walk',
      durationSeconds: 3600,
      bodyWeightKg: currentBodyWeightKg,
      liftedWeightKg: 0,
      reps: 0,
    });

    const totalCalories = cal_A + cal_B + cal_C;

    // A uses snapshot (500), C uses snapshot (300)
    expect(cal_A).toBe(500);
    expect(cal_C).toBe(300);
    
    // B falls back to calculation (not specified, but should be live calc)
    expect(cal_B).toBeLessThanOrEqual(cal_C); // 30 min < 60 min
    
    // Total should include both snapshot and calculated values
    expect(totalCalories).toBe(500 + cal_B + 300);
  });

  /**
   * Test 11: Multiple Zero Scenarios
   *
   * Various falsy scenarios that should NOT trigger fallback
   * when the actual value is 0.
   */
  it('Test 11 — Zero preservation in various contexts', () => {
    const bodyWeightKg = 75;

    // Scenario 1: Literally 0
    expect(
      getSessionCalories(0, {
        workoutId: 'outdoor_walk',
        durationSeconds: 3600,
        bodyWeightKg,
        liftedWeightKg: 0,
        reps: 0,
      })
    ).toBe(0);

    // Scenario 2: 0 in aggregation
    let total = 0;
    total += getSessionCalories(0, {
      workoutId: 'outdoor_walk',
      durationSeconds: 3600,
      bodyWeightKg,
      liftedWeightKg: 0,
      reps: 0,
    });
    total += getSessionCalories(100, {
      workoutId: 'outdoor_walk',
      durationSeconds: 3600,
      bodyWeightKg,
      liftedWeightKg: 0,
      reps: 0,
    });

    expect(total).toBe(100);
  });

  /**
   * Test 12: Cardio Snapshot Reader
   *
   * Verify cardio specifically respects snapshot.
   */
  it('Test 12 — Cardio reader: snapshot takes precedence', () => {
    const sessionCalories = 228; // 60 kg cardio
    const currentBodyWeightKg = 75; // Changed after save

    const result = getSessionCalories(sessionCalories, {
      workoutId: 'outdoor_walk',
      durationSeconds: 3600,
      bodyWeightKg: currentBodyWeightKg,
      liftedWeightKg: 0,
      reps: 0,
    });

    expect(result).toBe(228);
    expect(result).not.toBe(285); // Not 75kg value
  });

  /**
   * Test 13: Helper Function Contract
   *
   * Verify the helper function accepts all expected parameters
   * and returns a number.
   */
  it('Test 13 — Helper contract: returns number', () => {
    const result = getSessionCalories(100, {
      workoutId: 'bench_press',
      durationSeconds: 1800,
      bodyWeightKg: 75,
      liftedWeightKg: 20,
      reps: 10,
    });

    expect(typeof result).toBe('number');
    expect(Number.isFinite(result)).toBe(true);
  });
});
