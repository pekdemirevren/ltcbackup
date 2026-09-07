import { PrimaryStats } from '../constants/collectibleWorkouts';

export interface ExerciseMetrics {
    weight: number;
    sets: number;
    reps: number;
    rest: number;
    isBodyweight: boolean;
    isAssisted: boolean;
}

export type ExerciseCategory = 'POWER' | 'STANDARD' | 'ISOLATION' | 'BODYWEIGHT_PLUS' | 'BODYWEIGHT_MINUS';

export const getExerciseCategory = (name: string): ExerciseCategory => {
    const n = name.toLowerCase();

    // Bodyweight Minus (Assisted)
    if (n.includes('assisted')) return 'BODYWEIGHT_MINUS';

    // Power / Heavy Compound (Highest priority for weight)
    if (
        n.includes('deadlift') ||
        n.includes('squat') && !n.includes('goblet') && !n.includes('split') ||
        n.includes('bench press') ||
        n.includes('barbell row') ||
        n.includes('clean') ||
        n.includes('heavy') ||
        n.includes('competition') ||
        n.includes('push press')
    ) return 'POWER';

    // Bodyweight Plus (Targetting reps/sets or adding weights)
    if (
        n.includes('muscle-up') ||
        n.includes('pull-up') ||
        n.includes('chin-up') ||
        n.includes('dip') ||
        n.includes('push-up') ||
        n.includes('pistol') ||
        n.includes('nordic') ||
        n.includes('bodyweight')
    ) return 'BODYWEIGHT_PLUS';

    // Isolation (Low weight high reps)
    if (
        n.includes('curl') ||
        n.includes('lateral raise') ||
        n.includes('extension') ||
        n.includes('fly') ||
        n.includes('face pull') ||
        n.includes('calf') ||
        n.includes('shrug')
    ) return 'ISOLATION';

    // Standard Compound (Medium weight)
    return 'STANDARD';
};

const getBaseSpecs = (category: ExerciseCategory) => {
    switch (category) {
        case 'POWER':
            return { weight: 100, sets: 3, reps: 5, rest: 120 };
        case 'STANDARD':
            return { weight: 60, sets: 3, reps: 8, rest: 90 };
        case 'ISOLATION':
            return { weight: 15, sets: 2, reps: 12, rest: 60 };
        case 'BODYWEIGHT_PLUS':
            return { weight: 20, sets: 3, reps: 5, rest: 120 };
        case 'BODYWEIGHT_MINUS':
            return { weight: -20, sets: 3, reps: 10, rest: 90 };
        default:
            return { weight: 50, sets: 3, reps: 8, rest: 90 };
    }
};

export const calculateExerciseMetrics = (
    exerciseName: string,
    stats: PrimaryStats,
    level: number
): ExerciseMetrics => {
    const category = getExerciseCategory(exerciseName);
    const base = getBaseSpecs(category);

    // formulas
    // Level factor: Level 50 is baseline (1.0x). Level 90 is 1.4x. Level 5 is 0.55x.
    const levelFactor = 1 + (level - 50) / 100;

    // Weight calculation
    // STR (Strength) determines weight. 
    let calculatedWeight: number;

    if (category === 'BODYWEIGHT_MINUS') {
        const assistanceFactor = (1 - (stats.STR / 100)) * (1 / levelFactor);
        calculatedWeight = Math.max(2.5, 60 * assistanceFactor);
    } else {
        calculatedWeight = base.weight * (stats.STR / 100) * levelFactor;
    }

    // Round to nearest 2.5kg for realism
    calculatedWeight = Math.round(calculatedWeight / 2.5) * 2.5;

    // Sets calculation (VOL - Volume determines sets)
    const extraSets = Math.floor(stats.VOL / 33);
    const calculatedSets = base.sets + extraSets;

    // Reps calculation (END - Endurance determines reps)
    const extraReps = Math.floor(stats.END / 12);
    const calculatedReps = base.reps + extraReps;

    // Rest calculation (TMP - Tempo/Technique determines rest efficiency)
    const restFactor = 1.5 - (stats.TMP / 100);
    const calculatedRest = Math.round((base.rest * restFactor) / 5) * 5; // Round to nearest 5s

    return {
        weight: calculatedWeight,
        sets: calculatedSets,
        reps: calculatedReps,
        rest: calculatedRest,
        isBodyweight: category === 'BODYWEIGHT_PLUS' || category === 'BODYWEIGHT_MINUS',
        isAssisted: category === 'BODYWEIGHT_MINUS'
    };
};
