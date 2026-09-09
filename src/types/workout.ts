export interface WorkoutSummary {
  date: string;
  workoutId: string;
  workoutName: string;
  elapsedTime: number;
  completedSets: number;
  completedReps: number;
  avgGreenLoopTime: number;
  avgRedLoopTime: number;
  greenLoopTimes?: number[];
  redLoopTimes?: number[];
  // Phase 5A snapshot fields (optional for legacy compatibility)
  calories?: number;
  bodyWeightKg?: number;
  settings?: {
    greenReps: string;
    redReps: string;
    greenTime: string;
    restTime: string;
    weight?: string;
    // legacy storage: some sessions stored user body weight inside settings
    bodyWeight?: string | number;
  };
}
