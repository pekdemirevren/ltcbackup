import { displayNameToWorkoutId } from './workoutGenerator';
import { DEFAULT_BODY_WEIGHT_KG } from '../constants/bodyWeight';

export interface CalculateCaloriesOptions {
    workoutId: string;
    durationSeconds: number;
    bodyWeightKg?: number;
    liftedWeightKg?: number;
    reps?: number;
}

// Standard MET values for various activities
// Source: Compendium of Physical Activities
const MET_VALUES: { [key: string]: number } = {
    // Cardio / Aerobic
    'outdoor_run': 9.8,
    'outdoor_walk': 3.8,
    'outdoor_cycle': 7.5,
    'cross_trainer': 7.0,
    'jump_rope': 11.0,
    'swinging_the_rope': 10.0,
    'biking': 7.5,

    // Strength / Resistance (General estimates)
    'bench_press': 6.0,
    'incline_dumbbell_bench_press': 6.0,
    'flat_barbell_bench_press': 6.0,
    'decline_barbell': 6.0,
    'leg_press': 6.0,
    'lat_pulldown': 5.0,
    'seated_cable_row': 5.0,
    't_bar_row': 6.0,
    'one_arm_dumbbell_row': 5.0,
    'bicep_dumbbell': 4.0,
    'dumbbell_concentration': 4.0,
    'dumbbell_lunge_bicep_curl': 6.5,
    'dumbbell_lateral_raise': 4.0,
    'rear_delt_fly': 4.0,
    'assisted_tricep_dip': 5.0,
    'chest_rope': 5.0,
    'hip_raise_dumbbell': 5.0,
    'seated_hip_adduction': 4.0,
    'pull_up': 8.0,
    
    // Default fallback
    'default': 4.5
};

/**
 * Calculates the estimated calories burned for a specific workout.
 *
 * Preferred contract:
 * calculateCalories({
 *   workoutId,
 *   durationSeconds,
 *   bodyWeightKg,
 *   liftedWeightKg,
 *   reps,
 * })
 *
 * Legacy positional calls remain supported during migration to avoid breaking older callers.
 */
export function calculateCalories(options: CalculateCaloriesOptions): number {
    const workoutId = options.workoutId;
    const resolvedDurationSeconds = options.durationSeconds;
    const bodyWeightKg = options.bodyWeightKg;
    const resolvedLiftedWeightKg = options.liftedWeightKg ?? 0;
    const resolvedReps = options.reps ?? 0;

    const effectiveBodyWeightKg = Number.isFinite(bodyWeightKg as number) ? Number(bodyWeightKg) : DEFAULT_BODY_WEIGHT_KG;
    const normalizedId = String(workoutId).toLowerCase().replace(/-/g, '_');
    const met = MET_VALUES[normalizedId] || MET_VALUES['default'];
    const durationHours = resolvedDurationSeconds / 3600;

    const isCardio = [
        'outdoor_run', 'outdoor_walk', 'outdoor_cycle', 'biking', 
        'cross_trainer', 'jump_rope', 'swinging_the_rope'
    ].includes(normalizedId);

    let calories = 0;

    if (isCardio) {
        calories = met * effectiveBodyWeightKg * durationHours;
    } else {
        const baseCalories = met * effectiveBodyWeightKg * durationHours;
        let intensityMultiplier = 1;
        if (resolvedLiftedWeightKg > 0) {
            intensityMultiplier = 1 + (resolvedLiftedWeightKg / 200);
        }

        calories = baseCalories * intensityMultiplier;
    }

    return Math.round(calories);
}

/**
 * Helper to get a description of the calorie burn intensity
 */
export const getCalorieIntensityLevel = (workoutId: string): 'Low' | 'Medium' | 'High' | 'Very High' => {
    const normalizedId = workoutId.toLowerCase().replace(/-/g, '_');
    const met = MET_VALUES[normalizedId] || MET_VALUES['default'];

    if (met < 4.0) return 'Low';
    if (met < 7.0) return 'Medium';
    if (met < 10.0) return 'High';
    return 'Very High';
};
