#!/usr/bin/env node
// Script to rebalance card stats based on rarity tier

const fs = require('fs');

// OVR target ranges by rarity
const RARITY_STATS = {
    BRONZE: { min: 18, max: 32 },   // Heroes
    SILVER: { min: 38, max: 47 },   // Titans
    GOLD: { min: 52, max: 62 },     // Olympians
    TITAN: { min: 67, max: 73 },    // Creatures
    ICON: { min: 77, max: 83 },     // Underworld
    LEGEND: { min: 87, max: 97 }    // Primordial
};

// Position stat priorities
const POSITION_PRIORITIES = {
    PUSH: ['STR', 'PHY', 'VOL', 'END', 'TMP', 'HYP'],
    PULL: ['VOL', 'HYP', 'STR', 'PHY', 'END', 'TMP'],
    LEGS: ['END', 'STR', 'PHY', 'TMP', 'VOL', 'HYP']
};

// Generate balanced stats for a given target OVR and position
function generateStats(targetOVR, position) {
    const priorities = POSITION_PRIORITIES[position] || POSITION_PRIORITIES.PUSH;
    const stats = {};

    // Distribute stats based on priority
    priorities.forEach((stat, index) => {
        const bonus = (5 - index) * 3; // Higher priority = higher bonus
        const base = targetOVR + bonus - 7;
        const variance = Math.floor(Math.random() * 5) - 2;
        stats[stat] = Math.max(5, Math.min(99, base + variance));
    });

    return stats;
}

// Read file
const filePath = '/Users/evrenpekdemir/kurtarltc/ltcnew/src/constants/collectibleWorkouts.ts';
let content = fs.readFileSync(filePath, 'utf8');

let updatedCount = 0;
let currentRarity = null;
let currentPosition = null;

// Process line by line
const lines = content.split('\n');
const newLines = [];

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Check for id line with rarity and position
    // Format: id: 'pull_atlas', name: 'Atlas', position: 'PULL', rarity: 'SILVER',
    const idLineMatch = line.match(/id:\s*'([^']+)'.*position:\s*'([^']+)'.*rarity:\s*'([^']+)'/);
    if (idLineMatch) {
        currentPosition = idLineMatch[2];
        currentRarity = idLineMatch[3];
    }

    // Check for baseStats line
    if (line.includes('baseStats:') && line.includes('{') && currentRarity && currentPosition) {
        const rarityConfig = RARITY_STATS[currentRarity];
        if (rarityConfig) {
            const targetOVR = rarityConfig.min + Math.random() * (rarityConfig.max - rarityConfig.min);
            const stats = generateStats(Math.round(targetOVR), currentPosition);

            // Replace only the baseStats part
            const newStats = `baseStats: { STR: ${stats.STR}, VOL: ${stats.VOL}, TMP: ${stats.TMP}, END: ${stats.END}, PHY: ${stats.PHY}, HYP: ${stats.HYP} }`;
            line = line.replace(/baseStats:\s*\{[^}]+\}/, newStats);

            console.log(`${currentRarity}/${currentPosition} -> OVR ~${Math.round(targetOVR)}`);
            updatedCount++;
        }
        currentRarity = null;
        currentPosition = null;
    }

    newLines.push(line);
}

fs.writeFileSync(filePath, newLines.join('\n'));
console.log(`\nTotal updated: ${updatedCount} cards`);
