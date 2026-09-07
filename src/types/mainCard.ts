import { Rarity, Position } from '../constants/collectibleWorkouts';

export type AttrKey = 'STR' | 'VOL' | 'TMP' | 'END' | 'PHY' | 'HYP';

export type SessionMetrics = {
    volumeKg: number;      // weight * sets * reps
    enduranceMin: number;  // elapsed / 60
    cadenceSecPerRep: number; // active / reps
    intensityRatio: number;   // rest / active
    densityPct: number;       // active / elapsed * 100
};

export type SecondaryRule = {
    icon: string;                  // Hydra, Medusa, Sphinx...
    shardsToUnlock: number;        // e.g., 100
    shardFormula: (m: SessionMetrics, ctx: RunContext) => number;
};

export type RunContext = {
    runIndex: number;              // 1..requiredRuns
    completedWorkoutCount: number; // 0..workoutIds.length
    dayKey: string;                // streak/consistency (e.g., '2024-02-02')
};

export type MainCard = {
    id: string;
    rarity: Rarity;
    theme: Position;
    primary: string;                  // Lore name (e.g. Persephone)
    primaryIconId: string;            // Canonical ID from registry
    secondaryIconId: string | null;   // Encounter icon
    primaryEpithetByTier: Record<Rarity, string>;
    subtitle: string;                 // Concept sentence
    secondaryTag: string | null;      // "Encounter: Hydra" etc.
    category: 'TOP' | 'TITAN' | 'HERO' | 'ENCOUNTER';
    requiredRuns: number;
    workoutIds: string[];
    weights: Record<AttrKey, number>;
    secondaryUnlocks: SecondaryRule[];
};

export type MainCardGains = Record<AttrKey, number>;

export interface MainCardAttempt {
    id: string; // unique attempt ID (e.g., cardId_timestamp)
    mainCardId: string;
    workoutIds: string[]; // the 6 workouts in the package
    completedWorkouts: string[]; // IDs of completed workouts (base workout IDs)
    startedAt: string;
    isCompleted: boolean;
}

export interface MainCardState {
    id: string;
    level: number;       // Current "run" index (1..requiredRuns)
    xp: number;          // Total experience / sessions
    gains: MainCardGains; // Cumulative attribute gains
    shards: Record<string, number>; // Shards for secondary unlocks
    unlockedSecondaries: string[]; // List of unlocked icon names
    currentAttemptId: string | null; // Currently active run attempt
}
