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
    return Icons.BicycleIcon; // Fallback
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

export const allWorkouts: Workout[] = WORKOUT_GIF_FILES.map((gifFileName, index) => {
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
export const WORKOUT_IDS: { [key: string]: string } = allWorkouts.reduce((acc, workout) => {
  acc[workout.name] = workout.workoutId;
  return acc;
}, {} as { [key: string]: string });