// Auto-generated workout data from gif files
import {
    WORKOUT_GIF_FILES,
    gifFileNameToDisplayName,
    displayNameToWorkoutId,
    getGifRequirePath
} from '../utils/workoutGenerator';
import * as Icons from '../assets/icons';

export interface Workout {
    id: string;
    name: string;
    gifFileName: string;
    gifPath: any;
    workoutId: string;
    SvgIcon: React.FC<any>;
    muscleGroup: string;
}

// Helper to get SVG icon component from gif filename
const getSvgIcon = (fileName: string): React.FC<any> => {
    const namePart = fileName.replace('.gif', '');
    // Clean name: "lat pulldown " -> "lat pulldown", "Tbar-row" -> "Tbar-row"
    const cleanName = namePart.replace(/[_\s-]+/g, ' ').trim();

    // Special case mappings
    const specialCases: { [key: string]: string } = {
        'jump-rope-new': 'JumpRopeIcon',
        'biking': 'BicycleIcon',
        'bicep-dumbbell': 'BicepDumbbellIcon',
        'bench-press': 'BenchPressIcon',
        'lat pulldown ': 'LatPulldownIcon',
        'outdoor-walk': 'OutdoorWalkIcon',
        'outdoor-run': 'OutdoorRunIcon',
    };

    let iconName: string;
    if (specialCases[namePart]) {
        iconName = specialCases[namePart];
    } else {
        iconName = cleanName
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('') + 'Icon';
    }

    // @ts-ignore
    const Icon = Icons[iconName];

    if (!Icon) {
        console.warn(`Icon not found for ${fileName} (generated name: ${iconName})`);
        return Icons.BicepDumbbellIcon; // Fallback
    }

    return Icon;
};

// Helper to determine muscle group from workout name
const getMuscleGroup = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('squat') || n.includes('leg') || n.includes('calf') || n.includes('lunge')) return 'Legs';
    if (n.includes('bench') || n.includes('chest') || n.includes('push up') || n.includes('fly')) return 'Chest';
    if (n.includes('row') || n.includes('pull') || n.includes('lat') || n.includes('back')) return 'Back';
    if (n.includes('shoulder') || n.includes('press') || n.includes('raise') || n.includes('deltoid')) return 'Shoulders';
    if (n.includes('curl') || n.includes('tricep') || n.includes('bicep') || n.includes('arm')) return 'Arms';
    if (n.includes('crunch') || n.includes('plank') || n.includes('sit up') || n.includes('abs')) return 'Core';
    if (n.includes('run') || n.includes('walk') || n.includes('bike') || n.includes('jump') || n.includes('cardio')) return 'Cardio';
    return 'Full Body';
};

export const allWorkouts: Workout[] = (WORKOUT_GIF_FILES || []).map((gifFileName, index) => {
    const displayName = gifFileNameToDisplayName(gifFileName);
    const workoutId = displayNameToWorkoutId(displayName);

    return {
        id: String(index + 1),
        name: displayName,
        gifFileName: gifFileName,
        gifPath: getGifRequirePath(gifFileName),
        workoutId: workoutId,
        SvgIcon: getSvgIcon(gifFileName),
        muscleGroup: getMuscleGroup(displayName),
    };
});

// Export a map of workout IDs for easy lookup
export const WORKOUT_IDS: { [key: string]: string } = (allWorkouts || []).reduce((acc, workout) => {
    acc[workout.name] = workout.workoutId;
    return acc;
}, {} as { [key: string]: string });

/**
 * Find the SVG icon for a given exercise name
 */
export const findExerciseIcon = (query: string): React.FC<any> => {
    if (!query) return Icons.BicepDumbbellIcon;
    const q = query.toLowerCase().replace(/[\s_-]+/g, '').trim();

    // Explicit Aliases for the new 24-card set
    const aliases: { [key: string]: React.FC<any> } = {
        'ohp': Icons.BenchPressIcon,
        'bench_press': Icons.BenchPressIcon,
        'lat_pulldown': Icons.LatPulldownIcon,
        'seated_cable_row': Icons.SeatedCableRowIcon,
        'sq': Icons.LegPressIcon,
        'bb_sq': Icons.LegPressIcon,
        'hb_sq': Icons.LegPressIcon,
        'h_bb_sq': Icons.LegPressIcon,
        'h_sq_l': Icons.LegPressIcon,
        'leg_press': Icons.LegPressIcon,
        'adv_press': Icons.LegPressIcon,
        'pro_press': Icons.LegPressIcon,
        'lunge': Icons.DumbbellLungeBicepCurlIcon,
        'w_lunge': Icons.DumbbellLungeBicepCurlIcon,
        'e_lunge': Icons.DumbbellLungeBicepCurlIcon,
        'curl': Icons.BicepDumbbellIcon,
        'tri_ext': Icons.AssistedTricepDipIcon,
        'face_pull': Icons.RearDeltFlyIcon,
        'pull_up': Icons.PullUpIcon,
        'chest_fly': Icons.ChestRopeIcon,
        'incline_press': Icons.InclineDumbbellBenchPressIcon,
        'decline_press': Icons.DeclineBarbellIcon,
    };

    if (aliases[query]) return aliases[query];
    if (aliases[q]) return aliases[q];

    // Fuzzy matching
    const workout = allWorkouts.find(w => {
        const n = w.name.toLowerCase().replace(/[\s_-]+/g, '').trim();
        const id = w.workoutId.toLowerCase().replace(/[\s_-]+/g, '').trim();
        return n === q || id === q || q.includes(id) || id.includes(q);
    });

    return workout ? workout.SvgIcon : Icons.BicepDumbbellIcon;
};
