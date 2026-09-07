export type RarityTier = 'bronze' | 'silver' | 'gold' | 'pro' | 'legend';
export type WorkoutPosition = 'pull' | 'push' | 'legs';

export interface WorkoutStats {
  STR: number; // Strength (0-99)
  VOL: number; // Volume (0-99)
  TMP: number; // Tempo (0-99)
  END: number; // Endurance (0-99)
  TEC: number; // Technique (0-99)
  MOB: number; // Mobility (0-99)
}

export interface Workout {
  id: string;
  name: string;
  position: WorkoutPosition;
  level: number; // 1-99 (OVR equivalent)
  rarity: RarityTier;
  stats: WorkoutStats;
  exercises: Exercise[];
  duration: number; // in minutes
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string; // "12-15" or "AMRAP" etc
  rest: number; // seconds
}

export interface RarityConfig {
  tierKey: RarityTier;
  displayName: string;
  shortTag: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    glow: string;
  };
}
