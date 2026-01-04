// Utility to auto-generate workouts from gif files

/**
 * Converts a gif filename to a display name
 * Examples:
 * - "leg-press.gif" → "Leg Press"
 * - "Tbar-row.gif" → "Tbar Row"
 * - "assisted-tricep-dip.gif" → "Assisted Tricep Dip"
 */
export function gifFileNameToDisplayName(fileName: string): string {
    // Remove .gif extension
    const nameWithoutExt = fileName.replace('.gif', '');

    if (nameWithoutExt.toLowerCase() === 'biking') {
        return 'Outdoor Cycle';
    }

    // Split by dash or space
    const words = nameWithoutExt.split(/[-\s]+/);

    // Capitalize each word
    const capitalized = words.map(word => {
        // Special cases for abbreviations
        if (word.toLowerCase() === 'tbar') return 'T-Bar';

        // Capitalize first letter, keep rest as-is for mixed case (e.g., "Tbar")
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });

    return capitalized.join(' ');
}

/**
 * Converts display name to snake_case workout ID
 * "Leg Press" → "leg_press"
 */
export function displayNameToWorkoutId(displayName: string): string {
    return displayName.toLowerCase().replace(/[\s-]+/g, '_');
}

/**
 * List of all gif files in animations folder (excluding non-workout gifs)
 */
export const WORKOUT_GIF_FILES = [
    'Tbar-row.gif',
    'assisted-tricep-dip.gif',
    'bicep-dumbbell.gif',
    'biking.gif',
    'bench-press.gif',
    'chest-rope.gif',
    'cross-trainer.gif',
    'decline-barbell.gif',
    'dumbbell-concentration.gif',
    'dumbbell-lateral-raise.gif',
    'dumbbell-lunge-bicep-curl.gif',
    'flat-barbell-bench-press.gif',
    'hip-raise-dumbbell.gif',
    'incline-dumbbell-bench-press.gif',
    'jump-rope-new.gif',
    'lat pulldown .gif',
    'leg-press.gif',
    'one-arm-dumbbell-row.gif',
    'pull-up.gif',
    'rear-delt-fly.gif',
    'seated-cable-row.gif',
    'seated-hip-adduction.gif',
    'swinging-the-rope.gif',
    'outdoor-walk.gif',
    'outdoor-run.gif',
];

/**
 * Get the require path for a gif file
 */
export function getGifRequirePath(fileName: string): any {
    const paths: { [key: string]: any } = {
        'Tbar-row.gif': require('../assets/animations/Tbar-row.gif'),
        'assisted-tricep-dip.gif': require('../assets/animations/assisted-tricep-dip.gif'),
        'bicep-dumbbell.gif': require('../assets/animations/bicep-dumbbell.gif'),
        'biking.gif': require('../assets/animations/biking.gif'),
        'bench-press.gif': require('../assets/animations/bench-press.gif'),
        'chest-rope.gif': require('../assets/animations/chest-rope.gif'),
        'cross-trainer.gif': require('../assets/animations/cross-trainer.gif'),
        'decline-barbell.gif': require('../assets/animations/decline-barbell.gif'),
        'dumbbell-concentration.gif': require('../assets/animations/dumbbell-concentration.gif'),
        'dumbbell-lateral-raise.gif': require('../assets/animations/dumbbell-lateral-raise.gif'),
        'dumbbell-lunge-bicep-curl.gif': require('../assets/animations/dumbbell-lunge-bicep-curl.gif'),
        'flat-barbell-bench-press.gif': require('../assets/animations/flat-barbell-bench-press.gif'),
        'hip-raise-dumbbell.gif': require('../assets/animations/hip-raise-dumbbell.gif'),
        'incline-dumbbell-bench-press.gif': require('../assets/animations/incline-dumbbell-bench-press.gif'),
        'jump-rope-new.gif': require('../assets/animations/jump-rope-new.gif'),
        'lat pulldown .gif': require('../assets/animations/lat pulldown .gif'),
        'leg-press.gif': require('../assets/animations/leg-press.gif'),
        'one-arm-dumbbell-row.gif': require('../assets/animations/one-arm-dumbbell-row.gif'),
        'pull-up.gif': require('../assets/animations/pull-up.gif'),
        'rear-delt-fly.gif': require('../assets/animations/rear-delt-fly.gif'),
        'seated-cable-row.gif': require('../assets/animations/seated-cable-row.gif'),
        'seated-hip-adduction.gif': require('../assets/animations/seated-hip-adduction.gif'),
        'swinging-the-rope.gif': require('../assets/animations/swinging-the-rope.gif'),
        'outdoor-walk.gif': require('../assets/animations/walker.gif'),
        'outdoor-run.gif': require('../assets/animations/run_forrest.gif'),
    };

    return paths[fileName];
}
