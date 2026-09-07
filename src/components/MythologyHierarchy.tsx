import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getMythologyIcon } from '../assets/mythologyIcons';
import { Rarity } from '../constants/collectibleWorkouts';
import { getDeityConfig, DeitySourceKey } from '../constants/deityStyles';

interface MythologyHierarchyProps {
    primaryIconId?: string;
    secondaryIconIds?: string[];
    rarity: Rarity;
    epithet?: string;
    size?: number;
    color?: string;
    hideSecondaryWrapper?: boolean;
    hideEpithet?: boolean;
    useCropped?: boolean; // true for WorkoutCard, false for DetailScreen
}

// Cropped images for WorkoutCard (main screen) - All from cropped_updated folder
const croppedSourceMap: Partial<Record<DeitySourceKey, any>> = {
    // Olympians
    zeus: require('../assets/images/cropped_updated/zeus.png'),
    poseidon: require('../assets/images/resized-images/Poseidon.png'),
    hera: require('../assets/images/resized-images/hera.png'),
    athena: require('../assets/images/resized-images/athena.png'),
    apollo: require('../assets/images/resized-images/apollo.png'),
    artemis: require('../assets/images/resized-images/artemis.png'),
    ares: require('../assets/images/resized-images/ares.png'),
    hephaestus: require('../assets/images/resized-images/Hephaestus.png'),
    aphrodite: require('../assets/images/resized-images/aphrodite.png'),
    hermes: require('../assets/images/resized-images/hermes.png'),
    demeter: require('../assets/images/resized-images/demeter.png'),
    dionysus: require('../assets/images/resized-images/dionysos.png'),
    hestia: require('../assets/images/resized-images/hestia.png'),
    // Titans
    atlas: require('../assets/images/resized-images/atlas.png'),
    cronus: require('../assets/images/resized-images/kronos.png'),
    kronos: require('../assets/images/resized-images/kronos.png'),
    hyperion: require('../assets/images/resized-images/Hyperion.png'),
    themis: require('../assets/images/resized-images/Themis.png'),
    coeus: require('../assets/images/resized-images/Coeus.png'),
    crius: require('../assets/images/resized-images/Crius.png'),
    prometheus: require('../assets/images/resized-images/Prometheus.png'),
    rhea: require('../assets/images/resized-images/Rhea.png'),
    oceanus: require('../assets/images/resized-images/Oceanus.png'),
    tethys: require('../assets/images/resized-images/Tethys.png'),
    theia: require('../assets/images/resized-images/Theia.png'),
    phoebe: require('../assets/images/resized-images/Phoebe.png'),
    mnemosyne: require('../assets/images/resized-images/Mnemosyne.png'),
    iapetus: require('../assets/images/resized-images/Iapetus.png'),
    // Underworld
    hades: require('../assets/images/resized-images/hades.png'),
    persephone: require('../assets/images/resized-images/persephone.png'),
    hecate: require('../assets/images/resized-images/hecate.png'),
    thanatos: require('../assets/images/resized-images/thanatos.png'),
    hypnos: require('../assets/images/resized-images/hypnos.png'),
    styx: require('../assets/images/resized-images/styx.png'),
    acheron: require('../assets/images/resized-images/acheron.png'),
    erinyes: require('../assets/images/resized-images/erinyes.png'),
    moirae: require('../assets/images/resized-images/moirae.png'),
    // Primordial
    chaos: require('../assets/images/cropped_updated/chaos.png'),
    gaia: require('../assets/images/resized-images/gaia.png'),
    uranus: require('../assets/images/resized-images/uranus.png'),
    nyx: require('../assets/images/resized-images/nyx.png'),
    erebus: require('../assets/images/resized-images/erebus.png'),
    eros: require('../assets/images/resized-images/eros.png'),
    tartarus: require('../assets/images/resized-images/tartarus.png'),
    pontus: require('../assets/images/resized-images/pontus.png'),
    ourea: require('../assets/images/resized-images/ourea.png'),
    aether: require('../assets/images/resized-images/aether.png'),
    // Creatures
    cerberus: require('../assets/images/resized-images/cerberus.png'),
    hydra: require('../assets/images/resized-images/hydra.png'),
    medusa: require('../assets/images/resized-images/Medusa.png'),
    pegasus: require('../assets/images/resized-images/Pegasus.png'),
    chimera: require('../assets/images/resized-images/Chimera.png'),
    minotaur: require('../assets/images/resized-images/minotaur.png'),
    charybdis: require('../assets/images/resized-images/Charybdis.png'),
    cyclopes: require('../assets/images/resized-images/cyclopes.png'),
    scylla: require('../assets/images/resized-images/scylla.png'),
    polyphemus: require('../assets/images/resized-images/polyphemus.png'),
    hecatoncheires: require('../assets/images/resized-images/hecatoncheires.png'),
    giant: require('../assets/images/resized-images/giant.png'),
    mormo: require('../assets/images/resized-images/mormo.png'),
    pan: require('../assets/images/resized-images/pan.png'),
    arion: require('../assets/images/resized-images/arion.png'),
    graeae: require('../assets/images/resized-images/Graeae.png'),
    gorgons: require('../assets/images/resized-images/Gorgons.png'),
    pygmies: require('../assets/images/resized-images/Pygmies.png'),
    cretan_bull: require('../assets/images/resized-images/The_Cretan_Bull.png'),
    the_cretan_bull: require('../assets/images/resized-images/The_Cretan_Bull.png'),
    stymphalian_birds: require('../assets/images/resized-images/The_Stymphalian_Birds.png'),
    balius_xanthus: require('../assets/images/resized-images/Balius_and_Xanthus.png'),
    balius_and_xanthus: require('../assets/images/resized-images/Balius_and_Xanthus.png'),
    cercopes: require('../assets/images/resized-images/cercopes.png'),
    crommyonian_sow: require('../assets/images/resized-images/The_Crommyonian_Sow.png'),
    uranian_cyclopes: require('../assets/images/resized-images/uranian_cyclopes.png'),
    centaur: require('../assets/images/resized-images/centaur.png'),
    harpy: require('../assets/images/resized-images/harpy.png'),
    harpies: require('../assets/images/resized-images/harpy.png'),
    // Heroes/Mortals
    hercules: require('../assets/images/resized-images/heracles.png'),
    heracles: require('../assets/images/resized-images/heracles.png'),
    perseus: require('../assets/images/resized-images/perseus.png'),
    achilles: require('../assets/images/resized-images/achilles.png'),
    adonis: require('../assets/images/resized-images/adonis.png'),
    odysseus: require('../assets/images/resized-images/Odysseus.png'),
    theseus: require('../assets/images/resized-images/thesus.png'),
    thesus: require('../assets/images/resized-images/thesus.png'),
    jason: require('../assets/images/resized-images/Jason.png'),
    orpheus: require('../assets/images/resized-images/Orpheus.png'),
    bellerophon: require('../assets/images/resized-images/bellerophon.png'),
    agamemnon: require('../assets/images/resized-images/Agamemnon.png'),
    menelaus: require('../assets/images/resized-images/Menelaus.png'),
    hector: require('../assets/images/resized-images/Hector.png'),
    diomedes: require('../assets/images/resized-images/Diomedes.png'),
    meleager: require('../assets/images/resized-images/Meleager.png'),
    atalanta: require('../assets/images/resized-images/Atalanta.png'),
    aeneas: require('../assets/images/resized-images/Aeneas.png'),
    cadmus: require('../assets/images/resized-images/Cadmus.png'),
    oedipus: require('../assets/images/resized-images/Oedipus.png'),
    cassandra: require('../assets/images/resized-images/Cassandra.png'),
    andromache: require('../assets/images/resized-images/Andromache.png'),
    asclepius: require('../assets/images/resized-images/Asclepius.png'),
    triptolemus: require('../assets/images/resized-images/triptolemus.png'),
    abas: require('../assets/images/resized-images/abas.png'),
    acastus: require('../assets/images/resized-images/Acastus.png'),
    achaeus: require('../assets/images/resized-images/Achaeus.png'),
    admetus: require('../assets/images/resized-images/Admetus.png'),
    dioscuri: require('../assets/images/resized-images/Dioscuri.png'),
    icarus: require('../assets/images/resized-images/icarus.png'),
    helios: require('../assets/images/resized-images/Helios.png'),
    chronos: require('../assets/images/resized-images/chronos.png'),
    daedalus: require('../assets/images/resized-images/Daedalus.png'),
    midas: require('../assets/images/resized-images/Midas.png'),
    pandora: require('../assets/images/resized-images/Pandora.png'),
    // Additional Heroes/Mortals
    ariadne: require('../assets/images/resized-images/Ariadne.png'),
    epimetheus: require('../assets/images/resized-images/Epimetheus.png'),
    leto: require('../assets/images/resized-images/Leto.png'),
    sisyphus: require('../assets/images/resized-images/Sisyphus.png'),
    arachne: require('../assets/images/resized-images/arachne.png'),
    melinoe: require('../assets/images/resized-images/Melinoe.png'),
    // Additional Primordial
    ananke: require('../assets/images/resized-images/ananke.png'),
    hemera: require('../assets/images/resized-images/Hemera.png'),
    thalassa: require('../assets/images/resized-images/Thalassa.png'),
    phanes: require('../assets/images/resized-images/phanes.png'),
    // Stymphalian alias
    the_stymphalian_birds: require('../assets/images/resized-images/The_Stymphalian_Birds.png'),
    the_crommyonian_sow: require('../assets/images/resized-images/The_Crommyonian_Sow.png'),
    // Siren
    siren: require('../assets/images/resized-images/sirens.png'),
    sirens: require('../assets/images/resized-images/sirens.png'),
    // Narcissus, Nike, Sphinx
    narcissus: require('../assets/images/resized-images/narcissus.png'),
    nike: require('../assets/images/resized-images/Nike.png'),
    sphinx: require('../assets/images/resized-images/Sphinx.png'),
    // Charon
    charon: require('../assets/images/resized-images/charon.png'),
};

// Full images for CollectibleWorkoutDetailScreen
const fullSourceMap: Partial<Record<DeitySourceKey, any>> = {
    // Olympians
    zeus: require('../assets/images/zeus_ext_crop_nobg.png'),
    poseidon: require('../assets/images/poseidon_pp_nobg.png'),
    hestia: require('../assets/images/hestia_bg_nobg.png'),
    hera: require('../assets/images/cropped/creature_cropped/olympians_cropped/12 Olympians/hera_full.png'),
    athena: require('../assets/images/cropped/creature_cropped/olympians_cropped/12 Olympians/athena_full.png'),
    apollo: require('../assets/images/cropped/creature_cropped/olympians_cropped/12 Olympians/apollo_full.png'),
    artemis: require('../assets/images/cropped/creature_cropped/olympians_cropped/12 Olympians/artemis_full.png'),
    ares: require('../assets/images/cropped/creature_cropped/olympians_cropped/12 Olympians/ares_full.png'),
    hephaestus: require('../assets/images/cropped/creature_cropped/olympians_cropped/12 Olympians/Hephaestus_full.png'),
    aphrodite: require('../assets/images/cropped/creature_cropped/olympians_cropped/12 Olympians/aphrodite_full.png'),
    hermes: require('../assets/images/cropped/creature_cropped/olympians_cropped/12 Olympians/hermes_full.png'),
    demeter: require('../assets/images/cropped/creature_cropped/olympians_cropped/12 Olympians/demeter_full.png'),
    dionysus: require('../assets/images/cropped/creature_cropped/olympians_cropped/12 Olympians/dionysos_full.png'),
    // Titans
    atlas: require('../assets/images/cropped/creature_cropped/titans_cropped/titans/atlas_full.png'),
    cronus: require('../assets/images/cropped/creature_cropped/titans_cropped/titans/cronus_full_nobg.png'),
    hyperion: require('../assets/images/cropped/creature_cropped/titans_cropped/titans/Hyperion_full.png'),
    themis: require('../assets/images/cropped/creature_cropped/titans_cropped/titans/Themis_full.png'),
    coeus: require('../assets/images/cropped/creature_cropped/titans_cropped/titans/Coeus_full.png'),
    crius: require('../assets/images/cropped/creature_cropped/titans_cropped/titans/Crius_full.png'),
    prometheus: require('../assets/images/cropped/creature_cropped/titans_cropped/titans/Prometheus_full_nobg.png'),
    // Underworld
    hades: require('../assets/images/cropped/creature_cropped/underworld_god_cropped/underworld god/hadesmain.png'),
    persephone: require('../assets/images/cropped/creature_cropped/underworld_god_cropped/underworld god/persephone_main_nobg.png'),
    // Creatures (with _nobg for transparent backgrounds)
    cerberus: require('../assets/images/cropped/creature_cropped/creature/cerberus_full_nobg.png'),
    hydra: require('../assets/images/cropped/creature_cropped/creature/hydra_full_nobg.png'),
    medusa: require('../assets/images/cropped/creature_cropped/creature/Medusa_full_nobg.png'),
    pegasus: require('../assets/images/cropped/creature_cropped/creature/Pegasus_full_nobg.png'),
    chimera: require('../assets/images/cropped/creature_cropped/creature/Chimera_full_nobg.png'),
    minotaur: require('../assets/images/cropped/creature_cropped/creature/minotaur_full_nobg.png'),
    charybdis: require('../assets/images/cropped/creature_cropped/creature/Charybdis_full_nobg.png'),
    cyclopes: require('../assets/images/cropped/creature_cropped/creature/cyclopes_full_nobg.png'),
    scylla: require('../assets/images/cropped/creature_cropped/creature/scylla_full_nobg.png'),
    polyphemus: require('../assets/images/cropped/creature_cropped/creature/polyphemus_full_nobg.png'),
    hecatoncheires: require('../assets/images/cropped/creature_cropped/creature/Hecatoncheires_full_nobg.png'),
    giant: require('../assets/images/cropped/creature_cropped/creature/giant_full_nobg.png'),
    mormo: require('../assets/images/cropped/creature_cropped/creature/mormo_full_nobg.png'),
    pan: require('../assets/images/cropped/creature_cropped/creature/pan_nobg.png'),
    arion: require('../assets/images/cropped/creature_cropped/creature/arion_nobg.png'),
    graeae: require('../assets/images/cropped/creature_cropped/creature/Graeae_nobg.png'),
    gorgons: require('../assets/images/cropped/creature_cropped/creature/Gorgons_nobg.png'),
    pygmies: require('../assets/images/cropped/creature_cropped/creature/Pygmies_nobg.png'),
    cretan_bull: require('../assets/images/cropped/creature_cropped/creature/The_Cretan_Bull_nobg.png'),
    stymphalian_birds: require('../assets/images/cropped/creature_cropped/creature/The_Stymphalian_Birds_nobg.png'),
    balius_xanthus: require('../assets/images/cropped/creature_cropped/creature/Balius_and_Xanthus_nobg.png'),
    cercopes: require('../assets/images/cropped/creature_cropped/creature/Cercopes_nobg.png'),
    crommyonian_sow: require('../assets/images/cropped/creature_cropped/creature/The_Crommyonian_Sow_full_nobg.png'),
    uranian_cyclopes: require('../assets/images/cropped/creature_cropped/creature/The_Uranian_Cyclopes_full_nobg.png'),
    // Primordial
    gaia: require('../assets/images/cropped/creature_cropped/Primordial Gods cropped/Primordial Gods/gaia_main.png'),
    chaos: require('../assets/images/cropped/creature_cropped/Primordial Gods cropped/Primordial Gods/chaos_main.png'),
    // Heroes
    hercules: require('../assets/images/cropped/creature_cropped/mortals_cropped/Heracles_full_nobg.png'),
    perseus: require('../assets/images/cropped/creature_cropped/mortals_cropped/heroes/perseus_nobg.png'),
    achilles: require('../assets/images/cropped/creature_cropped/mortals_cropped/heroes/achilles_full_nobg.png'),
    adonis: require('../assets/images/cropped/creature_cropped/mortals_cropped/heroes/adonis_full_nobg.png'),
};

export const MythologyHierarchy: React.FC<MythologyHierarchyProps> = ({
    primaryIconId,
    secondaryIconIds = [],
    rarity,
    epithet,
    size = 120,
    color = '#000',
    hideSecondaryWrapper = false,
    hideEpithet = false,
    useCropped = true, // Default to cropped for backward compatibility
}) => {
    const PrimaryIcon = primaryIconId ? getMythologyIcon(primaryIconId) : null;
    const SecondaryIcon = (secondaryIconIds && secondaryIconIds.length > 0) ? getMythologyIcon(secondaryIconIds[0]) : null;

    const deityConfig = getDeityConfig(primaryIconId);

    // Select appropriate source map based on useCropped prop
    const sourceMap = useCropped ? croppedSourceMap : fullSourceMap;
    const imageSource = deityConfig ? sourceMap[deityConfig.sourceKey] : null;

    // Tier-based scaling for primary icon
    const getPrimaryScale = () => {
        if (deityConfig?.scaleOverride) return deityConfig.scaleOverride;

        switch (rarity) {
            case 'BRONZE': return 0.7;
            case 'SILVER': return 0.8;
            case 'GOLD': return 0.9;
            case 'TITAN': return 1.1;
            case 'ICON': return 1.3;
            case 'LEGEND': return 1.5;
            default: return 1;
        }
    };

    return (
        <View style={styles.container}>
            {/* Primary Icon Layer - Only if ID provided */}
            {primaryIconId && (
                <View style={[styles.primaryContainer, { transform: [{ scale: getPrimaryScale() }] }]}>
                    {PrimaryIcon ? (
                        (deityConfig && imageSource) ? (
                            <Image
                                source={imageSource}
                                style={{
                                    width: (size * 1.5) - deityConfig.sizeReduction,
                                    height: (size * 1.5) - deityConfig.sizeReduction,
                                    backgroundColor: 'transparent',
                                    resizeMode: 'contain',
                                    transform: [{ translateY: deityConfig.translateY }]
                                }}
                            />
                        ) : (
                            <PrimaryIcon
                                width={size}
                                height={size}
                                fill={color}
                                opacity={0.8}
                            />
                        )
                    ) : (
                        <MaterialCommunityIcons name="shield-star" size={size * 0.8} color={color} style={{ opacity: 0.4 }} />
                    )}
                </View>
            )}

            {/* Secondary Icons (Encounters/Trials) */}
            <View style={styles.secondaryContainer}>
                {secondaryIconIds.slice(0, 3).map((id, index) => {
                    const IconComponent = getMythologyIcon(id);
                    const isGlow = rarity === 'GOLD' && index === 0;

                    if (hideSecondaryWrapper) {
                        return IconComponent ? (
                            <IconComponent
                                key={index}
                                width={size}
                                height={size}
                                fill={id.toLowerCase() === 'hestia' ? undefined : color}
                            />
                        ) : null;
                    }

                    return (
                        <View key={index} style={[styles.secondaryIconWrapper, isGlow && styles.glowEffect]}>
                            {IconComponent ? (
                                <IconComponent
                                    width={22}
                                    height={22}
                                    fill={id.toLowerCase() === 'hestia' ? undefined : color}
                                />
                            ) : (
                                <MaterialCommunityIcons
                                    name="shield-alert-outline"
                                    size={18}
                                    color={color}
                                    style={{ opacity: 0.5 }}
                                />
                            )}
                        </View>
                    );
                })}
            </View>

            {/* Epithet Text - Now below icons */}
            {(epithet && !hideEpithet) && (
                <View style={styles.epithetContainer}>
                    <Text style={[styles.epithetText, { color }]}>{epithet.toUpperCase()}</Text>
                    <View style={[styles.epithetLine, { backgroundColor: color }]} />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    epithetContainer: {
        marginTop: 25, // Adjusted margin since it's now below icons
        alignItems: 'center',
    },
    epithetText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 2,
        opacity: 0.7,
    },
    epithetLine: {
        height: 1,
        width: 30,
        marginTop: 2,
        opacity: 0.3,
    },
    secondaryContainer: {
        flexDirection: 'row',
        marginTop: 10, // Adjusted for flow
        gap: 8,
        zIndex: 2,
    },
    secondaryIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    glowEffect: {
        borderColor: '#FFD700',
        elevation: 10,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
    }
});
