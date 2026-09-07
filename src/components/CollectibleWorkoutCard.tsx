import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Workout } from '../constants/workoutData';
import { TimerContext } from '../contexts/TimerContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Rarity configuration matching the Collectible design
export const rarityConfigs: Record<string, {
    displayName: string;
    colors: { primary: string; secondary: string; accent: string; glow: string };
}> = {
    bronze: {
        displayName: 'BRONZE',
        colors: {
            primary: '#D97941',
            secondary: '#B85C2F',
            accent: '#F0A574',
            glow: 'rgba(217, 121, 65, 0.5)',
        },
    },
    silver: {
        displayName: 'SILVER',
        colors: {
            primary: '#C5C5C5',
            secondary: '#9E9E9E',
            accent: '#E0E0E0',
            glow: 'rgba(197, 197, 197, 0.5)',
        },
    },
    gold: {
        displayName: 'GOLD',
        colors: {
            primary: '#F5C842',
            secondary: '#D4A418',
            accent: '#FFE082',
            glow: 'rgba(245, 200, 66, 0.6)',
        },
    },
    pro: {
        displayName: 'PRO',
        colors: {
            primary: '#00D9FF',
            secondary: '#0099CC',
            accent: '#5CE1FF',
            glow: 'rgba(0, 217, 255, 0.6)',
        },
    },
    legend: {
        displayName: 'LEGEND',
        colors: {
            primary: '#A855F7',
            secondary: '#7E22CE',
            accent: '#C084FC',
            glow: 'rgba(168, 85, 247, 0.6)',
        },
    },
};

// Map workout types to rarities and positions
export const getWorkoutRarity = (workoutName: string): string => {
    const name = workoutName.toLowerCase();
    if (name.includes('deadlift') || name.includes('squat')) return 'legend';
    if (name.includes('bench') || name.includes('press')) return 'gold';
    if (name.includes('row') || name.includes('pull')) return 'pro';
    if (name.includes('curl') || name.includes('extension')) return 'silver';
    return 'bronze';
};

export const getWorkoutPosition = (workoutName: string): string => {
    const name = workoutName.toLowerCase();
    if (name.includes('pull') || name.includes('row') || name.includes('curl') || name.includes('deadlift')) return 'PULL';
    if (name.includes('push') || name.includes('press') || name.includes('bench') || name.includes('extension')) return 'PUSH';
    if (name.includes('squat') || name.includes('leg') || name.includes('lunge') || name.includes('calf')) return 'LEGS';
    return 'PULL';
};

// Generate workout stats based on rarity level
export const generateWorkoutStats = (workoutName: string): { WC: number; STP: number; MOV: number; SKL: number; RES: number; REC: number; level: number } => {
    const rarity = getWorkoutRarity(workoutName);
    const baseLevel = rarity === 'legend' ? 90 : rarity === 'pro' ? 80 : rarity === 'gold' ? 70 : rarity === 'silver' ? 60 : 50;
    const variance = () => Math.floor(Math.random() * 15) - 5;

    return {
        level: baseLevel + Math.floor(Math.random() * 10),
        WC: Math.min(99, Math.max(50, baseLevel + variance())),
        STP: Math.min(99, Math.max(50, baseLevel + variance())),
        MOV: Math.min(99, Math.max(50, baseLevel + variance() - 5)),
        SKL: Math.min(99, Math.max(50, baseLevel + variance())),
        RES: Math.min(99, Math.max(50, baseLevel + variance() - 3)),
        REC: Math.min(99, Math.max(50, baseLevel + variance() - 2)),
    };
};

interface CollectibleWorkoutCardProps {
    workout: Workout;
    onPlayPress?: () => void;
    fullWidth?: boolean;
}

export const CollectibleWorkoutCard: React.FC<CollectibleWorkoutCardProps> = ({
    workout,
    onPlayPress,
    fullWidth = true,
}) => {
    const navigation = useNavigation<any>();
    const timerContext = useContext(TimerContext);
    const [stats, setStats] = useState<any>(null);

    const rarity = getWorkoutRarity(workout.name);
    const position = getWorkoutPosition(workout.name);
    const rarityConfig = rarityConfigs[rarity];
    const SvgIcon = workout.SvgIcon;

    useEffect(() => {
        // Generate consistent stats based on workout name (seeded by name hash)
        const storedStatsKey = `workout_stats_${workout.workoutId}`;
        AsyncStorage.getItem(storedStatsKey).then(stored => {
            if (stored) {
                setStats(JSON.parse(stored));
            } else {
                const newStats = generateWorkoutStats(workout.name);
                setStats(newStats);
                AsyncStorage.setItem(storedStatsKey, JSON.stringify(newStats));
            }
        });
    }, [workout.workoutId]);

    const handleCardPress = () => {
        navigation.navigate('CollectibleWorkoutDetail', {
            workoutId: workout.workoutId,
            workoutName: workout.name,
        });
    };

    if (!stats) return null;

    const cardWidth = fullWidth ? SCREEN_WIDTH - 32 : (SCREEN_WIDTH - 44) / 2;

    return (
        <TouchableOpacity
            style={[styles.cardContainer, { width: cardWidth }]}
            activeOpacity={0.9}
            onPress={handleCardPress}
        >
            <LinearGradient
                colors={[rarityConfig.colors.primary, rarityConfig.colors.secondary]}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Geometric Pattern Overlay */}
                <View style={styles.patternOverlay} />

                {/* Diagonal Shine */}
                <View style={[styles.diagonalShine, { backgroundColor: rarityConfig.colors.accent }]} />

                {/* Border Glow */}
                <View style={[styles.borderGlow, { borderColor: rarityConfig.colors.accent }]} />

                {/* Content */}
                <View style={styles.cardContent}>
                    {/* Top Section: Level + Position Badge + Icon */}
                    <View style={styles.topSection}>
                        <View style={styles.levelContainer}>
                            <Text style={styles.levelText}>{stats.level}</Text>
                            <View style={styles.positionBadge}>
                                <Text style={styles.positionText}>{position}</Text>
                            </View>
                        </View>

                        {/* Workout Icon */}
                        <View style={styles.iconContainer}>
                            {SvgIcon && <SvgIcon width={28} height={28} fill="#1a1a1a" />}
                        </View>
                    </View>

                    {/* Middle Section: Workout Name */}
                    <View style={styles.middleSection}>
                        <Text style={styles.workoutName} numberOfLines={2}>{workout.name.toUpperCase()}</Text>
                    </View>

                    {/* Separator */}
                    <View style={styles.separator} />

                    {/* 6-Stat Row (FIFA-style: label on top, value below) */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItemFifa}>
                            <Text style={styles.statLabelFifa}>STR</Text>
                            <Text style={styles.statValueFifa}>{stats.WC}</Text>
                        </View>
                        <View style={styles.statItemFifa}>
                            <Text style={styles.statLabelFifa}>VOL</Text>
                            <Text style={styles.statValueFifa}>{stats.STP}</Text>
                        </View>
                        <View style={styles.statItemFifa}>
                            <Text style={styles.statLabelFifa}>END</Text>
                            <Text style={styles.statValueFifa}>{stats.MOV}</Text>
                        </View>
                        <View style={styles.statItemFifa}>
                            <Text style={styles.statLabelFifa}>SKL</Text>
                            <Text style={styles.statValueFifa}>{stats.SKL}</Text>
                        </View>
                        <View style={styles.statItemFifa}>
                            <Text style={styles.statLabelFifa}>PWR</Text>
                            <Text style={styles.statValueFifa}>{stats.RES}</Text>
                        </View>
                        <View style={styles.statItemFifa}>
                            <Text style={styles.statLabelFifa}>REC</Text>
                            <Text style={styles.statValueFifa}>{stats.REC}</Text>
                        </View>
                    </View>

                    {/* Short Separator */}
                    <View style={styles.shortSeparator} />

                    {/* Footer: Rarity Badge */}
                    <View style={styles.footer}>
                        <View style={styles.rarityBadge}>
                            <Text style={styles.rarityText}>{rarityConfig.displayName}</Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        aspectRatio: 4 / 5,
        marginBottom: 16,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    cardGradient: {
        flex: 1,
        borderRadius: 24,
        overflow: 'hidden',
    },
    patternOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    diagonalShine: {
        position: 'absolute',
        top: -50,
        left: -50,
        width: '200%',
        height: 100,
        opacity: 0.2,
        transform: [{ rotate: '-15deg' }],
    },
    borderGlow: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 24,
        borderWidth: 2,
        opacity: 0.5,
    },
    cardContent: {
        flex: 1,
        padding: 20,
    },
    topSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    levelContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    levelText: {
        fontSize: 64,
        fontWeight: '900',
        color: '#1a1a1a',
        lineHeight: 64,
    },
    positionBadge: {
        marginTop: 6,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    positionText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    middleSection: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
    },
    workoutName: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1a1a1a',
        textAlign: 'center',
        letterSpacing: 1.5,
    },
    separator: {
        height: 1,
        backgroundColor: 'rgba(26, 26, 26, 0.2)',
        marginVertical: 8,
    },
    // FIFA-style stats row (6 stats in a single row)
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    statItemFifa: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statLabelFifa: {
        fontSize: 10,
        fontWeight: '600',
        color: 'rgba(26, 26, 26, 0.7)',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    statValueFifa: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1a1a1a',
    },
    // Legacy styles (kept for backward compatibility)
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: 8,
    },
    statsColumn: {
        flex: 1,
    },
    statItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    statLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: 'rgba(26, 26, 26, 0.6)',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1a1a1a',
    },
    gridVerticalSeparator: {
        width: 1,
        height: '100%',
        backgroundColor: 'rgba(26, 26, 26, 0.15)',
        marginHorizontal: 16,
    },
    shortSeparator: {
        width: 80,
        height: 1,
        backgroundColor: 'rgba(26, 26, 26, 0.2)',
        alignSelf: 'center',
        marginVertical: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
    },
    rarityBadge: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderWidth: 0.8,
        borderColor: 'rgba(255, 255, 255, 0.18)',
    },
    rarityText: {
        fontSize: 12,
        fontWeight: '900',
        color: '#1a1a1a',
        letterSpacing: 2,
    },
});

export default CollectibleWorkoutCard;
