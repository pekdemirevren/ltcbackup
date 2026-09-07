import React, { useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { ThemeContext } from '../contexts/ThemeContext';
import { RootStackParamList } from '../navigation/RootNavigator';
import {
    WorkoutDayType,
    WORKOUT_DAY_COLORS,
    WORKOUT_DAY_MUSCLE_GROUPS,
} from '../utils/WorkoutDayManager';
import {
    getDailyPlanDetails,
    formatDateString,
    DailyPlanDetails,
} from '../utils/WeeklyPlanManager';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TodayWorkoutWidgetProps {
    onRefresh?: () => void;
}

export default function TodayWorkoutWidget({ onRefresh }: TodayWorkoutWidgetProps) {
    const themeContext = useContext(ThemeContext);
    const colors = themeContext?.colors || { background: '#000', text: '#fff' };
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

    const [todayDetails, setTodayDetails] = useState<DailyPlanDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const today = new Date();
    const todayStr = formatDateString(today);

    useEffect(() => {
        loadTodayWorkout();
    }, []);

    const loadTodayWorkout = async () => {
        setIsLoading(true);
        try {
            const todayStr = formatDateString(today);
            const eventsStored = await AsyncStorage.getItem('@workout_calendar_events');

            if (eventsStored) {
                const events = JSON.parse(eventsStored);
                const todaysEvent = events.find((e: any) => {
                    const eventDate = e.date.split('T')[0];
                    return eventDate === todayStr && e.workoutDay;
                });

                if (todaysEvent) {
                    setTodayDetails({
                        workoutDay: todaysEvent.workoutDay,
                        startTime: todaysEvent.startTime,
                        endTime: todaysEvent.endTime,
                    });
                } else {
                    setTodayDetails(null);
                }
            } else {
                setTodayDetails(null);
            }
        } catch (error) {
            console.error('Error loading today workout:', error);
            setTodayDetails(null);
        }
        setIsLoading(false);
    };

    const handlePress = () => {
        if (todayDetails) {
            // Navigate to WorkoutEventDetail instead of DailyWorkoutDetail
            navigation.navigate('WorkoutEventDetail', {
                date: todayStr,
                eventId: `today_${todayStr}`,
            });
        } else {
            navigation.navigate('CreateWorkoutEventScreen', {
                date: todayStr,
            });
        }
    };

    const handleLongPress = () => {
        navigation.navigate('CreateWorkoutEventScreen', {
            date: todayStr,
            workoutDay: todayDetails?.workoutDay || undefined,
            editMode: !!todayDetails,
        });
    };

    const formatTodayDate = () => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${days[today.getDay()]}, ${months[today.getMonth()]} ${today.getDate()}`;
    };

    const formatTimeRange = () => {
        if (!todayDetails?.startTime) return null;
        if (todayDetails.endTime) {
            return `${todayDetails.startTime} - ${todayDetails.endTime}`;
        }
        return todayDetails.startTime;
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <View style={styles.loadingCard}>
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </View>
        );
    }

    // Rest Day View
    if (!todayDetails) {
        return (
            <TouchableOpacity
                style={styles.container}
                onPress={handlePress}
                onLongPress={handleLongPress}
                delayLongPress={500}
                activeOpacity={0.8}
            >
                <View style={styles.restDayCard}>
                    <View style={styles.restDayContent}>
                        <View style={styles.restDayIcon}>
                            <MaterialCommunityIcons name="sleep" size={32} color="#999" />
                        </View>
                        <View style={styles.restDayInfo}>
                            <Text style={styles.restDayTitle}>Rest Day 😌</Text>
                            <Text style={styles.dateText}>{formatTodayDate()}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={handlePress}
                        >
                            <Feather name="plus-circle" size={28} color="#9DEC2C" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.hintText}>Tap to add a workout</Text>
                </View>
            </TouchableOpacity>
        );
    }

    // Workout Day View
    const workoutColor = WORKOUT_DAY_COLORS[todayDetails.workoutDay] || '#4A90D9';
    const muscles = WORKOUT_DAY_MUSCLE_GROUPS[todayDetails.workoutDay] || [];
    const timeRange = formatTimeRange();

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={handlePress}
            onLongPress={handleLongPress}
            delayLongPress={500}
            activeOpacity={0.9}
        >
            <LinearGradient
                colors={[workoutColor, `${workoutColor}99`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.workoutCard}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.todayLabel}>TODAY</Text>
                    <Text style={styles.dateText}>{formatTodayDate()}</Text>
                </View>

                <View style={styles.workoutInfo}>
                    <Text style={styles.workoutName}>{todayDetails.workoutDay}</Text>
                    <Text style={styles.muscleGroups}>{muscles.join(', ')}</Text>
                    {timeRange && (
                        <View style={styles.timeRow}>
                            <Feather name="clock" size={14} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.timeText}>{timeRange}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.actionHint}>
                        <Feather name="arrow-right" size={16} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.actionHintText}>Tap for details</Text>
                    </View>
                    <View style={styles.editHint}>
                        <Feather name="edit-2" size={16} color="rgba(255,255,255,0.5)" />
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginVertical: 8,
    },
    loadingCard: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
    },
    loadingText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
    },
    restDayCard: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 20,
        padding: 20,
    },
    restDayContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    restDayIcon: {
        width: 56,
        height: 56,
        borderRadius: 14,
        backgroundColor: 'rgba(150,150,150,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    restDayInfo: {
        flex: 1,
        marginLeft: 16,
    },
    restDayTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    dateText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 4,
    },
    addButton: {
        padding: 8,
    },
    hintText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
        textAlign: 'center',
        marginTop: 12,
    },
    workoutCard: {
        borderRadius: 20,
        padding: 20,
        minHeight: 140,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    todayLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.8)',
        letterSpacing: 2,
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    workoutInfo: {
        marginTop: 16,
        flex: 1,
    },
    workoutName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
    },
    muscleGroups: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 6,
    },
    timeText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
    },
    actionHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    actionHintText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
    },
    editHint: {
        opacity: 0.5,
    },
});
