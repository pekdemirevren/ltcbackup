import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import {
    collectibleWorkouts,
    CollectibleWorkout,
    Rarity,
    collectibleRarityColors,
    CollectibleExercise,
    PRIMARY_SET,
    MONSTER_SET,
    normalizeIconRoles,
    calculateOVR,
    getCalculatedOVRFromWorkout,
    getRarityFromOVR
} from '../constants/collectibleWorkouts';
import { ProgressRing, getLevelProgressInTier } from './ProgressRing';
import { getWorkoutLevel, getWorkoutXP, getXPForLevel } from '../utils/LevelSystem';
import {
    getStatsWithBoostV2,
    ExtendedRarity
} from '../utils/collectibleStatEngine';
import { FUTShield } from './FUTShield';
import Svg, { Path, Polygon, G, Defs, LinearGradient as SvgGradient, RadialGradient, Stop as SvgStop, Rect, Pattern, Circle } from 'react-native-svg';
import { findExerciseIcon } from '../constants/workoutData';
import WarriorIcon from '../assets/icons/skills/warrior';
import AphroditeIcon from '../assets/icons/aphrodite';
import { getDeityConfig } from '../constants/deityStyles';
import { MythologyHierarchy } from './MythologyHierarchy';
import { getMythologyIcon } from '../assets/mythologyIcons';
import { getMythologyCategoryConfig, MYTHOLOGY_CATEGORY_CONFIGS } from '../constants/mythologyCategories';

const SymbolMap: Record<string, any> = {
    'aphrodite': AphroditeIcon,
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const RarityTexture = ({ rarity, color, seed }: { rarity: string, color: string, seed: string }) => {
    // Textures are now confined to the upper 55% of the card
    const upperHeight = "55%";

    const lowerRarity = rarity.toLowerCase();
    if (lowerRarity === 'bronze') {
        return (
            <Svg height={upperHeight} width="100%" style={{ position: 'absolute' }}>
                <Defs>
                    <SvgGradient id="bronzeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <SvgStop offset="0%" stopColor={color} stopOpacity="0.15" />
                        <SvgStop offset="100%" stopColor={color} stopOpacity="0.05" />
                    </SvgGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#bronzeGrad)" />
                {/* Workout Grid Mesh */}
                {[...Array(8)].map((_, i) => (
                    <Rect key={`h-${i}`} x="0" y={i * 25} width="100%" height="0.5" fill={color} opacity={0.1} />
                ))}
                {[...Array(10)].map((_, i) => (
                    <Rect key={`v-${i}`} x={i * 25} y="0" width="0.5" height="100%" fill={color} opacity={0.1} />
                ))}
            </Svg>
        );
    }

    if (lowerRarity === 'silver') {
        return (
            <Svg height={upperHeight} width="100%" style={{ position: 'absolute' }}>
                <Defs>
                    <Pattern id="workoutPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                        <Path d="M0 20 L10 10 L30 10 L40 20 L30 30 L10 30 Z" fill="none" stroke={color} strokeWidth="1" opacity="0.1" />
                    </Pattern>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#workoutPattern)" />
            </Svg>
        );
    }

    if (lowerRarity === 'gold') {
        return (
            <Svg height={upperHeight} width="100%" style={{ position: 'absolute' }}>
                <G opacity="0.15">
                    {/* Shiny Rays - Rotated 90 degrees right */}
                    <Path d="M100 160 L250 50" stroke={color} strokeWidth="15" opacity="0.3" />
                    <Path d="M100 160 L250 250" stroke={color} strokeWidth="15" opacity="0.3" />
                    <Path d="M100 160 L250 160" stroke={color} strokeWidth="20" opacity="0.4" />
                </G>
                {/* Dynamic workout bars */}
                {[...Array(5)].map((_, i) => (
                    <Rect key={i} x={30 + i * 35} y={100 - (i * 10)} width="10" height={20 + (i * 5)} fill={color} opacity={0.2} rx="2" />
                ))}
            </Svg>
        );
    }

    if (lowerRarity === 'pro') {
        return (
            <Svg height={upperHeight} width="100%" style={{ position: 'absolute' }}>
                <G opacity="0.2">
                    <Polygon points="0,0 200,0 100,160" fill={color} opacity="0.1" />
                    <Path d="M40 0 L40 160" stroke={color} strokeWidth="1" opacity="0.2" />
                    <Path d="M120 0 L120 160" stroke={color} strokeWidth="1" opacity="0.2" />
                </G>
                {/* Tech/Interface hexagons */}
                <Path d="M170 30 L190 40 L190 60 L170 70 L150 60 L150 40 Z" fill="none" stroke={color} strokeWidth="1" opacity="0.3" />
            </Svg>
        );
    }

    if (lowerRarity === 'legend') {
        return (
            <Svg height={upperHeight} width="100%" style={{ position: 'absolute' }}>
                <G opacity="0.1">
                    <Path d="M0 0 L200 280" stroke={color} strokeWidth="60" opacity="0.2" />
                    <Path d="M200 0 L0 280" stroke={color} strokeWidth="60" opacity="0.2" />
                </G>
            </Svg>
        );
    }

    return null;
};

interface CollectibleCardNewProps {
    workout: CollectibleWorkout;
    fullWidth?: boolean;
    level?: number;
    xp?: number;
}

export const CollectibleCardNew: React.FC<CollectibleCardNewProps> = React.memo(({
    workout,
    fullWidth = true,
    level = workout.baseLevel,
    xp = 0
}) => {
    const navigation = useNavigation<any>();
    const currentLevel = level;

    const { ovr, currentRarity, displayRarity, rarityConfig, boostedStats, primaryIconId, secondaryIconIds } = React.useMemo(() => {
        // PROJEDEKİ HESAPLAMA ARAÇLARI PASİF HALE GETİRİLDİ - SADECE VERİLEN VERİLER KULLANILIYOR
        const _stats = workout.baseStats;
        const _ovr = getCalculatedOVRFromWorkout(workout);

        const getDisplayRarity = (rarity: string) => {
            const r = rarity.toLowerCase();
            if (r === 'titan') return 'titan';
            if (r === 'creature') return 'creature';
            if (r === 'mortal') return 'mortal';
            if (r === 'underworld') return 'underworld';
            if (r === 'primordial') return 'primordial';
            if (r === 'hero') return 'hero';

            // Premium rarities
            if (r === 'icon') return 'icon';
            if (r === 'god') return 'god';
            if (r === 'goddess') return 'goddess';
            if (r === 'divine') return 'divine';
            if (r === 'legend') return 'legend';

            // Base rarities
            if (r === 'gold') return 'gold';
            if (r === 'silver') return 'silver';
            return 'bronze';
        };
        const _tier = workout.rarity;
        const rarityKey = _tier.toLowerCase();
        let mappedRarity: any = _tier;

        if (['titan', 'icon', 'legend', 'god', 'goddess', 'divine', 'creature', 'mortal', 'underworld', 'primordial', 'hero'].includes(rarityKey)) {
            mappedRarity = 'ICON';
            if (rarityKey === 'titan') mappedRarity = 'TITAN';
            if (rarityKey === 'legend') mappedRarity = 'LEGEND';
            if (rarityKey === 'creature') mappedRarity = 'CREATURE';
            if (rarityKey === 'mortal') mappedRarity = 'MORTAL';
            if (rarityKey === 'underworld') mappedRarity = 'UNDERWORLD';
            if (rarityKey === 'primordial') mappedRarity = 'PRIMORDIAL';
            if (rarityKey === 'hero') mappedRarity = 'HERO';
        }

        const _roles = normalizeIconRoles(workout);
        return {
            ovr: _ovr,
            currentRarity: _tier,
            displayRarity: getDisplayRarity(_tier),
            rarityConfig: collectibleRarityColors[mappedRarity as Rarity] || collectibleRarityColors.GOLD,
            boostedStats: _stats,
            primaryIconId: _roles.primaryIconId,
            secondaryIconIds: _roles.secondaryIconIds
        };
    }, [workout]);

    const xpNeeded = getXPForLevel(currentLevel);
    const currentXP = xp;

    const handleCardPress = React.useCallback(() => {
        navigation.navigate('CollectibleWorkoutDetail', {
            workoutId: workout.id,
            workoutName: workout.name,
        });
    }, [navigation, workout.id, workout.name]);

    const cardWidth = fullWidth ? SCREEN_WIDTH - 40 : (SCREEN_WIDTH - 52) / 2;
    const cardHeight = cardWidth * 1.5;

    const deityConfig = getDeityConfig(primaryIconId);
    const categoryConfig = getMythologyCategoryConfig(primaryIconId);

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleCardPress}
            style={styles.cardContainer}
        >
            <FUTShield
                width={cardWidth}
                height={cardHeight}
                fill={rarityConfig.secondary}
                bottomFill={rarityConfig.secondary + 'CC'}
                splitPercentage={58}
                rarity={displayRarity as any}
            >
                <View style={styles.cardContent}>
                    <RarityTexture
                        rarity={
                            ['god', 'goddess', 'divine', 'legend', 'gold', 'hero'].includes(displayRarity)
                                ? 'gold'
                                : displayRarity === 'titan'
                                    ? 'silver'
                                    : displayRarity === 'mortal'
                                        ? 'bronze'
                                        : ['primordial', 'underworld'].includes(displayRarity)
                                            ? 'legend'
                                            : displayRarity
                        }
                        color={rarityConfig.patternColor}
                        seed={workout.id}
                    />

                    {/* Full Scene Background - Specific to certain gods like Hestia */}
                    {primaryIconId === 'hestia' && (
                        <View style={[StyleSheet.absoluteFill, { opacity: 0.15, zIndex: -1, justifyContent: 'center', alignItems: 'center' }]}>
                            {React.createElement(getMythologyIcon('hestia_scene'), {
                                width: cardWidth * 1.5,
                                height: cardWidth * 1.5,
                                fill: rarityConfig.text,
                                style: { marginTop: (-cardHeight * 0.15) + 130 }
                            })}
                        </View>
                    )}

                    {/* Pentagon Category Badge - Positioned on left edge center */}
                    {categoryConfig && (
                        <View style={styles.pentagonBadgeContainer}>
                            <Svg width={32} height={36} viewBox="0 0 32 36" style={{ transform: [{ rotate: '180deg' }] }}>
                                <Polygon
                                    points="16,0 32,12 26,36 6,36 0,12"
                                    fill={rarityConfig.accent || '#333'}
                                    stroke={rarityConfig.text}
                                    strokeWidth="1.5"
                                    opacity={0.9}
                                />
                            </Svg>
                            <View style={styles.pentagonIconContainer}>
                                <MaterialCommunityIcons
                                    name={categoryConfig.icon}
                                    size={16}
                                    color={rarityConfig.text}
                                    style={{ transform: [{ rotate: '180deg' }] }}
                                />
                            </View>
                        </View>
                    )}

                    <View style={styles.topSection}>
                        <View style={styles.topSide}>
                            <Text style={[styles.levelText, { color: rarityConfig.text }]}>{currentLevel}</Text>
                            <Text style={[styles.positionText, { color: rarityConfig.text }]}>{workout.position}</Text>
                        </View>

                        <View style={[
                            styles.rightSymbolContainer,
                            deityConfig && { transform: [{ translateX: deityConfig.translateX }] }
                        ]}>
                            <MythologyHierarchy
                                primaryIconId={primaryIconId}
                                secondaryIconIds={[]}
                                rarity={currentRarity as any}
                                epithet={workout.primaryEpithetByTier[currentRarity as any] || workout.subtitle}
                                color={rarityConfig.text}
                                size={deityConfig?.baseSize || 210}
                                hideEpithet={true}
                                useCropped={true}
                            />
                        </View>
                    </View>

                    <View style={styles.bottomSection}>
                        <Text style={[styles.workoutName, { color: rarityConfig.text }]} numberOfLines={1}>
                            {workout.name}
                        </Text>

                        <View style={styles.statsLayoutHorizontal}>
                            <View style={styles.statColumnFIFA}>
                                <Text style={[styles.statLabelFIFA, { color: rarityConfig.text }]}>STR</Text>
                                <Text style={[styles.statValueFIFA, { color: rarityConfig.text }]}>{boostedStats.STR}</Text>
                            </View>
                            <View style={styles.statColumnFIFA}>
                                <Text style={[styles.statLabelFIFA, { color: rarityConfig.text }]}>VOL</Text>
                                <Text style={[styles.statValueFIFA, { color: rarityConfig.text }]}>{boostedStats.VOL}</Text>
                            </View>
                            <View style={styles.statColumnFIFA}>
                                <Text style={[styles.statLabelFIFA, { color: rarityConfig.text }]}>TMP</Text>
                                <Text style={[styles.statValueFIFA, { color: rarityConfig.text }]}>{boostedStats.TMP}</Text>
                            </View>

                            <View style={styles.statColumnFIFA}>
                                <Text style={[styles.statLabelFIFA, { color: rarityConfig.text }]}>END</Text>
                                <Text style={[styles.statValueFIFA, { color: rarityConfig.text }]}>{boostedStats.END}</Text>
                            </View>
                            <View style={styles.statColumnFIFA}>
                                <Text style={[styles.statLabelFIFA, { color: rarityConfig.text }]}>PHY</Text>
                                <Text style={[styles.statValueFIFA, { color: rarityConfig.text }]}>{boostedStats.PHY}</Text>
                            </View>
                            <View style={styles.statColumnFIFA}>
                                <Text style={[styles.statLabelFIFA, { color: rarityConfig.text }]}>HYP</Text>
                                <Text style={[styles.statValueFIFA, { color: rarityConfig.text }]}>{boostedStats.HYP}</Text>
                            </View>
                        </View>

                        {/* Mythology Category Badge */}
                        {getMythologyCategoryConfig(primaryIconId) && (
                            <View style={[styles.categoryBadge, { backgroundColor: getMythologyCategoryConfig(primaryIconId)?.color + '33' }]}>
                                <Text style={[styles.categoryText, { color: getMythologyCategoryConfig(primaryIconId)?.color }]}>
                                    {getMythologyCategoryConfig(primaryIconId)?.displayName.toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </FUTShield>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    cardContainer: {
        marginTop: 0,
        marginBottom: 10,
        marginLeft: 10,
        alignSelf: 'center',
        // 3D Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
    },
    cardContent: {
        flex: 1,
        paddingHorizontal: 0, // Removed to allow full-width backgrounds
        paddingTop: 30,
        paddingBottom: 10,
        overflow: 'visible', // Allow badge to extend outside
    },
    topSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        height: '35%',
        paddingTop: 75, // Better alignment with Title Case names
        paddingHorizontal: 16,
    },
    topSide: {
        alignItems: 'center',
        paddingLeft: 0,
    },
    levelLabel: {
        fontSize: 14,
        fontWeight: '700',
        fontFamily: Platform.OS === 'ios' ? 'DINPro-CondensedBold' : 'sans-serif-condensed',
        opacity: 0.8,
        marginBottom: -5,
    },
    levelText: {
        fontSize: 66, // Slightly larger for DIN impact
        fontWeight: '900',
        fontFamily: Platform.OS === 'ios' ? 'DINPro-CondensedBold' : 'sans-serif-condensed',
        lineHeight: 66,
    },
    positionText: {
        fontSize: 28,
        fontWeight: '800',
        fontFamily: Platform.OS === 'ios' ? 'DINPro-CondensedBold' : 'sans-serif-condensed',
        marginTop: -6,
        letterSpacing: 0.1,
    },
    pentagonBadgeContainer: {
        position: 'absolute',
        left: -21, // 2px more left
        top: '40%',
        marginTop: 37, // 15px lower
        width: 32,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    pentagonIconContainer: {
        position: 'absolute',
        top: 12,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    miniLogoPlaceholder: {
        marginTop: 12,
        width: 46,
        height: 24,
        borderRadius: 2,
        overflow: 'hidden',
    },
    miniFlag: {
        width: '100%',
        height: '100%',
    },
    ringContainer: {
        paddingTop: 5,
    },
    topRingContainer: {
        marginTop: 8,
    },
    bottomSection: {
        flex: 1,
        justifyContent: 'center',
        marginTop: '25%', // Increased from 15% to shift stats down ~20px
        paddingBottom: 30,
        paddingHorizontal: 0,
    },
    bottomBackground: {
        marginTop: -5, // Slight bleed for better coverage
    },
    workoutName: {
        fontSize: 46,
        fontWeight: '800',
        fontFamily: Platform.OS === 'ios' ? 'DINPro-CondensedBold' : 'sans-serif-condensed',
        textAlign: 'center',
        marginBottom: 6,
        letterSpacing: -1.0,
        // Removed textTransform: 'uppercase' to allow Title Case from JS
    },
    horizontalDivider: {
        height: 1,
        width: '70%',
        alignSelf: 'center',
        marginBottom: 10,
    },
    statsLayoutHorizontal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 0,
        gap: 5, // Gap is handled by space-between
    },
    statColumnFIFA: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    statLabelFIFA: {
        fontSize: 22,
        fontWeight: '700',
        fontFamily: Platform.OS === 'ios' ? 'DINPro-CondensedBold' : 'sans-serif-condensed',
        opacity: 1,
        marginBottom: 6,
    },
    statValueFIFA: {
        fontSize: 36,
        fontWeight: '800',
        fontFamily: Platform.OS === 'ios' ? 'DINPro-CondensedBold' : 'sans-serif-condensed',
        lineHeight: 38,
    },
    skillsIconsRowFIFA: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: 110,
        height: 110,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    rarityLabel: {
        fontSize: 10,
        fontWeight: '800',
        textAlign: 'center',
        marginTop: 4,
        letterSpacing: 2,
        opacity: 0.6,
    },
    microDivider: {
        width: 30,
        height: 1.5,
        borderRadius: 1,
        marginVertical: 4,
    },
    topRightGridFIFA: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
        gap: 5,
    },
    tagText: {
        fontSize: 8,
        fontWeight: '800',
        letterSpacing: 1,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 2,
    },
    tagBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    subtitleText: {
        fontSize: 11,
        fontWeight: '500',
        fontStyle: 'italic',
        lineHeight: 14,
        marginBottom: 8,
    },
    rightSymbolContainer: {
        position: 'absolute',
        top: 40,
        right: -10, // Shifted 10px right
        width: 180,
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: -1,
        opacity: 0.9,
    },
    secondaryIconRowBelowStats: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -10, // Shifted 10px higher from 5 to -5 (actually the request was 10px higher from previous state)
        opacity: 0.8,
    },
    cornerBadge: {
        position: 'absolute',
        top: 60,
        left: 16,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        zIndex: 10,
    },
    cornerBadgeText: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1,
    },
    categoryBadge: {
        alignSelf: 'center',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 8,
        marginTop: -2,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: '700',
        fontFamily: Platform.OS === 'ios' ? 'DINPro-CondensedBold' : 'sans-serif-condensed',
        letterSpacing: 2,
    },
});

export default CollectibleCardNew;
