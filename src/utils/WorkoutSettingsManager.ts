// Workout settings persistence manager
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WorkoutBlock {
    id: string;
    type: 'time' | 'loop' | 'speed' | 'lap';
    settings: any;
    title?: string;
}

export interface WorkoutSettings {
    workoutId: string;
    greenTime: string;
    restTime: string;
    greenReps: string;
    redReps: string;
    greenCountdownSpeed: number;
    redCountdownSpeed: number;
    infiniteLoopTime?: string;
    infiniteSpeed?: number;
    targetSets?: string; // Triple Tracking: Total sets to complete
    targetReps?: string; // Triple Tracking: Reps per set
    customBlocks?: WorkoutBlock[];
    hiddenCards?: string[];
    weight?: string;
}

const SETTINGS_STORAGE_PREFIX = '@workout_settings_';
export const LAST_SETTINGS_KEY = '@workout_settings_last';
export const LAST_ACTIVITY_WORKOUT_ID_KEY = '@last_activity_workout_id';

/**
 * Default settings that apply to all workouts initially
 */
export const DEFAULT_WORKOUT_SETTINGS: Omit<WorkoutSettings, 'workoutId'> = {
    greenTime: '30',
    restTime: '30',
    greenReps: '3',
    redReps: '3',
    greenCountdownSpeed: 1000,
    redCountdownSpeed: 1000,
    infiniteLoopTime: '30',
    infiniteSpeed: 1000,
    targetSets: '3',
    targetReps: '6',
    weight: '75',
};

/**
 * Get the storage key for a workout's settings
 */
function getStorageKey(workoutId: string): string {
    return `${SETTINGS_STORAGE_PREFIX}${workoutId}`;
}

/**
 * Load settings for a specific workout
 * Returns default settings if none are saved
 */
export async function loadWorkoutSettings(workoutId: string): Promise<WorkoutSettings> {
    try {
        const key = getStorageKey(workoutId);
        const stored = await AsyncStorage.getItem(key);

        if (stored) {
            const parsed = JSON.parse(stored);
            console.log('📥 Loaded settings for', workoutId, ':', parsed);
            // Merge with defaults to ensure new fields (like weight) are present
            return { ...DEFAULT_WORKOUT_SETTINGS, ...parsed, workoutId };
        }

        // If no specific settings, try last saved
        const lastStored = await AsyncStorage.getItem(LAST_SETTINGS_KEY);
        if (lastStored) {
            const parsed = JSON.parse(lastStored);
            // important: update workoutId to the current one
            const settingsForCurrentWorkout: WorkoutSettings = { ...parsed, workoutId };
            console.log('↪️ Using last saved settings for', workoutId, ':', settingsForCurrentWorkout);
            return settingsForCurrentWorkout;
        }

        // Return default settings
        const defaultSettings: WorkoutSettings = {
            workoutId,
            ...DEFAULT_WORKOUT_SETTINGS,
        };
        console.log('📋 Using default settings for', workoutId);
        return defaultSettings;
    } catch (error) {
        console.error('❌ Error loading settings for', workoutId, ':', error);
        return {
            workoutId,
            ...DEFAULT_WORKOUT_SETTINGS,
        };
    }
}

/**
 * Save settings for a specific workout
 */
export async function saveWorkoutSettings(settings: WorkoutSettings): Promise<void> {
    try {
        const key = getStorageKey(settings.workoutId);
        const settingsJson = JSON.stringify(settings);
        await AsyncStorage.setItem(key, settingsJson);
        // Also save as the last used settings
        await AsyncStorage.setItem(LAST_SETTINGS_KEY, settingsJson);
        await AsyncStorage.setItem(LAST_ACTIVITY_WORKOUT_ID_KEY, settings.workoutId);
        console.log('💾 Saved settings for', settings.workoutId, ':', settings);
    } catch (error) {
        console.error('❌ Error saving settings for', settings.workoutId, ':', error);
    }
}

/**
 * Get default settings for a workout (useful for reset)
 */
export function getDefaultSettings(workoutId: string): WorkoutSettings {
    return {
        workoutId,
        ...DEFAULT_WORKOUT_SETTINGS,
    };
}

/**
 * Clear all workout settings (for debugging/reset)
 */
export async function clearAllWorkoutSettings(): Promise<void> {
    try {
        const allKeys = await AsyncStorage.getAllKeys();
        const settingsKeys = allKeys.filter(key => key.startsWith(SETTINGS_STORAGE_PREFIX));
        await AsyncStorage.multiRemove(settingsKeys);
        console.log('🗑️ Cleared all workout settings');
    } catch (error) {
        console.error('❌ Error clearing settings:', error);
    }
}
