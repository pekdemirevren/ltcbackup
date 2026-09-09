jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { processMainCardRun } from '../src/utils/MainCardEngine';
import type { MainCard, SessionMetrics } from '../src/types/mainCard';

const mockedGetItem = AsyncStorage.getItem as jest.Mock;
const mockedSetItem = AsyncStorage.setItem as jest.Mock;

const makeCard = (): MainCard => ({
  id: 'card_1',
  rarity: 'GOLD' as any,
  theme: 'PULL' as any,
  primary: 'Test Card',
  primaryIconId: 'test_primary',
  secondaryIconId: null,
  primaryEpithetByTier: { GOLD: 'Test', SILVER: 'Test', BRONZE: 'Test' } as any,
  subtitle: 'Test subtitle',
  secondaryTag: null,
  category: 'TOP',
  requiredRuns: 10,
  workoutIds: ['w1', 'w2'],
  weights: { STR: 1, VOL: 1, TMP: 1, END: 1, PHY: 1, HYP: 1 },
  secondaryUnlocks: [],
});

const metrics: SessionMetrics[] = [
  { volumeKg: 100, enduranceMin: 20, cadenceSecPerRep: 3, intensityRatio: 1, densityPct: 60 },
  { volumeKg: 200, enduranceMin: 30, cadenceSecPerRep: 2, intensityRatio: 2, densityPct: 70 },
];

beforeEach(() => {
  jest.clearAllMocks();

  const store: Record<string, string> = {};
  mockedGetItem.mockImplementation((key: string) => store[key] ?? null);
  mockedSetItem.mockImplementation((key: string, value: string) => {
    store[key] = value;
    return Promise.resolve();
  });
});

describe('MainCard idempotency', () => {
  it('same attempt/run processed twice applies gains/xp/level only once', async () => {
    const card = makeCard();
    const ctx = {
      runIndex: 1,
      completedWorkoutCount: 2,
      dayKey: '2026-09-08',
      attemptId: 'attempt_1',
    };

    const first = await processMainCardRun(card, metrics, ctx);

    expect(first.gainsFromRun.STR).toBeGreaterThan(0);
    expect(first.state.xp).toBe(1);
    expect(first.state.level).toBe(1);

    const second = await processMainCardRun(card, metrics, ctx);

    expect(second.gainsFromRun).toEqual({ STR: 0, VOL: 0, TMP: 0, END: 0, PHY: 0, HYP: 0 });
    expect(second.state.xp).toBe(1);
    expect(second.state.level).toBe(1);
    expect(second.state.gains).toEqual(first.state.gains);
    expect(second.leveledUp).toBe(false);
  });

  it('different attempt/run still processes normally', async () => {
    const card = makeCard();

    const first = await processMainCardRun(card, metrics, {
      runIndex: 1,
      completedWorkoutCount: 2,
      dayKey: '2026-09-08',
      attemptId: 'attempt_1',
    });

    const second = await processMainCardRun(card, metrics, {
      runIndex: 2,
      completedWorkoutCount: 2,
      dayKey: '2026-09-08',
      attemptId: 'attempt_2',
    });

    expect(second.state.xp).toBe(first.state.xp + 1);
    expect(second.state.level).toBe(first.state.level + 1);
    expect(second.gainsFromRun.STR).toBeGreaterThan(0);
  });

  it('dedup state persists and blocks duplicate processing after reload', async () => {
    const card = makeCard();
    const ctx = {
      runIndex: 1,
      completedWorkoutCount: 2,
      dayKey: '2026-09-08',
      attemptId: 'attempt_1',
    };

    const first = await processMainCardRun(card, metrics, ctx);
    expect(first.state.processedAttemptIds).toContain('attempt_1');

    const reloaded = await processMainCardRun(card, metrics, ctx);

    expect(reloaded.gainsFromRun).toEqual({ STR: 0, VOL: 0, TMP: 0, END: 0, PHY: 0, HYP: 0 });
    expect(reloaded.state.xp).toBe(first.state.xp);
    expect(reloaded.state.level).toBe(first.state.level);
  });
});
