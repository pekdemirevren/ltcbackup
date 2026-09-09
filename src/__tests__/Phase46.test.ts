/**
 * Phase 46 — Suggested Next Weights Implementation
 * 
 * Tests for suggestion reader, resolver, and integration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getLastSessionForWorkout,
  getLastSessionSuggestedWeight,
  getLastSessionSuggestedMetrics,
} from '../utils/SessionSnapshotReader';
import { getSuggestedWorkoutSettings, SuggestedWorkoutSettings } from '../utils/WorkoutSuggestionResolver';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');

describe('Phase 46 — Suggested Next Weights', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Last session found
  describe('Test 1 — Last session found', () => {
    it('should find the most recent completed session for a workout', async () => {
      const mockSummaries = [
        {
          workoutId: 'workout-1',
          date: '2026-01-01T10:00:00Z',
          completedSets: 3,
          completedReps: 10,
          settings: { weight: '70' },
        },
        {
          workoutId: 'workout-1',
          date: '2026-01-02T10:00:00Z',
          completedSets: 3,
          completedReps: 10,
          settings: { weight: '75' },
        },
        {
          workoutId: 'workout-2',
          date: '2026-01-02T14:00:00Z',
          completedSets: 4,
          completedReps: 8,
          settings: { weight: '80' },
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockSummaries));

      const lastSession = await getLastSessionForWorkout('workout-1');

      expect(lastSession).toBeDefined();
      expect(lastSession?.date).toBe('2026-01-02T10:00:00Z');
      expect(lastSession?.completedSets).toBe(3);
      expect(lastSession?.completedReps).toBe(10);
      expect(lastSession?.settings.weight).toBe('75');
    });
  });

  // Test 2: Exercise mapping
  describe('Test 2 — Exercise mapping', () => {
    it('should correctly extract weight from last session', async () => {
      const mockSummaries = [
        {
          workoutId: 'squat-exercise',
          date: '2026-01-02T10:00:00Z',
          completedSets: 4,
          completedReps: 6,
          settings: { weight: '140' },
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockSummaries));

      const suggestedWeight = await getLastSessionSuggestedWeight('squat-exercise');

      expect(suggestedWeight).toBe('140');
    });

    it('should correctly extract sets and reps from last session', async () => {
      const mockSummaries = [
        {
          workoutId: 'bench-press',
          date: '2026-01-02T10:00:00Z',
          completedSets: 5,
          completedReps: 8,
          settings: { weight: '100' },
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockSummaries));

      const suggestedMetrics = await getLastSessionSuggestedMetrics('bench-press');

      expect(suggestedMetrics).toBeDefined();
      expect(suggestedMetrics?.sets).toBe(5);
      expect(suggestedMetrics?.reps).toBe(8);
    });
  });

  // Test 3: No history
  describe('Test 3 — No history', () => {
    it('should return null when no history exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const lastSession = await getLastSessionForWorkout('new-workout');

      expect(lastSession).toBeNull();
    });

    it('should return null for suggested weight when no history exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const suggestedWeight = await getLastSessionSuggestedWeight('new-workout');

      expect(suggestedWeight).toBeNull();
    });

    it('should return empty suggestion object when no history exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const suggestions = await getSuggestedWorkoutSettings('new-workout');

      expect(suggestions).toEqual({});
    });

    it('should not crash and maintain mevcut settings behavior with no suggestions', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      // This should complete without error
      const suggestions = await getSuggestedWorkoutSettings('any-workout');

      expect(suggestions).toBeDefined();
      expect(Object.keys(suggestions).length).toBe(0);
    });
  });

  // Test 4: Multiple sessions
  describe('Test 4 — Multiple sessions', () => {
    it('should use the most recent session when multiple sessions exist', async () => {
      const mockSummaries = [
        {
          workoutId: 'deadlift',
          date: '2025-12-30T10:00:00Z',
          completedSets: 3,
          completedReps: 5,
          settings: { weight: '150' },
        },
        {
          workoutId: 'deadlift',
          date: '2026-01-05T10:00:00Z',
          completedSets: 4,
          completedReps: 5,
          settings: { weight: '160' },
        },
        {
          workoutId: 'deadlift',
          date: '2026-01-10T10:00:00Z',
          completedSets: 4,
          completedReps: 5,
          settings: { weight: '165' },
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockSummaries));

      const suggestedWeight = await getLastSessionSuggestedWeight('deadlift');

      // Should suggest the most recent (165), not the oldest
      expect(suggestedWeight).toBe('165');
    });

    it('should ignore other workout IDs in the list', async () => {
      const mockSummaries = [
        {
          workoutId: 'workout-other',
          date: '2026-01-05T10:00:00Z',
          completedSets: 10,
          completedReps: 20,
          settings: { weight: '999' },
        },
        {
          workoutId: 'workout-target',
          date: '2026-01-01T10:00:00Z',
          completedSets: 3,
          completedReps: 8,
          settings: { weight: '50' },
        },
        {
          workoutId: 'workout-target',
          date: '2026-01-10T10:00:00Z',
          completedSets: 4,
          completedReps: 8,
          settings: { weight: '60' },
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockSummaries));

      const suggestedWeight = await getLastSessionSuggestedWeight('workout-target');

      expect(suggestedWeight).toBe('60');
      expect(suggestedWeight).not.toBe('999');
    });
  });

  // Test 5: Saved settings preserved
  describe('Test 5 — Saved settings preserved', () => {
    it('should not modify AsyncStorage when getting suggestions', async () => {
      const mockSummaries = [
        {
          workoutId: 'test-workout',
          date: '2026-01-10T10:00:00Z',
          completedSets: 3,
          completedReps: 10,
          settings: { weight: '80' },
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockSummaries));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await getSuggestedWorkoutSettings('test-workout');

      // Verify that setItem was never called (suggestion is read-only)
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  // Test 6: Apply suggestion
  describe('Test 6 — Apply suggestion', () => {
    it('should return complete suggestion object with weight, sets, and reps', async () => {
      const mockSummaries = [
        {
          workoutId: 'complex-workout',
          date: '2026-01-10T10:00:00Z',
          completedSets: 5,
          completedReps: 8,
          elapsedTime: 600,
          settings: { weight: '120' },
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockSummaries));

      const suggestions = await getSuggestedWorkoutSettings('complex-workout');

      expect(suggestions.weight).toBe('120');
      expect(suggestions.sets).toBe('5');
      expect(suggestions.reps).toBe('8');
    });

    it('should handle partial suggestions (only weight available)', async () => {
      const mockSummaries = [
        {
          workoutId: 'partial-workout',
          date: '2026-01-10T10:00:00Z',
          // No completedSets or completedReps
          settings: { weight: '95' },
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockSummaries));

      const suggestions = await getSuggestedWorkoutSettings('partial-workout');

      expect(suggestions.weight).toBe('95');
      expect(suggestions.sets).toBeUndefined();
      expect(suggestions.reps).toBeUndefined();
    });
  });

  // Test 7: Historical immutability
  describe('Test 7 — Historical immutability', () => {
    it('should not modify workoutSummaries when producing suggestion', async () => {
      const originalSummaries = [
        {
          workoutId: 'immutable-test',
          date: '2026-01-10T10:00:00Z',
          completedSets: 3,
          completedReps: 10,
          settings: { weight: '75' },
        },
      ];

      const mockSummariesStr = JSON.stringify(originalSummaries);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockSummariesStr);

      // Get suggestions multiple times
      await getSuggestedWorkoutSettings('immutable-test');
      await getSuggestedWorkoutSettings('immutable-test');
      await getLastSessionForWorkout('immutable-test');

      // If immutability is violated, getItem would be called but setItem would also be called
      expect(AsyncStorage.setItem).not.toHaveBeenCalledWith(
        'workoutSummaries',
        expect.anything()
      );

      // Verify we only read, never wrote
      const setItemCalls = (AsyncStorage.setItem as jest.Mock).mock.calls;
      const hasSummaryWrite = setItemCalls.some((call: any[]) => call[0] === 'workoutSummaries');
      expect(hasSummaryWrite).toBe(false);
    });
  });

  // Additional Test 8: Empty/malformed data handling
  describe('Test 8 — Error handling', () => {
    it('should handle empty workoutSummaries array', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('[]');

      const lastSession = await getLastSessionForWorkout('any-workout');

      expect(lastSession).toBeNull();
    });

    it('should handle corrupted JSON gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid json {]');

      const suggestions = await getSuggestedWorkoutSettings('error-workout');

      // Should return empty object, not throw
      expect(suggestions).toEqual({});
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const suggestions = await getSuggestedWorkoutSettings('error-prone-workout');

      // Should return empty object, not throw
      expect(suggestions).toEqual({});
    });
  });

  // Additional Test 9: Precedence integration (Phase 37 contract)
  describe('Test 9 — Phase 37 precedence (explicit > suggestion > saved > parsed)', () => {
    it('should return only the suggestion (not apply precedence itself)', async () => {
      const mockSummaries = [
        {
          workoutId: 'precedence-test',
          date: '2026-01-10T10:00:00Z',
          completedSets: 3,
          completedReps: 8,
          settings: { weight: '70' },
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockSummaries));

      const suggestions = await getSuggestedWorkoutSettings('precedence-test');

      // Suggestion resolver should only provide the suggestion
      // Precedence resolution happens in resolveWorkoutStartSettings (TimerContext)
      expect(suggestions).toEqual({
        weight: '70',
        sets: '3',
        reps: '8',
      });
    });
  });
});
