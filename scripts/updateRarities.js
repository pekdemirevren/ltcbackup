#!/usr/bin/env node
// Script to update card rarities based on mythology category

const fs = require('fs');
const path = require('path');

// Read the mythology categories file to understand entity → category mapping
const mythologyCategories = {
    // OLYMPIANS → GOLD
    zeus: 'GOLD', poseidon: 'GOLD', hera: 'GOLD', athena: 'GOLD', apollo: 'GOLD',
    artemis: 'GOLD', ares: 'GOLD', hephaestus: 'GOLD', aphrodite: 'GOLD',
    hermes: 'GOLD', demeter: 'GOLD', dionysus: 'GOLD', dionysos: 'GOLD', hestia: 'GOLD',

    // TITANS → SILVER
    atlas: 'SILVER', cronus: 'SILVER', kronos: 'SILVER', hyperion: 'SILVER', prometheus: 'SILVER',
    themis: 'SILVER', rhea: 'SILVER', oceanus: 'SILVER', tethys: 'SILVER',
    theia: 'SILVER', phoebe: 'SILVER', mnemosyne: 'SILVER', iapetus: 'SILVER',
    coeus: 'SILVER', crius: 'SILVER',

    // PRIMORDIAL → LEGEND
    chaos: 'LEGEND', gaia: 'LEGEND', gaea: 'LEGEND', uranus: 'LEGEND', nyx: 'LEGEND',
    erebus: 'LEGEND', eros: 'LEGEND', tartarus: 'LEGEND', pontus: 'LEGEND',
    ourea: 'LEGEND', aether: 'LEGEND', chronos: 'LEGEND',

    // UNDERWORLD → ICON
    hades: 'ICON', persephone: 'ICON', hecate: 'ICON', thanatos: 'ICON',
    hypnos: 'ICON', styx: 'ICON', acheron: 'ICON', erinyes: 'ICON', moirae: 'ICON',

    // CREATURES → TITAN (rarity)
    cerberus: 'TITAN', hydra: 'TITAN', medusa: 'TITAN', pegasus: 'TITAN',
    chimera: 'TITAN', minotaur: 'TITAN', cyclopes: 'TITAN', charybdis: 'TITAN',
    scylla: 'TITAN', polyphemus: 'TITAN', hecatoncheires: 'TITAN', gorgons: 'TITAN',
    graeae: 'TITAN', giant: 'TITAN', mormo: 'TITAN', pan: 'TITAN', arion: 'TITAN',
    cercopes: 'TITAN', pygmies: 'TITAN', uranian_cyclopes: 'TITAN',
    the_cretan_bull: 'TITAN', cretan_bull: 'TITAN',
    the_crommyonian_sow: 'TITAN', crommyonian_sow: 'TITAN',
    the_stymphalian_birds: 'TITAN', stymphalian_birds: 'TITAN',
    balius_and_xanthus: 'TITAN', balius_xanthus: 'TITAN',
    sphinx: 'TITAN', centaur: 'TITAN', cyclops: 'TITAN',
    cerberus_2: 'TITAN', icarus_2: 'TITAN',

    // HEROES → BRONZE
    achilles: 'BRONZE', perseus: 'BRONZE', heracles: 'BRONZE', hercules: 'BRONZE',
    odysseus: 'BRONZE', theseus: 'BRONZE', thesus: 'BRONZE', jason: 'BRONZE',
    orpheus: 'BRONZE', adonis: 'BRONZE', bellerophon: 'BRONZE', agamemnon: 'BRONZE',
    menelaus: 'BRONZE', hector: 'BRONZE', diomedes: 'BRONZE', meleager: 'BRONZE',
    atalanta: 'BRONZE', aeneas: 'BRONZE', cadmus: 'BRONZE', oedipus: 'BRONZE',
    cassandra: 'BRONZE', andromache: 'BRONZE', asclepius: 'BRONZE', triptolemus: 'BRONZE',
    abas: 'BRONZE', acastus: 'BRONZE', achaeus: 'BRONZE', admetus: 'BRONZE',
    dioscuri: 'BRONZE', icarus: 'BRONZE', daedalus: 'BRONZE',
    daedalus_icarus: 'BRONZE', helios: 'BRONZE', nike: 'BRONZE',
};

const filePath = '/Users/evrenpekdemir/kurtarltc/ltcnew/src/constants/collectibleWorkouts.ts';
let content = fs.readFileSync(filePath, 'utf8');

// For each workout entry, find primaryIconId and update rarity accordingly
// Pattern: primaryIconId: 'xxx', ... rarity: 'YYY'

let updatedCount = 0;

// Process each block that starts with id: and contains primaryIconId
const blocks = content.split(/(?=\{\s*\n?\s*id:)/);

for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    // Extract primaryIconId
    const primaryIconMatch = block.match(/primaryIconId:\s*['"]([^'"]+)['"]/);
    if (!primaryIconMatch) continue;

    const primaryIconId = primaryIconMatch[1].toLowerCase();
    const targetRarity = mythologyCategories[primaryIconId];

    if (!targetRarity) {
        console.log(`No mapping for: ${primaryIconId}`);
        continue;
    }

    // Check current rarity
    const currentRarityMatch = block.match(/rarity:\s*['"]([^'"]+)['"]/);
    if (!currentRarityMatch) continue;

    const currentRarity = currentRarityMatch[1];

    if (currentRarity !== targetRarity) {
        // Update this block's rarity
        const updatedBlock = block.replace(
            /rarity:\s*['"][^'"]+['"]/,
            `rarity: '${targetRarity}'`
        );
        blocks[i] = updatedBlock;
        console.log(`Updated ${primaryIconId}: ${currentRarity} → ${targetRarity}`);
        updatedCount++;
    }
}

content = blocks.join('');
fs.writeFileSync(filePath, content);

console.log(`\nTotal updated: ${updatedCount} cards`);
