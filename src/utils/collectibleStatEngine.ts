import { Position, PrimaryStats, Rarity, PrimaryStatKey, CollectibleExercise } from '../constants/collectibleWorkouts';

export type ExtendedRarity = Rarity | 'GOD' | 'GODDESS' | 'DIVINE';

export const LEVEL_TIERS = {
    BRONZE: { min: 0, max: 19, cap: 70 },
    SILVER: { min: 20, max: 39, cap: 80 },
    GOLD: { min: 40, max: 59, cap: 88 },
    TITAN: { min: 60, max: 79, cap: 94 },
    GOD_GODDESS: { min: 80, max: 99, cap: 99 },
};

export const POSITION_WEIGHTS: Record<Position, Record<PrimaryStatKey, number>> = {
    PULL: { STR: 1.05, VOL: 1.05, END: 1.00, TMP: 0.95, PHY: 0.95, HYP: 1.00 },
    PUSH: { STR: 1.05, TMP: 1.05, HYP: 1.05, VOL: 1.00, END: 0.95, PHY: 0.95 },
    LEGS: { STR: 1.05, VOL: 1.05, PHY: 1.05, END: 1.00, TMP: 0.95, HYP: 0.95 },
};

export const EXERCISE_COUNT_BY_TIER: Record<string, number> = {
    BRONZE: 3,
    SILVER: 4,
    GOLD: 5,
    TITAN: 5,
    GOD_GODDESS: 6,
};

/**
 * Determine the tier based on level
 */
export const getTierFromLevel = (level: number, gender: 'male' | 'female' | 'unknown' = 'unknown'): ExtendedRarity => {
    if (level >= 80) {
        if (gender === 'female') return 'GODDESS';
        if (gender === 'male') return 'GOD';
        return 'DIVINE';
    }
    if (level >= 60) return 'TITAN';
    if (level >= 40) return 'GOLD';
    if (level >= 20) return 'SILVER';
    return 'BRONZE';
};

/**
 * Base rarity for internal logic (mapping back to standard Rarity type if needed)
 */
export const getBaseRarity = (level: number): Rarity => {
    if (level >= 80) return 'ICON'; // GOD/GODDESS maps to ICON/LEGEND visual style
    if (level >= 60) return 'TITAN';
    if (level >= 40) return 'GOLD';
    if (level >= 20) return 'SILVER';
    return 'BRONZE';
};

/**
 * Advanced stat growth with headroom saturation curve
 * Formula: boosted = baseStat + (Cap - baseStat) * (1 - exp(-2.2 * (LV/99))) * weight
 */
export const getStatsWithBoostV2 = (
    baseStats: PrimaryStats,
    level: number,
    position: Position
): PrimaryStats => {
    const t = Math.min(1, level / 99);
    const curve = 1 - Math.exp(-2.2 * t);

    // Determine target cap based on current level range
    let currentCap = 99;
    if (level < 20) currentCap = 70;
    else if (level < 40) currentCap = 80;
    else if (level < 60) currentCap = 88;
    else if (level < 80) currentCap = 94;

    const weights = POSITION_WEIGHTS[position];

    const boostStat = (base: number, statKey: PrimaryStatKey) => {
        const weight = weights[statKey];
        const headroom = Math.max(0, currentCap - base);
        const boosted = base + (headroom * curve * weight);
        return Math.min(99, Math.round(boosted));
    };

    return {
        STR: boostStat(baseStats.STR, 'STR'),
        VOL: boostStat(baseStats.VOL, 'VOL'),
        TMP: boostStat(baseStats.TMP, 'TMP'),
        END: boostStat(baseStats.END, 'END'),
        PHY: boostStat(baseStats.PHY, 'PHY'),
        HYP: boostStat(baseStats.HYP, 'HYP'),
    };
};

/**
 * Calculate OVR based on boosted stats
 */
export const calculateOVRV2 = (boostedStats: PrimaryStats): number => {
    const stats = Object.values(boostedStats);
    const sum = stats.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / stats.length);
};

/**
 * Get slice of exercises based on tier/rarity
 * Accepts either a rarity string (BRONZE, SILVER, etc.) or OVR number
 */
export const getExercisesByTier = (pool: CollectibleExercise[], levelOrRarity: number | string): CollectibleExercise[] => {
    let count = 3;

    // Handle rarity string
    if (typeof levelOrRarity === 'string') {
        const rarity = levelOrRarity.toUpperCase();
        switch (rarity) {
            case 'BRONZE': count = 4; break;
            case 'SILVER':
            case 'GOLD':
            case 'TITAN': count = 6; break;
            case 'ICON':
            case 'LEGEND': count = 8; break;
            default: count = 4;
        }
    } else {
        // Handle numeric level
        if (levelOrRarity >= 80) count = 8;
        else if (levelOrRarity >= 50) count = 6;
        else if (levelOrRarity >= 15) count = 4;
    }

    return pool.slice(0, count);
};
