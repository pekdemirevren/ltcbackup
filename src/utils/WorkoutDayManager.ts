// Workout Day Manager - Manages which cards are in each workout day
import AsyncStorage from '@react-native-async-storage/async-storage';

export type WorkoutDayType = 'PUSH' | 'PULL' | 'LEGS' | 'REST' | 'LEG DAY' | 'PUSH DAY' | 'PULL DAY' | 'OFF DAY' | 'CHEST DAY' | 'SHOULDER DAY' | 'BACK DAY' | 'ABS DAY' | 'BICEPS-TRICEPS DAY';

export const ALL_WORKOUT_DAYS: WorkoutDayType[] = [
  'LEG DAY',
  'PUSH DAY',
  'PULL DAY',
  'OFF DAY',
];

// Workout Day default muscle group mapping
export const WORKOUT_DAY_MUSCLE_GROUPS: Record<string, string[]> = {
  'PUSH': ['Chest', 'Shoulders', 'Triceps'],
  'PULL': ['Back', 'Traps', 'Biceps'],
  'LEGS': ['Legs', 'Glutes', 'Abs'],
  'REST': ['Rest'],
  'PUSH DAY': ['Chest', 'Shoulders', 'Triceps'],
  'PULL DAY': ['Back', 'Traps', 'Biceps'],
  'LEG DAY': ['Legs'],
  'OFF DAY': ['Rest'],
  // Legacy mappings for temporary compatibility
  'CHEST DAY': ['Chest'],
  'SHOULDER DAY': ['Shoulders'],
  'BACK DAY': ['Back'],
  'ABS DAY': ['Core'],
  'BICEPS-TRICEPS DAY': ['Arms'],
};

// Workout day colors for calendar and UI
export const WORKOUT_DAY_COLORS: Record<string, string> = {
  'PUSH': '#FF3B30',      // Red (Energetic)
  'PULL': '#5856D6',      // Purple/Indigo (Cooler but strong)
  'LEGS': '#FF9500',      // Orange (Warning/Hard)
  'REST': '#8E8E93',      // Grey
  'PUSH DAY': '#FF3B30',
  'PULL DAY': '#5856D6',
  'LEG DAY': '#FF9500',   // Match LEGS color
  'OFF DAY': '#8E8E93',   // Match REST color
  // Legacy
  'CHEST DAY': '#6B8E23',
  'SHOULDER DAY': '#9B59B6',
  'BACK DAY': '#E67E22',
  'ABS DAY': '#1ABC9C',
  'BICEPS-TRICEPS DAY': '#E74C3C',
};

/**
 * Maps legacy workout types to new PPL types
 */
export function mapLegacyToPPL(type: WorkoutDayType): WorkoutDayType {
  switch (type) {
    case 'CHEST DAY':
    case 'SHOULDER DAY':
      return 'PUSH';
    case 'BACK DAY':
    case 'BICEPS-TRICEPS DAY':
      return 'PULL';
    case 'LEG DAY':
    case 'ABS DAY':
      return 'LEGS';
    default:
      return type;
  }
}

// Storage keys
const WORKOUT_DAY_CARDS_PREFIX = '@workout_day_cards_';
const DAILY_WORKOUT_SCHEDULE_KEY = '@daily_workout_schedule';
const HIDDEN_WORKOUT_DAYS_KEY = '@hidden_workout_days';

export interface WorkoutDayData {
  workoutDay: WorkoutDayType;
  workoutIds: string[];
  isVisible: boolean;
}

export interface DailySchedule {
  [date: string]: WorkoutDayType; // "2025-12-31" -> "LEG DAY"
}

/**
 * Get storage key for a workout day's cards
 */
function getWorkoutDayKey(workoutDay: WorkoutDayType): string {
  if (!workoutDay || typeof workoutDay !== 'string') {
    console.warn('⚠️ getWorkoutDayKey called with invalid workoutDay:', workoutDay);
    return `${WORKOUT_DAY_CARDS_PREFIX}LEG_DAY`; // Fallback
  }
  return `${WORKOUT_DAY_CARDS_PREFIX}${workoutDay.replace(/\s+/g, '_')}`;
}

/**
 * Load cards for a specific workout day
 */
export async function loadWorkoutDayCards(workoutDay: WorkoutDayType): Promise<string[]> {
  try {
    const key = getWorkoutDayKey(workoutDay);
    const stored = await AsyncStorage.getItem(key);

    if (stored) {
      return JSON.parse(stored);
    }

    return []; // Return empty array if no cards saved
  } catch (error) {
    console.error('Error loading workout day cards:', error);
    return [];
  }
}

/**
 * Save cards for a specific workout day
 */
export async function saveWorkoutDayCards(workoutDay: WorkoutDayType, workoutIds: string[]): Promise<void> {
  try {
    const key = getWorkoutDayKey(workoutDay);
    await AsyncStorage.setItem(key, JSON.stringify(workoutIds));
    console.log(`✅ Saved ${workoutIds.length} cards for ${workoutDay}`);
  } catch (error) {
    console.error('Error saving workout day cards:', error);
  }
}

/**
 * Add a card to a workout day
 */
export async function addCardToWorkoutDay(workoutDay: WorkoutDayType, workoutId: string): Promise<string[]> {
  const currentCards = await loadWorkoutDayCards(workoutDay);

  if (!currentCards.includes(workoutId)) {
    const newCards = [...currentCards, workoutId];
    await saveWorkoutDayCards(workoutDay, newCards);
    return newCards;
  }

  return currentCards;
}

/**
 * Remove a card from a workout day
 */
export async function removeCardFromWorkoutDay(workoutDay: WorkoutDayType, workoutId: string): Promise<string[]> {
  const currentCards = await loadWorkoutDayCards(workoutDay);
  const newCards = currentCards.filter(id => id !== workoutId);
  await saveWorkoutDayCards(workoutDay, newCards);
  return newCards;
}

/**
 * Get today's date as string (YYYY-MM-DD)
 */
export function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Load daily workout schedule
 */
export async function loadDailySchedule(): Promise<DailySchedule> {
  try {
    const stored = await AsyncStorage.getItem(DAILY_WORKOUT_SCHEDULE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return {};
  } catch (error) {
    console.error('Error loading daily schedule:', error);
    return {};
  }
}

/**
 * Save daily workout schedule
 */
export async function saveDailySchedule(schedule: DailySchedule): Promise<void> {
  try {
    await AsyncStorage.setItem(DAILY_WORKOUT_SCHEDULE_KEY, JSON.stringify(schedule));
  } catch (error) {
    console.error('Error saving daily schedule:', error);
  }
}

/**
 * @deprecated Use calendar events instead. This function is kept for backward compatibility.
 * Returns null if no workout is scheduled for today.
 */
export async function getTodaysWorkoutDay(): Promise<WorkoutDayType | null> {
  const today = getTodayDateString();
  const schedule = await loadDailySchedule();
  return schedule[today] || null;
}

/**
 * Load hidden workout days (removed from summary)
 */
export async function loadHiddenWorkoutDays(): Promise<WorkoutDayType[]> {
  try {
    const stored = await AsyncStorage.getItem(HIDDEN_WORKOUT_DAYS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error('Error loading hidden workout days:', error);
    return [];
  }
}

/**
 * Save hidden workout days
 */
export async function saveHiddenWorkoutDays(hiddenDays: WorkoutDayType[]): Promise<void> {
  try {
    await AsyncStorage.setItem(HIDDEN_WORKOUT_DAYS_KEY, JSON.stringify(hiddenDays));
  } catch (error) {
    console.error('Error saving hidden workout days:', error);
  }
}

/**
 * Hide a workout day from summary
 */
export async function hideWorkoutDay(workoutDay: WorkoutDayType): Promise<void> {
  const hidden = await loadHiddenWorkoutDays();
  if (!hidden.includes(workoutDay)) {
    hidden.push(workoutDay);
    await saveHiddenWorkoutDays(hidden);
  }
}

/**
 * Show a workout day in summary (remove from hidden)
 */
export async function showWorkoutDay(workoutDay: WorkoutDayType): Promise<void> {
  const hidden = await loadHiddenWorkoutDays();
  const newHidden = hidden.filter(day => day !== workoutDay);
  await saveHiddenWorkoutDays(newHidden);
}

/**
 * Get the current day number (1-7) based on which day of the week it is
 */
export function getCurrentDayNumber(): number {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  return dayOfWeek === 0 ? 7 : dayOfWeek; // Convert Sunday from 0 to 7
}

/**
 * Check if a workout day has any cards
 */
export async function workoutDayHasCards(workoutDay: WorkoutDayType): Promise<boolean> {
  const cards = await loadWorkoutDayCards(workoutDay);
  return cards.length > 0;
}

/**
 * Set workout day for a specific date manually
 */
export async function setWorkoutDayForDate(date: Date, workoutDay: WorkoutDayType): Promise<void> {
  const dateString = date.toISOString().split('T')[0];
  const schedule = await loadDailySchedule();
  schedule[dateString] = workoutDay;
  await saveDailySchedule(schedule);
  console.log(`✅ Set ${workoutDay} for ${dateString}`);
}

/**
 * Get workout day for a specific date
 */
export async function getWorkoutDayForDate(date: Date): Promise<WorkoutDayType | null> {
  const dateString = date.toISOString().split('T')[0];
  const schedule = await loadDailySchedule();
  return schedule[dateString] || null;
}
