/**
 * Collectible Workout Data - FUT Style
 */
import { MythologyCategory } from './mythologyCategories';

export type Position = "PULL" | "PUSH" | "LEGS";
export type Rarity = "BRONZE" | "SILVER" | "GOLD" | "TITAN" | "ICON" | "LEGEND" | "GOD" | "GODDESS" | "DIVINE" | "HERO" | "PRIMORDIAL" | "CREATURE" | "MORTAL" | "UNDERWORLD";

export const collectibleRarityColors: Record<Rarity, {
    primary: string;
    secondary: string;
    text: string;
    accent: string;
    patternColor: string;
}> = {
    BRONZE: { primary: '#DC9464', secondary: '#B85C2F', text: '#5D2E17', accent: '#F0A574', patternColor: '#5D2E17' },
    SILVER: { primary: '#9A9FA9', secondary: '#7F848E', text: '#374151', accent: '#D1D5DB', patternColor: '#374151' },
    GOLD: { primary: '#F5C842', secondary: '#D4A418', text: '#111111', accent: '#FFE082', patternColor: '#78350F' },
    TITAN: { primary: '#D1D5DB', secondary: '#9CA3AF', text: '#374151', accent: '#E5E7EB', patternColor: '#374151' }, // Light Silver
    ICON: { primary: '#FFFFFF', secondary: '#E0E0E0', text: '#111111', accent: '#C0C0C0', patternColor: '#E5E7EB' },
    LEGEND: { primary: '#F5C842', secondary: '#D4A418', text: '#111111', accent: '#FFE082', patternColor: '#78350F' }, // Gold (Top Tier)
    GOD: { primary: '#F5C842', secondary: '#D4A418', text: '#111111', accent: '#FFE082', patternColor: '#78350F' }, // Gold
    GODDESS: { primary: '#F5C842', secondary: '#D4A418', text: '#111111', accent: '#FFE082', patternColor: '#78350F' }, // Gold
    DIVINE: { primary: '#F5C842', secondary: '#D4A418', text: '#111111', accent: '#FFE082', patternColor: '#78350F' }, // Gold
    HERO: { primary: '#E5B288', secondary: '#C68945', text: '#FFFFFF', accent: '#F2D2B5', patternColor: '#7C471B' }, // Light Bronze
    PRIMORDIAL: { primary: '#FFFFFF', secondary: '#E5E7EB', text: '#111111', accent: '#F3F4F6', patternColor: '#374151' }, // White
    CREATURE: { primary: '#8B0000', secondary: '#660000', text: '#FFFFFF', accent: '#FF4D4D', patternColor: '#FFCCCC' }, // Red
    MORTAL: { primary: '#DC9464', secondary: '#B85C2F', text: '#5D2E17', accent: '#F0A574', patternColor: '#5D2E17' }, // Bronze
    UNDERWORLD: { primary: '#FFFFFF', secondary: '#FFF5E1', text: '#B8860B', accent: '#FFD700', patternColor: '#DAA520' } // White-Yellow
};
export type PrimaryStatKey = "STR" | "VOL" | "TMP" | "END" | "PHY" | "HYP";

export interface PrimaryStats {
    STR: number;
    VOL: number;
    TMP: number;
    END: number;
    PHY: number;
    HYP: number;
}

export type SubStatKey =
    | "maxStrength" | "explosivePower" | "lockoutStrength" | "gripStrength"
    | "totalVolume" | "setCapacity" | "repEndurance" | "trainingDensity"
    | "eccentricControl" | "timeUnderTension" | "pauseQuality" | "tempoConsistency"
    | "aerobicBase" | "recoverySpeed" | "workCapacity" | "stamina"
    | "jumping" | "aggression" | "bodyControl" | "durability"
    | "muscleVolume" | "pumpQuality" | "mindMuscle" | "growthResponse"
    | "speed" | "leadership" | "wit" | "endurance" | "clarity" | "potential" | "depth" | "mystery" | "pressure" | "flow" | "shadow" | "destiny" | "reaper" | "hope" | "greed" | "vanity" | "precision";

export interface SubStat {
    key: SubStatKey;
    label: string;
    value: number;
    primary: PrimaryStatKey;
}

export interface WorkoutSkill {
    id: string;
    name: string;
    description: string;
    iconName: string;
    customIcon?: 'warrior' | 'warmuppro'; // Custom SVG icons from assets/icons/skills
    unlockLevel: number; // Represents session count milestone
    tier?: "STANDARD" | "PLUS";
    statBoosts: { target: PrimaryStatKey | "ALL"; amount: number }[];
}

export interface CollectibleExercise {
    id: string;
    name: string;
}

export interface CollectibleWorkout {
    id: string;
    name: string;
    position: Position;
    rarity: Rarity;
    baseLevel: number;
    duration: number;
    exercises: CollectibleExercise[];
    baseStats: PrimaryStats;
    subStats: SubStat[];
    skills: WorkoutSkill[];
    lore?: string; // Original lore

    // Power Fantasy Fields
    primaryIconId: string;
    secondaryIconIds: string[];
    deityGender: 'male' | 'female' | 'unknown'; // For GOD vs GODDESS labels
    secondaryTraits?: Array<{ id: string; title: string; subtitle: string; }>;
    thread?: { title: string; subtitle: string; };
    primaryEpithetByTier: Record<string, string>; // Changed from Record<Rarity, string> for flexibility
    subtitle: string;
    secondaryTag: string | null;
    category: MythologyCategory | 'TOP' | 'TITAN' | 'HERO' | 'ENCOUNTER';
    symbol?: string; // Legacy field for safety
    exercisePool?: CollectibleExercise[]; // Optional: defaults to exercises if missing

    // Deity Bio (from mythopedia)
    deityBio?: {
        description: string; // Who is this character?
        family: string; // Parents, siblings, children
        powers: string[]; // Special abilities/domains
    };
}

// PRIMARY_SET: Olympians, Titans, and major Heroes (never secondary unless variant)
export const PRIMARY_SET = new Set([
    // 12 Olympians
    'zeus', 'hera', 'poseidon', 'demeter', 'athena', 'apollo',
    'artemis', 'ares', 'aphrodite', 'hephaestus', 'hermes', 'hestia', 'dionysus',
    // Titans & Primordials
    'atlas', 'cronus', 'chronos', 'coeus', 'crius', 'hyperion', 'prometheus', 'themis', 'helios',
    // Heroes
    'heracles', 'perseus', 'nike', 'persephone', 'hades', 'pan', 'adonis',
    'daedalus_icarus', 'icarus', 'gaia',
    'chaos', 'ourea', 'nyx', 'erebus', 'tartarus', 'eros', 'pontus', 'aether', 'hemera', 'thalassa', 'oceanus', 'mnemosyne', 'phoebe', 'tethys', 'theia', 'thanatos', 'moirae', 'hypnos', 'hecate', 'ananke', 'phanes'
]);

// MONSTER_SET: Creatures, encounters, and traits (secondary only)
export const MONSTER_SET = new Set([
    'hydra', 'chimera', 'cerberus', 'sphinx', 'medusa', 'cyclopes', 'centaur',
    'minotaur', 'apollo_symbol', 'hephaestus_symbol', 'dionysus_symbol', 'hestia_symbol', 'icarus_2', 'scylla', 'pegasus'
]);

const ENCOUNTER_METADATA: Record<string, { thread: { title: string; subtitle: string }, traits: Array<{ id: string; title: string; subtitle: string }> }> = {
    'hydra': {
        thread: { title: 'Hydra Regen', subtitle: 'Each failure spawns more volume; cut the head by finishing the set.' },
        traits: [
            { id: 'venom', title: 'Venom', subtitle: 'Gradual fatigue buildup.' },
            { id: 'regeneration', title: 'Regeneration', subtitle: 'Faster recovery.' }
        ]
    },
    'chimera': {
        thread: { title: 'Chimera Heat', subtitle: 'Three different movement patterns in one session.' },
        traits: [
            { id: 'ferocity', title: 'Ferocity', subtitle: 'Attack with varied intensity.' },
            { id: 'synthesis', title: 'Synthesis', subtitle: 'Balanced power across all heads.' }
        ]
    },
    'medusa': {
        thread: { title: 'Gorgon Stare', subtitle: 'Focus on isometric holds and slow eccentrics.' },
        traits: [
            { id: 'petrification', title: 'Petrification', subtitle: 'Superior isometric tension.' },
            { id: 'gaze', title: 'Focused Gaze', subtitle: 'Mind-muscle connection.' }
        ]
    },
    'cerberus': {
        thread: { title: 'Underworld Guard', subtitle: 'Triple-set structure for maximum pressure.' },
        traits: [
            { id: 'vigilance', title: 'Vigilance', subtitle: 'Unwavering focus on form.' },
            { id: 'gatekeeper', title: 'Gatekeeper Strength', subtitle: 'Indomitable static holds.' }
        ]
    },
    'sphinx': {
        thread: { title: 'Sphinx Riddle', subtitle: 'Complex exercise variations requiring mental focus.' },
        traits: [
            { id: 'intellect', title: 'Intellect', subtitle: 'Mental focus beyond physical limits.' },
            { id: 'enigma', title: 'Enigma Form', subtitle: 'Complex movement patterns.' }
        ]
    },
    'centaur': {
        thread: { title: 'Chiron Wisdom', subtitle: 'Technique-first approach to heavy loads.' },
        traits: [
            { id: 'dual_nature', title: 'Dual Nature', subtitle: 'Versatile performance.' },
            { id: 'gallop', title: 'Gallop Power', subtitle: 'Explosive lower body drive.' }
        ]
    },
    'minotaur': {
        thread: { title: 'Labyrinth Run', subtitle: 'High-intensity maze of reps and sets.' },
        traits: [
            { id: 'brute_force', title: 'Brute Force', subtitle: 'Raw mechanical advantage.' },
            { id: 'tenacity', title: 'Tenacity', subtitle: 'Unbreakable will.' }
        ]
    }
};

export const normalizeIconRoles = (workout: CollectibleWorkout): {
    primaryIconId: string | undefined;
    secondaryIconIds: string[];
    thread?: { title: string; subtitle: string; };
    secondaryTraits?: Array<{ id: string; title: string; subtitle: string; }>;
} => {
    let primary = workout.primaryIconId;
    let secondary: string[] = [...(workout.secondaryIconIds || [])];

    secondary = secondary.filter(id => !PRIMARY_SET.has(id.toLowerCase()));

    if (!primary && secondary.length > 0) {
        const candidate = secondary.find(id => PRIMARY_SET.has(id.toLowerCase()));
        if (candidate) {
            primary = candidate;
            secondary = secondary.filter(id => id !== candidate);
        }
    }

    if (primary && MONSTER_SET.has(primary.toLowerCase())) {
        const cardName = workout.name.toLowerCase();
        const iconName = primary.toLowerCase();
        if (!cardName.includes(iconName) && cardName !== iconName) {
            console.warn('[IconRole] Monster used as primary for non-monster card', workout.id, primary);
        }
    }

    if (!primary) {
        console.warn('[IconRole] Missing primary icon', workout.id);
    }

    secondary = Array.from(new Set(secondary)).filter(id => id && id !== primary);

    let thread = workout.thread;
    let secondaryTraits = workout.secondaryTraits;

    if (!thread || !secondaryTraits || secondaryTraits.length === 0) {
        const firstSecondary = secondary[0]?.toLowerCase();
        if (firstSecondary && ENCOUNTER_METADATA[firstSecondary]) {
            const meta = ENCOUNTER_METADATA[firstSecondary];
            if (!thread) thread = meta.thread;
            if (!secondaryTraits || secondaryTraits.length === 0) secondaryTraits = meta.traits;
        }
    }

    return { primaryIconId: primary, secondaryIconIds: secondary, thread, secondaryTraits };
};

const SPLIT_WEIGHTS: Record<Position, Record<keyof PrimaryStats, number>> = {
    PULL: { STR: 1.0, VOL: 1.0, END: 1.0, TMP: 0.5, PHY: 0.3, HYP: 0.5 },
    PUSH: { STR: 1.0, TMP: 1.0, HYP: 1.0, VOL: 0.5, END: 0.3, PHY: 0.5 },
    LEGS: { STR: 1.0, VOL: 1.0, PHY: 1.0, END: 0.5, TMP: 0.3, HYP: 0.5 }
};

export const calculateOVR = (stats: PrimaryStats, position: Position = 'PULL'): number => {
    const weights = SPLIT_WEIGHTS[position];
    let weightedSum = 0;
    let totalWeight = 0;

    (Object.keys(weights) as Array<keyof PrimaryStats>).forEach(stat => {
        const w = weights[stat];
        weightedSum += stats[stat] * w;
        totalWeight += w;
    });

    return Math.min(99, Math.round(weightedSum / totalWeight));
};

// Helper: obtain the authoritative calculated OVR for a CollectibleWorkout
export const getCalculatedOVRFromWorkout = (w: CollectibleWorkout): number => {
    return calculateOVR(w.baseStats, w.position);
};

export const getRarityFromOVR = (ovr: number): Rarity => {
    if (ovr >= 95) return 'DIVINE';
    if (ovr >= 90) return 'GOD';
    if (ovr >= 85) return 'LEGEND';
    if (ovr >= 80) return 'ICON';
    if (ovr >= 75) return 'TITAN';
    if (ovr >= 70) return 'GOLD';
    if (ovr >= 60) return 'SILVER';
    return 'BRONZE';
};

export const getExercisesByTier = (pool: CollectibleExercise[], rarity: Rarity): CollectibleExercise[] => {
    let limit = 4;
    if (rarity === 'LEGEND' || rarity === 'ICON' || rarity === 'GOD' || rarity === 'GODDESS' || rarity === 'DIVINE') limit = 8;
    else if (rarity === 'GOLD' || rarity === 'SILVER' || rarity === 'TITAN') limit = 6;
    return pool.slice(0, limit);
};

export const collectibleWorkouts: CollectibleWorkout[] = [
    {
        id: 'push_chaos', name: 'Chaos', position: 'PUSH',
        primaryIconId: 'chaos',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Chaos', SILVER: 'Chaos Vanguard', GOLD: 'Chaos Ascendant',
            TITAN: 'Chaos, The Eternal', ICON: 'Chaos, Higher Being', LEGEND: 'Chaos, Transcendental',
            PRIMORDIAL: 'Chaos, Genesis of All'
        },
        subtitle: 'The bottomless abyss at the beginning of the universe; absolute void.',
        secondaryTag: 'VANGUARD',
        rarity: 'PRIMORDIAL',
        category: 'PRIMORDIAL',
        lore: "Chaos (LVL 99 - PUSH): bench-press: 6x9x160kg • flat-barbell-bench-press: 5x9x140kg • chest-rope: 4x12x60kg • dumbbell-lateral-raise: 4x15x25kg • assisted-tricep-dip: 4x12x35kg • swinging-the-rope: 4x15x45kg.",
        duration: 90,
        exercisePool: [
            { id: 'bench_press', name: 'bench-press: 6x9x160kg' },
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 5x9x140kg' },
            { id: 'chest_rope', name: 'chest-rope: 4x12x60kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 4x15x25kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 4x12x35kg' },
            { id: 'swinging_the_rope', name: 'swinging-the-rope: 4x15x45kg' }
        ],
        exercises: [
            { id: 'bench_press', name: 'bench-press: 6x9x160kg' },
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 5x9x140kg' },
            { id: 'chest_rope', name: 'chest-rope: 4x12x60kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 4x15x25kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 4x12x35kg' },
            { id: 'swinging_the_rope', name: 'swinging-the-rope: 4x15x45kg' }
        ],
        baseLevel: 99,
        baseStats: {
            STR: 99,
            VOL: 89,
            TMP: 79,
            END: 84,
            PHY: 94,
            HYP: 99
        },
        subStats: [{ key: "potential", label: "Potential", value: 99, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Genesis of All',
            subtitle: 'A void that existed before everything, from which the universe was born. Represents nothingness and the origin of all creation. Has no family; the first source of creation.'
        }
    }, {
        id: 'legs_gaia', name: 'Gaia', position: 'LEGS',
        primaryIconId: 'gaia',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Gaia', SILVER: 'Gaia Vanguard', GOLD: 'Gaia Ascendant',
            TITAN: 'Gaia, The Eternal', ICON: 'Gaia, Higher Being', LEGEND: 'Gaia, Transcendental',
            PRIMORDIAL: 'Gaia, Genesis of All'
        },
        subtitle: 'The unshakable foundation of all things; mother of creation.',
        secondaryTag: 'VANGUARD',
        rarity: 'PRIMORDIAL',
        category: 'PRIMORDIAL',
        lore: "Gaia (LVL 98 - LEGS): leg-press: 6x9x450kg • hip-raise-dumbbell: 5x9x95kg • seated-hip-adduction: 5x12x100kg • outdoor-walk: 45 min • cross-trainer: 30 min.",
        duration: 90,
        exercisePool: [
            { id: 'leg_press', name: 'leg-press: 6x9x450kg' },
            { id: 'hip_raise_dumbbell', name: 'hip-raise-dumbbell: 5x9x95kg' },
            { id: 'seated_hip_adduction', name: 'seated-hip-adduction: 5x12x100kg' },
            { id: 'outdoor_walk', name: 'outdoor-walk: 45 min' },
            { id: 'cross_trainer', name: 'cross-trainer: 30 min' }
        ],
        exercises: [
            { id: 'leg_press', name: 'leg-press: 6x9x450kg' },
            { id: 'hip_raise_dumbbell', name: 'hip-raise-dumbbell: 5x9x95kg' },
            { id: 'seated_hip_adduction', name: 'seated-hip-adduction: 5x12x100kg' },
            { id: 'outdoor_walk', name: 'outdoor-walk: 45 min' },
            { id: 'cross_trainer', name: 'cross-trainer: 30 min' }
        ],
        baseLevel: 98,
        baseStats: {
            STR: 98,
            VOL: 88,
            TMP: 78,
            END: 83,
            PHY: 93,
            HYP: 98
        },
        subStats: [{ key: "potential", label: "Potential", value: 98, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Mother of All',
            subtitle: 'The earth mother born from Chaos who created the mountains, sea, and sky. Represents fertility, earth, and agriculture. Mother and wife of Uranus.'
        }
    }, {
        id: 'push_hades', name: 'Hades', position: 'PUSH',
        primaryIconId: 'hades',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Hades', SILVER: 'Hades Vanguard', GOLD: 'Hades Ascendant',
            TITAN: 'Hades, The Eternal', ICON: 'Hades, Higher Being', LEGEND: 'Hades, Transcendental',
            PRIMORDIAL: 'Hades, Genesis of All'
        },
        subtitle: 'The inevitable lord of the dead; the unshakable oppressive force of the underworld.',
        secondaryTag: 'VANGUARD',
        rarity: 'UNDERWORLD',
        category: 'UNDERWORLD',
        lore: "Hades (LVL 98 - PUSH): bench-press: 5x9x155kg • decline-barbell: 5x9x135kg • assisted-tricep-dip: 4x12x40kg • chest-rope: 4x12x60kg • flat-barbell-bench-press: 5x9x140kg.",
        duration: 90,
        exercisePool: [
            { id: 'bench_press', name: 'bench-press: 5x9x155kg' },
            { id: 'decline_barbell', name: 'decline-barbell: 5x9x135kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 4x12x40kg' },
            { id: 'chest_rope', name: 'chest-rope: 4x12x60kg' },
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 5x9x140kg' }
        ],
        exercises: [
            { id: 'bench_press', name: 'bench-press: 5x9x155kg' },
            { id: 'decline_barbell', name: 'decline-barbell: 5x9x135kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 4x12x40kg' },
            { id: 'chest_rope', name: 'chest-rope: 4x12x60kg' },
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 5x9x140kg' }
        ],
        baseLevel: 98,
        baseStats: {
            STR: 98,
            VOL: 88,
            TMP: 78,
            END: 83,
            PHY: 93,
            HYP: 98
        },
        subStats: [{ key: "potential", label: "Potential", value: 98, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Underworld Lord',
            subtitle: 'Became the ruler of the underworld after the defeat of the Titans, kidnapping Persephone to make her his queen. Represents death and the end. Son of Cronus and Rhea; brother of Zeus.'
        }
    }, {
        id: 'push_cronus', name: 'Cronus', position: 'PUSH',
        primaryIconId: 'cronus',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Cronus', SILVER: 'Cronus Vanguard', GOLD: 'Cronus Ascendant',
            TITAN: 'Cronus, The Eternal', ICON: 'Cronus, Higher Being', LEGEND: 'Cronus, Transcendental',
            PRIMORDIAL: 'Cronus, Genesis of All'
        },
        subtitle: 'The relentless ruler of time who overthrew his father; Titan King.',
        secondaryTag: 'VANGUARD',
        rarity: 'PRIMORDIAL',
        category: 'PRIMORDIAL',
        lore: "Cronus (LVL 97 - PUSH): Swaddle-stone Medicine Ball Slams: 5x15xStone Deception • bench-press: 6x9x155kg • flat-barbell-bench-press: 5x9x135kg • decline-barbell: 4x9x125kg • assisted-tricep-dip: 4x12x35kg.",
        duration: 90,
        exercisePool: [
            { id: 'Swaddle_stone_Medicine_Ball_Slams', name: 'Swaddle-stone Medicine Ball Slams: 5x15xStone Deception' },
            { id: 'bench_press', name: 'bench-press: 6x9x155kg' },
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 5x9x135kg' },
            { id: 'decline_barbell', name: 'decline-barbell: 4x9x125kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 4x12x35kg' }
        ],
        exercises: [
            { id: 'Swaddle_stone_Medicine_Ball_Slams', name: 'Swaddle-stone Medicine Ball Slams: 5x15xStone Deception' },
            { id: 'bench_press', name: 'bench-press: 6x9x155kg' },
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 5x9x135kg' },
            { id: 'decline_barbell', name: 'decline-barbell: 4x9x125kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 4x12x35kg' }
        ],
        baseLevel: 97,
        baseStats: {
            STR: 97,
            VOL: 87,
            TMP: 78,
            END: 82,
            PHY: 92,
            HYP: 97
        },
        subStats: [{ key: "potential", label: "Potential", value: 97, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Titan King',
            subtitle: 'He seized the throne by castrating his father Uranus, but swallowed his own children out of fear of being overthrown by them. Represents the passage of time and inevitable cycles. Son of Uranus and Gaia; father of Zeus.'
        }
    }, {
        id: 'pull_moirae', name: 'Moirae', position: 'PULL',
        primaryIconId: 'moirae',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Moirae', SILVER: 'Moirae Vanguard', GOLD: 'Moirae Ascendant',
            TITAN: 'Moirae, The Eternal', ICON: 'Moirae, Higher Being', LEGEND: 'Moirae, Transcendental',
            PRIMORDIAL: 'Moirae, Genesis of All'
        },
        subtitle: 'The destiny that even gods cannot escape; masters of the thread of fate.',
        secondaryTag: 'VANGUARD',
        rarity: 'UNDERWORLD',
        category: 'UNDERWORLD',
        lore: "Moirae (LVL 97 - PULL): lat pulldown : 6x9x115kg • seated-cable-row: 5x9x105kg • Tbar-row: 5x9x110kg • rear-delt-fly: 4x15x20kg • pull-up: 4x9x30kg.",
        duration: 90,
        exercisePool: [
            { id: 'lat_pulldown', name: 'lat pulldown : 6x9x115kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 5x9x105kg' },
            { id: 'Tbar_row', name: 'Tbar-row: 5x9x110kg' },
            { id: 'rear_delt_fly', name: 'rear-delt-fly: 4x15x20kg' },
            { id: 'pull_up', name: 'pull-up: 4x9x30kg' }
        ],
        exercises: [
            { id: 'lat_pulldown', name: 'lat pulldown : 6x9x115kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 5x9x105kg' },
            { id: 'Tbar_row', name: 'Tbar-row: 5x9x110kg' },
            { id: 'rear_delt_fly', name: 'rear-delt-fly: 4x15x20kg' },
            { id: 'pull_up', name: 'pull-up: 4x9x30kg' }
        ],
        baseLevel: 97,
        baseStats: {
            STR: 97,
            VOL: 87,
            TMP: 78,
            END: 82,
            PHY: 92,
            HYP: 97
        },
        subStats: [{ key: "potential", label: "Potential", value: 97, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Fates',
            subtitle: 'Clotho, Lachesis, and Atropos; they spin, measure, and cut the thread of life. Represents absolute fate and unchangeable destiny. Daughters of Nyx.'
        }
    }, {
        id: 'push_uranus', name: 'Uranus', position: 'PUSH',
        primaryIconId: 'uranus',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Uranus', SILVER: 'Uranus Vanguard', GOLD: 'Uranus Ascendant',
            TITAN: 'Uranus, The Eternal', ICON: 'Uranus, Higher Being', LEGEND: 'Uranus, Transcendental',
            PRIMORDIAL: 'Uranus, Genesis of All'
        },
        subtitle: 'The primordial push of the heavens; ancient ruler.',
        secondaryTag: 'VANGUARD',
        rarity: 'PRIMORDIAL',
        category: 'PRIMORDIAL',
        lore: "Uranus (LVL 96 - PUSH): flat-barbell-bench-press: 5x9x140kg • incline-dumbbell-bench-press: 5x9x65kg • dumbbell-lateral-raise: 4x12x22kg • chest-rope: 4x12x50kg • assisted-tricep-dip: 4x15x40kg.",
        duration: 90,
        exercisePool: [
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 5x9x140kg' },
            { id: 'incline_dumbbell_bench_press', name: 'incline-dumbbell-bench-press: 5x9x65kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 4x12x22kg' },
            { id: 'chest_rope', name: 'chest-rope: 4x12x50kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 4x15x40kg' }
        ],
        exercises: [
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 5x9x140kg' },
            { id: 'incline_dumbbell_bench_press', name: 'incline-dumbbell-bench-press: 5x9x65kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 4x12x22kg' },
            { id: 'chest_rope', name: 'chest-rope: 4x12x50kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 4x15x40kg' }
        ],
        baseLevel: 96,
        baseStats: {
            STR: 96,
            VOL: 86,
            TMP: 77,
            END: 82,
            PHY: 91,
            HYP: 96
        },
        subStats: [{ key: "potential", label: "Potential", value: 96, primary: "STR" }],
        skills: [],
        thread: {
            title: 'King of the Sky',
            subtitle: 'The sky god born by Gaia who enveloped the world; he imprisoned his children in the depths of Gaia fearing them. Represents cosmic authority. Gaia\'s husband; father of the Titans.'
        }
    }, {
        id: 'pull_thanatos', name: 'Thanatos', position: 'PULL',
        primaryIconId: 'thanatos',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Thanatos', SILVER: 'Thanatos Vanguard', GOLD: 'Thanatos Ascendant',
            TITAN: 'Thanatos, The Eternal', ICON: 'Thanatos, Higher Being', LEGEND: 'Thanatos, Transcendental',
            PRIMORDIAL: 'Thanatos, Genesis of All'
        },
        subtitle: 'The power that tears life from the body; death personified.',
        secondaryTag: 'VANGUARD',
        rarity: 'UNDERWORLD',
        category: 'UNDERWORLD',
        lore: "Thanatos (LVL 96 - PULL): pull-up: 5x9x35kg • lat pulldown : 5x12x100kg • one-arm-dumbbell-row: 4x9x55kg • dumbbell-concentration: 4x12x30kg • seated-cable-row: 5x12x90kg.",
        duration: 90,
        exercisePool: [
            { id: 'pull_up', name: 'pull-up: 5x9x35kg' },
            { id: 'lat_pulldown', name: 'lat pulldown : 5x12x100kg' },
            { id: 'one_arm_dumbbell_row', name: 'one-arm-dumbbell-row: 4x9x55kg' },
            { id: 'db_concentration_curl', name: 'dumbbell-concentration: 4x12x30kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 5x12x90kg' }
        ],
        exercises: [
            { id: 'pull_up', name: 'pull-up: 5x9x35kg' },
            { id: 'lat_pulldown', name: 'lat pulldown : 5x12x100kg' },
            { id: 'one_arm_dumbbell_row', name: 'one-arm-dumbbell-row: 4x9x55kg' },
            { id: 'db_concentration_curl', name: 'dumbbell-concentration: 4x12x30kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 5x12x90kg' }
        ],
        baseLevel: 96,
        baseStats: {
            STR: 96,
            VOL: 86,
            TMP: 77,
            END: 82,
            PHY: 91,
            HYP: 96
        },
        subStats: [{ key: "potential", label: "Potential", value: 96, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Personified Death',
            subtitle: 'A dark force that takes people\'s souls and starts the journey with no return. Represents death. Son of Nyx.'
        }
    }, {
        id: 'pull_nyx', name: 'Nyx', position: 'PULL',
        primaryIconId: 'nyx',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Nyx', SILVER: 'Nyx Vanguard', GOLD: 'Nyx Ascendant',
            TITAN: 'Nyx, The Eternal', ICON: 'Nyx, Higher Being', LEGEND: 'Nyx, Transcendental',
            PRIMORDIAL: 'Nyx, Genesis of All'
        },
        subtitle: 'Wrapping the world in her dark cloak; embodiment of night.',
        secondaryTag: 'VANGUARD',
        rarity: 'PRIMORDIAL',
        category: 'PRIMORDIAL',
        lore: "Nyx (LVL 95 - PULL): pull-up: 6x9x45kg • lat pulldown : 5x9x110kg • Tbar-row: 5x9x100kg • seated-cable-row: 4x12x95kg • rear-delt-fly: 4x15x18kg.",
        duration: 90,
        exercisePool: [
            { id: 'pull_up', name: 'pull-up: 6x9x45kg' },
            { id: 'lat_pulldown', name: 'lat pulldown : 5x9x110kg' },
            { id: 'Tbar_row', name: 'Tbar-row: 5x9x100kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x12x95kg' },
            { id: 'rear_delt_fly', name: 'rear-delt-fly: 4x15x18kg' }
        ],
        exercises: [
            { id: 'pull_up', name: 'pull-up: 6x9x45kg' },
            { id: 'lat_pulldown', name: 'lat pulldown : 5x9x110kg' },
            { id: 'Tbar_row', name: 'Tbar-row: 5x9x100kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x12x95kg' },
            { id: 'rear_delt_fly', name: 'rear-delt-fly: 4x15x18kg' }
        ],
        baseLevel: 95,
        baseStats: {
            STR: 95,
            VOL: 86,
            TMP: 76,
            END: 81,
            PHY: 90,
            HYP: 95
        },
        subStats: [{ key: "potential", label: "Potential", value: 95, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Goddess of Night',
            subtitle: 'A dark and mysterious power born from Chaos that even the most powerful gods fear. Represents night. Daughter of Chaos.'
        }
    }, {
        id: 'pull_erebus', name: 'Erebus', position: 'PULL',
        primaryIconId: 'erebus',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Erebus', SILVER: 'Erebus Vanguard', GOLD: 'Erebus Ascendant',
            TITAN: 'Erebus, The Eternal', ICON: 'Erebus, Higher Being', LEGEND: 'Erebus, Transcendental',
            PRIMORDIAL: 'Erebus, Genesis of All'
        },
        subtitle: 'Deep darkness; architect of shadows.',
        secondaryTag: 'VANGUARD',
        rarity: 'PRIMORDIAL',
        category: 'PRIMORDIAL',
        lore: "Erebus (LVL 94 - PULL): Tbar-row: 6x9x110kg • one-arm-dumbbell-row: 5x9x50kg • lat pulldown : 5x12x95kg • seated-cable-row: 4x12x90kg.",
        duration: 90,
        exercisePool: [
            { id: 'Tbar_row', name: 'Tbar-row: 6x9x110kg' },
            { id: 'one_arm_dumbbell_row', name: 'one-arm-dumbbell-row: 5x9x50kg' },
            { id: 'lat_pulldown', name: 'lat pulldown : 5x12x95kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x12x90kg' }
        ],
        exercises: [
            { id: 'Tbar_row', name: 'Tbar-row: 6x9x110kg' },
            { id: 'one_arm_dumbbell_row', name: 'one-arm-dumbbell-row: 5x9x50kg' },
            { id: 'lat_pulldown', name: 'lat pulldown : 5x12x95kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x12x90kg' }
        ],
        baseLevel: 94,
        baseStats: {
            STR: 94,
            VOL: 85,
            TMP: 75,
            END: 80,
            PHY: 89,
            HYP: 94
        },
        subStats: [{ key: "potential", label: "Potential", value: 94, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Shadow Architect',
            subtitle: 'The personification of darkness who was born from Chaos. Represents the shadows and the void. Brother and husband of Nyx.'
        }
    }, {
        id: 'pull_ananke', name: 'Ananke', position: 'PULL',
        primaryIconId: 'ananke',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Ananke', SILVER: 'Ananke Vanguard', GOLD: 'Ananke Ascendant',
            TITAN: 'Ananke, The Eternal', ICON: 'Ananke, Higher Being', LEGEND: 'Ananke, Transcendental',
            PRIMORDIAL: 'Ananke, Genesis of All'
        },
        subtitle: 'The unshakable control of Fate; inevitability.',
        secondaryTag: 'VANGUARD',
        rarity: 'PRIMORDIAL',
        category: 'PRIMORDIAL',
        lore: "Ananke (LVL 94 - PULL): lat pulldown : 5x9x105kg • seated-cable-row: 5x9x100kg • dumbbell-concentration: 4x12x30kg • rear-delt-fly: 4x15x20kg.",
        duration: 90,
        exercisePool: [
            { id: 'lat_pulldown', name: 'lat pulldown : 5x9x105kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 5x9x100kg' },
            { id: 'db_concentration_curl', name: 'dumbbell-concentration: 4x12x30kg' },
            { id: 'rear_delt_fly', name: 'rear-delt-fly: 4x15x20kg' }
        ],
        exercises: [
            { id: 'lat_pulldown', name: 'lat pulldown : 5x9x105kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 5x9x100kg' },
            { id: 'db_concentration_curl', name: 'dumbbell-concentration: 4x12x30kg' },
            { id: 'rear_delt_fly', name: 'rear-delt-fly: 4x15x20kg' }
        ],
        baseLevel: 94,
        baseStats: {
            STR: 94,
            VOL: 85,
            TMP: 75,
            END: 80,
            PHY: 89,
            HYP: 94
        },
        subStats: [{ key: "potential", label: "Potential", value: 94, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Necessity',
            subtitle: 'Symbolizes the absolute necessities and unavoidable conditions in the workings of the universe. Represents universal order. Pairs with Chronos.'
        }
    }, {
        id: 'legs_tartarus', name: 'Tartarus', position: 'LEGS',
        primaryIconId: 'tartarus',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Tartarus', SILVER: 'Tartarus Vanguard', GOLD: 'Tartarus Ascendant',
            TITAN: 'Tartarus, The Eternal', ICON: 'Tartarus, Higher Being', LEGEND: 'Tartarus, Transcendental',
            PRIMORDIAL: 'Tartarus, Genesis of All'
        },
        subtitle: 'Yeraltının en derin uçurumu; sonsuz hapis.',
        secondaryTag: 'Primordial',
        rarity: 'UNDERWORLD',
        category: 'UNDERWORLD',
        lore: "Tartarus (LVL 93 - LEGS): leg-press: 8x9x500kg • hip-raise-dumbbell: 4x9x90kg • outdoor-walk: 40 min • seated-hip-adduction: 4x12x120kg.",
        duration: 90,
        exercisePool: [
            { id: 'leg_press', name: 'leg-press: 8x9x500kg' },
            { id: 'hip_raise_dumbbell', name: 'hip-raise-dumbbell: 4x9x90kg' },
            { id: 'outdoor_walk', name: 'outdoor-walk: 40 min' },
            { id: 'seated_hip_adduction', name: 'seated-hip-adduction: 4x12x120kg' }
        ],
        exercises: [
            { id: 'leg_press', name: 'leg-press: 8x9x500kg' },
            { id: 'hip_raise_dumbbell', name: 'hip-raise-dumbbell: 4x9x90kg' },
            { id: 'outdoor_walk', name: 'outdoor-walk: 40 min' },
            { id: 'seated_hip_adduction', name: 'seated-hip-adduction: 4x12x120kg' }
        ],
        baseLevel: 93,
        baseStats: {
            STR: 93,
            VOL: 84,
            TMP: 74,
            END: 79,
            PHY: 88,
            HYP: 93
        },
        subStats: [{ key: "potential", label: "Potential", value: 93, primary: "STR" }],
        skills: [],
        deityBio: {
            description: "Yeraltının en derin uçurumu; sonsuz hapis.",
            family: "Mythological Entity",
            powers: ["Divine Strength"]
        }
    }, {
        id: 'pull_eros', name: 'Eros', position: 'PULL',
        primaryIconId: 'eros',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Eros', SILVER: 'Eros Vanguard', GOLD: 'Eros Ascendant',
            TITAN: 'Eros, The Eternal', ICON: 'Eros, Higher Being', LEGEND: 'Eros, Transcendental',
            PRIMORDIAL: 'Eros, Genesis of All'
        },
        subtitle: 'Arzu ve çekimin evrensel gücü.',
        secondaryTag: 'Primordial',
        rarity: 'PRIMORDIAL',
        category: 'PRIMORDIAL',
        lore: "Eros (LVL 92 - PULL): pull-up: 5x9x35kg • lat pulldown : 5x12x90kg • seated-cable-row: 4x12x85kg • bicep-dumbbell: 4x12x25kg.",
        duration: 90,
        exercisePool: [
            { id: 'pull_up', name: 'pull-up: 5x9x35kg' },
            { id: 'lat_pulldown', name: 'lat pulldown : 5x12x90kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x12x85kg' },
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 4x12x25kg' }
        ],
        exercises: [
            { id: 'pull_up', name: 'pull-up: 5x9x35kg' },
            { id: 'lat_pulldown', name: 'lat pulldown : 5x12x90kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x12x85kg' },
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 4x12x25kg' }
        ],
        baseLevel: 92,
        baseStats: {
            STR: 92,
            VOL: 83,
            TMP: 74,
            END: 78,
            PHY: 87,
            HYP: 92
        },
        subStats: [{ key: "potential", label: "Potential", value: 92, primary: "STR" }],
        skills: [],
        deityBio: {
            description: "Arzu ve çekimin evrensel gücü.",
            family: "Mythological Entity",
            powers: ["Divine Strength"]
        }
    }, {
        id: 'push_aether', name: 'Aether', position: 'PUSH',
        primaryIconId: 'aether',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Aether', SILVER: 'Aether Vanguard', GOLD: 'Aether Ascendant',
            TITAN: 'Aether, The Eternal', ICON: 'Aether, Higher Being', LEGEND: 'Aether, Transcendental',
            PRIMORDIAL: 'Aether, Genesis of All'
        },
        subtitle: 'Üst göklerin saf ve parlayan ışığı.',
        secondaryTag: 'Primordial',
        rarity: 'PRIMORDIAL',
        category: 'PRIMORDIAL',
        lore: "Aether (LVL 91 - PUSH): incline-dumbbell-bench-press: 6x9x55kg • chest-rope: 5x9x45kg • dumbbell-lateral-raise: 4x15x20kg • assisted-tricep-dip: 4x12x30kg.",
        duration: 90,
        exercisePool: [
            { id: 'incline_dumbbell_bench_press', name: 'incline-dumbbell-bench-press: 6x9x55kg' },
            { id: 'chest_rope', name: 'chest-rope: 5x9x45kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 4x15x20kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 4x12x30kg' }
        ],
        exercises: [
            { id: 'incline_dumbbell_bench_press', name: 'incline-dumbbell-bench-press: 6x9x55kg' },
            { id: 'chest_rope', name: 'chest-rope: 5x9x45kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 4x15x20kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 4x12x30kg' }
        ],
        baseLevel: 91,
        baseStats: {
            STR: 91,
            VOL: 82,
            TMP: 73,
            END: 77,
            PHY: 86,
            HYP: 91
        },
        subStats: [{ key: "potential", label: "Potential", value: 91, primary: "STR" }],
        skills: [],
        deityBio: {
            description: "Üst göklerin saf ve parlayan ışığı.",
            family: "Mythological Entity",
            powers: ["Divine Strength"]
        }
    }, {
        id: 'push_hemera', name: 'Hemera', position: 'PUSH',
        primaryIconId: 'hemera',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Hemera', SILVER: 'Hemera Vanguard', GOLD: 'Hemera Ascendant',
            TITAN: 'Hemera, The Eternal', ICON: 'Hemera, Higher Being', LEGEND: 'Hemera, Transcendental',
            PRIMORDIAL: 'Hemera, Genesis of All'
        },
        subtitle: 'Günün aydınlığı; karanlığı kovan güç.',
        secondaryTag: 'Primordial',
        rarity: 'PRIMORDIAL',
        category: 'PRIMORDIAL',
        lore: "Hemera (LVL 90 - PUSH): flat-barbell-bench-press: 5x9x110kg • dumbbell-lateral-raise: 4x12x20kg • chest-rope: 4x12x40kg.",
        duration: 90,
        exercisePool: [
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 5x9x110kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 4x12x20kg' },
            { id: 'chest_rope', name: 'chest-rope: 4x12x40kg' }
        ],
        exercises: [
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 5x9x110kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 4x12x20kg' },
            { id: 'chest_rope', name: 'chest-rope: 4x12x40kg' }
        ],
        baseLevel: 90,
        baseStats: {
            STR: 90,
            VOL: 81,
            TMP: 72,
            END: 77,
            PHY: 86,
            HYP: 90
        },
        subStats: [{ key: "potential", label: "Potential", value: 90, primary: "STR" }],
        skills: [],
        deityBio: {
            description: "Günün aydınlığı; karanlığı kovan güç.",
            family: "Mythological Entity",
            powers: ["Divine Strength"]
        }
    }, {
        id: 'pull_thalassa', name: 'Thalassa', position: 'PULL',
        primaryIconId: 'thalassa',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Thalassa', SILVER: 'Thalassa Vanguard', GOLD: 'Thalassa Ascendant',
            TITAN: 'Thalassa, The Eternal', ICON: 'Thalassa, Higher Being', LEGEND: 'Thalassa, Transcendental',
            PRIMORDIAL: 'Thalassa, Genesis of All'
        },
        subtitle: 'Denizin ruhu; derinliklerin sessizliği.',
        secondaryTag: 'Primordial',
        rarity: 'PRIMORDIAL',
        category: 'PRIMORDIAL',
        lore: "Thalassa (LVL 88 - PULL): seated-cable-row: 5x9x95kg • bicep-dumbbell: 4x12x22kg • lat pulldown : 4x12x80kg.",
        duration: 90,
        exercisePool: [
            { id: 'seated_cable_row', name: 'seated-cable-row: 5x9x95kg' },
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 4x12x22kg' },
            { id: 'lat_pulldown', name: 'lat pulldown : 4x12x80kg' }
        ],
        exercises: [
            { id: 'seated_cable_row', name: 'seated-cable-row: 5x9x95kg' },
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 4x12x22kg' },
            { id: 'lat_pulldown', name: 'lat pulldown : 4x12x80kg' }
        ],
        baseLevel: 88,
        baseStats: {
            STR: 88,
            VOL: 79,
            TMP: 70,
            END: 75,
            PHY: 84,
            HYP: 88
        },
        subStats: [{ key: "potential", label: "Potential", value: 88, primary: "STR" }],
        skills: [],
        deityBio: {
            description: "Denizin ruhu; derinliklerin sessizliği.",
            family: "Mythological Entity",
            powers: ["Divine Strength"]
        }
    }, {
        id: 'pull_pontus', name: 'Pontus', position: 'PULL',
        primaryIconId: 'pontus',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Pontus', SILVER: 'Pontus Vanguard', GOLD: 'Pontus Ascendant',
            TITAN: 'Pontus, The Eternal', ICON: 'Pontus, Higher Being', LEGEND: 'Pontus, Transcendental',
            PRIMORDIAL: 'Pontus, Genesis of All'
        },
        subtitle: 'Denizlerin kadim gücü.',
        secondaryTag: 'Primordial',
        rarity: 'PRIMORDIAL',
        category: 'PRIMORDIAL',
        lore: "Pontus (LVL 87 - PULL): lat pulldown : 5x9x90kg • one-arm-dumbbell-row: 4x12x45kg • rear-delt-fly: 4x15x15kg.",
        duration: 90,
        exercisePool: [
            { id: 'lat_pulldown', name: 'lat pulldown : 5x9x90kg' },
            { id: 'one_arm_dumbbell_row', name: 'one-arm-dumbbell-row: 4x12x45kg' },
            { id: 'rear_delt_fly', name: 'rear-delt-fly: 4x15x15kg' }
        ],
        exercises: [
            { id: 'lat_pulldown', name: 'lat pulldown : 5x9x90kg' },
            { id: 'one_arm_dumbbell_row', name: 'one-arm-dumbbell-row: 4x12x45kg' },
            { id: 'rear_delt_fly', name: 'rear-delt-fly: 4x15x15kg' }
        ],
        baseLevel: 87,
        baseStats: {
            STR: 87,
            VOL: 78,
            TMP: 70,
            END: 74,
            PHY: 83,
            HYP: 87
        },
        subStats: [{ key: "potential", label: "Potential", value: 87, primary: "STR" }],
        skills: [],
        deityBio: {
            description: "Denizlerin kadim gücü.",
            family: "Mythological Entity",
            powers: ["Divine Strength"]
        }
    }, {
        id: 'legs_ourea', name: 'Ourea', position: 'LEGS',
        primaryIconId: 'ourea',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Ourea', SILVER: 'Ourea Vanguard', GOLD: 'Ourea Ascendant',
            TITAN: 'Ourea, The Eternal', ICON: 'Ourea, Higher Being', LEGEND: 'Ourea, Transcendental',
            PRIMORDIAL: 'Ourea, Genesis of All'
        },
        subtitle: 'Dağların kadim ve sarsılmaz ruhu.',
        secondaryTag: 'Primordial',
        rarity: 'PRIMORDIAL',
        category: 'PRIMORDIAL',
        lore: "Ourea (LVL 86 - LEGS): leg-press: 5x12x250kg • outdoor-walk: 50 min.",
        duration: 90,
        exercisePool: [
            { id: 'leg_press', name: 'leg-press: 5x12x250kg' },
            { id: 'outdoor_walk', name: 'outdoor-walk: 50 min' }
        ],
        exercises: [
            { id: 'leg_press', name: 'leg-press: 5x12x250kg' },
            { id: 'outdoor_walk', name: 'outdoor-walk: 50 min' }
        ],
        baseLevel: 86,
        baseStats: {
            STR: 86,
            VOL: 77,
            TMP: 69,
            END: 73,
            PHY: 82,
            HYP: 86
        },
        subStats: [{ key: "potential", label: "Potential", value: 86, primary: "STR" }],
        skills: [],
        deityBio: {
            description: "Dağların kadim ve sarsılmaz ruhu.",
            family: "Mythological Entity",
            powers: ["Divine Strength"]
        }
    }, {
        id: 'push_phanes', name: 'Phanes', position: 'PUSH',
        primaryIconId: 'phanes',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Phanes', SILVER: 'Phanes Vanguard', GOLD: 'Phanes Ascendant',
            TITAN: 'Phanes, The Eternal', ICON: 'Phanes, Higher Being', LEGEND: 'Phanes, Transcendental',
            PRIMORDIAL: 'Phanes, Genesis of All'
        },
        subtitle: 'Yaratılışın ilk ışığı; her şeyi açığa çıkaran.',
        secondaryTag: 'Primordial',
        rarity: 'PRIMORDIAL',
        category: 'PRIMORDIAL',
        lore: "Phanes (LVL 85 - PUSH): flat-barbell-bench-press: 4x12x90kg • chest-rope: 4x15x35kg.",
        duration: 90,
        exercisePool: [
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 4x12x90kg' },
            { id: 'chest_rope', name: 'chest-rope: 4x15x35kg' }
        ],
        exercises: [
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 4x12x90kg' },
            { id: 'chest_rope', name: 'chest-rope: 4x15x35kg' }
        ],
        baseLevel: 85,
        baseStats: {
            STR: 85,
            VOL: 77,
            TMP: 68,
            END: 72,
            PHY: 81,
            HYP: 85
        },
        subStats: [{ key: "potential", label: "Potential", value: 85, primary: "STR" }],
        skills: [],
        deityBio: {
            description: "Yaratılışın ilk ışığı; her şeyi açığa çıkaran.",
            family: "Mythological Entity",
            powers: ["Divine Strength"]
        }
    }, {
        id: 'push_zeus', name: 'Zeus', position: 'PUSH', rarity: 'GOLD',
        primaryIconId: 'zeus',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Zeus', SILVER: 'Zeus Vanguard', GOLD: 'Zeus Ascendant',
            TITAN: 'Zeus, The Eternal', ICON: 'Zeus, Higher Being', LEGEND: 'Zeus, Transcendental',
            PRIMORDIAL: 'Zeus, Genesis of All'
        },
        subtitle: 'Absolute ruler of the heavens and lightning; king of the gods.',
        secondaryTag: 'VANGUARD',
        category: 'OLYMPIAN',
        lore: "Zeus (LVL 89 - PUSH): bench-press: 5x9x145kg • flat-barbell-bench-press: 4x9x125kg • chest-rope: 4x12x55kg • dumbbell-lateral-raise: 4x15x22kg • assisted-tricep-dip: 4x12x30kg.",
        duration: 90,
        exercisePool: [
            { id: 'bench_press', name: 'bench-press: 5x9x145kg' },
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 4x9x125kg' },
            { id: 'chest_rope', name: 'chest-rope: 4x12x55kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 4x15x22kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 4x12x30kg' }
        ],
        exercises: [
            { id: 'bench_press', name: 'bench-press: 5x9x145kg' },
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 4x9x125kg' },
            { id: 'chest_rope', name: 'chest-rope: 4x12x55kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 4x15x22kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 4x12x30kg' }
        ],
        baseLevel: 89,
        baseStats: {
            STR: 89,
            VOL: 80,
            TMP: 71,
            END: 76,
            PHY: 85,
            HYP: 89
        },
        subStats: [{ key: "potential", label: "Potential", value: 89, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Sky Ruler',
            subtitle: 'Absolute ruler of the heavens and lightning; king of the gods. Overthrew his father Cronus to save his siblings and fought the Titans to establish the new order. Represents justice and authority. Son of Cronus and Rhea; husband of Hera.'
        }
    }, {
        id: 'pull_poseidon', name: 'Poseidon', position: 'PULL', rarity: 'GOLD',
        primaryIconId: 'poseidon',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Poseidon', SILVER: 'Poseidon Vanguard', GOLD: 'Poseidon Ascendant',
            TITAN: 'Poseidon, The Eternal', ICON: 'Poseidon, Higher Being', LEGEND: 'Poseidon, Transcendental',
            PRIMORDIAL: 'Poseidon, Genesis of All'
        },
        subtitle: 'Unstoppable power in the depths of the ocean; lord of earthquakes.',
        secondaryTag: 'VANGUARD',
        category: 'OLYMPIAN',
        lore: "Poseidon (LVL 88 - PULL): lat pulldown : 5x9x110kg • seated-cable-row: 4x12x95kg • Tbar-row: 4x12x100kg • one-arm-dumbbell-row: 4x12x55kg • bicep-dumbbell: 3x15x22kg.",
        duration: 90,
        exercisePool: [
            { id: 'lat_pulldown', name: 'lat pulldown : 5x9x110kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x12x95kg' },
            { id: 'Tbar_row', name: 'Tbar-row: 4x12x100kg' },
            { id: 'one_arm_dumbbell_row', name: 'one-arm-dumbbell-row: 4x12x55kg' },
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 3x15x22kg' }
        ],
        exercises: [
            { id: 'lat_pulldown', name: 'lat pulldown : 5x9x110kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x12x95kg' },
            { id: 'Tbar_row', name: 'Tbar-row: 4x12x100kg' },
            { id: 'one_arm_dumbbell_row', name: 'one-arm-dumbbell-row: 4x12x55kg' },
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 3x15x22kg' }
        ],
        baseLevel: 88,
        baseStats: {
            STR: 88,
            VOL: 79,
            TMP: 70,
            END: 75,
            PHY: 84,
            HYP: 88
        },
        subStats: [{ key: "potential", label: "Potential", value: 88, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Sea Lord',
            subtitle: 'Unstoppable power in the depths of the ocean; lord of earthquakes. Stirred the seas and created tremors with his trident; competed with Athena for the patronage of Athens. Represents the seas and fury. Son of Cronus; brother of Zeus.'
        }
    }, {
        id: 'push_hera', name: 'Hera', position: 'PUSH', rarity: 'GOLD',
        primaryIconId: 'hera',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Hera', SILVER: 'Hera Vanguard', GOLD: 'Hera Ascendant',
            TITAN: 'Hera, The Eternal', ICON: 'Hera, Higher Being', LEGEND: 'Hera, Transcendental',
            PRIMORDIAL: 'Hera, Genesis of All'
        },
        subtitle: 'Queen of Olympus; protector of the family and marriage.',
        secondaryTag: 'VANGUARD',
        category: 'OLYMPIAN',
        lore: "Hera (LVL 87 - PUSH): chest-rope: 4x12x50kg • incline-dumbbell-bench-press: 4x12x40kg • dumbbell-lateral-raise: 4x15x18kg • flat-barbell-bench-press: 3x12x85kg • assisted-tricep-dip: 3x15x20kg.",
        duration: 90,
        exercisePool: [
            { id: 'chest_rope', name: 'chest-rope: 4x12x50kg' },
            { id: 'incline_dumbbell_bench_press', name: 'incline-dumbbell-bench-press: 4x12x40kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 4x15x18kg' },
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 3x12x85kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 3x15x20kg' }
        ],
        exercises: [
            { id: 'chest_rope', name: 'chest-rope: 4x12x50kg' },
            { id: 'incline_dumbbell_bench_press', name: 'incline-dumbbell-bench-press: 4x12x40kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 4x15x18kg' },
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 3x12x85kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 3x15x20kg' }
        ],
        baseLevel: 87,
        baseStats: {
            STR: 87,
            VOL: 78,
            TMP: 70,
            END: 74,
            PHY: 83,
            HYP: 87
        },
        subStats: [{ key: "potential", label: "Potential", value: 87, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Queen of Olympus',
            subtitle: 'Rules the kingdom as the wife of Zeus; known for punishing Zeus\'s lovers like Leto with jealousy. Represents marriage and loyalty. Daughter of Cronus and Rhea.'
        }
    }, {
        id: 'pull_athena', name: 'Athena', position: 'PULL', rarity: 'GOLD',
        primaryIconId: 'athena',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Athena', SILVER: 'Athena Vanguard', GOLD: 'Athena Ascendant',
            TITAN: 'Athena, The Eternal', ICON: 'Athena, Higher Being', LEGEND: 'Athena, Transcendental',
            PRIMORDIAL: 'Athena, Genesis of All'
        },
        subtitle: 'Sharp queen of intellect and strategy; protector of civilization.',
        secondaryTag: 'VANGUARD',
        category: 'OLYMPIAN',
        lore: "Athena (LVL 86 - PULL): lat pulldown : 5x12x95kg • pull-up: 3x9x25kg • seated-cable-row: 4x12x85kg • one-arm-dumbbell-row: 4x12x45kg • rear-delt-fly: 4x15x15kg • bicep-dumbbell: 3x15x18kg.",
        duration: 90,
        exercisePool: [
            { id: 'lat_pulldown', name: 'lat pulldown : 5x12x95kg' },
            { id: 'pull_up', name: 'pull-up: 3x9x25kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x12x85kg' },
            { id: 'one_arm_dumbbell_row', name: 'one-arm-dumbbell-row: 4x12x45kg' },
            { id: 'rear_delt_fly', name: 'rear-delt-fly: 4x15x15kg' },
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 3x15x18kg' }
        ],
        exercises: [
            { id: 'lat_pulldown', name: 'lat pulldown : 5x12x95kg' },
            { id: 'pull_up', name: 'pull-up: 3x9x25kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x12x85kg' },
            { id: 'one_arm_dumbbell_row', name: 'one-arm-dumbbell-row: 4x12x45kg' },
            { id: 'rear_delt_fly', name: 'rear-delt-fly: 4x15x15kg' },
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 3x15x18kg' }
        ],
        baseLevel: 86,
        baseStats: {
            STR: 86,
            VOL: 77,
            TMP: 69,
            END: 73,
            PHY: 82,
            HYP: 86
        },
        subStats: [{ key: "potential", label: "Potential", value: 86, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Wisdom Goddess',
            subtitle: 'Sharp queen of intellect and strategy; protector of civilization. Born from Zeus\'s head with her armor; gifted the olive tree to Athens to become the city\'s protector. Represents wisdom and strategic warfare. Daughter of Zeus.'
        }
    }, {
        id: 'push_ares', name: 'Ares', position: 'PUSH', rarity: 'GOLD',
        primaryIconId: 'ares',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Ares', SILVER: 'Ares Vanguard', GOLD: 'Ares Ascendant',
            TITAN: 'Ares, The Eternal', ICON: 'Ares, Higher Being', LEGEND: 'Ares, Transcendental',
            PRIMORDIAL: 'Ares, Genesis of All'
        },
        subtitle: 'Unbridled rage of war; god of violence and destruction.',
        secondaryTag: 'VANGUARD',
        category: 'OLYMPIAN',
        lore: "Ares (LVL 85 - PUSH): bench-press: 4x9x115kg • assisted-tricep-dip: 4x12x25kg • flat-barbell-bench-press: 4x10x100kg • chest-rope: 4x12x45kg • swinging-the-rope: 4x15x40kg.",
        duration: 90,
        exercisePool: [
            { id: 'bench_press', name: 'bench-press: 4x9x115kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 4x12x25kg' },
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 4x10x100kg' },
            { id: 'chest_rope', name: 'chest-rope: 4x12x45kg' },
            { id: 'swinging_the_rope', name: 'swinging-the-rope: 4x15x40kg' }
        ],
        exercises: [
            { id: 'bench_press', name: 'bench-press: 4x9x115kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 4x12x25kg' },
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 4x10x100kg' },
            { id: 'chest_rope', name: 'chest-rope: 4x12x45kg' },
            { id: 'swinging_the_rope', name: 'swinging-the-rope: 4x15x40kg' }
        ],
        baseLevel: 85,
        baseStats: {
            STR: 85,
            VOL: 77,
            TMP: 68,
            END: 72,
            PHY: 81,
            HYP: 85
        },
        subStats: [{ key: "potential", label: "Potential", value: 85, primary: "STR" }],
        skills: [],
        thread: {
            title: 'War God',
            subtitle: 'Unbridled rage of war; god of violence and destruction. Symbolizes the bloody and wild side of war, a quarrelsome and aggressive god. Represents physical violence and fury. Son of Zeus and Hera.'
        }
    }, {
        id: 'pull_apollo', name: 'Apollo', position: 'PULL', rarity: 'GOD',
        primaryIconId: 'apollo',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Apollo', SILVER: 'Apollo Vanguard', GOLD: 'Apollo Ascendant',
            TITAN: 'Apollo, The Eternal', ICON: 'Apollo, Higher Being', LEGEND: 'Apollo, Transcendental',
            PRIMORDIAL: 'Apollo, Genesis of All'
        },
        subtitle: 'Light of the sun and inspiration of art; master of prophecy.',
        secondaryTag: 'VANGUARD',
        category: 'OLYMPIAN',
        lore: "Apollo (LVL 84 - PULL): pull-up: 4x12x20kg • bicep-dumbbell: 4x15x25kg • lat pulldown : 4x12x75kg • seated-cable-row: 4x12x70kg • rear-delt-fly: 4x15x12kg.",
        duration: 90,
        exercisePool: [
            { id: 'pull_up', name: 'pull-up: 4x12x20kg' },
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 4x15x25kg' },
            { id: 'lat_pulldown', name: 'lat pulldown : 4x12x75kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x12x70kg' },
            { id: 'rear_delt_fly', name: 'rear-delt-fly: 4x15x12kg' }
        ],
        exercises: [
            { id: 'pull_up', name: 'pull-up: 4x12x20kg' },
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 4x15x25kg' },
            { id: 'lat_pulldown', name: 'lat pulldown : 4x12x75kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x12x70kg' },
            { id: 'rear_delt_fly', name: 'rear-delt-fly: 4x15x12kg' }
        ],
        baseLevel: 84,
        baseStats: {
            STR: 84,
            VOL: 76,
            TMP: 67,
            END: 71,
            PHY: 80,
            HYP: 84
        },
        subStats: [{ key: "potential", label: "Potential", value: 84, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Art Master',
            subtitle: 'Killed the Python serpent, plays the lyre, and heals but can spread disease with his arrows. Represents light, music, and truth. Son of Zeus and Leto.'
        }
    }, {
        id: 'pull_artemis', name: 'Artemis', position: 'PULL', rarity: 'GOD',
        primaryIconId: 'artemis',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Artemis', SILVER: 'Artemis Vanguard', GOLD: 'Artemis Ascendant',
            TITAN: 'Artemis, The Eternal', ICON: 'Artemis, Higher Being', LEGEND: 'Artemis, Transcendental',
            PRIMORDIAL: 'Artemis, Genesis of All'
        },
        subtitle: 'Agile queen of the wild; silver light of the moon.',
        secondaryTag: 'VANGUARD',
        category: 'OLYMPIAN',
        lore: "Artemis (LVL 83 - PULL): lat pulldown : 4x15x80kg • rear-delt-fly: 4x15x15kg • seated-cable-row: 4x12x75kg • one-arm-dumbbell-row: 4x12x45kg • bicep-dumbbell: 4x15x18kg.",
        duration: 90,
        exercisePool: [
            { id: 'lat_pulldown', name: 'lat pulldown : 4x15x80kg' },
            { id: 'rear_delt_fly', name: 'rear-delt-fly: 4x15x15kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x12x75kg' },
            { id: 'one_arm_dumbbell_row', name: 'one-arm-dumbbell-row: 4x12x45kg' },
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 4x15x18kg' }
        ],
        exercises: [
            { id: 'lat_pulldown', name: 'lat pulldown : 4x15x80kg' },
            { id: 'rear_delt_fly', name: 'rear-delt-fly: 4x15x15kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x12x75kg' },
            { id: 'one_arm_dumbbell_row', name: 'one-arm-dumbbell-row: 4x12x45kg' },
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 4x15x18kg' }
        ],
        baseLevel: 83,
        baseStats: {
            STR: 83,
            VOL: 75,
            TMP: 66,
            END: 71,
            PHY: 79,
            HYP: 83
        },
        subStats: [{ key: "potential", label: "Potential", value: 83, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Hunt Queen',
            subtitle: 'A free-spirited goddess who chases deer in the forests and protects her virginity and nature. Represents hunting and the wilderness. Daughter of Zeus and Leto.'
        }
    }, {
        id: 'push_hephaestus', name: 'Hephaestus', position: 'PUSH', rarity: 'GOD',
        primaryIconId: 'hephaestus',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Hephaestus', SILVER: 'Hephaestus Vanguard', GOLD: 'Hephaestus Ascendant',
            TITAN: 'Hephaestus, The Eternal', ICON: 'Hephaestus, Higher Being', LEGEND: 'Hephaestus, Transcendental',
            PRIMORDIAL: 'Hephaestus, Genesis of All'
        },
        subtitle: 'Blacksmith of the gods; master of craft and fire.',
        secondaryTag: 'VANGUARD',
        category: 'OLYMPIAN',
        lore: "Hephaestus (LVL 82 - PUSH): flat-barbell-bench-press: 5x12x130kg • bench-press: 4x12x120kg • assisted-tricep-dip: 4x12x30kg • chest-rope: 3x12x50kg • decline-barbell: 4x10x110kg.",
        duration: 90,
        exercisePool: [
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 5x12x130kg' },
            { id: 'bench_press', name: 'bench-press: 4x12x120kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 4x12x30kg' },
            { id: 'chest_rope', name: 'chest-rope: 3x12x50kg' },
            { id: 'decline_barbell', name: 'decline-barbell: 4x10x110kg' }
        ],
        exercises: [
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 5x12x130kg' },
            { id: 'bench_press', name: 'bench-press: 4x12x120kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 4x12x30kg' },
            { id: 'chest_rope', name: 'chest-rope: 3x12x50kg' },
            { id: 'decline_barbell', name: 'decline-barbell: 4x10x110kg' }
        ],
        baseLevel: 82,
        baseStats: {
            STR: 82,
            VOL: 74,
            TMP: 66,
            END: 70,
            PHY: 78,
            HYP: 82
        },
        subStats: [{ key: "potential", label: "Potential", value: 82, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Craft Master',
            subtitle: 'Master artist who made the gods\' armor and weapons, created Pandora from the earth. Represents craftsmanship and fire. Son of Hera.'
        }
    }, {
        id: 'legs_hermes', name: 'Hermes', position: 'LEGS', rarity: 'GOD',
        primaryIconId: 'hermes',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Hermes', SILVER: 'Hermes Vanguard', GOLD: 'Hermes Ascendant',
            TITAN: 'Hermes, The Eternal', ICON: 'Hermes, Higher Being', LEGEND: 'Hermes, Transcendental',
            PRIMORDIAL: 'Hermes, Genesis of All'
        },
        subtitle: 'Cunning messenger of the gods; lord of travelers.',
        secondaryTag: 'VANGUARD',
        category: 'OLYMPIAN',
        lore: "Hermes (LVL 81 - LEGS): outdoor-run: 40 min • jump-rope-new: 15 min • dumbbell-lunge-bicep-curl: 4x15x35kg • leg-press: 4x15x70kg • biking: 25 min.",
        duration: 90,
        exercisePool: [
            { id: 'outdoor_run', name: 'outdoor-run: 40 min' },
            { id: 'jump_rope_new', name: 'jump-rope-new: 15 min' },
            { id: 'dumbbell_lunge_bicep_curl', name: 'dumbbell-lunge-bicep-curl: 4x15x35kg' },
            { id: 'leg_press', name: 'leg-press: 4x15x70kg' },
            { id: 'biking', name: 'biking: 25 min' }
        ],
        exercises: [
            { id: 'outdoor_run', name: 'outdoor-run: 40 min' },
            { id: 'jump_rope_new', name: 'jump-rope-new: 15 min' },
            { id: 'dumbbell_lunge_bicep_curl', name: 'dumbbell-lunge-bicep-curl: 4x15x35kg' },
            { id: 'leg_press', name: 'leg-press: 4x15x70kg' },
            { id: 'biking', name: 'biking: 25 min' }
        ],
        baseLevel: 81,
        baseStats: {
            STR: 81,
            VOL: 73,
            TMP: 65,
            END: 69,
            PHY: 77,
            HYP: 81
        },
        subStats: [{ key: "potential", label: "Potential", value: 81, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Speed Master',
            subtitle: 'Speed master who carries Zeus\'s messages, delivers souls to the underworld, and is known for his cunning. Represents speed and communication. Son of Zeus and Maia.'
        }
    }, {
        id: 'legs_demeter', name: 'Demeter', position: 'LEGS', rarity: 'GOD',
        primaryIconId: 'demeter',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Demeter', SILVER: 'Demeter Vanguard', GOLD: 'Demeter Ascendant',
            TITAN: 'Demeter, The Eternal', ICON: 'Demeter, Higher Being', LEGEND: 'Demeter, Transcendental',
            PRIMORDIAL: 'Demeter, Genesis of All'
        },
        subtitle: 'Mother of fertility and harvest; ruler of the seasons.',
        secondaryTag: 'VANGUARD',
        category: 'OLYMPIAN',
        lore: "Demeter (LVL 80 - LEGS): leg-press: 4x15x220kg • hip-raise-dumbbell: 4x15x65kg • seated-hip-adduction: 4x15x80kg • outdoor-walk: 30 min • cross-trainer: 20 min.",
        duration: 90,
        exercisePool: [
            { id: 'leg_press', name: 'leg-press: 4x15x220kg' },
            { id: 'hip_raise_dumbbell', name: 'hip-raise-dumbbell: 4x15x65kg' },
            { id: 'seated_hip_adduction', name: 'seated-hip-adduction: 4x15x80kg' },
            { id: 'outdoor_walk', name: 'outdoor-walk: 30 min' },
            { id: 'cross_trainer', name: 'cross-trainer: 20 min' }
        ],
        exercises: [
            { id: 'leg_press', name: 'leg-press: 4x15x220kg' },
            { id: 'hip_raise_dumbbell', name: 'hip-raise-dumbbell: 4x15x65kg' },
            { id: 'seated_hip_adduction', name: 'seated-hip-adduction: 4x15x80kg' },
            { id: 'outdoor_walk', name: 'outdoor-walk: 30 min' },
            { id: 'cross_trainer', name: 'cross-trainer: 20 min' }
        ],
        baseLevel: 80,
        baseStats: {
            STR: 80,
            VOL: 72,
            TMP: 64,
            END: 68,
            PHY: 76,
            HYP: 80
        },
        subStats: [{ key: "potential", label: "Potential", value: 80, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Fertility Mother',
            subtitle: 'Mother of fertility and harvest; ruler of the seasons. Condemned the world to famine when her daughter Persephone was kidnapped, brought spring when reunited with her. Represents agriculture and fertility. Daughter of Cronus and Rhea.'
        }
    }, {
        id: 'push_aphrodite', name: 'Aphrodite', position: 'PUSH', rarity: 'GODDESS',
        primaryIconId: 'aphrodite',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Aphrodite', SILVER: 'Aphrodite Vanguard', GOLD: 'Aphrodite Ascendant',
            TITAN: 'Aphrodite, The Eternal', ICON: 'Aphrodite, Higher Being', LEGEND: 'Aphrodite, Transcendental',
            PRIMORDIAL: 'Aphrodite, Genesis of All'
        },
        subtitle: 'Absolute symbol of beauty; queen of love.',
        secondaryTag: 'VANGUARD',
        category: 'OLYMPIAN',
        lore: "Aphrodite (LVL 79 - PUSH): incline-dumbbell-bench-press: 4x15x30kg • chest-rope: 4x20x35kg • dumbbell-lateral-raise: 4x20x15kg • assisted-tricep-dip: 3x15x15kg.",
        duration: 90,
        exercisePool: [
            { id: 'incline_dumbbell_bench_press', name: 'incline-dumbbell-bench-press: 4x15x30kg' },
            { id: 'chest_rope', name: 'chest-rope: 4x20x35kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 4x20x15kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 3x15x15kg' }
        ],
        exercises: [
            { id: 'incline_dumbbell_bench_press', name: 'incline-dumbbell-bench-press: 4x15x30kg' },
            { id: 'chest_rope', name: 'chest-rope: 4x20x35kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 4x20x15kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 3x15x15kg' }
        ],
        baseLevel: 79,
        baseStats: {
            STR: 79,
            VOL: 71,
            TMP: 63,
            END: 67,
            PHY: 75,
            HYP: 79
        },
        subStats: [{ key: "potential", label: "Potential", value: 79, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Love Queen',
            subtitle: 'Born from sea foam, enchanted gods and humans, promised Paris the world\'s most beautiful woman. Represents love and charm. Born from the sea according to some, from Zeus according to others.'
        }
    }, {
        id: 'legs_hestia', name: 'Hestia', position: 'LEGS', rarity: 'GODDESS',
        primaryIconId: 'hestia',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Hestia', SILVER: 'Hestia Vanguard', GOLD: 'Hestia Ascendant',
            TITAN: 'Hestia, The Eternal', ICON: 'Hestia, Higher Being', LEGEND: 'Hestia, Transcendental',
            PRIMORDIAL: 'Hestia, Genesis of All'
        },
        subtitle: 'Sacred fire of the home; goddess of unshakable patience.',
        secondaryTag: 'VANGUARD',
        category: 'OLYMPIAN',
        lore: "Hestia (LVL 79 - LEGS): leg-press: 4x15x150kg • seated-hip-adduction: 4x15x75kg • outdoor-walk: 40 min • cross-trainer: 25 min.",
        duration: 90,
        exercisePool: [
            { id: 'leg_press', name: 'leg-press: 4x15x150kg' },
            { id: 'seated_hip_adduction', name: 'seated-hip-adduction: 4x15x75kg' },
            { id: 'outdoor_walk', name: 'outdoor-walk: 40 min' },
            { id: 'cross_trainer', name: 'cross-trainer: 25 min' }
        ],
        exercises: [
            { id: 'leg_press', name: 'leg-press: 4x15x150kg' },
            { id: 'seated_hip_adduction', name: 'seated-hip-adduction: 4x15x75kg' },
            { id: 'outdoor_walk', name: 'outdoor-walk: 40 min' },
            { id: 'cross_trainer', name: 'cross-trainer: 25 min' }
        ],
        baseLevel: 79,
        baseStats: {
            STR: 79,
            VOL: 71,
            TMP: 63,
            END: 67,
            PHY: 75,
            HYP: 79
        },
        subStats: [{ key: "potential", label: "Potential", value: 79, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Hearth Goddess',
            subtitle: 'Virgin goddess who guards the hearth in Olympus, protector of peace and order. Represents the family hearth and home peace. First daughter of Cronus.'
        }
    }, {
        id: 'legs_dionysus', name: 'Dionysus', position: 'LEGS', rarity: 'GOD',
        primaryIconId: 'dionysus',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Dionysus', SILVER: 'Dionysus Vanguard', GOLD: 'Dionysus Ascendant',
            TITAN: 'Dionysus, The Eternal', ICON: 'Dionysus, Higher Being', LEGEND: 'Dionysus, Transcendental',
            PRIMORDIAL: 'Dionysus, Genesis of All'
        },
        subtitle: 'God of ecstasy; source of the joy of life.',
        secondaryTag: 'VANGUARD',
        category: 'OLYMPIAN',
        lore: "Dionysus (LVL 79 - LEGS): dumbbell-lunge-bicep-curl: 4x12x40kg • leg-press: 4x12x160kg • biking: 20 min • outdoor-run: 20 min.",
        duration: 90,
        exercisePool: [
            { id: 'dumbbell_lunge_bicep_curl', name: 'dumbbell-lunge-bicep-curl: 4x12x40kg' },
            { id: 'leg_press', name: 'leg-press: 4x12x160kg' },
            { id: 'biking', name: 'biking: 20 min' },
            { id: 'outdoor_run', name: 'outdoor-run: 20 min' }
        ],
        exercises: [
            { id: 'dumbbell_lunge_bicep_curl', name: 'dumbbell-lunge-bicep-curl: 4x12x40kg' },
            { id: 'leg_press', name: 'leg-press: 4x12x160kg' },
            { id: 'biking', name: 'biking: 20 min' },
            { id: 'outdoor_run', name: 'outdoor-run: 20 min' }
        ],
        baseLevel: 79,
        baseStats: {
            STR: 79,
            VOL: 71,
            TMP: 63,
            END: 67,
            PHY: 75,
            HYP: 79
        },
        subStats: [{ key: "potential", label: "Potential", value: 79, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Life Joy',
            subtitle: 'Taught people how to make wine and have fun, married Ariadne on Naxos. Represents wine and artistic ecstasy. Son of Zeus and Semele.'
        }
    }, {
        id: 'push_atlas', name: 'Atlas', position: 'PUSH',
        primaryIconId: 'atlas',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Atlas', SILVER: 'Atlas Vanguard', GOLD: 'Atlas Ascendant',
            TITAN: 'Atlas, The Eternal', ICON: 'Atlas, Higher Being', LEGEND: 'Atlas, Transcendental',
            PRIMORDIAL: 'Atlas, Genesis of All'
        },
        subtitle: 'The massive shoulder carrying the celestial sphere.',
        secondaryTag: 'VANGUARD',
        rarity: 'TITAN',
        category: 'TITAN',
        lore: "Atlas (LVL 84 - PUSH): incline-dumbbell-bench-press: 6x9x65kg • flat-barbell-bench-press: 4x9x140kg • dumbbell-lateral-raise: 5x15x25kg • assisted-tricep-dip: 4x15x40kg • chest-rope: 4x12x55kg.",
        duration: 90,
        exercisePool: [
            { id: 'incline_dumbbell_bench_press', name: 'incline-dumbbell-bench-press: 6x9x65kg' },
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 4x9x140kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 5x15x25kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 4x15x40kg' },
            { id: 'chest_rope', name: 'chest-rope: 4x12x55kg' }
        ],
        exercises: [
            { id: 'incline_dumbbell_bench_press', name: 'incline-dumbbell-bench-press: 6x9x65kg' },
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 4x9x140kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 5x15x25kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 4x15x40kg' },
            { id: 'chest_rope', name: 'chest-rope: 4x12x55kg' }
        ],
        baseLevel: 84,
        baseStats: {
            STR: 84,
            VOL: 76,
            TMP: 67,
            END: 71,
            PHY: 80,
            HYP: 84
        },
        subStats: [{ key: "potential", label: "Potential", value: 84, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Celestial Bearer',
            subtitle: 'The massive shoulder carrying the celestial sphere. A Titan who fought against Zeus and was punished by being condemned to carry the sky on his shoulders forever. Represents endurance and the weight of the world. Son of Iapetus and Clymene.'
        }
    }, {
        id: 'legs_rhea', name: 'Rhea', position: 'LEGS',
        primaryIconId: 'rhea',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Rhea', SILVER: 'Rhea Vanguard', GOLD: 'Rhea Ascendant',
            TITAN: 'Rhea, The Eternal', ICON: 'Rhea, Higher Being', LEGEND: 'Rhea, Transcendental',
            PRIMORDIAL: 'Rhea, Genesis of All'
        },
        subtitle: 'Mother of the Olympian gods; symbol of flow and motherhood.',
        secondaryTag: 'VANGUARD',
        rarity: 'TITAN',
        category: 'TITAN',
        lore: "Rhea (LVL 83 - LEGS): Cretan Mountain Sprints: 8x100mxHidden King Load • Swaddle-Stone Medicine Ball Slams: 5x15xStone Deception • leg-press: 6x9x350kg • hip-raise-dumbbell: 4x9x85kg • outdoor-walk: 40 min.",
        duration: 90,
        exercisePool: [
            { id: 'Cretan_Mountain_Sprints', name: 'Cretan Mountain Sprints: 8x100mxHidden King Load' },
            { id: 'Swaddle_Stone_Medicine_Ball_Slams', name: 'Swaddle-Stone Medicine Ball Slams: 5x15xStone Deception' },
            { id: 'leg_press', name: 'leg-press: 6x9x350kg' },
            { id: 'hip_raise_dumbbell', name: 'hip-raise-dumbbell: 4x9x85kg' },
            { id: 'outdoor_walk', name: 'outdoor-walk: 40 min' }
        ],
        exercises: [
            { id: 'Cretan_Mountain_Sprints', name: 'Cretan Mountain Sprints: 8x100mxHidden King Load' },
            { id: 'Swaddle_Stone_Medicine_Ball_Slams', name: 'Swaddle-Stone Medicine Ball Slams: 5x15xStone Deception' },
            { id: 'leg_press', name: 'leg-press: 6x9x350kg' },
            { id: 'hip_raise_dumbbell', name: 'hip-raise-dumbbell: 4x9x85kg' },
            { id: 'outdoor_walk', name: 'outdoor-walk: 40 min' }
        ],
        baseLevel: 83,
        baseStats: {
            STR: 83,
            VOL: 75,
            TMP: 66,
            END: 71,
            PHY: 79,
            HYP: 83
        },
        subStats: [{ key: "potential", label: "Potential", value: 83, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Motherhood',
            subtitle: 'Mother of the Olympian gods; symbol of flow and motherhood. Saved Zeus from Cronus by tricking him with a stone, ensuring the survival of the new generation of gods. Represents protective motherhood and fertility. Wife of Cronus; mother of the First Olympians.'
        }
    }, {
        id: 'push_helios', name: 'Helios', position: 'PUSH',
        primaryIconId: 'helios',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Helios', SILVER: 'Helios Vanguard', GOLD: 'Helios Ascendant',
            TITAN: 'Helios, The Eternal', ICON: 'Helios, Higher Being', LEGEND: 'Helios, Transcendental',
            PRIMORDIAL: 'Helios, Genesis of All'
        },
        subtitle: 'High energy of the sun chariot.',
        secondaryTag: 'VANGUARD',
        rarity: 'TITAN',
        category: 'TITAN',
        lore: "Helios (LVL 82 - PUSH): bench-press: 5x9x125kg • flat-barbell-bench-press: 4x9x115kg • dumbbell-lateral-raise: 4x15x22kg • chest-rope: 4x12x50kg • assisted-tricep-dip: 3x12x30kg.",
        duration: 90,
        exercisePool: [
            { id: 'bench_press', name: 'bench-press: 5x9x125kg' },
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 4x9x115kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 4x15x22kg' },
            { id: 'chest_rope', name: 'chest-rope: 4x12x50kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 3x12x30kg' }
        ],
        exercises: [
            { id: 'bench_press', name: 'bench-press: 5x9x125kg' },
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 4x9x115kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 4x15x22kg' },
            { id: 'chest_rope', name: 'chest-rope: 4x12x50kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 3x12x30kg' }
        ],
        baseLevel: 82,
        baseStats: {
            STR: 82,
            VOL: 74,
            TMP: 66,
            END: 70,
            PHY: 78,
            HYP: 82
        },
        subStats: [{ key: "potential", label: "Potential", value: 82, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Sun Chariot',
            subtitle: 'High energy of the sun chariot. Represents the drive and power of the sun as it traverses the sky; father of Phaethon. Represents solar power and radiance. Son of Hyperion and Theia.'
        }
    }, {
        id: 'pull_prometheus', name: 'Prometheus', position: 'PULL',
        primaryIconId: 'prometheus',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Prometheus', SILVER: 'Prometheus Vanguard', GOLD: 'Prometheus Ascendant',
            TITAN: 'Prometheus, The Eternal', ICON: 'Prometheus, Higher Being', LEGEND: 'Prometheus, Transcendental',
            PRIMORDIAL: 'Prometheus, Genesis of All'
        },
        subtitle: 'The protector of humanity who stole fire.',
        secondaryTag: 'VANGUARD',
        rarity: 'TITAN',
        category: 'TITAN',
        lore: "Prometheus (LVL 81 - PULL): lat pulldown : 5x9x105kg • pull-up: 5x9x30kg • seated-cable-row: 4x12x90kg • one-arm-dumbbell-row: 4x12x55kg • rear-delt-fly: 4x15x30kg.",
        duration: 90,
        exercisePool: [
            { id: 'lat_pulldown', name: 'lat pulldown : 5x9x105kg' },
            { id: 'pull_up', name: 'pull-up: 5x9x30kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x12x90kg' },
            { id: 'one_arm_dumbbell_row', name: 'one-arm-dumbbell-row: 4x12x55kg' },
            { id: 'rear_delt_fly', name: 'rear-delt-fly: 4x15x30kg' }
        ],
        exercises: [
            { id: 'lat_pulldown', name: 'lat pulldown : 5x9x105kg' },
            { id: 'pull_up', name: 'pull-up: 5x9x30kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x12x90kg' },
            { id: 'one_arm_dumbbell_row', name: 'one-arm-dumbbell-row: 4x12x55kg' },
            { id: 'rear_delt_fly', name: 'rear-delt-fly: 4x15x30kg' }
        ],
        baseLevel: 81,
        baseStats: {
            STR: 81,
            VOL: 73,
            TMP: 65,
            END: 69,
            PHY: 77,
            HYP: 81
        },
        subStats: [{ key: "potential", label: "Potential", value: 81, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Humanity Protector',
            subtitle: 'The protector of humanity who stole fire. Tricked the gods to give humans fire and knowledge; endured eternal punishment for his sacrifice. Represents foresight and rebellion. Son of Iapetus.'
        }
    }, {
        id: 'push_hyperion', name: 'Hyperion', position: 'PUSH',
        primaryIconId: 'hyperion',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Hyperion', SILVER: 'Hyperion Vanguard', GOLD: 'Hyperion Ascendant',
            TITAN: 'Hyperion, The Eternal', ICON: 'Hyperion, Higher Being', LEGEND: 'Hyperion, Transcendental',
            PRIMORDIAL: 'Hyperion, Genesis of All'
        },
        subtitle: 'The source of celestial light; the high one.',
        secondaryTag: 'VANGUARD',
        rarity: 'TITAN',
        category: 'TITAN',
        lore: "Hyperion (LVL 80 - PUSH): bench-press: 5x9x125kg • decline-barbell: 4x9x115kg • dumbbell-lateral-raise: 4x15x22kg • chest-rope: 4x12x50kg.",
        duration: 90,
        exercisePool: [
            { id: 'bench_press', name: 'bench-press: 5x9x125kg' },
            { id: 'decline_barbell', name: 'decline-barbell: 4x9x115kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 4x15x22kg' },
            { id: 'chest_rope', name: 'chest-rope: 4x12x50kg' }
        ],
        exercises: [
            { id: 'bench_press', name: 'bench-press: 5x9x125kg' },
            { id: 'decline_barbell', name: 'decline-barbell: 4x9x115kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 4x15x22kg' },
            { id: 'chest_rope', name: 'chest-rope: 4x12x50kg' }
        ],
        baseLevel: 80,
        baseStats: {
            STR: 80,
            VOL: 72,
            TMP: 64,
            END: 68,
            PHY: 76,
            HYP: 80
        },
        subStats: [{ key: "potential", label: "Potential", value: 80, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Celestial Light',
            subtitle: 'The source of celestial light; the high one. One of the first generation Titans who represents the observation from above and the fundamental light of the heavens. Represents the sun, moon, and dawn. Son of Uranus and Gaia.'
        }
    }, {
        id: 'push_theia', name: 'Theia', position: 'PUSH',
        primaryIconId: 'theia',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Theia', SILVER: 'Theia Vanguard', GOLD: 'Theia Ascendant',
            TITAN: 'Theia, The Eternal', ICON: 'Theia, Higher Being', LEGEND: 'Theia, Transcendental',
            PRIMORDIAL: 'Theia, Genesis of All'
        },
        subtitle: 'Mother of the luminaries; the goddess of shining light.',
        secondaryTag: 'VANGUARD',
        rarity: 'TITAN',
        category: 'TITAN',
        lore: "Theia (LVL 79 - PUSH): flat-barbell-bench-press: 4x9x105kg • incline-dumbbell-bench-press: 4x9x50kg • dumbbell-lateral-raise: 4x15x20kg • chest-rope: 4x15x40kg.",
        duration: 90,
        exercisePool: [
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 4x9x105kg' },
            { id: 'incline_dumbbell_bench_press', name: 'incline-dumbbell-bench-press: 4x9x50kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 4x15x20kg' },
            { id: 'chest_rope', name: 'chest-rope: 4x15x40kg' }
        ],
        exercises: [
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 4x9x105kg' },
            { id: 'incline_dumbbell_bench_press', name: 'incline-dumbbell-bench-press: 4x9x50kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 4x15x20kg' },
            { id: 'chest_rope', name: 'chest-rope: 4x15x40kg' }
        ],
        baseLevel: 79,
        baseStats: {
            STR: 79,
            VOL: 71,
            TMP: 63,
            END: 67,
            PHY: 75,
            HYP: 79
        },
        subStats: [{ key: "potential", label: "Potential", value: 79, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Radiance Sight',
            subtitle: 'Mother of the luminaries; the goddess of shining light. Gave birth to the Sun, Moon, and Dawn; represents the clarity of sight and the value of gold and gems. Represents radiance and vision. Wife and sister of Hyperion.'
        }
    }, {
        id: 'push_iapetus', name: 'Iapetus', position: 'PUSH',
        primaryIconId: 'iapetus',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Iapetus', SILVER: 'Iapetus Vanguard', GOLD: 'Iapetus Ascendant',
            TITAN: 'Iapetus, The Eternal', ICON: 'Iapetus, Higher Being', LEGEND: 'Iapetus, Transcendental',
            PRIMORDIAL: 'Iapetus, Genesis of All'
        },
        subtitle: 'Harsh boundaries of mortality.',
        secondaryTag: 'VANGUARD',
        rarity: 'TITAN',
        category: 'TITAN',
        lore: "Iapetus (LVL 78 - PUSH): bench-press: 5x9x130kg • decline-barbell: 4x9x115kg • assisted-tricep-dip: 4x12x30kg • chest-rope: 3x12x45kg.",
        duration: 90,
        exercisePool: [
            { id: 'bench_press', name: 'bench-press: 5x9x130kg' },
            { id: 'decline_barbell', name: 'decline-barbell: 4x9x115kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 4x12x30kg' },
            { id: 'chest_rope', name: 'chest-rope: 3x12x45kg' }
        ],
        exercises: [
            { id: 'bench_press', name: 'bench-press: 5x9x130kg' },
            { id: 'decline_barbell', name: 'decline-barbell: 4x9x115kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 4x12x30kg' },
            { id: 'chest_rope', name: 'chest-rope: 3x12x45kg' }
        ],
        baseLevel: 78,
        baseStats: {
            STR: 78,
            VOL: 70,
            TMP: 62,
            END: 66,
            PHY: 74,
            HYP: 78
        },
        subStats: [{ key: "potential", label: "Potential", value: 78, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Mortality Titan',
            subtitle: 'Harsh boundaries of mortality. One of the four Titans who held Uranus down during his castration; ancestor of the human race through his sons. Represents mortality and craftsmanship. Son of Uranus and Gaia.'
        }
    }, {
        id: 'pull_oceanus', name: 'Oceanus', position: 'PULL',
        primaryIconId: 'oceanus',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Oceanus', SILVER: 'Oceanus Vanguard', GOLD: 'Oceanus Ascendant',
            TITAN: 'Oceanus, The Eternal', ICON: 'Oceanus, Higher Being', LEGEND: 'Oceanus, Transcendental',
            PRIMORDIAL: 'Oceanus, Genesis of All'
        },
        subtitle: 'The infinite river encircling the world.',
        secondaryTag: 'VANGUARD',
        rarity: 'TITAN',
        category: 'TITAN',
        lore: "Oceanus (LVL 77 - PULL): Tbar-row: 5x9x115kg • seated-cable-row: 5x12x105kg • lat pulldown : 4x12x110kg • one-arm-dumbbell-row: 4x12x60kg.",
        duration: 90,
        exercisePool: [
            { id: 'Tbar_row', name: 'Tbar-row: 5x9x115kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 5x12x105kg' },
            { id: 'lat_pulldown', name: 'lat pulldown : 4x12x110kg' },
            { id: 'one_arm_dumbbell_row', name: 'one-arm-dumbbell-row: 4x12x60kg' }
        ],
        exercises: [
            { id: 'Tbar_row', name: 'Tbar-row: 5x9x115kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 5x12x105kg' },
            { id: 'lat_pulldown', name: 'lat pulldown : 4x12x110kg' },
            { id: 'one_arm_dumbbell_row', name: 'one-arm-dumbbell-row: 4x12x60kg' }
        ],
        baseLevel: 77,
        baseStats: {
            STR: 77,
            VOL: 69,
            TMP: 62,
            END: 65,
            PHY: 73,
            HYP: 77
        },
        subStats: [{ key: "potential", label: "Potential", value: 77, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Great River',
            subtitle: 'The infinite river encircling the world. Represents the fresh waters of the earth and the boundary of the known world, stayed neutral during the Titan War. Represents the cosmic water. Son of Uranus and Gaia.'
        }
    }, {
        id: 'pull_tethys', name: 'Tethys', position: 'PULL',
        primaryIconId: 'tethys',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Tethys', SILVER: 'Tethys Vanguard', GOLD: 'Tethys Ascendant',
            TITAN: 'Tethys, The Eternal', ICON: 'Tethys, Higher Being', LEGEND: 'Tethys, Transcendental',
            PRIMORDIAL: 'Tethys, Genesis of All'
        },
        subtitle: 'The ancient mother of rivers and clouds.',
        secondaryTag: 'VANGUARD',
        rarity: 'TITAN',
        category: 'TITAN',
        lore: "Tethys (LVL 76 - PULL): seated-cable-row: 5x9x90kg • lat pulldown : 4x12x85kg • bicep-dumbbell: 4x15x20kg • one-arm-dumbbell-row: 4x12x45kg.",
        duration: 90,
        exercisePool: [
            { id: 'seated_cable_row', name: 'seated-cable-row: 5x9x90kg' },
            { id: 'lat_pulldown', name: 'lat pulldown : 4x12x85kg' },
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 4x15x20kg' },
            { id: 'one_arm_dumbbell_row', name: 'one-arm-dumbbell-row: 4x12x45kg' }
        ],
        exercises: [
            { id: 'seated_cable_row', name: 'seated-cable-row: 5x9x90kg' },
            { id: 'lat_pulldown', name: 'lat pulldown : 4x12x85kg' },
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 4x15x20kg' },
            { id: 'one_arm_dumbbell_row', name: 'one-arm-dumbbell-row: 4x12x45kg' }
        ],
        baseLevel: 76,
        baseStats: {
            STR: 76,
            VOL: 68,
            TMP: 61,
            END: 65,
            PHY: 72,
            HYP: 76
        },
        subStats: [{ key: "potential", label: "Potential", value: 76, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Fresh Water Mother',
            subtitle: 'The ancient mother of rivers and clouds. Ruler of the waters with Oceanus; gave birth to three thousand river gods and three thousand ocean nymphs. Represents the origin of water. Wife and sister of Oceanus.'
        }
    }, {
        id: 'legs_leto', name: 'Leto', position: 'LEGS',
        primaryIconId: 'leto',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Leto', SILVER: 'Leto Vanguard', GOLD: 'Leto Ascendant',
            TITAN: 'Leto, The Eternal', ICON: 'Leto, Higher Being', LEGEND: 'Leto, Transcendental',
            PRIMORDIAL: 'Leto, Genesis of All'
        },
        subtitle: 'The suffering but powerful mother of the divine twins.',
        secondaryTag: 'VANGUARD',
        rarity: 'TITAN',
        category: 'TITAN',
        lore: "Leto (LVL 75 - LEGS): leg-press: 4x12x180kg • outdoor-walk: 45 min • seated-hip-adduction: 4x15x70kg • cross-trainer: 30 min.",
        duration: 90,
        exercisePool: [
            { id: 'leg_press', name: 'leg-press: 4x12x180kg' },
            { id: 'outdoor_walk', name: 'outdoor-walk: 45 min' },
            { id: 'seated_hip_adduction', name: 'seated-hip-adduction: 4x15x70kg' },
            { id: 'cross_trainer', name: 'cross-trainer: 30 min' }
        ],
        exercises: [
            { id: 'leg_press', name: 'leg-press: 4x12x180kg' },
            { id: 'outdoor_walk', name: 'outdoor-walk: 45 min' },
            { id: 'seated_hip_adduction', name: 'seated-hip-adduction: 4x15x70kg' },
            { id: 'cross_trainer', name: 'cross-trainer: 30 min' }
        ],
        baseLevel: 75,
        baseStats: {
            STR: 75,
            VOL: 68,
            TMP: 60,
            END: 64,
            PHY: 71,
            HYP: 75
        },
        subStats: [{ key: "potential", label: "Potential", value: 75, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Twin Mother',
            subtitle: 'The suffering but powerful mother of the divine twins. Wandered the earth to find a place to give birth while being pursued by Hera\'s jealousy, finally gave birth to Apollo and Artemis on Delos. Represents motherhood and endurance. Daughter of Coeus and Phoebe.'
        }
    }, {
        id: 'pull_mnemosyne', name: 'Mnemosyne', position: 'PULL',
        primaryIconId: 'mnemosyne',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Mnemosyne', SILVER: 'Mnemosyne Vanguard', GOLD: 'Mnemosyne Ascendant',
            TITAN: 'Mnemosyne, The Eternal', ICON: 'Mnemosyne, Higher Being', LEGEND: 'Mnemosyne, Transcendental',
            PRIMORDIAL: 'Mnemosyne, Genesis of All'
        },
        subtitle: 'The goddess of memory and mother of the Muses.',
        secondaryTag: 'VANGUARD',
        rarity: 'TITAN',
        category: 'TITAN',
        lore: "Mnemosyne (LVL 75 - PULL): lat pulldown : 4x9x85kg • seated-cable-row: 4x12x80kg • Tbar-row: 4x12x75kg • bicep-dumbbell: 4x15x20kg.",
        duration: 90,
        exercisePool: [
            { id: 'lat_pulldown', name: 'lat pulldown : 4x9x85kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x12x80kg' },
            { id: 'Tbar_row', name: 'Tbar-row: 4x12x75kg' },
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 4x15x20kg' }
        ],
        exercises: [
            { id: 'lat_pulldown', name: 'lat pulldown : 4x9x85kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x12x80kg' },
            { id: 'Tbar_row', name: 'Tbar-row: 4x12x75kg' },
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 4x15x20kg' }
        ],
        baseLevel: 75,
        baseStats: {
            STR: 75,
            VOL: 68,
            TMP: 60,
            END: 64,
            PHY: 71,
            HYP: 75
        },
        subStats: [{ key: "potential", label: "Potential", value: 75, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Memory Goddess',
            subtitle: 'The goddess of memory and mother of the Muses. Created the power of words and names; mother of the nine Muses who inspire art and science. Represents memory and preservation. Daughter of Uranus and Gaia.'
        }
    }, {
        id: 'push_themis', name: 'Themis', position: 'PUSH',
        primaryIconId: 'themis',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Themis', SILVER: 'Themis Vanguard', GOLD: 'Themis Ascendant',
            TITAN: 'Themis, The Eternal', ICON: 'Themis, Higher Being', LEGEND: 'Themis, Transcendental',
            PRIMORDIAL: 'Themis, Genesis of All'
        },
        subtitle: 'The guardian of divine law and universal order.',
        secondaryTag: 'VANGUARD',
        rarity: 'TITAN',
        category: 'TITAN',
        lore: "Themis (LVL 75 - PUSH): flat-barbell-bench-press: 5x9x110kg • chest-rope: 4x9x45kg • dumbbell-lateral-raise: 4x15x18kg • assisted-tricep-dip: 3x12x25kg.",
        duration: 90,
        exercisePool: [
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 5x9x110kg' },
            { id: 'chest_rope', name: 'chest-rope: 4x9x45kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 4x15x18kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 3x12x25kg' }
        ],
        exercises: [
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 5x9x110kg' },
            { id: 'chest_rope', name: 'chest-rope: 4x9x45kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 4x15x18kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 3x12x25kg' }
        ],
        baseLevel: 75,
        baseStats: {
            STR: 75,
            VOL: 68,
            TMP: 60,
            END: 64,
            PHY: 71,
            HYP: 75
        },
        subStats: [{ key: "potential", label: "Potential", value: 75, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Divine Law',
            subtitle: 'The guardian of divine law and universal order. Advised Zeus on the laws of nature and justice; often depicted with scales. Represents eternal justice and order. Daughter of Uranus and Gaia.'
        }
    }, {
        id: 'pull_phoebe', name: 'Phoebe', position: 'PULL',
        primaryIconId: 'phoebe',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Phoebe', SILVER: 'Phoebe Vanguard', GOLD: 'Phoebe Ascendant',
            TITAN: 'Phoebe, The Eternal', ICON: 'Phoebe, Higher Being', LEGEND: 'Phoebe, Transcendental',
            PRIMORDIAL: 'Phoebe, Genesis of All'
        },
        subtitle: 'The bright lady of the moon and prophecy.',
        secondaryTag: 'VANGUARD',
        rarity: 'TITAN',
        category: 'TITAN',
        lore: "Phoebe (LVL 75 - PULL): lat pulldown : 5x9x80kg • seated-cable-row: 4x12x75kg • dumbbell-concentration: 4x15x25kg • bicep-dumbbell: 4x12x18kg.",
        duration: 90,
        exercisePool: [
            { id: 'lat_pulldown', name: 'lat pulldown : 5x9x80kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x12x75kg' },
            { id: 'db_concentration_curl', name: 'dumbbell-concentration: 4x15x25kg' },
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 4x12x18kg' }
        ],
        exercises: [
            { id: 'lat_pulldown', name: 'lat pulldown : 5x9x80kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x12x75kg' },
            { id: 'db_concentration_curl', name: 'dumbbell-concentration: 4x15x25kg' },
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 4x12x18kg' }
        ],
        baseLevel: 75,
        baseStats: {
            STR: 75,
            VOL: 68,
            TMP: 60,
            END: 64,
            PHY: 72,
            HYP: 75
        },
        subStats: [{ key: "potential", label: "Potential", value: 75, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Prophecy Lady',
            subtitle: 'The bright lady of the moon and prophecy. Associated with the Oracle of Delphi before giving it to Apollo; represents the shining quality of the mind. Represents prophecy and light. Wife and sister of Coeus.'
        }
    }, {
        id: 'pull_coeus', name: 'Coeus', position: 'PULL',
        primaryIconId: 'coeus',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Coeus', SILVER: 'Coeus Vanguard', GOLD: 'Coeus Ascendant',
            TITAN: 'Coeus, The Eternal', ICON: 'Coeus, Higher Being', LEGEND: 'Coeus, Transcendental',
            PRIMORDIAL: 'Coeus, Genesis of All'
        },
        subtitle: 'The Titan of the North and the inquiring mind.',
        secondaryTag: 'VANGUARD',
        rarity: 'TITAN',
        category: 'TITAN',
        lore: "Coeus (LVL 75 - PULL): Tbar-row: 4x9x100kg • lat pulldown : 4x12x85kg • one-arm-dumbbell-row: 4x12x50kg • rear-delt-fly: 4x15x15kg.",
        duration: 90,
        exercisePool: [
            { id: 'Tbar_row', name: 'Tbar-row: 4x9x100kg' },
            { id: 'lat_pulldown', name: 'lat pulldown : 4x12x85kg' },
            { id: 'one_arm_dumbbell_row', name: 'one-arm-dumbbell-row: 4x12x50kg' },
            { id: 'rear_delt_fly', name: 'rear-delt-fly: 4x15x15kg' }
        ],
        exercises: [
            { id: 'Tbar_row', name: 'Tbar-row: 4x9x100kg' },
            { id: 'lat_pulldown', name: 'lat pulldown : 4x12x85kg' },
            { id: 'one_arm_dumbbell_row', name: 'one-arm-dumbbell-row: 4x12x50kg' },
            { id: 'rear_delt_fly', name: 'rear-delt-fly: 4x15x15kg' }
        ],
        baseLevel: 75,
        baseStats: {
            STR: 75,
            VOL: 68,
            TMP: 60,
            END: 64,
            PHY: 72,
            HYP: 75
        },
        subStats: [{ key: "potential", label: "Potential", value: 75, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Cosmic Intelligence',
            subtitle: 'The Titan of the North and the inquiring mind. Represents the axis of the heavens and the search for knowledge; grandfather of Apollo and Artemis. Represents cosmic intelligence. Son of Uranus and Gaia.'
        }
    }, {
        id: 'push_crius', name: 'Crius', position: 'PUSH',
        primaryIconId: 'crius',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Crius', SILVER: 'Crius Vanguard', GOLD: 'Crius Ascendant',
            TITAN: 'Crius, The Eternal', ICON: 'Crius, Higher Being', LEGEND: 'Crius, Transcendental',
            PRIMORDIAL: 'Crius, Genesis of All'
        },
        subtitle: 'The master of the constellations and the south.',
        secondaryTag: 'VANGUARD',
        rarity: 'TITAN',
        category: 'TITAN',
        lore: "Crius (LVL 75 - PUSH): flat-barbell-bench-press: 4x9x115kg • incline-dumbbell-bench-press: 4x12x50kg • assisted-tricep-dip: 4x15x30kg • chest-rope: 3x12x40kg.",
        duration: 90,
        exercisePool: [
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 4x9x115kg' },
            { id: 'incline_dumbbell_bench_press', name: 'incline-dumbbell-bench-press: 4x12x50kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 4x15x30kg' },
            { id: 'chest_rope', name: 'chest-rope: 3x12x40kg' }
        ],
        exercises: [
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 4x9x115kg' },
            { id: 'incline_dumbbell_bench_press', name: 'incline-dumbbell-bench-press: 4x12x50kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 4x15x30kg' },
            { id: 'chest_rope', name: 'chest-rope: 3x12x40kg' }
        ],
        baseLevel: 75,
        baseStats: {
            STR: 76,
            VOL: 68,
            TMP: 60,
            END: 64,
            PHY: 72,
            HYP: 76
        },
        subStats: [{ key: "potential", label: "Potential", value: 76, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Celestial Cycles',
            subtitle: 'The master of the constellations and the south. Represents the turning of the stars and the celestial cycles. Associated with the constellation Aries (the Ram). Represents stability and endurance. Son of Uranus and Gaia.'
        }
    }, {
        id: 'pull_epimetheus', name: 'Epimetheus', position: 'PULL',
        primaryIconId: 'epimetheus',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Epimetheus', SILVER: 'Epimetheus Vanguard', GOLD: 'Epimetheus Ascendant',
            TITAN: 'Epimetheus, The Eternal', ICON: 'Epimetheus, Higher Being', LEGEND: 'Epimetheus, Transcendental',
            PRIMORDIAL: 'Epimetheus, Genesis of All'
        },
        subtitle: 'The one who thinks too late; brother of Prometheus.',
        secondaryTag: 'VANGUARD',
        rarity: 'TITAN',
        category: 'TITAN',
        lore: "Epimetheus (LVL 75 - PULL): lat pulldown : 4x9x85kg • seated-cable-row: 4x12x80kg • dumbbell-concentration: 4x15x20kg • bicep-dumbbell: 3x12x25kg.",
        duration: 90,
        exercisePool: [
            { id: 'lat_pulldown', name: 'lat pulldown : 4x9x85kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x12x80kg' },
            { id: 'db_concentration_curl', name: 'dumbbell-concentration: 4x15x20kg' },
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 3x12x25kg' }
        ],
        exercises: [
            { id: 'lat_pulldown', name: 'lat pulldown : 4x9x85kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x12x80kg' },
            { id: 'db_concentration_curl', name: 'dumbbell-concentration: 4x15x20kg' },
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 3x12x25kg' }
        ],
        baseLevel: 75,
        baseStats: {
            STR: 76,
            VOL: 68,
            TMP: 60,
            END: 64,
            PHY: 72,
            HYP: 76
        },
        subStats: [{ key: "potential", label: "Potential", value: 76, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Afterthought Titan',
            subtitle: 'The one who thinks too late; brother of Prometheus. Accepted Pandora as a gift despite his brother\'s warning, leading to the release of all evils into the world. Represents impulsiveness and hindsight. Son of Iapetus.'
        }
    }, {
        id: 'push_heracles', name: 'Heracles', position: 'PUSH',
        primaryIconId: 'heracles',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Heracles', SILVER: 'Heracles Vanguard', GOLD: 'Heracles Ascendant',
            TITAN: 'Heracles, The Eternal', ICON: 'Heracles, Higher Being', LEGEND: 'Heracles, Transcendental',
            PRIMORDIAL: 'Heracles, Genesis of All'
        },
        subtitle: 'Muazzam Güç; 12 Labor şampiyonu.',
        secondaryTag: 'VANGUARD',
        rarity: 'HERO',
        category: 'HERO',
        lore: "Heracles (LVL 75 - PUSH): bench-press: 6x9x150kg • flat-barbell-bench-press: 5x9x130kg • incline-dumbbell-bench-press: 4x12x55kg • assisted-tricep-dip: 4x15x30kg • swinging-the-rope: 4x15x50kg.",
        duration: 90,
        exercisePool: [
            { id: 'bench_press', name: 'bench-press: 6x9x150kg' },
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 5x9x130kg' },
            { id: 'incline_dumbbell_bench_press', name: 'incline-dumbbell-bench-press: 4x12x55kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 4x15x30kg' },
            { id: 'swinging_the_rope', name: 'swinging-the-rope: 4x15x50kg' }
        ],
        exercises: [
            { id: 'bench_press', name: 'bench-press: 6x9x150kg' },
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 5x9x130kg' },
            { id: 'incline_dumbbell_bench_press', name: 'incline-dumbbell-bench-press: 4x12x55kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 4x15x30kg' },
            { id: 'swinging_the_rope', name: 'swinging-the-rope: 4x15x50kg' }
        ],
        baseLevel: 75,
        baseStats: {
            STR: 75,
            VOL: 68,
            TMP: 60,
            END: 64,
            PHY: 71,
            HYP: 75
        },
        subStats: [{ key: "potential", label: "Potential", value: 75, primary: "STR" }],
        skills: [],
        thread: {
            title: '12 Labor Şampiyonu',
            subtitle: 'İnsanüstü itiş gücünün simgesi. İşlediği günahların kefareti olarak 12 imkansız görevi tamamlayan, aslanı ve hydra\'yı öldüren en büyük kahramandır. Gücü temsil eder. Zeus\'un oğludur.'
        }
    }, {
        id: 'pull_achilles', name: 'Achilles', position: 'PULL',
        primaryIconId: 'achilles',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Achilles', SILVER: 'Achilles Vanguard', GOLD: 'Achilles Ascendant',
            TITAN: 'Achilles, The Eternal', ICON: 'Achilles, Higher Being', LEGEND: 'Achilles, Transcendental',
            PRIMORDIAL: 'Achilles, Genesis of All'
        },
        subtitle: 'Yenilmez Savaşçı; savaşçı onuru.',
        secondaryTag: 'VANGUARD',
        rarity: 'HERO',
        category: 'HERO',
        lore: "Achilles (LVL 74 - PULL): pull-up: 4x9x25kg • lat pulldown : 4x12x90kg • one-arm-dumbbell-row: 4x12x55kg • bicep-dumbbell: 4x12x25kg • outdoor-run: 20 min.",
        duration: 90,
        exercisePool: [
            { id: 'pull_up', name: 'pull-up: 4x9x25kg' },
            { id: 'lat_pulldown', name: 'lat pulldown : 4x12x90kg' },
            { id: 'one_arm_dumbbell_row', name: 'one-arm-dumbbell-row: 4x12x55kg' },
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 4x12x25kg' },
            { id: 'outdoor_run', name: 'outdoor-run: 20 min' }
        ],
        exercises: [
            { id: 'pull_up', name: 'pull-up: 4x9x25kg' },
            { id: 'lat_pulldown', name: 'lat pulldown : 4x12x90kg' },
            { id: 'one_arm_dumbbell_row', name: 'one-arm-dumbbell-row: 4x12x55kg' },
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 4x12x25kg' },
            { id: 'outdoor_run', name: 'outdoor-run: 20 min' }
        ],
        baseLevel: 74,
        baseStats: {
            STR: 74,
            VOL: 67,
            TMP: 59,
            END: 63,
            PHY: 70,
            HYP: 74
        },
        subStats: [{ key: "potential", label: "Potential", value: 74, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Yenilmez Savaşçı',
            subtitle: 'Savaşçı onurunun patlayıcı gücü. Truva\'nın en hızlısı; topuğu dışındaki her yeri yaralanmaz olan, öfkesiyle Truva Savaşı\'nın kaderini değiştiren kahramandır. Cesareti temsil eder. Peleus ve Thetis\'in oğludur.'
        }
    }, {
        id: 'pull_odysseus', name: 'Odysseus', position: 'PULL',
        primaryIconId: 'odysseus',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Odysseus', SILVER: 'Odysseus Vanguard', GOLD: 'Odysseus Ascendant',
            TITAN: 'Odysseus, The Eternal', ICON: 'Odysseus, Higher Being', LEGEND: 'Odysseus, Transcendental',
            PRIMORDIAL: 'Odysseus, Genesis of All'
        },
        subtitle: 'Zeka ve Dayanıklılık; sabırlı çekiş.',
        secondaryTag: 'VANGUARD',
        rarity: 'HERO',
        category: 'HERO',
        lore: "Odysseus (LVL 73 - PULL): seated-cable-row: 5x12x95kg • lat pulldown : 4x12x85kg • Tbar-row: 4x12x90kg • one-arm-dumbbell-row: 4x12x50kg • biking: 30 min.",
        duration: 90,
        exercisePool: [
            { id: 'seated_cable_row', name: 'seated-cable-row: 5x12x95kg' },
            { id: 'lat_pulldown', name: 'lat pulldown : 4x12x85kg' },
            { id: 'Tbar_row', name: 'Tbar-row: 4x12x90kg' },
            { id: 'one_arm_dumbbell_row', name: 'one-arm-dumbbell-row: 4x12x50kg' },
            { id: 'biking', name: 'biking: 30 min' }
        ],
        exercises: [
            { id: 'seated_cable_row', name: 'seated-cable-row: 5x12x95kg' },
            { id: 'lat_pulldown', name: 'lat pulldown : 4x12x85kg' },
            { id: 'Tbar_row', name: 'Tbar-row: 4x12x90kg' },
            { id: 'one_arm_dumbbell_row', name: 'one-arm-dumbbell-row: 4x12x50kg' },
            { id: 'biking', name: 'biking: 30 min' }
        ],
        baseLevel: 73,
        baseStats: {
            STR: 73,
            VOL: 66,
            TMP: 58,
            END: 62,
            PHY: 69,
            HYP: 73
        },
        subStats: [{ key: "potential", label: "Potential", value: 73, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Cunning Ustası',
            subtitle: '20 yıllık yolculuğun sabırlı çekişi. Truva Atı\'nı icat eden ve Truva\'dan evine dönmek için on yıl boyunca canavarlarla savaşan Ithaca kralıdır. Zekayı temsil eder. Laertes\'in oğludur.'
        }
    }, {
        id: 'push_perseus', name: 'Perseus', position: 'PUSH',
        primaryIconId: 'perseus',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Perseus', SILVER: 'Perseus Vanguard', GOLD: 'Perseus Ascendant',
            TITAN: 'Perseus, The Eternal', ICON: 'Perseus, Higher Being', LEGEND: 'Perseus, Transcendental',
            PRIMORDIAL: 'Perseus, Genesis of All'
        },
        subtitle: 'Medusa Avcısı; kalkanın yansıması.',
        secondaryTag: 'VANGUARD',
        rarity: 'HERO',
        category: 'HERO',
        lore: "Perseus (LVL 70 - PUSH): incline-dumbbell-bench-press: 5x9x45kg • dumbbell-lateral-raise: 4x12x20kg • flat-barbell-bench-press: 4x9x90kg • jump-rope-new: 15 min.",
        duration: 90,
        exercisePool: [
            { id: 'incline_dumbbell_bench_press', name: 'incline-dumbbell-bench-press: 5x9x45kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 4x12x20kg' },
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 4x9x90kg' },
            { id: 'jump_rope_new', name: 'jump-rope-new: 15 min' }
        ],
        exercises: [
            { id: 'incline_dumbbell_bench_press', name: 'incline-dumbbell-bench-press: 5x9x45kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 4x12x20kg' },
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 4x9x90kg' },
            { id: 'jump_rope_new', name: 'jump-rope-new: 15 min' }
        ],
        baseLevel: 70,
        baseStats: {
            STR: 70,
            VOL: 63,
            TMP: 56,
            END: 60,
            PHY: 67,
            HYP: 70
        },
        subStats: [{ key: "potential", label: "Potential", value: 70, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Medusa Avcısı',
            subtitle: 'Kalkanın yansımasıyla canavarları yenen kahraman. Athena\'nın yardımıyla Medusa\'nın başını kesmiş ve Andromeda\'yı deniz canavarından kurtarmıştır. Kahramanlığı temsil eder. Zeus ve Danae\'nin oğludur.'
        }
    }, {
        id: 'legs_theseus', name: 'Theseus', position: 'LEGS',
        primaryIconId: 'theseus',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Theseus', SILVER: 'Theseus Vanguard', GOLD: 'Theseus Ascendant',
            TITAN: 'Theseus, The Eternal', ICON: 'Theseus, Higher Being', LEGEND: 'Theseus, Transcendental',
            PRIMORDIAL: 'Theseus, Genesis of All'
        },
        subtitle: 'Labirent Çözücü; sarsılmaz bacaklar.',
        secondaryTag: 'VANGUARD',
        rarity: 'HERO',
        category: 'HERO',
        lore: "Theseus (LVL 68 - LEGS): leg-press: 4x12x300kg • dumbbell-lunge-bicep-curl: 4x12x45kg • outdoor-run: 25 min • hip-raise-dumbbell: 4x15x75kg • jump-rope-new: 15 min.",
        duration: 90,
        exercisePool: [
            { id: 'leg_press', name: 'leg-press: 4x12x300kg' },
            { id: 'dumbbell_lunge_bicep_curl', name: 'dumbbell-lunge-bicep-curl: 4x12x45kg' },
            { id: 'outdoor_run', name: 'outdoor-run: 25 min' },
            { id: 'hip_raise_dumbbell', name: 'hip-raise-dumbbell: 4x15x75kg' },
            { id: 'jump_rope_new', name: 'jump-rope-new: 15 min' }
        ],
        exercises: [
            { id: 'leg_press', name: 'leg-press: 4x12x300kg' },
            { id: 'dumbbell_lunge_bicep_curl', name: 'dumbbell-lunge-bicep-curl: 4x12x45kg' },
            { id: 'outdoor_run', name: 'outdoor-run: 25 min' },
            { id: 'hip_raise_dumbbell', name: 'hip-raise-dumbbell: 4x15x75kg' },
            { id: 'jump_rope_new', name: 'jump-rope-new: 15 min' }
        ],
        baseLevel: 68,
        baseStats: {
            STR: 68,
            VOL: 61,
            TMP: 54,
            END: 58,
            PHY: 65,
            HYP: 68
        },
        subStats: [{ key: "potential", label: "Potential", value: 68, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Labirent Çözücü',
            subtitle: 'Labirentin sarsılmaz bacakları; Atina\'nın kahramanı. Girit\'teki labirente girerek Minotaur\'u öldürmüş ve Ariadne\'nin ipiyle dışarı çıkmayı başarmıştır. Azmi temsil eder. Aegeus\'un oğludur.'
        }
    }, {
        id: 'legs_bellerophon', name: 'Bellerophon', position: 'LEGS',
        primaryIconId: 'bellerophon',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Bellerophon', SILVER: 'Bellerophon Vanguard', GOLD: 'Bellerophon Ascendant',
            TITAN: 'Bellerophon, The Eternal', ICON: 'Bellerophon, Higher Being', LEGEND: 'Bellerophon, Transcendental',
            PRIMORDIAL: 'Bellerophon, Genesis of All'
        },
        subtitle: 'Pegasus Binicisi; yüksek stabilite.',
        secondaryTag: 'VANGUARD',
        rarity: 'HERO',
        category: 'HERO',
        lore: "Bellerophon (LVL 65 - LEGS): dumbbell-lunge-bicep-curl: 4x9x45kg • leg-press: 4x12x150kg • biking: 30 min • outdoor-run: 20 min.",
        duration: 90,
        exercisePool: [
            { id: 'dumbbell_lunge_bicep_curl', name: 'dumbbell-lunge-bicep-curl: 4x9x45kg' },
            { id: 'leg_press', name: 'leg-press: 4x12x150kg' },
            { id: 'biking', name: 'biking: 30 min' },
            { id: 'outdoor_run', name: 'outdoor-run: 20 min' }
        ],
        exercises: [
            { id: 'dumbbell_lunge_bicep_curl', name: 'dumbbell-lunge-bicep-curl: 4x9x45kg' },
            { id: 'leg_press', name: 'leg-press: 4x12x150kg' },
            { id: 'biking', name: 'biking: 30 min' },
            { id: 'outdoor_run', name: 'outdoor-run: 20 min' }
        ],
        baseLevel: 65,
        baseStats: {
            STR: 65,
            VOL: 59,
            TMP: 52,
            END: 55,
            PHY: 62,
            HYP: 65
        },
        subStats: [{ key: "potential", label: "Potential", value: 65, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Pegasus Binicisi',
            subtitle: 'Göklerde süzülen canavar avcısı; yüksek stabilite. Kanatlı at Pegasus\'u evcilleştirmiş ve ateş püskürten Chimera\'yı öldürmüştür. Cesareti temsil eder. Poseidon\'un oğlu sayılır.'
        }
    }, {
        id: 'push_nike', name: 'Nike', position: 'PUSH',
        primaryIconId: 'nike',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Nike', SILVER: 'Nike Vanguard', GOLD: 'Nike Ascendant',
            TITAN: 'Nike, The Eternal', ICON: 'Nike, Higher Being', LEGEND: 'Nike, Transcendental',
            PRIMORDIAL: 'Nike, Genesis of All'
        },
        subtitle: 'Explosive push power of victory.',
        secondaryTag: 'VANGUARD',
        rarity: 'HERO',
        category: 'HERO',
        lore: "Nike (LVL 60 - PUSH): flat-barbell-bench-press: 4x12x70kg • dumbbell-lateral-raise: 4x15x20kg • outdoor-run: 15 min • chest-rope: 3x12x35kg.",
        duration: 90,
        exercisePool: [
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 4x12x70kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 4x15x20kg' },
            { id: 'outdoor_run', name: 'outdoor-run: 15 min' },
            { id: 'chest_rope', name: 'chest-rope: 3x12x35kg' }
        ],
        exercises: [
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 4x12x70kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 4x15x20kg' },
            { id: 'outdoor_run', name: 'outdoor-run: 15 min' },
            { id: 'chest_rope', name: 'chest-rope: 3x12x35kg' }
        ],
        baseLevel: 60,
        baseStats: {
            STR: 60,
            VOL: 54,
            TMP: 48,
            END: 51,
            PHY: 57,
            HYP: 60
        },
        subStats: [{ key: "potential", label: "Potential", value: 60, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Victory personification',
            subtitle: 'Explosive push power of victory. The personification of victory, often depicted with wings; fought on the side of Zeus during the Titan War. Represents speed and triumph. Daughter of Pallas and Styx.'
        }
    }, {
        id: 'pull_persephone', name: 'Persephone', position: 'PULL',
        primaryIconId: 'persephone',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Persephone', SILVER: 'Persephone Vanguard', GOLD: 'Persephone Ascendant',
            TITAN: 'Persephone, The Eternal', ICON: 'Persephone, Higher Being', LEGEND: 'Persephone, Transcendental',
            PRIMORDIAL: 'Persephone, Genesis of All'
        },
        subtitle: 'Bahar ve Yeraltı Kraliçesi; mevsimlerin döngüsü.',
        secondaryTag: 'VANGUARD',
        rarity: 'HERO',
        category: 'HERO',
        lore: "Persephone (LVL 55 - PULL): lat pulldown : 4x12x80kg • seated-cable-row: 4x12x75kg • bicep-dumbbell: 4x15x20kg • rear-delt-fly: 4x15x15kg.",
        duration: 90,
        exercisePool: [
            { id: 'lat_pulldown', name: 'lat pulldown : 4x12x80kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x12x75kg' },
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 4x15x20kg' },
            { id: 'rear_delt_fly', name: 'rear-delt-fly: 4x15x15kg' }
        ],
        exercises: [
            { id: 'lat_pulldown', name: 'lat pulldown : 4x12x80kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x12x75kg' },
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 4x15x20kg' },
            { id: 'rear_delt_fly', name: 'rear-delt-fly: 4x15x15kg' }
        ],
        baseLevel: 55,
        baseStats: {
            STR: 55,
            VOL: 50,
            TMP: 44,
            END: 47,
            PHY: 52,
            HYP: 55
        },
        subStats: [{ key: "potential", label: "Potential", value: 55, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Bahar ve Yeraltı Kraliçesi',
            subtitle: 'Mevsimlerin döngüsü; yeraltının zarif kraliçesi. Hades tarafından kaçırılmış, nar çekirdeği yediği için yılın yarısını yeraltında yarısını yeryüzünde geçirmeye mahkum olmuştur. Döngüselliği temsil eder. Zeus ve Demeter\'in kızıdır.'
        }
    }, {
        id: 'pull_adonis', name: 'Adonis', position: 'PULL',
        primaryIconId: 'adonis',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Adonis', SILVER: 'Adonis Vanguard', GOLD: 'Adonis Ascendant',
            TITAN: 'Adonis, The Eternal', ICON: 'Adonis, Higher Being', LEGEND: 'Adonis, Transcendental',
            PRIMORDIAL: 'Adonis, Genesis of All'
        },
        subtitle: 'Aesthetic pull and visual symmetry.',
        secondaryTag: 'VANGUARD',
        rarity: 'HERO',
        category: 'HERO',
        lore: "Adonis (LVL 50 - PULL): pull-up: 3x9x15kg • bicep-dumbbell: 4x12x15kg • lat pulldown : 3x12x65kg • outdoor-run: 20 min.",
        duration: 90,
        exercisePool: [
            { id: 'pull_up', name: 'pull-up: 3x9x15kg' },
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 4x12x15kg' },
            { id: 'lat_pulldown', name: 'lat pulldown : 3x12x65kg' },
            { id: 'outdoor_run', name: 'outdoor-run: 20 min' }
        ],
        exercises: [
            { id: 'pull_up', name: 'pull-up: 3x9x15kg' },
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 4x12x15kg' },
            { id: 'lat_pulldown', name: 'lat pulldown : 3x12x65kg' },
            { id: 'outdoor_run', name: 'outdoor-run: 20 min' }
        ],
        baseLevel: 50,
        baseStats: {
            STR: 50,
            VOL: 45,
            TMP: 40,
            END: 43,
            PHY: 48,
            HYP: 50
        },
        subStats: [{ key: "potential", label: "Potential", value: 50, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Visual Symmetry',
            subtitle: 'Aesthetic pull and visual symmetry. A youth of incredible beauty, loved by both Aphrodite and Persephone; represents the cycle of nature and male beauty. Represent grace and rebirth. Son of Myrrha.'
        }
    }, {
        id: 'legs_triptolemus', name: 'Triptolemus', position: 'LEGS',
        primaryIconId: 'triptolemus',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Triptolemus', SILVER: 'Triptolemus Vanguard', GOLD: 'Triptolemus Ascendant',
            TITAN: 'Triptolemus, The Eternal', ICON: 'Triptolemus, Higher Being', LEGEND: 'Triptolemus, Transcendental',
            PRIMORDIAL: 'Triptolemus, Genesis of All'
        },
        subtitle: 'Agriculture envoy; patient legs.',
        secondaryTag: 'VANGUARD',
        rarity: 'HERO',
        category: 'HERO',
        lore: "Triptolemus (LVL 49 - LEGS): outdoor-walk: 40 min • leg-press: 4x15x180kg • seated-hip-adduction: 4x15x80kg • biking: 20 min.",
        duration: 90,
        exercisePool: [
            { id: 'outdoor_walk', name: 'outdoor-walk: 40 min' },
            { id: 'leg_press', name: 'leg-press: 4x15x180kg' },
            { id: 'seated_hip_adduction', name: 'seated-hip-adduction: 4x15x80kg' },
            { id: 'biking', name: 'biking: 20 min' }
        ],
        exercises: [
            { id: 'outdoor_walk', name: 'outdoor-walk: 40 min' },
            { id: 'leg_press', name: 'leg-press: 4x15x180kg' },
            { id: 'seated_hip_adduction', name: 'seated-hip-adduction: 4x15x80kg' },
            { id: 'biking', name: 'biking: 20 min' }
        ],
        baseLevel: 49,
        baseStats: {
            STR: 49,
            VOL: 44,
            TMP: 39,
            END: 42,
            PHY: 47,
            HYP: 49
        },
        subStats: [{ key: "potential", label: "Potential", value: 49, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Agriculture Envoy',
            subtitle: 'Agriculture envoy; patient legs. Taught by Demeter the secrets of agriculture and spread the knowledge of grain across the world. Represents civilization and the harvest. Son of Celeus.'
        }
    }, {
        id: 'legs_ariadne', name: 'Ariadne', position: 'LEGS',
        primaryIconId: 'ariadne',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Ariadne', SILVER: 'Ariadne Vanguard', GOLD: 'Ariadne Ascendant',
            TITAN: 'Ariadne, The Eternal', ICON: 'Ariadne, Higher Being', LEGEND: 'Ariadne, Transcendental',
            PRIMORDIAL: 'Ariadne, Genesis of All'
        },
        subtitle: 'Labyrinth guide; patient walk.',
        secondaryTag: 'VANGUARD',
        rarity: 'HERO',
        category: 'HERO',
        lore: "Ariadne (LVL 49 - LEGS): outdoor-walk: 35 min • seated-hip-adduction: 3x15x50kg • hip-raise-dumbbell: 4x15x60kg • cross-trainer: 20 min.",
        duration: 90,
        exercisePool: [
            { id: 'outdoor_walk', name: 'outdoor-walk: 35 min' },
            { id: 'seated_hip_adduction', name: 'seated-hip-adduction: 3x15x50kg' },
            { id: 'hip_raise_dumbbell', name: 'hip-raise-dumbbell: 4x15x60kg' },
            { id: 'cross_trainer', name: 'cross-trainer: 20 min' }
        ],
        exercises: [
            { id: 'outdoor_walk', name: 'outdoor-walk: 35 min' },
            { id: 'seated_hip_adduction', name: 'seated-hip-adduction: 3x15x50kg' },
            { id: 'hip_raise_dumbbell', name: 'hip-raise-dumbbell: 4x15x60kg' },
            { id: 'cross_trainer', name: 'cross-trainer: 20 min' }
        ],
        baseLevel: 49,
        baseStats: {
            STR: 49,
            VOL: 44,
            TMP: 39,
            END: 42,
            PHY: 47,
            HYP: 49
        },
        subStats: [{ key: "potential", label: "Potential", value: 49, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Labyrinth Guide',
            subtitle: 'Labyrinth guide; patient walk. Helped Theseus defeat the Minotaur using her thread; later became the wife of Dionysus after being abandoned on Naxos. Represents guidance and devotion. Daughter of King Minos.'
        }
    }, {
        id: 'push_pandora', name: 'Pandora', position: 'PUSH',
        primaryIconId: 'pandora',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Pandora', SILVER: 'Pandora Vanguard', GOLD: 'Pandora Ascendant',
            TITAN: 'Pandora, The Eternal', ICON: 'Pandora, Higher Being', LEGEND: 'Pandora, Transcendental',
            PRIMORDIAL: 'Pandora, Genesis of All'
        },
        subtitle: 'Merakın Sembolü; ilk kadın.',
        secondaryTag: 'VANGUARD',
        rarity: 'MORTAL',
        category: 'MORTAL',
        lore: "Pandora (LVL 48 - PUSH): chest-rope: 4x15x35kg • incline-dumbbell-bench-press: 3x12x25kg • dumbbell-lateral-raise: 4x15x12kg • flat-barbell-bench-press: 3x12x50kg.",
        duration: 90,
        exercisePool: [
            { id: 'chest_rope', name: 'chest-rope: 4x15x35kg' },
            { id: 'incline_dumbbell_bench_press', name: 'incline-dumbbell-bench-press: 3x12x25kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 4x15x12kg' },
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 3x12x50kg' }
        ],
        exercises: [
            { id: 'chest_rope', name: 'chest-rope: 4x15x35kg' },
            { id: 'incline_dumbbell_bench_press', name: 'incline-dumbbell-bench-press: 3x12x25kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 4x15x12kg' },
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 3x12x50kg' }
        ],
        baseLevel: 48,
        baseStats: {
            STR: 48,
            VOL: 43,
            TMP: 38,
            END: 41,
            PHY: 46,
            HYP: 48
        },
        subStats: [{ key: "potential", label: "Potential", value: 48, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Merakın Sembolü',
            subtitle: 'Merakın sembolü; ilk kadın. Tanrılar tarafından bir jar (kavanoz) ile gönderilmiş; merakına yenik düşerek dünyadaki tüm kötülükleri serbest bırakmıştır. İnsani zayıflığı temsil eder. Hephaestus tarafından yapılmıştır.'
        }
    }, {
        id: 'legs_sisyphus', name: 'Sisyphus', position: 'LEGS',
        primaryIconId: 'sisyphus',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Sisyphus', SILVER: 'Sisyphus Vanguard', GOLD: 'Sisyphus Ascendant',
            TITAN: 'Sisyphus, The Eternal', ICON: 'Sisyphus, Higher Being', LEGEND: 'Sisyphus, Transcendental',
            PRIMORDIAL: 'Sisyphus, Genesis of All'
        },
        subtitle: 'Sonsuz Azim; kayayı sonsuza dek tepeye iten kral.',
        secondaryTag: 'VANGUARD',
        rarity: 'MORTAL',
        category: 'MORTAL',
        lore: "Sisyphus (LVL 45 - LEGS): leg-press: 6x12x350kg • hip-raise-dumbbell: 4x15x95kg • outdoor-walk: 60 min • cross-trainer: 30 min.",
        duration: 90,
        exercisePool: [
            { id: 'leg_press', name: 'leg-press: 6x12x350kg' },
            { id: 'hip_raise_dumbbell', name: 'hip-raise-dumbbell: 4x15x95kg' },
            { id: 'outdoor_walk', name: 'outdoor-walk: 60 min' },
            { id: 'cross_trainer', name: 'cross-trainer: 30 min' }
        ],
        exercises: [
            { id: 'leg_press', name: 'leg-press: 6x12x350kg' },
            { id: 'hip_raise_dumbbell', name: 'hip-raise-dumbbell: 4x15x95kg' },
            { id: 'outdoor_walk', name: 'outdoor-walk: 60 min' },
            { id: 'cross_trainer', name: 'cross-trainer: 30 min' }
        ],
        baseLevel: 45,
        baseStats: {
            STR: 45,
            VOL: 41,
            TMP: 36,
            END: 38,
            PHY: 43,
            HYP: 45
        },
        subStats: [{ key: "potential", label: "Potential", value: 45, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Sonsuz Azim',
            subtitle: 'Sonsuz azim; kayayı sonsuza dek tepeye iten kral. Ölümü kandırdığı için bir kayayı dağın tepesine çıkarmaya mahkum edilmiş, kaya her seferinde geri yuvarlanmıştır. Beyhude çabayı temsil eder. Corinth kurucusudur.'
        }
    }, {
        id: 'push_midas', name: 'Midas', position: 'PUSH',
        primaryIconId: 'midas',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Midas', SILVER: 'Midas Vanguard', GOLD: 'Midas Ascendant',
            TITAN: 'Midas, The Eternal', ICON: 'Midas, Higher Being', LEGEND: 'Midas, Transcendental',
            PRIMORDIAL: 'Midas, Genesis of All'
        },
        subtitle: 'Altın Dokunuş; hırsın kurbanı.',
        secondaryTag: 'VANGUARD',
        rarity: 'MORTAL',
        category: 'MORTAL',
        lore: "Midas (LVL 40 - PUSH): flat-barbell-bench-press: 4x12x85kg • dumbbell-lateral-raise: 4x15x15kg • assisted-tricep-dip: 3x12x15kg • chest-rope: 3x12x40kg.",
        duration: 90,
        exercisePool: [
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 4x12x85kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 4x15x15kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 3x12x15kg' },
            { id: 'chest_rope', name: 'chest-rope: 3x12x40kg' }
        ],
        exercises: [
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 4x12x85kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 4x15x15kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 3x12x15kg' },
            { id: 'chest_rope', name: 'chest-rope: 3x12x40kg' }
        ],
        baseLevel: 40,
        baseStats: {
            STR: 40,
            VOL: 36,
            TMP: 32,
            END: 34,
            PHY: 38,
            HYP: 40
        },
        subStats: [{ key: "potential", label: "Potential", value: 40, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Dokunuşu Altına Çeviren',
            subtitle: 'Dokunuşu altına çeviren; hırsın kurbanı. Dionysus\'tan dokunduğu her şeyi altına çevirme gücü istemiş, ancak yiyeceklerin bile altına dönüşmesiyle perişan olmuştur. Açgözlülüğü temsil eder. Phrygia kralıdır.'
        }
    }, {
        id: 'pull_narcissus', name: 'Narcissus', position: 'PULL',
        primaryIconId: 'narcissus',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Narcissus', SILVER: 'Narcissus Vanguard', GOLD: 'Narcissus Ascendant',
            TITAN: 'Narcissus, The Eternal', ICON: 'Narcissus, Higher Being', LEGEND: 'Narcissus, Transcendental',
            PRIMORDIAL: 'Narcissus, Genesis of All'
        },
        subtitle: 'In love with his own reflection (pull).',
        secondaryTag: 'VANGUARD',
        rarity: 'HERO',
        category: 'HERO',
        lore: "Narcissus (LVL 35 - PULL): bicep-dumbbell: 5x15x15kg • lat pulldown : 4x12x60kg • seated-cable-row: 3x12x55kg • outdoor-run: 15 min.",
        duration: 90,
        exercisePool: [
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 5x15x15kg' },
            { id: 'lat_pulldown', name: 'lat pulldown : 4x12x60kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 3x12x55kg' },
            { id: 'outdoor_run', name: 'outdoor-run: 15 min' }
        ],
        exercises: [
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 5x15x15kg' },
            { id: 'lat_pulldown', name: 'lat pulldown : 4x12x60kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 3x12x55kg' },
            { id: 'outdoor_run', name: 'outdoor-run: 15 min' }
        ],
        baseLevel: 35,
        baseStats: {
            STR: 35,
            VOL: 32,
            TMP: 28,
            END: 30,
            PHY: 33,
            HYP: 35
        },
        subStats: [{ key: "potential", label: "Potential", value: 35, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Reflection Love',
            subtitle: 'In love with his own reflection (pull). A hunter known for his beauty who fell in love with his own reflection and wasted away; later turned into a flower. Represents self-obsession and unrequited love. Son of Cephissus.'
        }
    }, {
        id: 'legs_icarus', name: 'Icarus', position: 'LEGS',
        primaryIconId: 'icarus',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Icarus', SILVER: 'Icarus Vanguard', GOLD: 'Icarus Ascendant',
            TITAN: 'Icarus, The Eternal', ICON: 'Icarus, Higher Being', LEGEND: 'Icarus, Transcendental',
            PRIMORDIAL: 'Icarus, Genesis of All'
        },
        subtitle: 'Explosive tempo flying to the sun.',
        secondaryTag: 'VANGUARD',
        rarity: 'HERO',
        category: 'HERO',
        lore: "Icarus (LVL 30 - LEGS): outdoor-run: 15 min • jump-rope-new: 15 min • leg-press: 3x15x100kg • cross-trainer: 15 min.",
        duration: 90,
        exercisePool: [
            { id: 'outdoor_run', name: 'outdoor-run: 15 min' },
            { id: 'jump_rope_new', name: 'jump-rope-new: 15 min' },
            { id: 'leg_press', name: 'leg-press: 3x15x100kg' },
            { id: 'cross_trainer', name: 'cross-trainer: 15 min' }
        ],
        exercises: [
            { id: 'outdoor_run', name: 'outdoor-run: 15 min' },
            { id: 'jump_rope_new', name: 'jump-rope-new: 15 min' },
            { id: 'leg_press', name: 'leg-press: 3x15x100kg' },
            { id: 'cross_trainer', name: 'cross-trainer: 15 min' }
        ],
        baseLevel: 30,
        baseStats: {
            STR: 30,
            VOL: 27,
            TMP: 24,
            END: 26,
            PHY: 29,
            HYP: 30
        },
        subStats: [{ key: "potential", label: "Potential", value: 30, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Sun Flight',
            subtitle: 'Explosive tempo flying to the sun. Flew too close to the sun with wings of wax and feathers made by his father Daedalus, leading to his fall into the sea. Represents the dangers of over-ambition and youthful folly. Son of Daedalus.'
        }
    }, {
        id: 'pull_arachne', name: 'Arachne', position: 'PULL',
        primaryIconId: 'arachne',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Arachne', SILVER: 'Arachne Vanguard', GOLD: 'Arachne Ascendant',
            TITAN: 'Arachne, The Eternal', ICON: 'Arachne, Higher Being', LEGEND: 'Arachne, Transcendental',
            PRIMORDIAL: 'Arachne, Genesis of All'
        },
        subtitle: 'Dokuma Ustası; örümceğe dönüşen gurur.',
        secondaryTag: 'VANGUARD',
        rarity: 'MORTAL',
        category: 'MORTAL',
        lore: "Arachne (LVL 19 - PULL): seated-cable-row: 4x15x60kg • lat pulldown : 4x15x55kg • rear-delt-fly: 4x15x10kg • bicep-dumbbell: 4x15x12kg.",
        duration: 90,
        exercisePool: [
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x15x60kg' },
            { id: 'lat_pulldown', name: 'lat pulldown : 4x15x55kg' },
            { id: 'rear_delt_fly', name: 'rear-delt-fly: 4x15x10kg' },
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 4x15x12kg' }
        ],
        exercises: [
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x15x60kg' },
            { id: 'lat_pulldown', name: 'lat pulldown : 4x15x55kg' },
            { id: 'rear_delt_fly', name: 'rear-delt-fly: 4x15x10kg' },
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 4x15x12kg' }
        ],
        baseLevel: 19,
        baseStats: {
            STR: 19,
            VOL: 17,
            TMP: 15,
            END: 16,
            PHY: 18,
            HYP: 19
        },
        subStats: [{ key: "potential", label: "Potential", value: 19, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Dokuma Ustası',
            subtitle: 'Dokuma ustasının ince çekişi; örümceğe dönüşen gurur. Athena ile dokuma yarışına giren ve hubris gösterdiği için Athena tarafından örümceğe dönüştürülen kadındır. Yeteneği ve kibri temsil eder.'
        }
    }, {
        id: 'legs_cerberus', name: 'Cerberus', position: 'LEGS',
        primaryIconId: 'cerberus',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Cerberus', SILVER: 'Cerberus Vanguard', GOLD: 'Cerberus Ascendant',
            TITAN: 'Cerberus, The Eternal', ICON: 'Cerberus, Higher Being', LEGEND: 'Cerberus, Transcendental',
            PRIMORDIAL: 'Cerberus, Genesis of All'
        },
        subtitle: 'The three-headed guardian of the gates.',
        secondaryTag: 'VANGUARD',
        rarity: 'CREATURE',
        category: 'CREATURE',
        lore: "Cerberus (LVL 85 - LEGS): leg-press: 6x9x380kg • hip-raise-dumbbell: 5x9x95kg • outdoor-run: 20 min • seated-hip-adduction: 4x15x120kg.",
        duration: 90,
        exercisePool: [
            { id: 'leg_press', name: 'leg-press: 6x9x380kg' },
            { id: 'hip_raise_dumbbell', name: 'hip-raise-dumbbell: 5x9x95kg' },
            { id: 'outdoor_run', name: 'outdoor-run: 20 min' },
            { id: 'seated_hip_adduction', name: 'seated-hip-adduction: 4x15x120kg' }
        ],
        exercises: [
            { id: 'leg_press', name: 'leg-press: 6x9x380kg' },
            { id: 'hip_raise_dumbbell', name: 'hip-raise-dumbbell: 5x9x95kg' },
            { id: 'outdoor_run', name: 'outdoor-run: 20 min' },
            { id: 'seated_hip_adduction', name: 'seated-hip-adduction: 4x15x120kg' }
        ],
        baseLevel: 85,
        baseStats: {
            STR: 85,
            VOL: 77,
            TMP: 68,
            END: 72,
            PHY: 81,
            HYP: 85
        },
        subStats: [{ key: "potential", label: "Potential", value: 85, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Hades Guardian',
            subtitle: 'The three-headed guardian of the gates of the underworld. Prevents the dead from leaving and the living from entering the realm of Hades. Represents vigilance and ferocity. Offspring of Typhon and Echidna.'
        }
    }, {
        id: 'pull_hydra', name: 'Hydra', position: 'PULL',
        primaryIconId: 'hydra',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Hydra', SILVER: 'Hydra Vanguard', GOLD: 'Hydra Ascendant',
            TITAN: 'Hydra, The Eternal', ICON: 'Hydra, Higher Being', LEGEND: 'Hydra, Transcendental',
            PRIMORDIAL: 'Hydra, Genesis of All'
        },
        subtitle: 'The multi-headed pool of regenerating strength.',
        secondaryTag: 'VANGUARD',
        rarity: 'CREATURE',
        category: 'CREATURE',
        lore: "Hydra (LVL 84 - PULL): lat pulldown : 5x9x105kg • one-arm-dumbbell-row: 4x9x55kg • Tbar-row: 4x12x85kg • seated-cable-row: 4x15x90kg.",
        duration: 90,
        exercisePool: [
            { id: 'lat_pulldown', name: 'lat pulldown : 5x9x105kg' },
            { id: 'one_arm_dumbbell_row', name: 'one-arm-dumbbell-row: 4x9x55kg' },
            { id: 'Tbar_row', name: 'Tbar-row: 4x12x85kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x15x90kg' }
        ],
        exercises: [
            { id: 'lat_pulldown', name: 'lat pulldown : 5x9x105kg' },
            { id: 'one_arm_dumbbell_row', name: 'one-arm-dumbbell-row: 4x9x55kg' },
            { id: 'Tbar_row', name: 'Tbar-row: 4x12x85kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x15x90kg' }
        ],
        baseLevel: 84,
        baseStats: {
            STR: 84,
            VOL: 76,
            TMP: 67,
            END: 71,
            PHY: 80,
            HYP: 84
        },
        subStats: [{ key: "potential", label: "Potential", value: 84, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Regenerating Strength',
            subtitle: 'The multi-headed pool of regenerating strength. A marsh-dwelling water monster with multiple heads; whenever one was cut off, two more would grow in its place. Represents persistence and overwhelming force. Offspring of Typhon and Echidna.'
        }
    }, {
        id: 'pull_scylla', name: 'Scylla', position: 'PULL',
        primaryIconId: 'scylla',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Scylla', SILVER: 'Scylla Vanguard', GOLD: 'Scylla Ascendant',
            TITAN: 'Scylla, The Eternal', ICON: 'Scylla, Higher Being', LEGEND: 'Scylla, Transcendental',
            PRIMORDIAL: 'Scylla, Genesis of All'
        },
        subtitle: 'The multi-headed monster who snatches sailors.',
        secondaryTag: 'VANGUARD',
        rarity: 'CREATURE',
        category: 'CREATURE',
        lore: "Scylla (LVL 83 - PULL): Tbar-row: 5x9x95kg • seated-cable-row: 4x12x85kg • one-arm-dumbbell-row: 4x9x45kg • lat pulldown : 4x12x80kg.",
        duration: 90,
        exercisePool: [
            { id: 'Tbar_row', name: 'Tbar-row: 5x9x95kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x12x85kg' },
            { id: 'one_arm_dumbbell_row', name: 'one-arm-dumbbell-row: 4x9x45kg' },
            { id: 'lat_pulldown', name: 'lat pulldown : 4x12x80kg' }
        ],
        exercises: [
            { id: 'Tbar_row', name: 'Tbar-row: 5x9x95kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x12x85kg' },
            { id: 'one_arm_dumbbell_row', name: 'one-arm-dumbbell-row: 4x9x45kg' },
            { id: 'lat_pulldown', name: 'lat pulldown : 4x12x80kg' }
        ],
        baseLevel: 83,
        baseStats: {
            STR: 83,
            VOL: 75,
            TMP: 66,
            END: 71,
            PHY: 79,
            HYP: 83
        },
        subStats: [{ key: "potential", label: "Potential", value: 83, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Sailor Snatcher',
            subtitle: 'The multi-headed monster who snatches sailors. A sea monster who dwelt in a narrow strait opposite Charybdis, snatching sailors from passing ships with her six long necks. Represents inescapable danger. Daughter of Phorcys and Ceto.'
        }
    }, {
        id: 'pull_charybdis', name: 'Charybdis', position: 'PULL',
        primaryIconId: 'charybdis',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Charybdis', SILVER: 'Charybdis Vanguard', GOLD: 'Charybdis Ascendant',
            TITAN: 'Charybdis, The Eternal', ICON: 'Charybdis, Higher Being', LEGEND: 'Charybdis, Transcendental',
            PRIMORDIAL: 'Charybdis, Genesis of All'
        },
        subtitle: 'A massive whirlpool of suction power.',
        secondaryTag: 'VANGUARD',
        rarity: 'CREATURE',
        category: 'CREATURE',
        lore: "Charybdis (LVL 82 - PULL): seated-cable-row: 6x9x110kg • lat pulldown : 5x9x95kg • one-arm-dumbbell-row: 4x12x55kg • Tbar-row: 4x9x100kg.",
        duration: 90,
        exercisePool: [
            { id: 'seated_cable_row', name: 'seated-cable-row: 6x9x110kg' },
            { id: 'lat_pulldown', name: 'lat pulldown : 5x9x95kg' },
            { id: 'one_arm_dumbbell_row', name: 'one-arm-dumbbell-row: 4x12x55kg' },
            { id: 'Tbar_row', name: 'Tbar-row: 4x9x100kg' }
        ],
        exercises: [
            { id: 'seated_cable_row', name: 'seated-cable-row: 6x9x110kg' },
            { id: 'lat_pulldown', name: 'lat pulldown : 5x9x95kg' },
            { id: 'one_arm_dumbbell_row', name: 'one-arm-dumbbell-row: 4x12x55kg' },
            { id: 'Tbar_row', name: 'Tbar-row: 4x9x100kg' }
        ],
        baseLevel: 82,
        baseStats: {
            STR: 82,
            VOL: 74,
            TMP: 66,
            END: 70,
            PHY: 78,
            HYP: 82
        },
        subStats: [{ key: "potential", label: "Potential", value: 82, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Destructive Nature',
            subtitle: 'A massive whirlpool of suction power. A sea monster who lived under a fig tree on one side of a narrow strait and swallowed huge amounts of water three times a day, creating deadly whirlpools. Represents destructive nature. Daughter of Poseidon and Gaia.'
        }
    }, {
        id: 'push_medusa', name: 'Medusa', position: 'PUSH',
        primaryIconId: 'medusa',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Medusa', SILVER: 'Medusa Vanguard', GOLD: 'Medusa Ascendant',
            TITAN: 'Medusa, The Eternal', ICON: 'Medusa, Higher Being', LEGEND: 'Medusa, Transcendental',
            PRIMORDIAL: 'Medusa, Genesis of All'
        },
        subtitle: 'Harsh push that turns onlookers to stone.',
        secondaryTag: 'VANGUARD',
        rarity: 'CREATURE',
        category: 'CREATURE',
        lore: "Medusa (LVL 81 - PUSH): incline-dumbbell-bench-press: 5x9x45kg • dumbbell-lateral-raise: 5x9x20kg • chest-rope: 4x15x40kg • bench-press: 4x10x100kg.",
        duration: 90,
        exercisePool: [
            { id: 'incline_dumbbell_bench_press', name: 'incline-dumbbell-bench-press: 5x9x45kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 5x9x20kg' },
            { id: 'chest_rope', name: 'chest-rope: 4x15x40kg' },
            { id: 'bench_press', name: 'bench-press: 4x10x100kg' }
        ],
        exercises: [
            { id: 'incline_dumbbell_bench_press', name: 'incline-dumbbell-bench-press: 5x9x45kg' },
            { id: 'dumbbell_lateral_raise', name: 'dumbbell-lateral-raise: 5x9x20kg' },
            { id: 'chest_rope', name: 'chest-rope: 4x15x40kg' },
            { id: 'bench_press', name: 'bench-press: 4x10x100kg' }
        ],
        baseLevel: 81,
        baseStats: {
            STR: 81,
            VOL: 73,
            TMP: 65,
            END: 69,
            PHY: 77,
            HYP: 81
        },
        subStats: [{ key: "potential", label: "Potential", value: 81, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Terrifying Beauty',
            subtitle: 'Harsh push that turns onlookers to stone. Once a beautiful priestess, transformed by Athena into a monster with snakes for hair whose gaze could turn any living being to stone. Represents terrifying beauty and protection. Daughter of Phorcys and Ceto.'
        }
    }, {
        id: 'push_chimera', name: 'Chimera', position: 'PUSH',
        primaryIconId: 'chimera',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Chimera', SILVER: 'Chimera Vanguard', GOLD: 'Chimera Ascendant',
            TITAN: 'Chimera, The Eternal', ICON: 'Chimera, Higher Being', LEGEND: 'Chimera, Transcendental',
            PRIMORDIAL: 'Chimera, Genesis of All'
        },
        subtitle: 'A fire-breathing mixed-creature push.',
        secondaryTag: 'VANGUARD',
        rarity: 'CREATURE',
        category: 'CREATURE',
        lore: "Chimera (LVL 80 - PUSH): chest-rope: 4x12x40kg • bench-press: 4x10x100kg • incline-dumbbell-bench-press: 4x12x55kg • swinging-the-rope: 4x15x35kg.",
        duration: 90,
        exercisePool: [
            { id: 'chest_rope', name: 'chest-rope: 4x12x40kg' },
            { id: 'bench_press', name: 'bench-press: 4x10x100kg' },
            { id: 'incline_dumbbell_bench_press', name: 'incline-dumbbell-bench-press: 4x12x55kg' },
            { id: 'swinging_the_rope', name: 'swinging-the-rope: 4x15x35kg' }
        ],
        exercises: [
            { id: 'chest_rope', name: 'chest-rope: 4x12x40kg' },
            { id: 'bench_press', name: 'bench-press: 4x10x100kg' },
            { id: 'incline_dumbbell_bench_press', name: 'incline-dumbbell-bench-press: 4x12x55kg' },
            { id: 'swinging_the_rope', name: 'swinging-the-rope: 4x15x35kg' }
        ],
        baseLevel: 80,
        baseStats: {
            STR: 80,
            VOL: 72,
            TMP: 64,
            END: 68,
            PHY: 76,
            HYP: 80
        },
        subStats: [{ key: "potential", label: "Potential", value: 80, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Chaotic Power',
            subtitle: 'A fire-breathing mixed-creature push. A monstrous fire-breathing hybrid creature with the front of a lion, the middle of a goat, and the rear of a dragon (or snake). Represents chaotic power. Offspring of Typhon and Echidna.'
        }
    }, {
        id: 'push_minotaur', name: 'Minotaur', position: 'PUSH',
        primaryIconId: 'minotaur',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Minotaur', SILVER: 'Minotaur Vanguard', GOLD: 'Minotaur Ascendant',
            TITAN: 'Minotaur, The Eternal', ICON: 'Minotaur, Higher Being', LEGEND: 'Minotaur, Transcendental',
            PRIMORDIAL: 'Minotaur, Genesis of All'
        },
        subtitle: 'The brute bull strength of the Labyrinth.',
        secondaryTag: 'VANGUARD',
        rarity: 'CREATURE',
        category: 'CREATURE',
        lore: "Minotaur (LVL 79 - PUSH): bench-press: 5x8x125kg • assisted-tricep-dip: 4x9x25kg • chest-rope: 3x12x45kg • flat-barbell-bench-press: 4x9x110kg.",
        duration: 90,
        exercisePool: [
            { id: 'bench_press', name: 'bench-press: 5x8x125kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 4x9x25kg' },
            { id: 'chest_rope', name: 'chest-rope: 3x12x45kg' },
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 4x9x110kg' }
        ],
        exercises: [
            { id: 'bench_press', name: 'bench-press: 5x8x125kg' },
            { id: 'assisted_tricep_dip', name: 'assisted-tricep-dip: 4x9x25kg' },
            { id: 'chest_rope', name: 'chest-rope: 3x12x45kg' },
            { id: 'flat_barbell_bench_press', name: 'flat-barbell-bench-press: 4x9x110kg' }
        ],
        baseLevel: 79,
        baseStats: {
            STR: 79,
            VOL: 71,
            TMP: 63,
            END: 67,
            PHY: 75,
            HYP: 79
        },
        subStats: [{ key: "potential", label: "Potential", value: 79, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Labyrinth Brute',
            subtitle: 'The brute bull strength of the Labyrinth. A monster with the body of a man and the head of a bull, confined in the Knossian Labyrinth built by Daedalus. Represents primal rage and imprisonment. Child of Pasiphae and the Cretan Bull.'
        }
    }, {
        id: 'pull_sphinx', name: 'Sphinx', position: 'PULL',
        primaryIconId: 'sphinx',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Sphinx', SILVER: 'Sphinx Vanguard', GOLD: 'Sphinx Ascendant',
            TITAN: 'Sphinx, The Eternal', ICON: 'Sphinx, Higher Being', LEGEND: 'Sphinx, Transcendental',
            PRIMORDIAL: 'Sphinx, Genesis of All'
        },
        subtitle: 'The riddle-solving grip of the claw.',
        secondaryTag: 'VANGUARD',
        rarity: 'CREATURE',
        category: 'CREATURE',
        lore: "Sphinx (LVL 75 - PULL): lat pulldown : 5x9x85kg • bicep-dumbbell: 4x12x20kg • seated-cable-row: 4x12x75kg • one-arm-dumbbell-row: 4x9x40kg.",
        duration: 90,
        exercisePool: [
            { id: 'lat_pulldown', name: 'lat pulldown : 5x9x85kg' },
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 4x12x20kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x12x75kg' },
            { id: 'one_arm_dumbbell_row', name: 'one-arm-dumbbell-row: 4x9x40kg' }
        ],
        exercises: [
            { id: 'lat_pulldown', name: 'lat pulldown : 5x9x85kg' },
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 4x12x20kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x12x75kg' },
            { id: 'one_arm_dumbbell_row', name: 'one-arm-dumbbell-row: 4x9x40kg' }
        ],
        baseLevel: 75,
        baseStats: {
            STR: 75,
            VOL: 68,
            TMP: 60,
            END: 64,
            PHY: 71,
            HYP: 75
        },
        subStats: [{ key: "potential", label: "Potential", value: 75, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Riddle Solver',
            subtitle: 'The riddle-solving grip of the claw. A mythical creature with the head of a human, the body of a lion, and the wings of a bird; famous for her riddle. Represents mystery and lethal intellect. Offspring of Orthrus and the Chimera.'
        }
    }, {
        id: 'legs_centaur', name: 'Centaur', position: 'LEGS',
        primaryIconId: 'centaur',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Centaur', SILVER: 'Centaur Vanguard', GOLD: 'Centaur Ascendant',
            TITAN: 'Centaur, The Eternal', ICON: 'Centaur, Higher Being', LEGEND: 'Centaur, Transcendental',
            PRIMORDIAL: 'Centaur, Genesis of All'
        },
        subtitle: 'Unshakable balance of the wild.',
        secondaryTag: 'VANGUARD',
        rarity: 'CREATURE',
        category: 'CREATURE',
        lore: "Centaur (LVL 72 - LEGS): dumbbell-lunge-bicep-curl: 5x9x45kg • leg-press: 4x12x200kg • biking: 20 min • outdoor-run: 25 min.",
        duration: 90,
        exercisePool: [
            { id: 'dumbbell_lunge_bicep_curl', name: 'dumbbell-lunge-bicep-curl: 5x9x45kg' },
            { id: 'leg_press', name: 'leg-press: 4x12x200kg' },
            { id: 'biking', name: 'biking: 20 min' },
            { id: 'outdoor_run', name: 'outdoor-run: 25 min' }
        ],
        exercises: [
            { id: 'dumbbell_lunge_bicep_curl', name: 'dumbbell-lunge-bicep-curl: 5x9x45kg' },
            { id: 'leg_press', name: 'leg-press: 4x12x200kg' },
            { id: 'biking', name: 'biking: 20 min' },
            { id: 'outdoor_run', name: 'outdoor-run: 25 min' }
        ],
        baseLevel: 72,
        baseStats: {
            STR: 72,
            VOL: 65,
            TMP: 58,
            END: 61,
            PHY: 68,
            HYP: 72
        },
        subStats: [{ key: "potential", label: "Potential", value: 72, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Wild Balance',
            subtitle: 'Unshakable balance of the wild. Half-man and half-horse creatures known for their wild nature, strength, and skill in archery (though some, like Chiron, were wise). Represents the duality of nature. Descendants of Ixion.'
        }
    }, {
        id: 'legs_pegasus', name: 'Pegasus', position: 'LEGS',
        primaryIconId: 'pegasus',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Pegasus', SILVER: 'Pegasus Vanguard', GOLD: 'Pegasus Ascendant',
            TITAN: 'Pegasus, The Eternal', ICON: 'Pegasus, Higher Being', LEGEND: 'Pegasus, Transcendental',
            PRIMORDIAL: 'Pegasus, Genesis of All'
        },
        subtitle: 'Legs that glide through the sky.',
        secondaryTag: 'VANGUARD',
        rarity: 'CREATURE',
        category: 'CREATURE',
        lore: "Pegasus (LVL 69 - LEGS): leg-press: 4x12x180kg • jump-rope-new: 20 min • outdoor-run: 30 min • biking: 30 min.",
        duration: 90,
        exercisePool: [
            { id: 'leg_press', name: 'leg-press: 4x12x180kg' },
            { id: 'jump_rope_new', name: 'jump-rope-new: 20 min' },
            { id: 'outdoor_run', name: 'outdoor-run: 30 min' },
            { id: 'biking', name: 'biking: 30 min' }
        ],
        exercises: [
            { id: 'leg_press', name: 'leg-press: 4x12x180kg' },
            { id: 'jump_rope_new', name: 'jump-rope-new: 20 min' },
            { id: 'outdoor_run', name: 'outdoor-run: 30 min' },
            { id: 'biking', name: 'biking: 30 min' }
        ],
        baseLevel: 69,
        baseStats: {
            STR: 69,
            VOL: 62,
            TMP: 55,
            END: 59,
            PHY: 66,
            HYP: 69
        },
        subStats: [{ key: "potential", label: "Potential", value: 69, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Divine Wings',
            subtitle: 'Legs that glide through the sky. A divine winged horse who sprang from the neck of Medusa when she was beheaded; associated with lightning and thunder. Represents inspiration and freedom. Born from Medusa and Poseidon.'
        }
    }, {
        id: 'pull_graeae', name: 'Graeae', position: 'PULL',
        primaryIconId: 'graeae',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Graeae', SILVER: 'Graeae Vanguard', GOLD: 'Graeae Ascendant',
            TITAN: 'Graeae, The Eternal', ICON: 'Graeae, Higher Being', LEGEND: 'Graeae, Transcendental',
            PRIMORDIAL: 'Graeae, Genesis of All'
        },
        subtitle: 'Constant pull for the shared eye.',
        secondaryTag: 'VANGUARD',
        rarity: 'CREATURE',
        category: 'CREATURE',
        lore: "Graeae (LVL 67 - PULL): lat pulldown : 5x9x75kg • seated-cable-row: 4x12x70kg • bicep-dumbbell: 4x12x18kg • dumbbell-concentration: 4x15x15kg.",
        duration: 90,
        exercisePool: [
            { id: 'lat_pulldown', name: 'lat pulldown : 5x9x75kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x12x70kg' },
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 4x12x18kg' },
            { id: 'db_concentration_curl', name: 'dumbbell-concentration: 4x15x15kg' }
        ],
        exercises: [
            { id: 'lat_pulldown', name: 'lat pulldown : 5x9x75kg' },
            { id: 'seated_cable_row', name: 'seated-cable-row: 4x12x70kg' },
            { id: 'bicep_db_curl', name: 'bicep-dumbbell: 4x12x18kg' },
            { id: 'db_concentration_curl', name: 'dumbbell-concentration: 4x15x15kg' }
        ],
        baseLevel: 67,
        baseStats: {
            STR: 67,
            VOL: 60,
            TMP: 54,
            END: 57,
            PHY: 64,
            HYP: 67
        },
        subStats: [{ key: "potential", label: "Potential", value: 67, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Shared Vision',
            subtitle: 'Constant pull for the shared eye. Three sisters who shared a single eye and a single tooth among them; experts in ancient knowledge and oracles. Represents collective vision and sisterhood. Daughters of Phorcys and Ceto.'
        }
    }, {
        id: 'legs_pygmies', name: 'Pygmies', position: 'LEGS',
        primaryIconId: 'pygmies',
        secondaryIconIds: [],
        deityGender: 'male',
        primaryEpithetByTier: {
            BRONZE: 'Sigil of Pygmies', SILVER: 'Pygmies Vanguard', GOLD: 'Pygmies Ascendant',
            TITAN: 'Pygmies, The Eternal', ICON: 'Pygmies, Higher Being', LEGEND: 'Pygmies, Transcendental',
            PRIMORDIAL: 'Pygmies, Genesis of All'
        },
        subtitle: 'Agile legs that fight the cranes.',
        secondaryTag: 'VANGUARD',
        rarity: 'CREATURE',
        category: 'CREATURE',
        lore: "Pygmies (LVL 65 - LEGS): outdoor-run: 35 min • dumbbell-lunge-bicep-curl: 4x12x25kg • seated-hip-adduction: 4x15x50kg • jump-rope-new: 10 min.",
        duration: 90,
        exercisePool: [
            { id: 'outdoor_run', name: 'outdoor-run: 35 min' },
            { id: 'dumbbell_lunge_bicep_curl', name: 'dumbbell-lunge-bicep-curl: 4x12x25kg' },
            { id: 'seated_hip_adduction', name: 'seated-hip-adduction: 4x15x50kg' },
            { id: 'jump_rope_new', name: 'jump-rope-new: 10 min' }
        ],
        exercises: [
            { id: 'outdoor_run', name: 'outdoor-run: 35 min' },
            { id: 'dumbbell_lunge_bicep_curl', name: 'dumbbell-lunge-bicep-curl: 4x12x25kg' },
            { id: 'seated_hip_adduction', name: 'seated-hip-adduction: 4x15x50kg' },
            { id: 'jump_rope_new', name: 'jump-rope-new: 10 min' }
        ],
        baseLevel: 65,
        baseStats: {
            STR: 65,
            VOL: 59,
            TMP: 52,
            END: 55,
            PHY: 62,
            HYP: 65
        },
        subStats: [{ key: "potential", label: "Potential", value: 65, primary: "STR" }],
        skills: [],
        thread: {
            title: 'Crane Fighters',
            subtitle: 'Agile legs that fight the cranes. A tribe of diminutive people known for their constant battles with migrating cranes. Represents courage in the face of larger foes. Descendants of Pygmaeus.'
        }
    }
];
export const SORTED_COLLECTIBLE_WORKOUTS = [...collectibleWorkouts]
    .filter(w => w && w.id && w.position && w.baseStats)
    .sort((a, b) => {
        // Sort by position first
        if (a.position !== b.position) return a.position.localeCompare(b.position);
        // Then by OVR
        const ovrA = calculateOVR(a.baseStats, a.position);
        const ovrB = calculateOVR(b.baseStats, b.position);
        return ovrA - ovrB;
    });

export default collectibleWorkouts;
