import { calculate1RM, calculateDSI } from '../src/utils/StrengthCalculator';
import { get1RM, getDSIForSession, getActiveTime, getRestTime } from '../src/utils/SessionSnapshotReader';

describe('Phase 6C — historical 1RM / DSI readers', () => {
  it('uses recorded exercise data for historical 1RM instead of current settings', () => {
    const session = {
      settings: { weight: '500', targetReps: '8' },
      exerciseLifts: [
        { exerciseId: 'bench', weightKg: 120, reps: 5 },
        { exerciseId: 'bench', weightKg: 95, reps: 10 },
      ],
      bodyWeightKg: 82,
    };

    const result = get1RM(session);
    const expected = Math.max(calculate1RM(120, 5), calculate1RM(95, 10));

    expect(result.value).toBeCloseTo(expected, 10);
    expect(result.value).not.toBeCloseTo(calculate1RM(500, 8), 10);
  });

  it('uses session bodyWeightKg for historical DSI instead of current user weight', () => {
    const session = {
      bodyWeightKg: 82,
      exerciseLifts: [
        { weightKg: 120, reps: 5 },
        { weightKg: 95, reps: 10 },
      ],
      userBodyWeightKg: 90,
    };

    const result = getDSIForSession(session);
    const expected = calculateDSI(
      [
        { weight: 120, reps: 5 },
        { weight: 95, reps: 10 },
      ],
      82,
    );

    expect(result.value).toBeCloseTo(expected, 10);
    expect(result.value).not.toBeCloseTo(calculateDSI(
      [
        { weight: 120, reps: 5 },
        { weight: 95, reps: 10 },
      ],
      90,
    ), 10);
  });

  it('uses snapshot-first active/rest precedence and averages loop arrays', () => {
    const session = {
      activeTime: 120,
      avgGreenLoopTime: 30,
      greenLoopTimes: [25, 35],
      elapsedTime: 240,
      restTime: 60,
      avgRedLoopTime: 15,
      redLoopTimes: [10, 20],
    };

    expect(getActiveTime(session)).toEqual({ value: 120, source: 'activeTime' });
    expect(getRestTime(session)).toEqual({ value: 60, source: 'restTime' });

    const fallbackSession = {
      elapsedTime: 240,
      greenLoopTimes: [10, 20, 30],
      redLoopTimes: [5, 15],
    };

    expect(getActiveTime(fallbackSession)).toEqual({ value: 20, source: 'greenLoopTimes' });
    expect(getRestTime(fallbackSession)).toEqual({ value: 10, source: 'redLoopTimes' });

    const elapsedFallback = {
      elapsedTime: 240,
      restTime: 90,
      greenLoopTimes: [],
      redLoopTimes: [],
    };

    expect(getActiveTime(elapsedFallback)).toEqual({ value: 150, source: 'elapsed_minus_rest' });
    expect(getRestTime(elapsedFallback)).toEqual({ value: 90, source: 'restTime' });
  });
});
