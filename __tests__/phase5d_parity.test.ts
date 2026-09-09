import { getSessionCalories } from '../src/utils/SnapshotCalorieReader';
import { calculateCalories } from '../src/utils/CalorieCalculator';
import { DEFAULT_BODY_WEIGHT_KG } from '../src/constants/bodyWeight';

describe('Phase 5D — Historical calorie parity tests', () => {
  it('persisted snapshot precedence: returns stored calories regardless of current body weight', () => {
    const storedCalories = 500;
    const optsA = { workoutId: 'outdoor_walk', durationSeconds: 1800, bodyWeightKg: 75, liftedWeightKg: 0, reps: 0 };
    const optsB = { workoutId: 'outdoor_walk', durationSeconds: 1800, bodyWeightKg: 60, liftedWeightKg: 0, reps: 0 };

    const a = getSessionCalories(storedCalories as any, optsA as any);
    const b = getSessionCalories(storedCalories as any, optsB as any);

    expect(a).toBe(500);
    expect(b).toBe(500);
    expect(a).toBe(b);
  });

  it('same historical session produces identical kcal across different reader options', () => {
    const storedCalories = 320;
    const opts1 = { workoutId: 'bench_press', durationSeconds: 1200, bodyWeightKg: 80, liftedWeightKg: 20, reps: 10 };
    const opts2 = { workoutId: 'bench_press', durationSeconds: 900, bodyWeightKg: 65, liftedWeightKg: 20, reps: 8 };

    const r1 = getSessionCalories(storedCalories as any, opts1 as any);
    const r2 = getSessionCalories(storedCalories as any, opts2 as any);

    expect(r1).toBe(320);
    expect(r2).toBe(320);
  });

  it('body-weight change after save does not affect snapshot-based totals', () => {
    const persisted = { calories: 285, bodyWeightKg: 75 } as any;
    const optsBefore = { workoutId: 'outdoor_walk', durationSeconds: 3600, bodyWeightKg: persisted.bodyWeightKg, liftedWeightKg: 0, reps: 0 } as any;
    const optsAfter = { workoutId: 'outdoor_walk', durationSeconds: 3600, bodyWeightKg: 60, liftedWeightKg: 0, reps: 0 } as any;

    const persistedVal = getSessionCalories(persisted.calories, optsBefore);
    const afterVal = getSessionCalories(persisted.calories, optsAfter);

    expect(persistedVal).toBe(285);
    expect(afterVal).toBe(285);
  });

  it('mixed legacy + snapshot sessions aggregate deterministically (sum of per-session energies)', () => {
    const snapshotSession = { calories: 200 } as any;
    const legacySession = { calories: undefined, workoutId: 'outdoor_walk', elapsedTime: 3600 } as any;

    const legacyOpts = { workoutId: legacySession.workoutId, durationSeconds: legacySession.elapsedTime, bodyWeightKg: DEFAULT_BODY_WEIGHT_KG, liftedWeightKg: 0, reps: 0 } as any;
    const legacyEnergy = calculateCalories(legacyOpts as any);

    const sumPerSession = getSessionCalories(snapshotSession.calories, legacyOpts) + getSessionCalories(legacySession.calories as any, legacyOpts);

    const expected = 200 + legacyEnergy;
    expect(sumPerSession).toBe(expected);
  });

  it('zero snapshot is preserved (0 is authoritative)', () => {
    const zero = 0;
    const opts = { workoutId: 'outdoor_walk', durationSeconds: 1800, bodyWeightKg: DEFAULT_BODY_WEIGHT_KG, liftedWeightKg: 0, reps: 0 } as any;

    const v = getSessionCalories(zero as any, opts as any);
    expect(v).toBe(0);
  });

  it('invalid snapshot types fallback to live calculation', () => {
    const invalid = '228' as any;
    const opts = { workoutId: 'outdoor_walk', durationSeconds: 3600, bodyWeightKg: 75, liftedWeightKg: 0, reps: 0 } as any;

    const v = getSessionCalories(invalid, opts as any);
    const expected = calculateCalories(opts as any);
    expect(v).toBe(expected);
  });
});
