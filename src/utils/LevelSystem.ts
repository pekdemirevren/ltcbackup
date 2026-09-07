// Level System Utilities for Collectible Workouts
import AsyncStorage from '@react-native-async-storage/async-storage';

const LEVEL_KEY_PREFIX = 'collectible_level_';
const XP_KEY_PREFIX = 'collectible_xp_';

// XP needed per level (Level N requires N sessions to reach Level N+1)
export const getXPForLevel = (level: number): number => {
    // If level is 5, it takes 5 sessions to reach level 6
    // We cap at a minimum of 1 for level 0/sub-1 cases
    return Math.max(1, level);
};

// XP gained per workout completion (1 workout = 1 session)
export const getXPPerWorkout = (workoutDuration: number): number => {
    return 1;
};

// Get current level for a workout
export const getWorkoutLevel = async (workoutId: string, baseLevel: number): Promise<number> => {
    try {
        const savedLevelStr = await AsyncStorage.getItem(`${LEVEL_KEY_PREFIX}${workoutId}`);
        const savedLevel = savedLevelStr ? parseInt(savedLevelStr, 10) : baseLevel;
        return savedLevel;
    } catch (e) {
        console.error('Failed to get workout level:', e);
        return baseLevel;
    }
};

// Get current XP for a workout
export const getWorkoutXP = async (workoutId: string): Promise<number> => {
    try {
        const savedXP = await AsyncStorage.getItem(`${XP_KEY_PREFIX}${workoutId}`);
        return savedXP ? parseInt(savedXP, 10) : 0;
    } catch (e) {
        console.error('Failed to get workout XP:', e);
        return 0;
    }
};

// Add XP to a workout and level up if needed
export const addWorkoutXP = async (
    workoutId: string,
    baseLevel: number,
    workoutDuration: number,
    areAllExercisesCompleted: boolean = false
): Promise<{ newLevel: number; newXP: number; leveledUp: boolean; xpGained: number; levelUpGated: boolean }> => {
    try {
        const currentLevel = await getWorkoutLevel(workoutId, baseLevel);
        const currentXP = await getWorkoutXP(workoutId);
        const xpGained = getXPPerWorkout(workoutDuration);

        let newXP = currentXP + xpGained;
        let newLevel = currentLevel;
        let leveledUp = false;
        let levelUpGated = false;

        // Level up while XP exceeds requirement (max level 99)
        // GATED: Only level up if all exercises are completed
        while (newLevel < 99 && newXP >= getXPForLevel(newLevel)) {
            if (areAllExercisesCompleted) {
                newXP -= getXPForLevel(newLevel);
                newLevel++;
                leveledUp = true;
            } else {
                levelUpGated = true;
                break; // Stop leveling up but keep XP
            }
        }

        // Cap at level 99
        if (newLevel >= 99) {
            newLevel = 99;
            newXP = 0;
        }

        // Save new values
        await AsyncStorage.setItem(`${LEVEL_KEY_PREFIX}${workoutId}`, newLevel.toString());
        await AsyncStorage.setItem(`${XP_KEY_PREFIX}${workoutId}`, newXP.toString());

        return { newLevel, newXP, leveledUp, xpGained, levelUpGated };
    } catch (e) {
        console.error('Failed to add workout XP:', e);
        return { newLevel: baseLevel, newXP: 0, leveledUp: false, xpGained: 0, levelUpGated: false };
    }
};


// Reset a workout's level (for testing)
export const resetWorkoutLevel = async (workoutId: string): Promise<void> => {
    try {
        await AsyncStorage.removeItem(`${LEVEL_KEY_PREFIX}${workoutId}`);
        await AsyncStorage.removeItem(`${XP_KEY_PREFIX}${workoutId}`);
    } catch (e) {
        console.error('Failed to reset workout level:', e);
    }
};

// Get all workout levels
export const getAllWorkoutLevels = async (): Promise<Record<string, number>> => {
    try {
        const keys = await AsyncStorage.getAllKeys();
        const levelKeys = keys.filter(k => k.startsWith(LEVEL_KEY_PREFIX));
        const pairs = await AsyncStorage.multiGet(levelKeys);

        const levels: Record<string, number> = {};
        pairs.forEach(([key, value]) => {
            const workoutId = key.replace(LEVEL_KEY_PREFIX, '');
            levels[workoutId] = value ? parseInt(value, 10) : 0;
        });

        return levels;
    } catch (e) {
        console.error('Failed to get all workout levels:', e);
        return {};
    }
};

// Get all workout XP
export const getAllWorkoutXP = async (): Promise<Record<string, number>> => {
    try {
        const keys = await AsyncStorage.getAllKeys();
        const xpKeys = keys.filter(k => k.startsWith(XP_KEY_PREFIX));
        const pairs = await AsyncStorage.multiGet(xpKeys);

        const xps: Record<string, number> = {};
        pairs.forEach(([key, value]) => {
            const workoutId = key.replace(XP_KEY_PREFIX, '');
            xps[workoutId] = value ? parseInt(value, 10) : 0;
        });

        return xps;
    } catch (e) {
        console.error('Failed to get all workout XP:', e);
        return {};
    }
};
