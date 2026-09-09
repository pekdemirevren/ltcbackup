import { calculateCalories } from '../src/utils/CalorieCalculator';
import { calculate1RM, calculateVolume, calculateDSI } from '../src/utils/StrengthCalculator';
import { calculateOVR } from '../src/constants/collectibleWorkouts';

describe('Numeric calculation vectors — Phase 30 smoke tests', () => {
  test('calculate1RM Epley formula', () => {
    const oneRM = calculate1RM(100, 10);
    expect(oneRM).toBeCloseTo(133.3333333, 6);
  });

  test('calculate1RM edge cases', () => {
    expect(calculate1RM(0, 5)).toBe(0);
    expect(calculate1RM(100, 0)).toBe(0);
  });

  test('calculateVolume basic', () => {
    expect(calculateVolume(3, 8, 50)).toBe(1200);
    expect(calculateVolume(0, 8, 50)).toBe(0);
  });

  test('calculateCalories — cardio (outdoor_run) 1h at 70kg', () => {
    const kcal = calculateCalories({ workoutId: 'outdoor_run', durationSeconds: 3600, bodyWeightKg: 70 });
    // MET 9.8 * 70kg * 1h = 686
    expect(kcal).toBe(686);
  });

  test('calculateCalories — strength bench_press with liftedWeight intensity', () => {
    const kcal = calculateCalories({ workoutId: 'bench_press', durationSeconds: 3600, bodyWeightKg: 80, liftedWeightKg: 100 });
    // base = 6 * 80 * 1h = 480; intensity multiplier = 1 + 100/200 = 1.5 => 480*1.5 = 720
    expect(kcal).toBe(720);
  });

  test('calculateCalories — default fallback activity', () => {
    const kcal = calculateCalories({ workoutId: 'unknown_activity', durationSeconds: 1800, bodyWeightKg: 70 });
    // MET default 4.5 * 70kg * 0.5h = 157.5 -> round -> 158
    expect(kcal).toBe(158);
  });

  test('calculateDSI example', () => {
    const lifts = [ { weight: 100, reps: 5 }, { weight: 80, reps: 8 } ];
    const dsi = calculateDSI(lifts, 80);
    // oneRM1 = 100*(1+5/30)=116.6666667 -> ratio1=1.4583333333
    // oneRM2 = 80*(1+8/30)=101.3333333 -> ratio2=1.2666666667
    // avg = 1.3625
    expect(dsi).toBeCloseTo(1.3625, 6);
  });

  test('calculateOVR example (push_chaos baseStats)', () => {
    const stats = { STR: 99, VOL: 89, TMP: 79, END: 84, PHY: 94, HYP: 99 } as any;
    const ovr = calculateOVR(stats, 'PUSH');
    // computed weighted average in collector: ~91.558 -> round -> 92
    expect(ovr).toBe(92);
  });
});
