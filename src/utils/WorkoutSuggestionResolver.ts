/**
 * Phase 46: Workout Suggestion Resolver
 *
 * Centralizes logic for suggesting workout settings based on historical completion data.
 * Does not modify saved settings, historical data, or any persisted state.
 * Purely read-only suggestion generation.
 */

import { getLastSessionSuggestedWeight, getLastSessionSuggestedMetrics } from './SessionSnapshotReader';

export interface SuggestedWorkoutSettings {
  weight?: string;
  sets?: string;
  reps?: string;
}

/**
 * Get suggested workout settings based on last completed session.
 *
 * Returns an object with suggested weight, sets, and reps.
 * If no history is found, returns an empty object (no suggestions).
 *
 * This respects Phase 37 precedence:
 * explicit override > suggestion > saved settings > parsed fallback
 *
 * Usage:
 * const suggestion = await getSuggestedWorkoutSettings(workoutId);
 * if (suggestion.weight) {
 *   // Show suggestion to user
 * }
 *
 * @param workoutId - The workout ID to get suggestions for
 * @returns Promise<SuggestedWorkoutSettings> with keys only if suggestions found
 */
export async function getSuggestedWorkoutSettings(workoutId: string): Promise<SuggestedWorkoutSettings> {
  try {
    const [weight, metrics] = await Promise.all([
      getLastSessionSuggestedWeight(workoutId),
      getLastSessionSuggestedMetrics(workoutId),
    ]);

    const result: SuggestedWorkoutSettings = {};

    if (weight) {
      result.weight = weight;
    }

    if (metrics) {
      if (metrics.sets !== null) {
        result.sets = String(metrics.sets);
      }
      if (metrics.reps !== null) {
        result.reps = String(metrics.reps);
      }
    }

    return result;
  } catch (error) {
    console.error('❌ Error getting suggested workout settings for', workoutId, ':', error);
    return {};
  }
}
