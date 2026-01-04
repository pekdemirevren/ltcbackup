import { displayNameToWorkoutId } from './workoutGenerator';

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

// Average body weight in kg (used if user weight is not applicable or for base calculations)
const DEFAULT_BODY_WEIGHT_KG = 75;

/**
 * Calculates the estimated calories burned for a specific workout.
 * 
 * @param workoutId - The unique identifier for the workout (e.g., 'bench_press')
 * @param durationSeconds - The duration of the workout in seconds
 * @param liftedWeightKg - (Optional) The weight used in the exercise (resistance)
 * @param reps - (Optional) The total number of repetitions performed
 * @returns The estimated number of calories burned (kcal)
 */
export const calculateCalories = (
    workoutId: string, 
    durationSeconds: number, 
    liftedWeightKg: number = 0, 
    reps: number = 0
): number => {
    // Normalize workoutId
    const normalizedId = workoutId.toLowerCase().replace(/-/g, '_');
    
    // Get Base MET
    let met = MET_VALUES[normalizedId] || MET_VALUES['default'];

    // Duration in hours
    const durationHours = durationSeconds / 3600;

    // Logic Split: Cardio vs Strength
    const isCardio = [
        'outdoor_run', 'outdoor_walk', 'outdoor_cycle', 'biking', 
        'cross_trainer', 'jump_rope', 'swinging_the_rope'
    ].includes(normalizedId);

    let calories = 0;

    if (isCardio) {
        // Cardio Formula: Calories = MET * BodyWeight * Duration(hours)
        // We assume standard body weight since we don't track user body weight in settings usually
        calories = met * DEFAULT_BODY_WEIGHT_KG * durationHours;
    } else {
        // Strength Formula: Adjusted for intensity (Lifted Weight)
        // Base Calorie Burn (Metabolic cost of moving body + baseline)
        const baseCalories = met * DEFAULT_BODY_WEIGHT_KG * durationHours;

        // Intensity Factor:
        // If liftedWeight is provided, we increase the burn.
        // Heuristic: Lifting 50kg adds ~20% intensity to the base MET for that duration
        let intensityMultiplier = 1;
        if (liftedWeightKg > 0) {
            intensityMultiplier = 1 + (liftedWeightKg / 200); // e.g. 100kg adds 50%
        }

        // Reps Factor:
        // If reps are high, it implies more continuous movement (less rest), maintaining the MET
        // If reps are low but time is high, it implies lots of rest.
        // We can use reps to validate the "active" nature of the duration.
        // For now, we'll stick to the intensity multiplier on the base duration.
        
        calories = baseCalories * intensityMultiplier;
    }

    return Math.round(calories);
};

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
