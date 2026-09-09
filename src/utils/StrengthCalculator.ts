import { DEFAULT_BODY_WEIGHT_KG } from '../constants/bodyWeight';

export { DEFAULT_BODY_WEIGHT_KG } from '../constants/bodyWeight';

/**
 * Strength Intensity and 1RM (One Rep Max) Calculation Utility
 * Uses the Epley formula for 1RM prediction.
 */

// Default body weight is centralized in src/constants/bodyWeight.ts.

/**
 * Calculates the predicted One Rep Max (1RM) using the Epley formula.
 * Formula: 1RM = Weight * (1 + Reps / 30)
 * 
 * @param weight - The weight lifted in kg
 * @param reps - The number of repetitions performed
 * @returns The estimated 1RM in kg
 */
export const calculate1RM = (weight: number, reps: number): number => {
    if (weight <= 0 || reps <= 0) return 0;
    // Epley formula: weight * (1 + reps/30)
    // Higher accuracy for 1-10 reps
    return weight * (1 + reps / 30);
};

/**
 * Calculates the Strength Ratio (1RM divided by Body Weight).
 * 
 * @param oneRM - The estimated 1RM in kg
 * @param bodyWeight - The user's body weight in kg (defaults to 75)
 * @returns The ratio multiplier (e.g., 1.5)
 */
export const calculateStrengthRatio = (oneRM: number, bodyWeight: number = DEFAULT_BODY_WEIGHT_KG): number => {
    if (bodyWeight <= 0) return 0;
    return oneRM / bodyWeight;
};

/**
 * Categorizes the strength level based on the Strength Ratio for specific compound movements.
 * Ref: Bench Press standard (Beginner: 0.75x, Intermediate: 1.0x, Advanced: 1.5x, Elite: 2.0x)
 * 
 * @param ratio - The Strength Ratio (1RM / BW)
 * @returns The strength level category
 */
export const getStrengthLevelLabel = (ratio: number): string => {
    if (ratio < 0.75) return 'Beginner';
    if (ratio < 1.0) return 'Novice';
    if (ratio < 1.25) return 'Intermediate';
    if (ratio < 1.5) return 'Proficient';
    if (ratio < 2.0) return 'Advanced';
    return 'Elite';
};

/**
 * Formats the Strength Ratio for display.
 * 
 * @param ratio - The calculated ratio
 * @returns String representation (e.g., '1.46x')
 */
export const formatStrengthRatio = (ratio: number): string => {
    return `${ratio.toFixed(2)}x`;
};

// ============================================
// RPE/RIR (Rate of Perceived Exertion / Reps in Reserve) Functions
// ============================================

/**
 * Converts RPE (Rate of Perceived Exertion) to RIR (Reps In Reserve).
 * RPE 10 = 0 RIR (no reps left)
 * RPE 9 = 1 RIR (could do 1 more rep)
 * etc.
 * 
 * @param rpe - RPE score (typically 6-10)
 * @returns RIR (reps in reserve)
 */
export const calculateRIR = (rpe: number): number => {
    return Math.max(0, 10 - rpe);
};

/**
 * Adjusts 1RM calculation based on RPE.
 * If RPE is less than 10, the lifter had reps in reserve,
 * meaning the actual 1RM is higher than a raw calculation would suggest.
 * 
 * Formula: Adjusted1RM = calculate1RM(weight, reps + RIR)
 * 
 * @param weight - The weight lifted in kg
 * @param reps - The number of repetitions performed
 * @param rpe - The RPE score (typically 6-10)
 * @returns The RPE-adjusted estimated 1RM in kg
 */
export const calculateAdjusted1RM = (weight: number, reps: number, rpe: number): number => {
    const rir = calculateRIR(rpe);
    const totalReps = reps + rir; // Effective reps if pushed to RPE 10
    return calculate1RM(weight, totalReps);
};

/**
 * Gets a human-readable label for an RPE score.
 * 
 * @param rpe - RPE score (typically 6-10)
 * @returns Description of the effort level
 */
export const getRPELabel = (rpe: number): string => {
    if (rpe <= 5) return 'Very Easy';
    if (rpe === 6) return 'Light';
    if (rpe === 7) return 'Moderate';
    if (rpe === 8) return 'Hard';
    if (rpe === 9) return 'Very Hard';
    return 'Max Effort'; // RPE 10
};

/**
 * Calculates Volume (Total Workload).
 * Volume = Sets × Reps × Weight
 * 
 * @param sets - Number of sets
 * @param reps - Number of reps per set
 * @param weight - Weight per rep in kg
 * @returns Total volume in kg
 */
export const calculateVolume = (sets: number, reps: number, weight: number): number => {
    if (sets <= 0 || reps <= 0 || weight <= 0) return 0;
    return sets * reps * weight;
};

// ============================================
// Daily Strength Index (DSI) and Weekly Strength Index (WSI) Functions
// ============================================

/**
 * Lift data for DSI calculation
 */
export interface LiftData {
    weight: number;  // Weight lifted in kg
    reps: number;    // Reps performed
}

/**
 * Calculates the Daily Strength Index (DSI).
 * DSI = Average of (1RM / Body Weight) for all compound lifts performed that day.
 * 
 * Formula per lift: 1RM = weight * (1 + reps/30) [Epley]
 * DSI = Σ(1RM / BW) / n
 * 
 * @param lifts - Array of lift data (weight, reps) for compound movements
 * @param bodyWeight - User's body weight in kg
 * @returns The Daily Strength Index (normalized relative strength score)
 */
export const calculateDSI = (lifts: LiftData[], bodyWeight: number = DEFAULT_BODY_WEIGHT_KG): number => {
    if (!lifts || lifts.length === 0 || bodyWeight <= 0) return 0;

    let totalRatio = 0;
    let validLifts = 0;

    for (const lift of lifts) {
        if (lift.weight > 0 && lift.reps > 0) {
            const oneRM = calculate1RM(lift.weight, lift.reps);
            const ratio = oneRM / bodyWeight;
            totalRatio += ratio;
            validLifts++;
        }
    }

    return validLifts > 0 ? totalRatio / validLifts : 0;
};

/**
 * Calculates the Weekly Strength Index (WSI).
 * WSI is the 7-day moving average of Daily Strength Index values.
 * This smooths out daily fluctuations from fatigue, sleep, stress, etc.
 * 
 * @param dsiValues - Array of DSI values (up to 7 days)
 * @returns The Weekly Strength Index (7-day moving average)
 */
export const calculateWSI = (dsiValues: number[]): number => {
    if (!dsiValues || dsiValues.length === 0) return 0;

    // Take only the last 7 days
    const last7Days = dsiValues.slice(-7);
    const validValues = last7Days.filter(v => v > 0);

    if (validValues.length === 0) return 0;

    const sum = validValues.reduce((acc, val) => acc + val, 0);
    return sum / validValues.length;
};

/**
 * Gets a strength level label based on DSI/WSI value.
 * Reference (for compound lifts, natural trainees):
 * - < 1.3: Beginner
 * - 1.3-1.6: Intermediate
 * - 1.6-1.9: Good
 * - 1.9-2.2: Advanced
 * - 2.2+: Elite
 * 
 * @param dsi - Daily or Weekly Strength Index value
 * @returns Human-readable strength level
 */
export const getDSILevelLabel = (dsi: number): string => {
    if (dsi < 1.3) return 'Beginner';
    if (dsi < 1.6) return 'Intermediate';
    if (dsi < 1.9) return 'Good';
    if (dsi < 2.2) return 'Advanced';
    return 'Elite';
};

/**
 * Gets a color for the DSI level indicator.
 * 
 * @param dsi - Daily or Weekly Strength Index value
 * @returns Hex color code for the level
 */
export const getDSILevelColor = (dsi: number): string => {
    if (dsi < 1.3) return '#FF6B6B';  // Red - Beginner
    if (dsi < 1.6) return '#FFB347';  // Orange - Intermediate
    if (dsi < 1.9) return '#00C7BE';  // Cyan - Good
    if (dsi < 2.2) return '#9DEC2C';  // Green - Advanced
    return '#FFD700';                  // Gold - Elite
};
