#!/usr/bin/env node
const fs = require('fs');

const EXERCISE_POOLS = {
    PUSH: [
        { id: 'bench_press', name: 'Flat Barbell Bench Press' },
        { id: 'ohp', name: 'OHP' },
        { id: 'incline_dumbbell_bench_press', name: 'Incline Dumbbell' },
        { id: 'chest_rope', name: 'Chest Rope' },
        { id: 'assisted_tricep_dip', name: 'Assisted Tricep Dip' },
        { id: 'dumbbell_lateral_raise', name: 'Dumbbell Lateral Raise' },
        { id: 'push_up', name: 'Push Up' },
        { id: 'dip', name: 'Standard Dip' }
    ],
    PULL: [
        { id: 'one_arm_dumbbell_row', name: 'One Arm Dumbbell Row' },
        { id: 'tbar_row', name: 'T-Bar Row' },
        { id: 'pull_up', name: 'Pull Up' },
        { id: 'lat_pulldown', name: 'Lat Pulldown' },
        { id: 'bicep_curl_dumbbell', name: 'Bicep Curl' },
        { id: 'face_pull', name: 'Face Pull' },
        { id: 'hammer_curl', name: 'Hammer Curl' },
        { id: 'shrugs', name: 'Barbell Shrugs' }
    ],
    LEGS: [
        { id: 'squat', name: 'Barbell Squat' },
        { id: 'leg_press', name: 'Leg Press' },
        { id: 'leg_extension', name: 'Leg Extension' },
        { id: 'leg_curl', name: 'Leg Curl' },
        { id: 'calf_raise', name: 'Calf Raise' },
        { id: 'walking_lunges', name: 'Walking Lunges' },
        { id: 'romanian_deadlift', name: 'Romanian Deadlift' },
        { id: 'bulgarian_split_squat', name: 'Bulgarian Split Squat' }
    ]
};

const filePath = '/Users/evrenpekdemir/kurtarltc/ltcnew/src/constants/collectibleWorkouts.ts';
let content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
let currentPosition = null;
let updatedCount = 0;
let inWorkout = false;

const outputLines = [];

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Detect start of workout
    if (line.includes('id:') && (line.includes("'") || line.includes('"'))) {
        inWorkout = true;
    }

    // Detect position
    const posMatch = line.match(/position:\s*['"]([^'"]+)['"]/);
    if (posMatch) {
        currentPosition = posMatch[1].toUpperCase();
    }

    // Replace exercise strings or lists
    if (inWorkout && currentPosition && EXERCISE_POOLS[currentPosition]) {
        const pool = EXERCISE_POOLS[currentPosition];
        const exerciseText = '[\n' + pool.map(ex => `            { id: '${ex.id}', name: '${ex.name}' }`).join(',\n') + '\n        ]';

        if (line.includes('exercisePool: [') || line.includes('exercises: [')) {
            // Find end of current pool
            let j = i;
            let bracketCount = 1;
            while (j < lines.length && bracketCount > 0) {
                j++;
                if (lines[j].includes('[')) bracketCount++;
                if (lines[j].includes(']')) bracketCount--;
            }

            // Extract the pool content to check if it's a generic one
            const poolContent = lines.slice(i, j + 1).join('\n');
            const isGeneric = poolContent.includes('Power Movement') ||
                poolContent.includes('Strength Builder') ||
                poolContent.includes(pool[0].id);

            const isAlreadyFull = poolContent.includes(pool[7].id);

            if (isGeneric && !isAlreadyFull) {
                const header = line.match(/^\s*(exercisePool|exercises):\s*\[/)[0];
                const footer = lines[j].match(/\]\s*,?\s*$/)[0];

                // Replace lines i to j
                const replacement = '        ' + header.trim() + pool.map(ex => `\n            { id: '${ex.id}', name: '${ex.name}' }`).join(',') + '\n        ' + footer.trim();

                outputLines.push(replacement);
                i = j;
                updatedCount++;
                continue;
            }
        }
    }

    if (line.trim() === '},' || line.trim() === '}') {
        inWorkout = false;
        currentPosition = null;
    }

    outputLines.push(line);
}

fs.writeFileSync(filePath, outputLines.join('\n'));
console.log(`\nUpdated ${updatedCount} entries.`);
