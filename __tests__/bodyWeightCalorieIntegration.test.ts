import { calculateCalories } from '../src/utils/CalorieCalculator';

describe('Body Weight / Calorie integration — explicit contract', () => {
  it('cardio: honors explicit bodyWeightKg (60,75,90 fixtures)', () => {
    const durationSeconds = 3600;

    expect(calculateCalories({
      workoutId: 'outdoor_walk',
      durationSeconds,
      bodyWeightKg: 60,
      liftedWeightKg: 0,
      reps: 0,
    })).toBe(228);

    expect(calculateCalories({
      workoutId: 'outdoor_walk',
      durationSeconds,
      bodyWeightKg: 75,
      liftedWeightKg: 0,
      reps: 0,
    })).toBe(285);

    expect(calculateCalories({
      workoutId: 'outdoor_walk',
      durationSeconds,
      bodyWeightKg: 90,
      liftedWeightKg: 0,
      reps: 0,
    })).toBe(342);
  });

  it('cardio: falls back to DEFAULT_BODY_WEIGHT_KG for missing/invalid bodyWeightKg', () => {
    const durationSeconds = 3600;

    // missing
    expect(calculateCalories({
      workoutId: 'outdoor_walk',
      durationSeconds,
      liftedWeightKg: 0,
      reps: 0,
    })).toBe(285);

    // explicitly undefined
    expect(calculateCalories({
      workoutId: 'outdoor_walk',
      durationSeconds,
      bodyWeightKg: undefined as any,
      liftedWeightKg: 0,
      reps: 0,
    })).toBe(285);

    // null treated as invalid input at run-time (tests cast to any to simulate)
    expect(calculateCalories({
      workoutId: 'outdoor_walk',
      durationSeconds,
      bodyWeightKg: (null as any),
      liftedWeightKg: 0,
      reps: 0,
    })).toBe(285);

    // NaN
    expect(calculateCalories({
      workoutId: 'outdoor_walk',
      durationSeconds,
      bodyWeightKg: Number.NaN as any,
      liftedWeightKg: 0,
      reps: 0,
    })).toBe(285);

    // invalid string (simulated via any)
    expect(calculateCalories({
      workoutId: 'outdoor_walk',
      durationSeconds,
      bodyWeightKg: ('invalid' as any),
      liftedWeightKg: 0,
      reps: 0,
    })).toBe(285);
  });

  it('strength: bodyWeight and liftedWeight are distinct and affect different parts of formula', () => {
    const durationSeconds = 3600;

    const baseFor60 = Math.round(6.0 * 60 * (durationSeconds / 3600) * (1 + 20 / 200));
    const baseFor75 = Math.round(6.0 * 75 * (durationSeconds / 3600) * (1 + 20 / 200));
    const baseFor90 = Math.round(6.0 * 90 * (durationSeconds / 3600) * (1 + 20 / 200));

    const sixty = calculateCalories({
      workoutId: 'bench_press',
      durationSeconds,
      bodyWeightKg: 60,
      liftedWeightKg: 20,
      reps: 10,
    });

    const seventyFive = calculateCalories({
      workoutId: 'bench_press',
      durationSeconds,
      bodyWeightKg: 75,
      liftedWeightKg: 20,
      reps: 10,
    });

    const ninety = calculateCalories({
      workoutId: 'bench_press',
      durationSeconds,
      bodyWeightKg: 90,
      liftedWeightKg: 20,
      reps: 10,
    });

    expect(sixty).toBe(baseFor60);
    expect(seventyFive).toBe(baseFor75);
    expect(ninety).toBe(baseFor90);

    // lifted weight multiplier changes when liftedWeightKg changes
    const lifted20 = calculateCalories({
      workoutId: 'bench_press',
      durationSeconds,
      bodyWeightKg: 75,
      liftedWeightKg: 20,
      reps: 10,
    });

    const lifted40 = calculateCalories({
      workoutId: 'bench_press',
      durationSeconds,
      bodyWeightKg: 75,
      liftedWeightKg: 40,
      reps: 10,
    });

    expect(lifted40).toBeGreaterThan(lifted20);
  });
});
