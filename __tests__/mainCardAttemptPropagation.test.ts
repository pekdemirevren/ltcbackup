jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { recordWorkoutInAttempt } from '../src/utils/MainCardAttemptManager';

const mockedGetItem = AsyncStorage.getItem as jest.Mock;
const mockedSetItem = AsyncStorage.setItem as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  const store: Record<string, string> = {};
  mockedGetItem.mockImplementation((key: string) => Promise.resolve(store[key] ?? null));
  mockedSetItem.mockImplementation((key: string, value: string) => {
    store[key] = value;
    return Promise.resolve();
  });
});

describe('MainCardAttempt propagation and duplicate metrics prevention', () => {
  it('records metrics only once when same workout completed twice', async () => {
    // Prepare a fake attempt and main_card_state pointing to it
    const attempt = {
      id: 'cardA_1',
      mainCardId: 'cardA',
      workoutIds: ['w1', 'w2'],
      completedWorkouts: [],
      startedAt: new Date().toISOString(),
      isCompleted: false,
    };

    const mainCardState = {
      id: 'cardA',
      level: 0,
      xp: 0,
      gains: { STR: 0, VOL: 0, TMP: 0, END: 0, PHY: 0, HYP: 0 },
      shards: {},
      unlockedSecondaries: [],
      currentAttemptId: attempt.id,
      processedAttemptIds: [],
    };

    // Seed AsyncStorage
    await mockedSetItem(`main_card_attempt_${attempt.id}`, JSON.stringify(attempt));
    await mockedSetItem(`main_card_state_${mainCardState.id}`, JSON.stringify(mainCardState));

    // First recording
    const sessionData = { weightKg: 50, completedSets: 3, completedReps: 8, elapsedSec: 300, activeSec: 240, restSec: 60 };
    const first = await recordWorkoutInAttempt('cardA', 'w1', sessionData);

    // Metrics should have been recorded
    const metricsKey = `main_card_attempt_${attempt.id}_metrics`;
    const metricsSaved = await mockedGetItem(metricsKey);
    expect(metricsSaved).not.toBeNull();
    const metricsList = JSON.parse(metricsSaved as string);
    expect(metricsList.length).toBe(1);

    // Second recording (duplicate)
    const second = await recordWorkoutInAttempt('cardA', 'w1', sessionData);
    const metricsSaved2 = await mockedGetItem(metricsKey);
    const metricsList2 = JSON.parse(metricsSaved2 as string);

    // Metrics list must still be length 1 (no duplicate pushed)
    expect(metricsList2.length).toBe(1);

    // Attempt completedWorkouts should contain w1 only once
    const attemptSaved = JSON.parse(await mockedGetItem(`main_card_attempt_${attempt.id}`) as string);
    expect(attemptSaved.completedWorkouts.filter((w: string) => w === 'w1').length).toBe(1);

    // runProcessed can be false because not all workouts are completed yet
    expect(first.runProcessed).toBe(false);
    expect(second.runProcessed).toBe(false);
  });
});
