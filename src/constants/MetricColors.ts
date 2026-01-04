/**
 * Centralized metric color constants
 * Based on card icon colors from GenericWorkoutSettingsScreen
 */

export const MetricColors = {
    // Primary metrics from workout cards
    time: '#FEE522',      // Yellow - Duration/Time
    sets: '#F9104E',      // Red/Pink - Sets/Reps/Lap
    speed: '#00B7FE',     // Blue - Speed
    weight: '#FF9500',    // Orange - Weight
    energy: '#FF9500',    // Orange - KCAL/Energy
    volume: '#FA4D62',    // Pink - Volume (calculated metric)

    // Aliases for clarity
    duration: '#FEE522',  // Same as time
    reps: '#F9104E',      // Same as sets
    kcal: '#FF9500',      // Same as energy
    strength: '#FA4D62',  // Same as volume
} as const;

export type MetricColorKey = keyof typeof MetricColors;

export default MetricColors;
