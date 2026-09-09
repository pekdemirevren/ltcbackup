import React, { useState, useContext, useEffect, useRef, useCallback } from "react";
import {
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Image,
    StyleSheet,
    Modal,
    Animated,
    Dimensions,
    Alert,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { BlurView } from '@react-native-community/blur';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Theme from '../constants/theme';
import { SettingsScreenStyles as styles } from '../styles/SettingsScreenStyles';
import { ThemeContext } from "../contexts/ThemeContext";
import SpeedIcon from '../assets/icons/speed';
import { WeightIcon } from '../assets/icons';
import PlusIcon from '../assets/icons/PlusIcon';
import { TimerContext } from "../contexts/TimerContext";
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { loadWorkoutSettings, saveWorkoutSettings, WorkoutSettings } from '../utils/WorkoutSettingsManager';
import { getWorkoutById } from '../constants/WorkoutConstants';

type GenericWorkoutSettingsScreenProps = StackScreenProps<RootStackParamList, 'GenericWorkoutSettingsScreen'>;

const BlockRightActions = ({
    progress,
    dragX,
    blockId,
    onDeepSwipeStatus,
    onDeletePress,
}: {
    progress: any;
    dragX: any;
    blockId: string;
    onDeepSwipeStatus: (isDeep: boolean) => void;
    onDeletePress: (id: string) => void;
}) => {
    const BUTTON_SIZE = 56;

    useEffect(() => {
        const listenerId = progress.addListener(({ value }: { value: number }) => {
            // 1.0 = 80px. 2.5 = 200px.
            if (value > 2.5) {
                onDeepSwipeStatus(true);
            } else if (value < 0.5) {
                onDeepSwipeStatus(false);
            }
        });
        return () => {
            progress.removeListener(listenerId);
        };
    }, [progress, onDeepSwipeStatus]);

    const leftCapTranslateX = dragX.interpolate({
        inputRange: [-400, -80, 0],
        outputRange: [-320, 0, 0],
        extrapolate: 'clamp',
    });

    const circleScale = dragX.interpolate({
        inputRange: [-80, 0],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    const bodyScaleX = dragX.interpolate({
        inputRange: [-400, -80],
        outputRange: [320, 0],
        extrapolate: 'clamp',
    });

    const bodyTranslateX = dragX.interpolate({
        inputRange: [-400, -80],
        outputRange: [-160, 0],
        extrapolate: 'clamp',
    });

    const rightCapOpacity = dragX.interpolate({
        inputRange: [-85, -80],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    const iconScale = dragX.interpolate({
        inputRange: [-150, -80, 0],
        outputRange: [1.2, 1, 0.5],
        extrapolate: 'clamp',
    });

    const iconTranslateX = dragX.interpolate({
        inputRange: [-400, -80, 0],
        outputRange: [130, 0, 0],
        extrapolate: 'clamp',
    });

    return (
        <View
            style={{
                width: 80,
                justifyContent: 'center',
                alignItems: 'flex-end',
            }}
        >
            <View style={{
                width: BUTTON_SIZE,
                height: BUTTON_SIZE,
                marginRight: 12,
                justifyContent: 'center',
                alignItems: 'center',
            }}>

                {/* Right Cap (Stationary Base) */}
                <Animated.View
                    style={{
                        position: 'absolute',
                        width: BUTTON_SIZE,
                        height: BUTTON_SIZE,
                        borderRadius: BUTTON_SIZE / 2,
                        backgroundColor: '#FF3B30',
                        opacity: rightCapOpacity,
                    }}
                />

                {/* Body (The Filler) */}
                <Animated.View
                    style={{
                        position: 'absolute',
                        height: BUTTON_SIZE,
                        width: 1,
                        backgroundColor: '#FF3B30',
                        transform: [
                            { translateX: bodyTranslateX },
                            { scaleX: bodyScaleX }
                        ],
                        zIndex: 1,
                    }}
                />

                {/* Left Cap (The Moving Head with Icon) */}
                <Animated.View
                    style={{
                        width: BUTTON_SIZE,
                        height: BUTTON_SIZE,
                        borderRadius: BUTTON_SIZE / 2,
                        backgroundColor: '#FF3B30',
                        justifyContent: 'center',
                        alignItems: 'center',
                        transform: [
                            { translateX: leftCapTranslateX },
                            { scale: circleScale }
                        ],
                        zIndex: 2,
                    }}
                >
                    <TouchableOpacity
                        onPress={() => onDeletePress(blockId)}
                        activeOpacity={0.7}
                        style={{
                            width: BUTTON_SIZE,
                            height: BUTTON_SIZE,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Animated.View style={{ transform: [{ scale: iconScale }, { translateX: iconTranslateX }] }}>
                            <MaterialCommunityIcons name="trash-can-outline" size={26} color="white" />
                        </Animated.View>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </View>
    );
};

const SwipeableBlock = ({
    block,
    colors,
    timerContext,
    workoutId,
    workoutName,
    navigation,
    onDelete
}: {
    block: any,
    colors: any,
    timerContext: any,
    workoutId: string,
    workoutName: string,
    navigation: any,
    onDelete: (id: string) => void
}) => {
    const deepSwipeTriggered = useRef(false);
    const swipeableRef = useRef<Swipeable>(null);

    let cardColor = colors.quickStart.card;
    let primaryColor = colors.quickStart.primary;
    let Icon: any = Theme.Icons.infinity.lib;
    let iconName: string | undefined;
    let title = 'Custom';
    let valueText = '';

    switch (block.type) {
        case 'loop':
            cardColor = colors.quickStart.card;
            primaryColor = colors.quickStart.primary;
            Icon = Theme.Icons.infinity.lib;
            title = 'Loop';
            valueText = `${block.settings.infiniteLoopTime || '30'}sec`;
            break;
        case 'time':
            cardColor = colors.time.card;
            primaryColor = colors.time.primary;
            Icon = Theme.Icons.time.lib;
            title = 'Time';
            valueText = `${block.settings.greenTime || '30'}s / ${block.settings.restTime || '15'}s`;
            break;
        case 'speed':
            cardColor = colors.speed.card;
            primaryColor = colors.speed.primary;
            Icon = SpeedIcon;
            title = 'Speed';
            valueText = `${(block.settings.greenCountdownSpeed || 1000) / 1000}s / ${(block.settings.redCountdownSpeed || 1000) / 1000}s`;
            break;
        case 'lap':
            cardColor = colors.lap.card;
            primaryColor = colors.lap.primary;
            Icon = Theme.Icons.lap.lib;
            title = 'Sets';
            valueText = `${block.settings.greenReps || '3'} Sets / ${block.settings.redReps || '3'} Reps`;
            break;
        case 'weight':
            cardColor = colors.weight.card;
            primaryColor = colors.weight.primary;
            Icon = WeightIcon;
            iconName = undefined;
            title = 'Weight';
            valueText = `${block.settings.weight || '75'}kg`;
            break;
        default:
            break;
    }

    const CardContent = () => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: cardColor }]}
            activeOpacity={0.8}
            onPress={() => {
                switch (block.type) {
                    case 'loop':
                        navigation.navigate('LoopSelection', { workoutId, workoutName, blockId: block.id, settings: block.settings });
                        break;
                    case 'time':
                        navigation.navigate('TimeSelectionScreen', { workoutId, blockId: block.id, settings: block.settings });
                        break;
                    case 'speed':
                        navigation.navigate('SpeedSelectionScreen', { workoutId, blockId: block.id, settings: block.settings });
                        break;
                    case 'lap':
                        navigation.navigate('LapSelectionScreen', { workoutId, blockId: block.id, settings: block.settings });
                        break;
                    case 'weight':
                        navigation.navigate('WeightSelectionScreen', { workoutId, blockId: block.id, settings: block.settings });
                        break;
                }
            }}
        >
            <View style={styles.iconContainer}>
                <Icon width={32} height={32} color={primaryColor} />
            </View>

            <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={[styles.cardSubtitle, { color: primaryColor }]}>
                    {valueText}
                </Text>
            </View>

            <TouchableOpacity
                onPress={() => {
                    if (block.type === 'loop') {
                        timerContext.startInfiniteLoopWithSpeed(
                            {
                                time: block.settings.infiniteLoopTime || '30',
                                speed: (block.settings.infiniteSpeed || 1000) / 1000,
                            },
                            { workoutId, workoutName },
                        );
                    } else {
                        if (block.type === 'time') {
                            timerContext.setGreenTime(block.settings.greenTime);
                            timerContext.setRedTime(block.settings.restTime);
                        } else if (block.type === 'speed') {
                            timerContext.setGreenCountdownSpeed(
                                block.settings.greenCountdownSpeed,
                            );
                            timerContext.setRedCountdownSpeed(
                                block.settings.redCountdownSpeed,
                            );
                        } else if (block.type === 'lap') {
                            timerContext.setGreenReps(block.settings.greenReps);
                            timerContext.setRedReps(block.settings.redReps);
                        } else if (block.type === 'weight') {
                            timerContext.setWeight(block.settings.weight);
                        }
                        timerContext.startTimerWithCurrentSettings(true);
                    }
                }}
                activeOpacity={0.7}
            >
                <View style={[styles.playIconContainer, { backgroundColor: primaryColor }]}>
                    <Theme.Icons.play.lib width={33} height={33} color={colors.playIconText} />
                </View>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <Swipeable
            ref={swipeableRef}
            key={block.id}
            renderRightActions={(progress, dragX) => (
                <BlockRightActions
                    progress={progress}
                    dragX={dragX}
                    blockId={block.id}
                    onDeepSwipeStatus={(isDeep) => {
                        deepSwipeTriggered.current = isDeep;
                    }}
                    onDeletePress={onDelete}
                />
            )}
            rightThreshold={40}
            overshootRight={true}
            friction={1.25}
            useNativeAnimations={false}
            onSwipeableOpen={() => {
                if (deepSwipeTriggered.current) {
                    onDelete(block.id);
                    deepSwipeTriggered.current = false;
                    swipeableRef.current?.close();
                }
            }}
        >
            <CardContent />
        </Swipeable>
    );
};

export function GenericWorkoutSettingsScreen({ route, navigation }: GenericWorkoutSettingsScreenProps) {
    const { workoutId, workoutName } = route.params;
    const workout = getWorkoutById(workoutId);
    const { colors } = useContext(ThemeContext)!;
    const timerContext = useContext(TimerContext)!;

    // State for all settings
    const [currentSettings, setCurrentSettings] = useState<WorkoutSettings | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const isDeleteAlertOpen = useRef(false);
    const deepSwipeTriggered = useRef(false);

    const timeSwipeableRef = useRef<Swipeable>(null);
    const speedSwipeableRef = useRef<Swipeable>(null);
    const lapSwipeableRef = useRef<Swipeable>(null);
    const weightSwipeableRef = useRef<Swipeable>(null);

    // Load settings on mount and when returning to screen
    useEffect(() => {
        loadSettings();
        const unsubscribe = navigation.addListener('focus', () => {
            loadSettings();
        });
        return unsubscribe;
    }, [workoutId, navigation]);

    const loadSettings = async () => {
        const settings = await loadWorkoutSettings(workoutId);
        const { initialSettings } = route.params as any;

        if (initialSettings) {
            setCurrentSettings({
                ...settings,
                targetSets: initialSettings.targetSets || settings.targetSets,
                targetReps: initialSettings.targetReps || settings.targetReps,
                weight: initialSettings.weight || settings.weight,
            });
        } else {
            setCurrentSettings(settings);
        }
    };

    const handleStartWorkout = async (isCustom: boolean = true) => {
        if (!currentSettings) return;
        const { collectibleCardId, collectibleBaseLevel } = route.params || {};

        await saveWorkoutSettings(currentSettings);

        timerContext.startTimerWithWorkoutSettings(
            workoutId,
            workoutName,
            collectibleCardId,
            collectibleBaseLevel,
            {
                targetSets: currentSettings.targetSets,
                targetReps: currentSettings.targetReps,
                weight: currentSettings.weight,
            },
        );
    };

    const handleBack = () => {
        navigation.goBack();
    };

    if (!currentSettings) return null;

    const summaryItems = [
        { label: 'Loop', value: `${currentSettings.infiniteLoopTime || '30'} sec` },
        { label: 'Time', value: `${currentSettings.greenTime || '30'} / ${currentSettings.restTime || '15'} s` },
        { label: 'Reps', value: `${currentSettings.targetSets || '3'} x ${currentSettings.targetReps || '6'}` },
        { label: 'Weight', value: `${currentSettings.weight || '75'} kg` },
    ];

    const localStyles = StyleSheet.create({
        cardGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            marginTop: 12,
        },
        card: {
            width: '48%',
            borderRadius: 18,
            padding: 16,
            marginBottom: 12,
        },
        cardTitle: {
            fontSize: 12,
            color: '#A7A7A7',
            marginBottom: 10,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
        },
        cardValue: {
            fontSize: 18,
            fontWeight: '700',
        },
        startButton: {
            marginTop: 8,
            backgroundColor: '#9DEC2C',
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
        },
        startButtonText: {
            color: '#000',
            fontSize: 15,
            fontWeight: '700',
        },
    });

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}> 
            <StatusBar barStyle="light-content" backgroundColor="transparent" />

            <View style={styles.topBackButton}>
                <TouchableOpacity onPress={handleBack} style={[styles.backButton, { backgroundColor: colors.backButtonBackground }]}> 
                    <Theme.Icons.back.lib width={36} height={36} color={colors.text} />
                </TouchableOpacity>
            </View>

            <View style={styles.header}>
                <Text style={styles.headerTitle}>{workoutName}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={localStyles.cardGrid}>
                    {summaryItems.map((item) => (
                        <View key={item.label} style={[localStyles.card, { backgroundColor: colors.quickStart.card }]}> 
                            <Text style={[localStyles.cardTitle, { color: '#e5e5e5' }]}>{item.label}</Text>
                            <Text style={[localStyles.cardValue, { color: colors.quickStart.primary }]}>{item.value}</Text>
                        </View>
                    ))}
                </View>

                <TouchableOpacity
                    style={localStyles.startButton}
                    onPress={() => handleStartWorkout()}
                    activeOpacity={0.9}
                >
                    <Text style={localStyles.startButtonText}>Start workout</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}
