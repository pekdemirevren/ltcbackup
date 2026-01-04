export const ALL_SETTINGS_KEY = 'all_workout_settings';

export interface WorkoutSettings {
  greenTime: string;
  restTime: string;
  greenReps: string;
  redReps: string;
  greenSpeed: number; // in seconds
  redSpeed: number; // in seconds
  // Add other settings here as they are discovered or needed
}

export const defaultSettings: WorkoutSettings = {
  greenTime: '30',
  restTime: '15',
  greenReps: '3',
  redReps: '3',
  greenSpeed: 1, // in seconds
  redSpeed: 1, // in seconds
};
