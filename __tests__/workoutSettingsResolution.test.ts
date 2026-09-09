import { resolveWorkoutStartSettings } from '../src/utils/WorkoutSettingsManager';

describe('resolveWorkoutStartSettings', () => {
  it('prefers saved workout settings over parsed defaults when starting a collectible workout', () => {
    const parsed = { name: 'Bench Press', sets: 5, reps: '10', weight: '140' };
    const saved = { targetSets: '3', targetReps: '8', weight: '135' };

    expect(resolveWorkoutStartSettings(parsed, saved)).toEqual({
      targetSets: '3',
      targetReps: '8',
      weight: '135',
    });
  });

  it('allows a current explicit selection to override saved settings', () => {
    const parsed = { name: 'Bench Press', sets: 5, reps: '10', weight: '140' };
    const saved = { targetSets: '3', targetReps: '8', weight: '135' };
    const explicit = { targetSets: '4', targetReps: '12', weight: '150' };

    expect(resolveWorkoutStartSettings(parsed, saved, explicit)).toEqual({
      targetSets: '4',
      targetReps: '12',
      weight: '150',
    });
  });
});
