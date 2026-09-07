// Greek Mythology Category Mapping
// Central source of truth for categorizing all mythological entities

export type MythologyCategory =
    | 'OLYMPIAN'
    | 'TITAN'
    | 'PRIMORDIAL'
    | 'UNDERWORLD'
    | 'CREATURE'
    | 'HERO'
    | 'MORTAL';

export interface MythologyCategoryConfig {
    name: string;
    displayName: string;
    color: string;
    icon: string;
}

export const MYTHOLOGY_CATEGORY_CONFIGS: Record<MythologyCategory, MythologyCategoryConfig> = {
    OLYMPIAN: {
        name: 'olympian',
        displayName: 'Olympian',
        color: '#FFD700', // Gold
        icon: 'crown',
    },
    TITAN: {
        name: 'titan',
        displayName: 'Titan',
        color: '#8B4513', // Earth brown
        icon: 'mountain',
    },
    PRIMORDIAL: {
        name: 'primordial',
        displayName: 'Primordial',
        color: '#4B0082', // Deep purple
        icon: 'star-four-points',
    },
    UNDERWORLD: {
        name: 'underworld',
        displayName: 'Underworld',
        color: '#1A1A2E', // Dark blue
        icon: 'skull',
    },
    CREATURE: {
        name: 'creature',
        displayName: 'Creature',
        color: '#8B0000', // Dark red
        icon: 'paw',
    },
    HERO: {
        name: 'hero',
        displayName: 'Hero',
        color: '#00CED1', // Cyan
        icon: 'sword',
    },
    MORTAL: {
        name: 'mortal',
        displayName: 'Mortal',
        color: '#A9A9A9', // Dark gray
        icon: 'account',
    },
};

// Entity to Category mapping based on mythopedia.com classification
export const MYTHOLOGY_CATEGORIES: Record<string, MythologyCategory> = {
    // ============ OLYMPIANS (12 Gods of Mount Olympus) ============
    zeus: 'OLYMPIAN',
    poseidon: 'OLYMPIAN',
    hera: 'OLYMPIAN',
    athena: 'OLYMPIAN',
    apollo: 'OLYMPIAN',
    artemis: 'OLYMPIAN',
    ares: 'OLYMPIAN',
    hephaestus: 'OLYMPIAN',
    aphrodite: 'OLYMPIAN',
    hermes: 'OLYMPIAN',
    demeter: 'OLYMPIAN',
    dionysus: 'OLYMPIAN',
    dionysos: 'OLYMPIAN', // Alternate spelling

    // ============ TITANS (Pre-Olympian Gods) ============
    atlas: 'TITAN',
    cronus: 'TITAN',
    hyperion: 'TITAN',
    prometheus: 'TITAN',
    themis: 'TITAN',
    rhea: 'TITAN',
    oceanus: 'TITAN',
    tethys: 'TITAN',
    theia: 'TITAN',
    phoebe: 'TITAN',
    mnemosyne: 'TITAN',
    iapetus: 'TITAN',
    coeus: 'TITAN',
    crius: 'TITAN',

    // ============ PRIMORDIAL GODS (First Beings) ============
    chaos: 'PRIMORDIAL',
    gaia: 'PRIMORDIAL',
    uranus: 'PRIMORDIAL',
    nyx: 'PRIMORDIAL',
    erebus: 'PRIMORDIAL',
    eros: 'PRIMORDIAL',
    tartarus: 'PRIMORDIAL',
    pontus: 'PRIMORDIAL',
    ourea: 'PRIMORDIAL',
    aether: 'PRIMORDIAL',

    // ============ UNDERWORLD GODS ============
    hades: 'UNDERWORLD',
    persephone: 'UNDERWORLD',
    hecate: 'UNDERWORLD',
    thanatos: 'UNDERWORLD',
    hypnos: 'UNDERWORLD',
    styx: 'UNDERWORLD',
    acheron: 'UNDERWORLD',
    erinyes: 'UNDERWORLD',
    moirae: 'UNDERWORLD',

    // ============ CREATURES & MONSTERS ============
    cerberus: 'CREATURE',
    hydra: 'CREATURE',
    medusa: 'CREATURE',
    pegasus: 'CREATURE',
    chimera: 'CREATURE',
    minotaur: 'CREATURE',
    cyclopes: 'CREATURE',
    charybdis: 'CREATURE',
    scylla: 'CREATURE',
    polyphemus: 'CREATURE',
    hecatoncheires: 'CREATURE',
    gorgons: 'CREATURE',
    graeae: 'CREATURE',
    giant: 'CREATURE',
    mormo: 'CREATURE',
    pan: 'CREATURE',
    arion: 'CREATURE',
    cercopes: 'CREATURE',
    pygmies: 'CREATURE',
    uranian_cyclopes: 'CREATURE',
    the_cretan_bull: 'CREATURE',
    cretan_bull: 'CREATURE',
    the_crommyonian_sow: 'CREATURE',
    crommyonian_sow: 'CREATURE',
    the_stymphalian_birds: 'CREATURE',
    stymphalian_birds: 'CREATURE',
    balius_and_xanthus: 'CREATURE',
    balius_xanthus: 'CREATURE',

    // ============ HEROES & MORTALS ============
    achilles: 'HERO',
    perseus: 'HERO',
    heracles: 'HERO',
    hercules: 'HERO', // Roman name
    odysseus: 'HERO',
    theseus: 'HERO',
    thesus: 'HERO', // Alternate spelling
    jason: 'HERO',
    orpheus: 'HERO',
    adonis: 'HERO',
    bellerophon: 'HERO',
    agamemnon: 'HERO',
    menelaus: 'HERO',
    hector: 'HERO',
    diomedes: 'HERO',
    meleager: 'HERO',
    atalanta: 'HERO',
    aeneas: 'HERO',
    cadmus: 'HERO',
    oedipus: 'HERO',
    cassandra: 'HERO',
    andromache: 'HERO',
    asclepius: 'HERO',
    triptolemus: 'HERO',
    abas: 'HERO',
    acastus: 'HERO',
    achaeus: 'HERO',
    admetus: 'HERO',
    dioscuri: 'HERO',
    icarus: 'HERO',
    daedalus: 'HERO',
    helios: 'HERO', // Sometimes classified as Titan
    nike: 'HERO',
    chronos: 'HERO',

    // ============ MORTALS (Fated Figures) ============
    pandora: 'MORTAL',
    sisyphus: 'MORTAL',
    midas: 'MORTAL',
    arachne: 'MORTAL',
};

// Helper function to get category for an entity
export const getMythologyCategory = (entityId?: string): MythologyCategory | undefined => {
    if (!entityId) return undefined;
    return MYTHOLOGY_CATEGORIES[entityId.toLowerCase()];
};

// Helper function to get category config
export const getMythologyCategoryConfig = (entityId?: string): MythologyCategoryConfig | undefined => {
    const category = getMythologyCategory(entityId);
    if (!category) return undefined;
    return MYTHOLOGY_CATEGORY_CONFIGS[category];
};
