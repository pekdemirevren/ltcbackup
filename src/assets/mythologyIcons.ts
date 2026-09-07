import Aphrodite from './icons/skills.js/aphrodite';
import Apollo from './icons/skills.js/apollo';
import Ares from './icons/skills.js/ares';
import Artemis from './icons/skills.js/artemis';
import Athena from './icons/skills.js/athena';
import Atlas from './icons/skills.js/atlas';
import Centaur from './icons/skills.js/centaur';
import Cerberus from './icons/skills.js/cerberus';
import Chimera from './icons/skills.js/chimera';
import Coeus from './icons/skills.js/coeus';
import Crius from './icons/skills.js/crius';
import Cronus from './icons/skills.js/cronus';
import Cyclops from './icons/skills.js/cyclopus';
import DaedalusIcarus from './icons/skills.js/daedalus_and_ikarus';
import Demeter from './icons/skills.js/demeter';
import Dionysus from './icons/skills.js/dionysus';
import Hades from './icons/skills.js/hades';
import Helios from './icons/skills.js/helios';
import Hephaestus from './icons/skills.js/hephaestus';
import Hera from './icons/skills.js/hera';
import Hercules from './icons/skills.js/hercules';
import Hermes from './icons/skills.js/hermes';
import Hestia from './icons/skills.js/hestia_color';
import HestiaScene from './icons/skills.js/hestia_scene';
import Hydra from './icons/skills.js/hydra';
import Hyperion from './icons/skills.js/hyperian';
import Icarus from './icons/skills.js/icarus';
import Icarus2 from './icons/skills.js/icarus_2';
import Adonis from './icons/skills.js/adonis';
import Apollo2 from './icons/skills.js/apollo_2';
import ApolloSymbol from './icons/skills.js/apollo_symbol';
import Cerberus2 from './icons/skills.js/cerberus_2';
import DionysusSymbol from './icons/skills.js/dionysus_symbol..js';
import HestiaSymbol from './icons/skills.js/hestia_symbol';
import HephaestusSymbol from './icons/skills.js/hephaestus_symbol';
import Medusa from './icons/skills.js/medusa';
import Minotaur from './icons/skills.js/Minotaur';
import Nike from './icons/skills.js/nike';
import Pan from './icons/skills.js/pan';
import Pegasus from './icons/skills.js/pegasus';
import Persephone from './icons/skills.js/persephone';
import Perseus from './icons/skills.js/perseus';
import Poseidon from './icons/skills.js/poseidon';
import Prometheus from './icons/skills.js/prometheus';
import Sphinx from './icons/skills.js/sphinx';
import Chronos from './icons/skills.js/The_Primordial_God_Of_Time_Chronos';
import Themis from './icons/skills.js/Themis';
import Zeus from './icons/skills.js/zeus';

export type IconId =
    | 'aphrodite' | 'ares' | 'artemis' | 'athena' | 'atlas'
    | 'centaur' | 'cerberus' | 'chimera' | 'coeus' | 'crius'
    | 'cronus' | 'cyclops' | 'daedalus_icarus' | 'demeter' | 'dionysus'
    | 'hades' | 'helios' | 'hephaestus' | 'hera' | 'hercules'
    | 'hermes' | 'hestia' | 'hydra' | 'hyperion' | 'icarus'
    | 'medusa' | 'nike' | 'pan' | 'pegasus' | 'persephone'
    | 'perseus' | 'poseidon' | 'prometheus' | 'sphinx' | 'chronos'
    | 'themis' | 'zeus' | 'apollo' | 'minotaur' | 'adonis' | 'apollo_2'
    | 'apollo_symbol' | 'cerberus_2' | 'icarus_2' | 'dionysus_symbol'
    | 'hestia_symbol' | 'hephaestus_symbol' | 'arachne' | 'hestia_scene'
    | 'thanatos' | 'moirae' | 'hypnos' | 'hecate' | 'scylla' | 'cyclopes'
    | 'oceanus' | 'gaea' | 'ourea' | 'aether' | 'chaos' | 'erebus' | 'eros' | 'hemera' | 'mnemosyne' | 'phoebe' | 'thalassa' | 'nyx' | 'tartarus' | 'pontus' | 'uranus' | 'tethys' | 'theia' | 'harpy' | 'siren';

export const MythologyIconMap: Record<IconId, React.FC<any>> = {
    aphrodite: Aphrodite,
    ares: Ares,
    artemis: Artemis,
    athena: Athena,
    atlas: Atlas,
    centaur: Centaur,
    cerberus: Cerberus,
    chimera: Chimera,
    coeus: Coeus,
    crius: Crius,
    cronus: Cronus,
    cyclops: Cyclops,
    cyclopes: Cyclops,
    daedalus_icarus: DaedalusIcarus,
    demeter: Demeter,
    dionysus: Dionysus,
    hades: Hades,
    thanatos: Hades,
    hypnos: Hades,
    moirae: Athena,
    hecate: Artemis,
    scylla: Poseidon,
    helios: Helios,
    hephaestus: Hephaestus,
    hera: Hera,
    hercules: Hercules,
    hermes: Hermes,
    hestia: Hestia,
    hydra: Hydra,
    hyperion: Hyperion,
    icarus: Icarus,
    medusa: Medusa,
    nike: Nike,
    pan: Pan,
    pegasus: Pegasus,
    persephone: Persephone,
    perseus: Perseus,
    poseidon: Poseidon,
    prometheus: Prometheus,
    sphinx: Sphinx,
    chronos: Chronos,
    themis: Themis,
    zeus: Zeus,
    apollo: Apollo,
    minotaur: Minotaur,
    adonis: Adonis,
    apollo_2: Apollo2,
    apollo_symbol: ApolloSymbol,
    cerberus_2: Cerberus2,
    icarus_2: Icarus2,
    dionysus_symbol: DionysusSymbol,
    hestia_symbol: HestiaSymbol,
    hephaestus_symbol: HephaestusSymbol,
    arachne: Athena,
    hestia_scene: HestiaScene,
    oceanus: Poseidon,
    gaea: Demeter,
    ourea: Atlas,
    aether: Helios,
    chaos: Chronos,
    erebus: Chronos,
    eros: Aphrodite,
    hemera: Helios,
    mnemosyne: Athena,
    phoebe: Artemis,
    thalassa: Poseidon,
    nyx: Artemis,
    tartarus: Hades,
    pontus: Poseidon,
    uranus: Zeus,
    tethys: Hera,
    theia: Artemis,
    harpy: Artemis,
    siren: Poseidon,
};

export const getMythologyIcon = (id: string): React.FC<any> => {
    return MythologyIconMap[id.toLowerCase() as IconId] || MythologyIconMap.zeus;
};
