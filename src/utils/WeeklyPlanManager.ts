// src/utils/WeeklyPlanManager.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutDayType, WORKOUT_DAY_COLORS } from './WorkoutDayManager';

const WEEKLY_PLAN_STORAGE_KEY = '@weekly_workout_plan';

// Enhanced interface with workout details and time
export interface DailyPlanDetails {
    workoutDay: WorkoutDayType;
    workoutIds?: string[]; // Specific workout IDs from that day
    startTime?: string; // Format: "HH:MM" (e.g., "14:00")
    endTime?: string; // Format: "HH:MM" (e.g., "15:30")
    notes?: string;
}

export interface WeeklyPlan {
    [dateKey: string]: DailyPlanDetails | null;
}

export interface WorkoutTemplate {
    id: string;
    name: string;
    description: string;
    plan: {
        monday: WorkoutDayType | null;
        tuesday: WorkoutDayType | null;
        wednesday: WorkoutDayType | null;
        thursday: WorkoutDayType | null;
        friday: WorkoutDayType | null;
        saturday: WorkoutDayType | null;
        sunday: WorkoutDayType | null;
    };
}

// Predefined templates
export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
    {
        id: 'push-pull-legs',
        name: 'Push Pull Legs',
        description: '3-day split focused on movement patterns',
        plan: {
            monday: 'PUSH DAY',
            tuesday: 'PULL DAY',
            wednesday: 'LEG DAY',
            thursday: 'OFF DAY',
            friday: 'PUSH DAY',
            saturday: 'PULL DAY',
            sunday: 'OFF DAY',
        },
    },
    {
        id: 'bro-split',
        name: 'Classic Bro Split',
        description: 'Traditional bodybuilding split',
        plan: {
            monday: 'PUSH DAY',
            tuesday: 'PULL DAY',
            wednesday: 'PUSH DAY',
            thursday: 'LEG DAY',
            friday: 'PULL DAY',
            saturday: 'OFF DAY',
            sunday: 'OFF DAY',
        },
    },
    {
        id: 'upper-lower',
        name: 'Upper Lower',
        description: '4-day split alternating upper and lower body',
        plan: {
            monday: 'PUSH DAY',
            tuesday: 'LEG DAY',
            wednesday: 'OFF DAY',
            thursday: 'PULL DAY',
            friday: 'LEG DAY',
            saturday: 'OFF DAY',
            sunday: 'OFF DAY',
        },
    },
];

// Format date to YYYY-MM-DD
export function formatDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Get short day name (English)
export function getShortDayName(date: Date): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
}

// Get full day name (English)
export function getFullDayName(date: Date): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
}

// Get week start date (Monday)
export function getWeekStartDate(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

// Get all days in a week (Mon-Sun)
export function getWeekDays(date: Date): Date[] {
    const weekStart = getWeekStartDate(date);
    const days: Date[] = [];

    for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        days.push(day);
    }

    return days;
}

// Load weekly plan for a specific week
export async function loadWeeklyPlan(date: Date): Promise<WeeklyPlan> {
    try {
        const stored = await AsyncStorage.getItem(WEEKLY_PLAN_STORAGE_KEY);
        if (!stored) return {};

        const allPlans = JSON.parse(stored);
        const weekDays = getWeekDays(date);
        const weekPlan: WeeklyPlan = {};

        weekDays.forEach((day) => {
            const dateKey = formatDateString(day);
            weekPlan[dateKey] = allPlans[dateKey] || null;
        });

        return weekPlan;
    } catch (error) {
        console.error('Error loading weekly plan:', error);
        return {};
    }
}

// Save weekly plan
export async function saveWeeklyPlan(date: Date, weekPlan: WeeklyPlan): Promise<void> {
    try {
        const stored = await AsyncStorage.getItem(WEEKLY_PLAN_STORAGE_KEY);
        const allPlans = stored ? JSON.parse(stored) : {};

        // Merge with existing plans
        const updatedPlans = { ...allPlans, ...weekPlan };

        await AsyncStorage.setItem(WEEKLY_PLAN_STORAGE_KEY, JSON.stringify(updatedPlans));
    } catch (error) {
        console.error('Error saving weekly plan:', error);
        throw error;
    }
}

// Set workout for a specific date
export async function setWorkoutForDate(
    date: Date,
    details: DailyPlanDetails | null
): Promise<void> {
    try {
        const dateKey = formatDateString(date);
        const stored = await AsyncStorage.getItem(WEEKLY_PLAN_STORAGE_KEY);
        const allPlans = stored ? JSON.parse(stored) : {};

        if (details === null) {
            delete allPlans[dateKey];
        } else {
            allPlans[dateKey] = details;
        }

        await AsyncStorage.setItem(WEEKLY_PLAN_STORAGE_KEY, JSON.stringify(allPlans));
    } catch (error) {
        console.error('Error setting workout for date:', error);
        throw error;
    }
}

// Get workout for a specific date (backward compatible)
export async function getWorkoutForDate(date: Date): Promise<WorkoutDayType | null> {
    try {
        const dateKey = formatDateString(date);
        const stored = await AsyncStorage.getItem(WEEKLY_PLAN_STORAGE_KEY);

        if (!stored) return null;

        const allPlans = JSON.parse(stored);
        const details = allPlans[dateKey];

        // Backward compatibility: return workoutDay if exists
        return details?.workoutDay || null;
    } catch (error) {
        console.error('Error getting workout for date:', error);
        return null;
    }
}

// Get full details for a specific date
export async function getDailyPlanDetails(date: Date): Promise<DailyPlanDetails | null> {
    try {
        const dateKey = formatDateString(date);
        const stored = await AsyncStorage.getItem(WEEKLY_PLAN_STORAGE_KEY);

        if (!stored) return null;

        const allPlans = JSON.parse(stored);
        return allPlans[dateKey] || null;
    } catch (error) {
        console.error('Error getting details for date:', error);
        return null;
    }
}

// Apply template to a week
export async function applyTemplateToWeek(
    weekStartDate: Date,
    template: WorkoutTemplate
): Promise<void> {
    try {
        const weekDays = getWeekDays(weekStartDate);
        const dayKeys: (keyof WorkoutTemplate['plan'])[] = [
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
            'sunday',
        ];

        const weekPlan: WeeklyPlan = {};

        weekDays.forEach((day, index) => {
            const dateKey = formatDateString(day);
            const workoutDay = template.plan[dayKeys[index]];

            if (workoutDay) {
                weekPlan[dateKey] = {
                    workoutDay,
                    // Templates don't have specific times, users can add them later
                };
            } else {
                weekPlan[dateKey] = null;
            }
        });

        await saveWeeklyPlan(weekStartDate, weekPlan);
    } catch (error) {
        console.error('Error applying template:', error);
        throw error;
    }
}

// Get workout color (for UI)
export function getWorkoutColor(details: DailyPlanDetails | WorkoutDayType | null): string {
    if (!details) return '#2C2C2E'; // Rest day color

    // Handle both old (WorkoutDayType) and new (DailyPlanDetails) formats
    const workoutDay = typeof details === 'string' ? details : details.workoutDay;

    return WORKOUT_DAY_COLORS[workoutDay] || '#2C2C2E';
}

// Clear all plans (utility function)
export async function clearAllPlans(): Promise<void> {
    try {
        await AsyncStorage.removeItem(WEEKLY_PLAN_STORAGE_KEY);
    } catch (error) {
        console.error('Error clearing plans:', error);
        throw error;
    }
}
