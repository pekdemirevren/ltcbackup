// Deity style configuration for icon positioning across cards
// Cropped images are used in WorkoutCard, Full images in CollectibleWorkoutDetailScreen

export type DeitySourceKey =
    // Olympians
    | 'zeus' | 'poseidon' | 'hera' | 'athena' | 'apollo' | 'artemis'
    | 'ares' | 'hephaestus' | 'aphrodite' | 'hermes' | 'demeter' | 'dionysus' | 'hestia'
    // Titans
    | 'atlas' | 'cronus' | 'kronos' | 'hyperion' | 'themis' | 'coeus' | 'crius'
    | 'iapetus' | 'mnemosyne' | 'oceanus' | 'phoebe' | 'prometheus' | 'rhea' | 'tethys' | 'theia'
    // Underworld
    | 'hades' | 'persephone' | 'hecate' | 'thanatos' | 'hypnos' | 'styx' | 'acheron' | 'erinyes' | 'moirae' | 'charon'
    // Creatures
    | 'cerberus' | 'hydra' | 'medusa' | 'pegasus' | 'chimera' | 'minotaur' | 'cyclopes' | 'centaur'
    | 'charybdis' | 'scylla' | 'polyphemus' | 'hecatoncheires' | 'giant' | 'mormo' | 'pan' | 'arion'
    | 'graeae' | 'gorgons' | 'pygmies' | 'cretan_bull' | 'the_cretan_bull' | 'stymphalian_birds' | 'the_stymphalian_birds' | 'balius_xanthus' | 'balius_and_xanthus'
    | 'cercopes' | 'crommyonian_sow' | 'the_crommyonian_sow' | 'uranian_cyclopes' | 'harpy' | 'siren' | 'harpies' | 'sirens' | 'sphinx'
    // Primordial
    | 'chaos' | 'gaia' | 'uranus' | 'nyx' | 'erebus' | 'eros' | 'tartarus' | 'pontus' | 'ourea' | 'aether'
    | 'ananke' | 'hemera' | 'thalassa' | 'phanes'
    // Heroes/Mortals
    | 'hercules' | 'heracles' | 'perseus' | 'achilles' | 'odysseus' | 'theseus' | 'thesus' | 'jason' | 'orpheus' | 'adonis'
    | 'bellerophon' | 'agamemnon' | 'menelaus' | 'hector' | 'diomedes' | 'meleager' | 'atalanta' | 'aeneas'
    | 'cadmus' | 'oedipus' | 'cassandra' | 'andromache' | 'asclepius' | 'triptolemus'
    | 'abas' | 'acastus' | 'achaeus' | 'admetus' | 'dioscuri'
    | 'helios' | 'chronos' | 'nike' | 'icarus' | 'daedalus'
    | 'ariadne' | 'epimetheus' | 'leto' | 'sisyphus' | 'narcissus' | 'arachne' | 'melinoe'
    | 'midas' | 'pandora';

export interface DeityStyleConfig {
    sizeReduction: number;
    translateY: number;
    translateX: number;
    baseSize: number;
    scaleOverride?: number;
    sourceKey: DeitySourceKey;
}

// Base profile for all deities - can be overridden per deity if needed
const BASE_PROFILE = {
    sizeReduction: 130,
    translateY: -11,
    translateX: -25,
    baseSize: 230,
    scaleOverride: 1.1,
};

// Helper to create a deity config with base profile
const createDeityConfig = (sourceKey: DeitySourceKey, overrides?: Partial<DeityStyleConfig>): DeityStyleConfig => ({
    ...BASE_PROFILE,
    sourceKey,
    ...overrides,
});

export const DEITY_STYLE_CONFIGS: Record<string, DeityStyleConfig> = {
    // ============ OLYMPIANS ============
    // Olympians use original settings (20px smaller, 15px lower than global)
    zeus: createDeityConfig('zeus', { baseSize: 210, translateY: 5 }),
    poseidon: createDeityConfig('poseidon', { baseSize: 210, translateY: 5 }),
    poseidon_small: createDeityConfig('poseidon', { baseSize: 210, translateY: 5 }),
    hera: createDeityConfig('hera', { baseSize: 210, translateY: 5 }),
    athena: createDeityConfig('athena', { baseSize: 210, translateY: 5 }),
    apollo: createDeityConfig('apollo', { baseSize: 210, translateY: 5 }),
    artemis: createDeityConfig('artemis', { baseSize: 210, translateY: 5 }),
    ares: createDeityConfig('ares', { baseSize: 210, translateY: 5 }),
    hephaestus: createDeityConfig('hephaestus', { baseSize: 210, translateY: 5 }),
    aphrodite: createDeityConfig('aphrodite', { baseSize: 210, translateY: 5 }),
    hermes: createDeityConfig('hermes', { baseSize: 210, translateY: 5 }),
    demeter: createDeityConfig('demeter', { baseSize: 210, translateY: 5 }),
    dionysus: createDeityConfig('dionysus', { baseSize: 210, translateY: 5 }),
    dionysos: createDeityConfig('dionysus', { baseSize: 210, translateY: 5 }),
    hestia: createDeityConfig('hestia', { baseSize: 210, translateY: 5 }),

    // ============ TITANS ============
    // Titans use original settings (20px smaller, 15px lower than global)
    atlas: createDeityConfig('atlas', { baseSize: 210, translateY: 5 }),
    cronus: createDeityConfig('cronus', { baseSize: 210, translateY: 5 }),
    kronos: createDeityConfig('kronos', { baseSize: 210, translateY: 5 }),
    hyperion: createDeityConfig('hyperion', { baseSize: 210, translateY: 5 }),
    themis: createDeityConfig('themis', { baseSize: 210, translateY: 5 }),
    coeus: createDeityConfig('coeus', { baseSize: 210, translateY: 5 }),
    crius: createDeityConfig('crius', { baseSize: 210, translateY: 5 }),
    iapetus: createDeityConfig('iapetus', { baseSize: 210, translateY: 5 }),
    mnemosyne: createDeityConfig('mnemosyne', { baseSize: 210, translateY: 5 }),
    oceanus: createDeityConfig('oceanus', { baseSize: 210, translateY: 5 }),
    phoebe: createDeityConfig('phoebe', { baseSize: 210, translateY: 5 }),
    prometheus: createDeityConfig('prometheus', { baseSize: 210, translateY: 5 }),
    rhea: createDeityConfig('rhea', { baseSize: 210, translateY: 5 }),
    tethys: createDeityConfig('tethys', { baseSize: 210, translateY: 5 }),
    theia: createDeityConfig('theia', { baseSize: 210, translateY: 5 }),

    // ============ UNDERWORLD ============
    hades: createDeityConfig('hades'),
    persephone: createDeityConfig('persephone'),
    hecate: createDeityConfig('hecate'),
    thanatos: createDeityConfig('thanatos'),
    hypnos: createDeityConfig('hypnos'),
    styx: createDeityConfig('styx'),
    acheron: createDeityConfig('acheron'),
    erinyes: createDeityConfig('erinyes'),
    moirae: createDeityConfig('moirae'),
    charon: createDeityConfig('charon'),

    // ============ CREATURES ============
    cerberus: createDeityConfig('cerberus'),
    cerberus_2: createDeityConfig('cerberus'),
    hydra: createDeityConfig('hydra'),
    medusa: createDeityConfig('medusa'),
    pegasus: createDeityConfig('pegasus'),
    chimera: createDeityConfig('chimera'),
    minotaur: createDeityConfig('minotaur'),
    cyclopes: createDeityConfig('cyclopes'),
    centaur: createDeityConfig('centaur'),
    charybdis: createDeityConfig('charybdis'),
    scylla: createDeityConfig('scylla'),
    polyphemus: createDeityConfig('polyphemus'),
    hecatoncheires: createDeityConfig('hecatoncheires'),
    giant: createDeityConfig('giant'),
    mormo: createDeityConfig('mormo'),
    pan: createDeityConfig('pan'),
    arion: createDeityConfig('arion'),
    graeae: createDeityConfig('graeae'),
    gorgons: createDeityConfig('gorgons'),
    pygmies: createDeityConfig('pygmies'),
    cretan_bull: createDeityConfig('cretan_bull'),
    the_cretan_bull: createDeityConfig('the_cretan_bull'),
    stymphalian_birds: createDeityConfig('stymphalian_birds'),
    the_stymphalian_birds: createDeityConfig('the_stymphalian_birds'),
    balius_xanthus: createDeityConfig('balius_xanthus'),
    cercopes: createDeityConfig('cercopes'),
    crommyonian_sow: createDeityConfig('crommyonian_sow'),
    the_crommyonian_sow: createDeityConfig('the_crommyonian_sow'),
    uranian_cyclopes: createDeityConfig('uranian_cyclopes'),
    harpy: createDeityConfig('harpy'),
    harpies: createDeityConfig('harpy'),
    siren: createDeityConfig('siren'),
    sirens: createDeityConfig('siren'),
    sphinx: createDeityConfig('sphinx'),

    // ============ PRIMORDIAL ============
    chaos: createDeityConfig('chaos'),
    gaia: createDeityConfig('gaia'),
    gaea: createDeityConfig('gaia'), // Alternate spelling
    uranus: createDeityConfig('uranus'),
    nyx: createDeityConfig('nyx'),
    erebus: createDeityConfig('erebus'),
    eros: createDeityConfig('eros'),
    tartarus: createDeityConfig('tartarus'),
    pontus: createDeityConfig('pontus'),
    ourea: createDeityConfig('ourea'),
    aether: createDeityConfig('aether'),
    ananke: createDeityConfig('ananke'),
    hemera: createDeityConfig('hemera'),
    thalassa: createDeityConfig('thalassa'),
    phanes: createDeityConfig('phanes'),

    // ============ HEROES/MORTALS ============
    // Heroes use original settings (20px smaller, 15px lower than global)
    hercules: createDeityConfig('hercules', { baseSize: 210, translateY: 5 }),
    heracles: createDeityConfig('heracles', { baseSize: 210, translateY: 5 }),
    perseus: createDeityConfig('perseus', { baseSize: 210, translateY: 5 }),
    achilles: createDeityConfig('achilles', { baseSize: 210, translateY: 5 }),
    odysseus: createDeityConfig('odysseus', { baseSize: 210, translateY: 5 }),
    theseus: createDeityConfig('theseus', { baseSize: 210, translateY: 5 }),
    thesus: createDeityConfig('thesus', { baseSize: 210, translateY: 5 }),
    jason: createDeityConfig('jason', { baseSize: 210, translateY: 5 }),
    orpheus: createDeityConfig('orpheus', { baseSize: 210, translateY: 5 }),
    adonis: createDeityConfig('adonis', { baseSize: 210, translateY: 5 }),
    helios: createDeityConfig('helios', { baseSize: 210, translateY: 5 }),
    chronos: createDeityConfig('chronos', { baseSize: 210, translateY: 5 }),
    nike: createDeityConfig('nike', { baseSize: 210, translateY: 5 }),
    icarus: createDeityConfig('icarus', { baseSize: 210, translateY: 5 }),
    daedalus: createDeityConfig('daedalus', { baseSize: 210, translateY: 5 }),
    daedalus_icarus: createDeityConfig('daedalus', { baseSize: 210, translateY: 5 }),
    hector: createDeityConfig('hector', { baseSize: 210, translateY: 5 }),
    agamemnon: createDeityConfig('agamemnon', { baseSize: 210, translateY: 5 }),
    menelaus: createDeityConfig('menelaus', { baseSize: 210, translateY: 5 }),
    bellerophon: createDeityConfig('bellerophon', { baseSize: 210, translateY: 5 }),
    diomedes: createDeityConfig('diomedes', { baseSize: 210, translateY: 5 }),
    meleager: createDeityConfig('meleager', { baseSize: 210, translateY: 5 }),
    atalanta: createDeityConfig('atalanta', { baseSize: 210, translateY: 5 }),
    aeneas: createDeityConfig('aeneas', { baseSize: 210, translateY: 5 }),
    cadmus: createDeityConfig('cadmus', { baseSize: 210, translateY: 5 }),
    oedipus: createDeityConfig('oedipus', { baseSize: 210, translateY: 5 }),
    cassandra: createDeityConfig('cassandra', { baseSize: 210, translateY: 5 }),
    andromache: createDeityConfig('andromache', { baseSize: 210, translateY: 5 }),
    asclepius: createDeityConfig('asclepius', { baseSize: 210, translateY: 5 }),
    triptolemus: createDeityConfig('triptolemus', { baseSize: 210, translateY: 5 }),
    abas: createDeityConfig('abas', { baseSize: 210, translateY: 5 }),
    acastus: createDeityConfig('acastus', { baseSize: 210, translateY: 5 }),
    achaeus: createDeityConfig('achaeus', { baseSize: 210, translateY: 5 }),
    admetus: createDeityConfig('admetus', { baseSize: 210, translateY: 5 }),
    dioscuri: createDeityConfig('dioscuri', { baseSize: 210, translateY: 5 }),
    balius_and_xanthus: createDeityConfig('balius_and_xanthus', { baseSize: 210, translateY: 5 }),
    ariadne: createDeityConfig('ariadne', { baseSize: 210, translateY: 5 }),
    epimetheus: createDeityConfig('epimetheus', { baseSize: 210, translateY: 5 }),
    leto: createDeityConfig('leto', { baseSize: 210, translateY: 5 }),
    sisyphus: createDeityConfig('sisyphus', { baseSize: 210, translateY: 5 }),
    narcissus: createDeityConfig('narcissus', { baseSize: 210, translateY: 5 }),
    arachne: createDeityConfig('arachne', { baseSize: 210, translateY: 5 }),
    melinoe: createDeityConfig('melinoe', { baseSize: 210, translateY: 5 }),
    midas: createDeityConfig('midas', { baseSize: 210, translateY: 5 }),
    pandora: createDeityConfig('pandora', { baseSize: 210, translateY: 5 }),
};

export const getDeityConfig = (id?: string): DeityStyleConfig | undefined => {
    if (!id) return undefined;
    return DEITY_STYLE_CONFIGS[id.toLowerCase()];
};
