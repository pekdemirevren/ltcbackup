/**
 * Phase 5B — Historical Calorie Snapshot Reader Helper
 *
 * Provides consistent snapshot/fallback resolution for all calorie readers.
 */

import { calculateCalories, CalculateCaloriesOptions } from './CalorieCalculator';

/**
 * Get session calories with snapshot precedence.
 *
 * Policy:
 * - If persisted session.calories is a valid finite number, use it
 * - Otherwise, calculate using provided options
 *
 * This ensures that Phase 5A snapshots are authoritative whenever present,
 * while maintaining graceful fallback for legacy sessions.
 */
export function getSessionCalories(
  sessionCalories: any,
  calculateOptions: CalculateCaloriesOptions
): number {
  // Explicit finite-number check (not truthiness)
  // This protects against: null, undefined, 0 (valid), NaN, strings, etc.
  if (typeof sessionCalories === 'number' && Number.isFinite(sessionCalories)) {
    return sessionCalories;
  }

  // Fallback to live calculation for legacy sessions
  return calculateCalories(calculateOptions);
}
