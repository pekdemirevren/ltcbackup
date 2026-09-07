import React, { useContext, useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, StatusBar, Platform, Alert, Animated, Modal, TouchableWithoutFeedback } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { findExerciseIcon } from '../constants/workoutData';
import { TimerContext } from '../contexts/TimerContext';
import {
    collectibleWorkouts,
    CollectibleWorkout,
    collectibleRarityColors,
    CollectibleExercise,
    PRIMARY_SET,
    MONSTER_SET,
    normalizeIconRoles,
    calculateOVR,
    getRarityFromOVR,
    Rarity
} from '../constants/collectibleWorkouts';
import { ThemeContext } from '../contexts/ThemeContext';
import Theme from '../constants/theme';
import {
    getTierFromLevel,
    getStatsWithBoostV2,
    calculateOVRV2,
    getExercisesByTier,
    ExtendedRarity
} from '../utils/collectibleStatEngine';
import { MythologyHierarchy } from '../components/MythologyHierarchy';
import { getMythologyCategoryConfig } from '../constants/mythologyCategories';
import { ProgressRing, getLevelProgressInTier } from '../components/ProgressRing';
import { calculateExerciseMetrics } from '../utils/WorkoutCalculator';
import { addWorkoutXP, getWorkoutLevel, getWorkoutXP, getXPForLevel } from '../utils/LevelSystem';
import * as Icons from '../assets/icons';
import WarriorIcon from '../assets/icons/skills/warrior';
import WarmupProIcon from '../assets/icons/warmuppro';
import AphroditeIcon from '../assets/icons/aphrodite';
import { LiquidGlass } from '../components/LiquidGlass';
import { FUTShield } from '../components/FUTShield';

const SymbolMap: Record<string, any> = {
    'aphrodite': AphroditeIcon,
};
import Svg, { Path, Polygon, G, Defs, LinearGradient as SvgGradient, RadialGradient, Stop as SvgStop, Rect, Pattern, Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = StackScreenProps<RootStackParamList, 'CollectibleWorkoutDetail'>;

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

const cardWidth = SCREEN_WIDTH - 40;
const cardHeight = cardWidth * 1.5;

const parseWorkoutName = (fullName: string) => {
    // Expected format: "Exercise Name: 6x09x140kg" or "Exercise Name"
    const parts = fullName.split(':');
    const name = parts[0].trim();
    if (parts.length < 2) {
        return { name, sets: undefined, reps: undefined, weight: undefined };
    }

    const settingsPart = parts[1].trim(); // "6x9x140kg"
    const settingsMatch = settingsPart.match(/(\d+)x(\d+)[x ](\d+)(kg)?/i);

    if (settingsMatch) {
        return {
            name,
            sets: settingsMatch[1],
            reps: String(parseInt(settingsMatch[2], 10)),
            weight: settingsMatch[3]
        };
    }

    return { name, sets: undefined, reps: undefined, weight: undefined };
};

const CollectibleWorkoutDetailScreen: React.FC<Props> = ({ route, navigation }) => {
    const themeContext = useContext(ThemeContext);
    const timerContext = useContext(TimerContext);
    const { workoutId } = route.params;

    const workout = collectibleWorkouts.find(w => w.id === workoutId);
    const [currentLevel, setCurrentLevel] = useState(0);
    const [currentXP, setCurrentXP] = useState(0);
    const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
    const [workoutSettings, setWorkoutSettings] = useState<Record<string, any>>({});

    const scrollY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        let isMounted = true;
        const loadLevelData = async () => {
            if (!workout) return;
            const level = await getWorkoutLevel(workout.id, workout.baseLevel);
            const xp = await getWorkoutXP(workout.id);
            if (isMounted) {
                setCurrentLevel(level);
                setCurrentXP(xp);
            }
        };
        loadLevelData();
        return () => { isMounted = false; };
    }, [workoutId, workout?.id]);

    useEffect(() => {
        const loadExerciseStats = async () => {
            if (!workout) return;
            try {
                const { loadWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
                const settingsMap: Record<string, any> = {};

                for (const exercise of workout.exercises) {
                    const combinedId = `${workout.id}_${exercise.id}`;
                    const settings = await loadWorkoutSettings(combinedId);
                    settingsMap[exercise.id] = settings;
                }

                setWorkoutSettings(settingsMap);
            } catch (e) {
                console.error('Failed to load settings:', e);
            }
        };
        loadExerciseStats();
    }, [workout?.id]);


    useEffect(() => {
        const loadCompletionStatus = async () => {
            try {
                const summariesStr = await AsyncStorage.getItem('workoutSummaries');
                const summaries = summariesStr ? JSON.parse(summariesStr) : [];
                const today = new Date().toISOString().split('T')[0];
                const todaySummaries = summaries.filter((s: any) => s.date.startsWith(today));

                const completedIds = new Set<string>();
                todaySummaries.forEach((s: any) => {
                    const wId = String(s.workoutId);
                    completedIds.add(wId);
                    // Also add the base ID if it's a combined ID
                    if (wId.includes('_')) {
                        const parts = wId.split('_');
                        completedIds.add(parts[parts.length - 1]);
                    }
                });

                setCompletedExercises(completedIds);
            } catch (e) {
                console.error('Failed to load exercise completion status:', e);
            }
        };
        loadCompletionStatus();
    }, [workout?.id]);


    if (!workout) return null;

    const _tier = workout.rarity;
    const rarityKey = _tier.toLowerCase();
    let mappedRarity: any = _tier;

    if (['titan', 'icon', 'legend', 'god', 'goddess', 'divine'].includes(rarityKey)) {
        mappedRarity = 'ICON';
        if (rarityKey === 'titan') mappedRarity = 'TITAN';
        if (rarityKey === 'legend') mappedRarity = 'LEGEND';
    }

    const currentRarity = _tier;
    const rarityConfig = collectibleRarityColors[mappedRarity as Rarity] || collectibleRarityColors.GOLD;

    // Normalize icon roles to prevent Olympians appearing as secondary
    const { primaryIconId, secondaryIconIds, thread, secondaryTraits } = normalizeIconRoles(workout);
    const boostedStats = workout.baseStats;
    const ovr = workout.baseLevel;

    // Exercises logic
    const visibleExercises = workout.exercises;

    const handleExercisePress = (exercise: CollectibleExercise) => {
        const parsed = parseWorkoutName(exercise.name);
        const combinedId = `${workout.id}_${exercise.id}`;
        navigation.navigate('GenericWorkoutSettingsScreen', {
            workoutId: combinedId,
            workoutName: parsed.name,
            collectibleCardId: workout.id,
            collectibleBaseLevel: workout.baseLevel,

            initialSettings: parsed.sets ? {
                targetSets: parsed.sets,
                targetReps: parsed.reps,
                weight: parsed.weight
            } : undefined
        } as any);
    };

    const handleStartWorkout = async () => {
        if (timerContext && visibleExercises.length > 0) {
            const firstExercise = visibleExercises[0];
            const parsed = parseWorkoutName(firstExercise.name);
            const combinedId = `${workout.id}_${firstExercise.id}`;
            timerContext.startTimerWithWorkoutSettings(
                combinedId,
                parsed.name,
                workout.id,
                workout.baseLevel,

                parsed.sets ? {
                    targetSets: parsed.sets,
                    targetReps: parsed.reps,
                    weight: parsed.weight
                } : undefined
            );
            navigation.goBack();
        }
    };

    const headerBgOpacity = scrollY.interpolate({
        inputRange: [40, 70],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const stickyTitleOpacity = scrollY.interpolate({
        inputRange: [180, 240],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const stickyTitleTranslateY = scrollY.interpolate({
        inputRange: [180, 240],
        outputRange: [20, 0],
        extrapolate: 'clamp',
    });

    const headerScale = scrollY.interpolate({
        inputRange: [-100, 0],
        outputRange: [1.2, 1],
        extrapolate: 'clamp',
    });

    const getBarColor = (progress: number) => {
        if (progress < 30) return '#FF6B6B';
        if (progress < 70) return '#FFE61E';
        return '#9DEC2C';
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <Animated.View style={[
                styles.headerContainer,
                { transform: [{ scale: headerScale }] }
            ]}>
                <Animated.View style={StyleSheet.absoluteFill}>
                    <LinearGradient
                        colors={[rarityConfig.primary, rarityConfig.secondary, 'transparent']}
                        locations={[0, 0.4, 1]}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                        style={{ flex: 1, height: Platform.OS === 'ios' ? 160 : 140 }}
                    />
                </Animated.View>
                <View style={styles.headerContent}>
                    <LiquidGlass
                        borderRadius={24}
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Theme.Icons.back.lib width={28} height={28} color="#FFF" />
                    </LiquidGlass>
                    <Animated.View style={[
                        styles.stickyTitleContainer,
                        {
                            opacity: stickyTitleOpacity,
                            transform: [{ translateY: stickyTitleTranslateY }]
                        }
                    ]}>
                        <Text style={styles.stickyTitle}>{workout.name.toUpperCase()}</Text>
                    </Animated.View>
                    <View style={{ width: 48 }} />
                </View>
            </Animated.View>

            <Animated.ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                {/* Large Title Section */}
                <View style={{ paddingHorizontal: 16, paddingTop: 0, marginBottom: 10 }}>
                    <Text style={{ fontSize: 34, fontWeight: 'bold', color: '#FFF' }}>{workout.name}</Text>
                </View>

                <View style={[styles.cardSection, styles.mainCardContainer]}>
                    <FUTShield
                        width={cardWidth}
                        height={cardHeight}
                        fill={rarityConfig.secondary}
                        bottomFill={rarityConfig.secondary + 'CC'}
                        splitPercentage={55}
                        stroke="transparent"
                        strokeWidth={0}
                        rarity={currentRarity.toLowerCase() as any}
                    >
                        <View style={styles.cardContent}>
                            <RarityTexture
                                rarity={
                                    ['titan', 'icon', 'legend', 'god', 'goddess', 'divine'].includes(currentRarity.toLowerCase())
                                        ? 'legend'
                                        : currentRarity.toLowerCase()
                                }
                                color={rarityConfig.patternColor}
                                seed={workout.id}
                            />

                            {/* Pentagon Category Badge - Positioned on left edge center */}
                            {getMythologyCategoryConfig(primaryIconId) && (
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
                                            name={getMythologyCategoryConfig(primaryIconId)!.icon}
                                            size={16}
                                            color={rarityConfig.text}
                                            style={{ transform: [{ rotate: '180deg' }] }}
                                        />
                                    </View>
                                </View>
                            )}

                            <View style={styles.topSection}>
                                <View style={styles.topSide}>
                                    <View style={{ alignItems: 'center' }}>
                                        <Text style={[styles.levelText, { color: rarityConfig.text }]}>{currentLevel}</Text>
                                        <Text style={[styles.positionText, { color: rarityConfig.text }]}>{workout.position}</Text>
                                    </View>
                                </View>

                                {/* Large Central Mythological Hierarchy - Positioned Right */}
                                <View style={styles.rightSymbolContainer}>
                                    <MythologyHierarchy
                                        primaryIconId={primaryIconId}
                                        secondaryIconIds={[]} // Secondary icons rendered separately below stats
                                        rarity={currentRarity as any}
                                        epithet={workout.primaryEpithetByTier?.[currentRarity as any] || workout.subtitle}
                                        color={rarityConfig.text}
                                        size={210}
                                        hideEpithet={true}
                                        useCropped={true}
                                    />
                                </View>
                            </View>

                            <View style={styles.bottomSection}>
                                <Text style={[styles.workoutName, { color: rarityConfig.text }]} numberOfLines={1}>
                                    {(workout.name || '').toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
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

                                {/* Secondary Mythology Icons - Positioned Below Stats (filtered to exclude Olympians) */}
                                {secondaryIconIds.length > 0 && (
                                    <View style={styles.secondaryIconRowBelowStats}>
                                        <MythologyHierarchy
                                            primaryIconId={undefined}
                                            secondaryIconIds={secondaryIconIds}
                                            rarity={currentRarity}
                                            color={rarityConfig.text}
                                            size={60}
                                            hideSecondaryWrapper={true}
                                            useCropped={false}
                                        />
                                    </View>
                                )}
                            </View>
                        </View>
                    </FUTShield>
                </View>

                {/* Standalone OVR Badge/Indicator */}
                <View style={[styles.ovrBadgeStandalone, { backgroundColor: rarityConfig.primary + '15' }]}>
                    <Text style={[styles.ovrBadgeLabel, { color: rarityConfig.primary }]}>TARGET GOAL</Text>
                    <Text style={[styles.ovrBadgeValue, { color: rarityConfig.primary }]}>LEVEL {ovr}</Text>
                </View>

                {/* Workout Subtitle/Description - Moved from card */}
                <View style={styles.descriptionSection}>
                    {workout.primaryEpithetByTier?.[currentRarity as any] && (
                        <Text style={[styles.secondaryTagText, { color: rarityConfig.primary, fontSize: 13, marginBottom: 4 }]}>
                            {workout.primaryEpithetByTier[currentRarity as any].toUpperCase()}
                        </Text>
                    )}
                    <Text style={[styles.descriptionText, { color: rarityConfig.primary }]}>
                        {workout.subtitle}
                    </Text>
                </View>

                {/* Power Fantasy Detail Block (Thread & Traits) */}
                <View style={styles.powerFantasyDetailBlock}>
                    {thread && (
                        <View style={styles.threadContainer}>
                            <View style={styles.threadContent}>
                                <Text style={styles.threadTitle}>{thread.title.toUpperCase()}</Text>
                                <Text style={styles.threadSubtitle}>{thread.subtitle}</Text>
                            </View>
                        </View>
                    )}

                    {secondaryTraits && secondaryTraits.length > 0 && (
                        <View style={styles.traitsContainer}>
                            <Text style={styles.traitsLabel}>{workout.secondaryTag ? workout.secondaryTag.toUpperCase() : 'ENCOUNTER TRAITS'}</Text>
                            <View style={styles.traitsGrid}>
                                {secondaryTraits.map((trait, idx) => (
                                    <View key={idx} style={[styles.traitChip, { backgroundColor: rarityConfig.primary + '20', borderColor: rarityConfig.primary + '40' }]}>
                                        <MaterialCommunityIcons name="shield-check" size={14} color={rarityConfig.primary} />
                                        <Text style={[styles.traitChipText, { color: '#FFF' }]}>{trait.title}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                <View style={[styles.xpBarContainer, { paddingHorizontal: 0 }]}>
                    <Text style={[styles.xpText, { color: '#FFFFFF', fontWeight: '900', fontSize: 14 }]}>
                        LV {currentLevel} COMPLETED
                    </Text>
                    <View style={styles.sessionBarContainer}>
                        <View style={[
                            styles.sessionBarFill,
                            {
                                width: `${Math.min(100, (currentLevel / 10) * 100)}%`,
                                backgroundColor: getBarColor((currentLevel / 10) * 100)
                            }
                        ]} />
                    </View>
                </View>

                <View style={styles.detailSection}>
                    {/* Time & Workout Stats Container */}
                    <View style={styles.infoCardsSection}>
                        <View style={styles.infoCardsRow}>
                            <View style={styles.infoCard}>
                                <Theme.Icons.time.lib width={24} height={24} color="#9DEC2C" />
                                <View style={styles.infoTextContainer}>
                                    <Text style={styles.infoValue}>{workout.duration}</Text>
                                    <Text style={styles.infoLabel}>MIN</Text>
                                </View>
                            </View>
                            <View style={styles.infoCard}>
                                <MaterialCommunityIcons name="dumbbell" size={24} color="#9DEC2C" />
                                <View style={styles.infoTextContainer}>
                                    <Text style={styles.infoValue}>{visibleExercises.length}</Text>
                                    <Text style={styles.infoLabel}>WORKOUTS</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Workouts Section */}
                    <View style={styles.workoutsSection}>
                        <Text style={[styles.sectionTitle, { marginHorizontal: 15, marginTop: 15, marginBottom: 10 }]}>WORKOUTS</Text>

                        <View style={styles.recessedPickerWrapper}>
                            {visibleExercises.map((exercise) => {
                                const ExerciseIcon = findExerciseIcon(exercise.id);
                                const settings = workoutSettings[exercise.id];
                                const parsed = parseWorkoutName(exercise.name);
                                const weight = settings?.weight || '75';
                                const sets = settings?.targetSets || '3';
                                const reps = settings?.targetReps || '6';
                                const isDone = completedExercises.has(exercise.id);

                                return (
                                    <TouchableOpacity
                                        key={exercise.id}
                                        activeOpacity={0.9}
                                        onPress={() => handleExercisePress(exercise)}
                                        style={styles.workoutCardThin}
                                    >
                                        <LinearGradient
                                            colors={isDone ? ['#1B3705', '#2E5008'] : ['#122003', '#213705']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.workoutIconGradient}
                                        >
                                            <ExerciseIcon width={30} height={30} fill={isDone ? "#9DEC2C" : "#89AF56"} />
                                        </LinearGradient>

                                        <View style={styles.workoutInfo}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Text style={[styles.workoutCardName, isDone && { color: '#9DEC2C' }]} numberOfLines={1}>
                                                    {parsed.name.toUpperCase()}
                                                </Text>
                                                {isDone && (
                                                    <View style={styles.workoutStatusContainer}>
                                                        <Text style={[styles.workoutStatusLabel, { color: '#9DEC2C' }]}>
                                                            DONE
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                                                <Text style={styles.workoutValue}>{weight}</Text>
                                                <Text style={styles.workoutUnit}>KG</Text>
                                                <Text style={styles.workoutSeparator}> / </Text>
                                                <Text style={styles.workoutValue}>{parsed.sets ? `${parsed.sets}x${parsed.reps}` : `${sets}x${reps}`}</Text>
                                                <Text style={styles.workoutUnit}>REPS</Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <View style={styles.subStatsSection}>
                        <LiquidGlass
                            borderRadius={16}
                            borderWidth={0}
                            style={styles.majorSectionContainer}
                            contentStyle={{ paddingBottom: 20, alignItems: 'stretch' }}
                        >
                            <Text style={[styles.sectionTitle, { marginHorizontal: 15, marginTop: 15, marginBottom: 20 }]}>ATTRIBUTES</Text>

                            <View style={styles.recessedPickerWrapper}>
                                <View style={styles.statsGrid2x3}>
                                    {[
                                        { key: 'STR', label: 'STRENGTH' },
                                        { key: 'VOL', label: 'VOLUME' },
                                        { key: 'TMP', label: 'TEMPO' },
                                        { key: 'END', label: 'ENDURANCE' },
                                        { key: 'PHY', label: 'PHYSICALITY' },
                                        { key: 'HYP', label: 'HYPERTROPHY' },
                                    ].map((stat) => (
                                        <View key={stat.key} style={styles.statGridItem}>
                                            <View style={styles.statGridHeader}>
                                                <Text style={styles.statGridLabel}>{stat.label}</Text>
                                                <Text style={[styles.statGridValue, { color: getBarColor(boostedStats[stat.key as keyof typeof boostedStats]) }]}>
                                                    {boostedStats[stat.key as keyof typeof boostedStats]}
                                                </Text>
                                            </View>
                                            <View style={styles.statGridBarContainer}>
                                                <View style={[
                                                    styles.statGridBarFill,
                                                    {
                                                        width: `${(boostedStats[stat.key as keyof typeof boostedStats] / 99) * 100}%`,
                                                        backgroundColor: getBarColor(boostedStats[stat.key as keyof typeof boostedStats])
                                                    }
                                                ]} />
                                            </View>
                                        </View>
                                    ))}
                                </View>

                                <LinearGradient
                                    colors={['rgba(0,0,0,0.4)', 'transparent']}
                                    style={[styles.pickerGradient, { top: 0 }]}
                                    pointerEvents="none"
                                />
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.4)']}
                                    style={[styles.pickerGradient, { bottom: 0 }]}
                                    pointerEvents="none"
                                />
                            </View>
                        </LiquidGlass>
                    </View>


                    {/* Skills Section */}
                    {workout.skills && workout.skills.length > 0 && (
                        <View style={styles.skillsSection}>
                            <Text style={styles.sectionTitle}>PLAYSTYLES / SKILLS</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.skillsScroll}>
                                {(workout.skills || []).map((skill) => {
                                    const isLocked = currentLevel < skill.unlockLevel;
                                    const isPlus = skill.tier === 'PLUS';
                                    return (
                                        <View key={skill.id} style={[
                                            styles.skillCard,
                                            {
                                                backgroundColor: isLocked ? 'rgba(0,0,0,0.5)' : (isPlus ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.3)'),
                                                borderColor: isLocked ? 'transparent' : (isPlus ? rarityConfig.primary : 'rgba(255,255,255,0.1)'),
                                                marginRight: 15,
                                            }
                                        ]}>
                                            <View style={styles.skillIconContainer}>
                                                {skill.customIcon === 'warrior' ? (
                                                    <WarriorIcon
                                                        width={36}
                                                        height={36}
                                                        fill={isLocked ? '#888' : '#b56a2d'}
                                                    />
                                                ) : skill.customIcon === 'warmuppro' ? (
                                                    <WarmupProIcon
                                                        width={36}
                                                        height={36}
                                                        fill={isLocked ? '#888' : '#b56a2d'}
                                                    />
                                                ) : (
                                                    <MaterialCommunityIcons
                                                        name={skill.iconName}
                                                        size={36}
                                                        color={isLocked ? '#888' : '#b56a2d'}
                                                    />
                                                )}
                                                {isLocked && (
                                                    <View style={styles.lockOverlay}>
                                                        <Feather name="lock" size={16} color="rgba(255,255,255,0.7)" />
                                                    </View>
                                                )}
                                            </View>
                                            <View style={styles.skillInfo}>
                                                <Text style={[styles.skillName, { color: isLocked ? '#666' : '#FFF' }]}>{skill.name}</Text>
                                                <Text style={[styles.skillLevel, { color: isPlus ? rarityConfig.primary : '#888', opacity: isPlus ? 1 : 0.6 }]}>
                                                    UNLOCK LVL {skill.unlockLevel}
                                                </Text>
                                                {skill.statBoosts && (
                                                    <View style={styles.skillBoosts}>
                                                        {(skill.statBoosts || []).map((boost, bi) => (
                                                            <Text key={bi} style={[styles.skillBoostText, { color: rarityConfig.primary }]}>+{boost.amount} {boost.target}</Text>
                                                        ))}
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    )}

                    {workout.lore && (
                        <View style={[styles.loreContainer, { marginBottom: 30 }]}>
                            <MaterialCommunityIcons name="format-quote-open" size={20} color={rarityConfig.primary} style={{ opacity: 0.5, marginBottom: 8 }} />
                            <Text style={[styles.loreText, { color: rarityConfig.primary }]}>
                                {workout.lore}
                            </Text>
                            <View style={[styles.loreDivider, { backgroundColor: rarityConfig.primary }]} />
                        </View>
                    )}



                    <TouchableOpacity style={[styles.startButton, { backgroundColor: rarityConfig.primary }]} onPress={handleStartWorkout} activeOpacity={0.9}>
                        <Text style={[styles.startButtonText, { color: rarityConfig.text || '#000000' }]}>Start Workout</Text>
                    </TouchableOpacity>
                </View>
            </Animated.ScrollView >
        </View >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    loadingText: { color: '#FFF', fontSize: 16, textAlign: 'center', marginTop: 100 },
    headerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
        paddingBottom: 16
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stickyTitleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stickyTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    scrollView: { flex: 1 },
    scrollContent: {
        paddingHorizontal: 9,
        paddingTop: Platform.OS === 'ios' ? 140 : 120,
        paddingBottom: 140
    },
    cardSection: {
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
        alignItems: 'center',
        width: '100%',
    },
    mainCardContainer: {
        alignSelf: 'center',
        marginTop: -90, // Shifted an additional 50px UP (-40 - 50)
        marginBottom: 24,
    },
    cardContent: {
        flex: 1,
        paddingHorizontal: 0,
        paddingTop: 30,
        paddingBottom: 0,
    },
    topSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        height: '35%',
        paddingTop: 75,
        paddingHorizontal: 16,
    },
    topSide: { alignItems: 'center', paddingLeft: 0 },
    levelLabelDetail: {
        fontSize: 16,
        fontWeight: '700',
        fontFamily: Platform.OS === 'ios' ? 'DINPro-CondensedBold' : 'sans-serif-condensed',
        opacity: 0.8,
        marginBottom: -5,
    },
    levelText: {
        fontSize: 66,
        fontWeight: '900',
        fontFamily: Platform.OS === 'ios' ? 'DINPro-CondensedBold' : 'sans-serif-condensed',
        lineHeight: 66
    },
    positionText: {
        fontSize: 28,
        fontWeight: '800',
        fontFamily: Platform.OS === 'ios' ? 'DINPro-CondensedBold' : 'sans-serif-condensed',
        marginTop: -6,
        letterSpacing: 0.1
    },
    ringContainer: { paddingTop: 5 },
    middleSection: { height: '35%', justifyContent: 'center' }, // Kept for legacy if needed elsewhere but removed from card structure
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
    },
    separator: { height: 1, marginHorizontal: 20, marginBottom: 15 },
    footerLogo: { width: 32, height: 32, borderRadius: 16 },
    xpBarContainer: { marginBottom: 16, alignItems: 'center' },
    xpBarBackground: { width: '100%', height: 8, backgroundColor: '#2C2C2E', borderRadius: 4, overflow: 'hidden' },
    xpBarFill: { height: '100%', borderRadius: 4 },
    xpText: { fontSize: 12, color: '#888', marginTop: 4, fontWeight: '600' },
    sessionBarContainer: {
        width: '100%',
        height: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 5,
        marginTop: 10,
        overflow: 'hidden',
    },
    sessionBarFill: {
        height: '100%',
        borderRadius: 5,
    },
    detailSection: { marginTop: 10 },
    infoCardsSection: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 12,
        marginBottom: 20,
    },
    infoCardsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 0, gap: 10 },
    infoCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: '#242426',
        borderRadius: 24,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginHorizontal: 0,
        gap: 8,
        overflow: 'hidden'
    },
    infoTextContainer: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    infoValue: { fontSize: 22, fontWeight: '900', color: '#9DEC2C' },
    infoLabel: { fontSize: 12, fontWeight: '700', color: '#9DEC2C', letterSpacing: 1 },

    workoutsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 10 },
    workoutsTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', letterSpacing: 2 },
    workoutCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'transparent',
        borderRadius: 32,
        paddingHorizontal: 8,
        paddingVertical: 11,
        minHeight: 44,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
    sessionIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    sessionInfo: {
        flex: 1,
    },
    sessionWorkoutName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 2,
    },
    sessionMetric: {
        fontSize: 22,
        color: '#9DEC2C',
        fontWeight: '500',
    },
    sessionUnit: {
        fontSize: 13,
        color: '#9DEC2C',
        fontWeight: '500',
        marginLeft: 4,
        letterSpacing: 0.5,
    },
    sessionDivider: {
        color: '#9DEC2C',
        fontSize: 13,
        fontWeight: '500',
        marginHorizontal: 4,
    },
    exerciseStatsRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    statsLayoutHorizontal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 0,
        gap: 5,
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
    topRightGridFIFA: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
        gap: 5,
    },
    footerLogos: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginTop: 15,
    },
    workoutChevronContainer: {
        position: 'absolute',
        top: 10,
        right: 12,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    startButton: {
        height: 54,
        borderRadius: 30,
        backgroundColor: '#9DEC2C',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        marginBottom: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    startButtonText: { color: '#000000', fontWeight: '600', fontSize: 20 },
    topRingContainer: {
        marginTop: 8,
    },
    bottomShortDivider: {
        width: 40,
        height: 1.5,
        borderRadius: 1,
        alignSelf: 'center',
        marginTop: 12,
    },
    majorSectionContainer: {
        marginHorizontal: 0,
        borderRadius: 16, // Classic thinner look
        overflow: 'hidden',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '900',
        color: '#8E8E93',
        letterSpacing: 2,
    },
    workoutsSection: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 12,
        marginBottom: 20,
    },
    recessedPickerWrapper: {
        width: '100%',
        position: 'relative',
        marginTop: 12,
    },
    pickerGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 20,
        zIndex: 1,
    },
    workoutCardThin: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#242426',
        borderRadius: 24,
        paddingHorizontal: 12,
        paddingVertical: 14,
        minHeight: 50,
        marginBottom: 10,
        overflow: 'hidden',
    },
    workoutIconGradient: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    chevronCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#8E8E93', // Headings-like grey
        justifyContent: 'center',
        alignItems: 'center',
    },
    workoutInfo: {
        flex: 1,
    },
    workoutCardName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 4,
    },
    workoutValue: {
        color: '#9DEC2C',
        fontSize: 22,
        fontWeight: '500',
    },
    workoutUnit: {
        color: '#9DEC2C',
        fontSize: 13,
        fontWeight: '500',
        marginLeft: 4,
        letterSpacing: 0.5,
    },
    workoutSeparator: {
        color: '#9DEC2C',
        fontSize: 13,
        fontWeight: '500',
        marginHorizontal: 4,
    },
    workoutStatusContainer: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginLeft: 8,
    },
    workoutStatusLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    },
    subStatsSection: {
        marginBottom: 24,
    },
    attributeGroups: {
        gap: 16,
    },
    attributeGroup: {
        backgroundColor: '#1C1C1E',
        borderRadius: 24,
        padding: 20,
    },
    groupTitle: {
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 2,
        color: '#FFFFFF',
    },
    attributeHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingBottom: 10,
        borderBottomWidth: 1.5,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    attributeTitleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    groupStatValue: {
        fontSize: 20,
        fontWeight: '900',
        fontFamily: Platform.OS === 'ios' ? 'DINPro-CondensedBold' : 'sans-serif-condensed',
    },
    attributeChevronContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    attributeContent: {
        paddingHorizontal: 4,
    },
    subStatItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    subStatLabel: {
        fontSize: 14,
        fontWeight: '700',
        flex: 1,
    },
    subStatValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        width: '45%',
    },
    subStatBarContainer: {
        flex: 1,
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    subStatBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    subStatValue: {
        fontSize: 16,
        fontWeight: '900',
        width: 30,
        textAlign: 'right',
    },
    skillsSection: {
        marginBottom: 24,
    },
    skillsScroll: {
        paddingRight: 60,
    },
    skillCard: {
        width: SCREEN_WIDTH * 0.65,
        borderRadius: 24,
        padding: 6,
        backgroundColor: '#1C1C1E',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderColor: '#3A3A3C',
    },
    skillHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    skillIconContainer: {
        width: 41,
        height: 41,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },

    lockOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    skillInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    skillNameContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    skillName: {
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    skillDesc: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '500',
        opacity: 0.8,
        marginBottom: 12,
    },
    skillFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'auto',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingTop: 8,
    },
    skillLevel: {
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    skillBoosts: {
        flexDirection: 'row',
        gap: 8,
    },
    skillBoostText: {
        fontSize: 17,
        fontWeight: '900',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#1C1C1E',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#333',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: 1,
    },
    modalValue: {
        fontSize: 32,
        fontWeight: '900',
    },
    modalContent: {
        gap: 20,
    },
    modalStatItem: {
        marginBottom: 15,
    },
    modalStatLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    modalStatLabel: {
        fontSize: 14,
        color: '#8E8E93',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    modalStatValue: {
        fontSize: 16,
        color: '#FFF',
        fontWeight: '700',
    },
    modalCloseButton: {
        marginTop: 30,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    modalCloseText: {
        fontSize: 16,
        fontWeight: '700',
    },
    loreContainer: {
        marginTop: 40,
        marginBottom: 20,
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    loreText: {
        fontSize: 15,
        fontWeight: '700',
        fontStyle: 'italic',
        textAlign: 'center',
        lineHeight: 22,
        letterSpacing: 0.5,
        opacity: 0.8,
    },
    loreDivider: {
        width: 40,
        height: 2,
        borderRadius: 1,
        marginTop: 12,
        opacity: 0.3,
    },
    powerFantasyDetailBlock: {
        paddingHorizontal: 0,
        marginVertical: 12,
        gap: 16,
    },
    threadContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    pentagonBadgeContainer: {
        position: 'absolute',
        left: -21,
        top: '40%',
        marginTop: 37,
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
    threadLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#9DEC2C',
        width: 60,
        letterSpacing: 1,
    },
    threadContent: {
        flex: 1,
        paddingLeft: 12,
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(255,255,255,0.1)',
    },
    threadTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 2,
    },
    threadSubtitle: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.6)',
        fontStyle: 'italic',
    },
    traitsContainer: {
        gap: 8,
    },
    traitsLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 2,
        marginLeft: 4,
    },
    traitsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    traitChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        gap: 6,
    },
    traitChipText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    rightSymbolContainer: {
        position: 'absolute',
        top: 40,
        right: -10,
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
        marginTop: -10, // Shifted 10px higher from 5 to -5
        opacity: 0.8,
    },
    // 2x3 Grid Styles
    statsGrid2x3: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 15,
        justifyContent: 'space-between',
        gap: 15,
    },
    statGridItem: {
        width: '47%',
        marginBottom: 5,
    },
    statGridHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 6,
    },
    statGridLabel: {
        fontSize: 12,
        color: '#8E8E93',
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    statGridValue: {
        fontSize: 18,
        fontWeight: '900',
    },
    statGridBarContainer: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    statGridBarFill: {
        height: '100%',
        borderRadius: 2,
    },
    descriptionSection: {
        paddingHorizontal: 20,
        marginVertical: 10,
        alignItems: 'center',
    },
    secondaryTagText: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 4,
        opacity: 0.9,
    },
    descriptionText: {
        fontSize: 14,
        fontWeight: '600',
        fontStyle: 'italic',
        textAlign: 'center',
        lineHeight: 20,
        opacity: 0.8,
    },
    ovrBadgeStandalone: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 16,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    ovrBadgeLabel: {
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 2,
        opacity: 0.8,
    },
    ovrBadgeValue: {
        fontSize: 24,
        fontWeight: '900',
        fontFamily: Platform.OS === 'ios' ? 'DINPro-CondensedBold' : 'sans-serif-condensed',
    },
    workoutCardSingle: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginHorizontal: 15,
        marginBottom: 15,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
});

export default CollectibleWorkoutDetailScreen;
