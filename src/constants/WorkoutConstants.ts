// Updated WorkoutConstants with auto-generated workout mappings
import { allWorkouts, WORKOUT_IDS } from './workoutData';

/**
 * Get the settings screen name for a workout
 * Now uses a generic settings screen for all workouts
 */
export const getSettingsScreenName = (workoutName: string): string => {
  // All workouts now use the generic settings screen
  return 'GenericWorkoutSettingsScreen';
};

// Export WORKOUT_IDS from workoutData for backward compatibility
export { WORKOUT_IDS };

/**
 * Get workout by ID
 */
export function getWorkoutById(workoutId: string) {
  const found = allWorkouts.find(w => w.workoutId === workoutId);
  if (found) return found;

  // If not found, check if it's a combined ID (e.g., cardId_workoutId)
  if (workoutId && workoutId.includes('_')) {
    const parts = workoutId.split('_');
    const baseId = parts[parts.length - 1]; // Take the last part (the exercise ID)
    return allWorkouts.find(w => w.workoutId === baseId);
  }

  return undefined;
}


/**
 * Get workout by name
 */
export function getWorkoutByName(name: string) {
  return allWorkouts.find(w => w.name === name);
}

/**
 * Storage keys and defaults for Summary Cards
 */
export const SUMMARY_CARD_STORAGE_KEY = 'visible_summary_cards';

export const DEFAULT_VISIBLE_CARDS = [
  'DailyWorkout',
  'ActivityRing',
  'StrengthLevel',
  'SetCount',
  'Trends',
  'Sessions_List',
  'WorkoutShortcuts'
];