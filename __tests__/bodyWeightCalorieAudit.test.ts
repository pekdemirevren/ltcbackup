import { calculateCalories } from '../src/utils/CalorieCalculator';
import { DEFAULT_BODY_WEIGHT_KG } from '../src/constants/bodyWeight';

describe('Body Weight / calorie audit — current behavior only', () => {
  it('cardio uses the default 75 kg when no explicit body-weight value is supplied', () => {
    const durationSeconds = 3600;
    const expected = Math.round(3.8 * 75 * (durationSeconds / 3600));

    expect(calculateCalories({ workoutId: 'outdoor_walk', durationSeconds, bodyWeightKg: undefined, liftedWeightKg: 0, reps: 0 })).toBe(expected);
    expect(calculateCalories({ workoutId: 'outdoor_walk', durationSeconds, bodyWeightKg: undefined, liftedWeightKg: 0, reps: 0 })).toBe(285);
  });

  it('cardio ignores a numeric lifted-weight argument and still uses the default body weight', () => {
    const durationSeconds = 3600;
    const defaultValue = calculateCalories({ workoutId: 'outdoor_walk', durationSeconds, bodyWeightKg: undefined, liftedWeightKg: 0, reps: 0 });
    const withLiftedWeight = calculateCalories({ workoutId: 'outdoor_walk', durationSeconds, bodyWeightKg: undefined, liftedWeightKg: 60, reps: 0 });

    expect(withLiftedWeight).toBe(defaultValue);
    expect(withLiftedWeight).toBe(285);
  });

  it('strength calories scale with lifted weight and not with user body weight', () => {
    const durationSeconds = 3600;
    const met = 6.0;
    const defaultBodyWeight = 75;
    const liftedWeightKg = 60;
    const expected = Math.round(met * defaultBodyWeight * (durationSeconds / 3600) * (1 + liftedWeightKg / 200));

    expect(calculateCalories({ workoutId: 'bench_press', durationSeconds, bodyWeightKg: DEFAULT_BODY_WEIGHT_KG, liftedWeightKg, reps: 10 })).toBe(expected);
    expect(calculateCalories({ workoutId: 'bench_press', durationSeconds, bodyWeightKg: DEFAULT_BODY_WEIGHT_KG, liftedWeightKg, reps: 10 })).toBe(585);
  });

  it('passing a body-weight value in the final positional slot does not change cardio output', () => {
    const durationSeconds = 3600;
    const defaultValue = calculateCalories({ workoutId: 'outdoor_walk', durationSeconds, bodyWeightKg: undefined, liftedWeightKg: 0, reps: 0 });
    const asIfUserWeight = calculateCalories({ workoutId: 'outdoor_walk', durationSeconds, bodyWeightKg: 60, liftedWeightKg: 0, reps: 0 });

    expect(asIfUserWeight).not.toBe(defaultValue);
    expect(asIfUserWeight).toBe(228);
  });

  it('different intended user weights do not change the current calorie output for the same cardio call shape', () => {
    const durationSeconds = 3600;
    const at60 = calculateCalories({ workoutId: 'outdoor_walk', durationSeconds, bodyWeightKg: 60, liftedWeightKg: 0, reps: 0 });
    const at75 = calculateCalories({ workoutId: 'outdoor_walk', durationSeconds, bodyWeightKg: undefined, liftedWeightKg: 0, reps: 0 });
    const at90 = calculateCalories({ workoutId: 'outdoor_walk', durationSeconds, bodyWeightKg: 90, liftedWeightKg: 0, reps: 0 });

    expect(at60).toBe(228);
    expect(at75).toBe(285);
    expect(at90).toBe(342);
  });
});
