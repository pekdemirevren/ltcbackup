import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, LayoutAnimation, Platform, UIManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../contexts/ThemeContext';
import Theme from '../constants/theme';
import Feather from 'react-native-vector-icons/Feather';
import { allWorkouts } from '../constants/workoutData';
import LinearGradient from 'react-native-linear-gradient';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { calculateCalories } from '../utils/CalorieCalculator';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface WorkoutSummary {
    date: string;
    workoutId: string;
    workoutName: string;
    elapsedTime: number;
    completedSets: number;
    completedReps: number;
    avgGreenLoopTime: number;
    avgRedLoopTime: number;
    greenLoopTimes?: number[];
    redLoopTimes?: number[];
    settings?: {
        greenReps: string;
        redReps: string;
        greenTime: string;
        restTime: string;
        weight?: string;
    };
}

const SummaryCard = ({ item, workoutIcon: WorkoutIcon }: { item: WorkoutSummary, workoutIcon: any }) => {
    const [detailsOpen, setDetailsOpen] = useState(true);
    const [segmentsOpen, setSegmentsOpen] = useState(false);

    const toggleDetails = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setDetailsOpen(!detailsOpen);
    };

    const toggleSegments = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSegmentsOpen(!segmentsOpen);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const formatTimeRange = (dateString: string, elapsedSeconds: number) => {
        const endDate = new Date(dateString);
        const startDate = new Date(endDate.getTime() - elapsedSeconds * 1000);
        
        const format = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        return `${format(startDate)}–${format(endDate)}`;
    };

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Calculations
    const activeTime = item.greenLoopTimes ? item.greenLoopTimes.reduce((a, b) => a + b, 0) : 0;
    const totalSets = item.completedSets || 0;
    const totalReps = item.completedReps || 0;
    const targetSets = item.settings?.greenReps ? parseInt(item.settings.greenReps) : 0;
    const targetReps = item.settings?.redReps ? parseInt(item.settings.redReps) : 0;
    const avgWorkoutTime = totalSets > 0 ? item.elapsedTime / totalSets : 0;
    const progress = targetSets > 0 ? Math.min((totalSets / targetSets) * 100, 100) : 100;

    // Calorie Calculation
    const weightVal = item.settings?.weight ? parseFloat(item.settings.weight) : 0;
    const calories = calculateCalories(item.workoutId, item.elapsedTime, weightVal, totalReps);

    return (
        <View style={styles.summaryContainer}>
            {/* Main Header Info */}
            <View style={styles.mainInfoContainer}>
                <View style={styles.iconRow}>
                    <View style={styles.progressCircleContainer}>
                        <AnimatedCircularProgress
                            size={85}
                            width={8}
                            fill={progress}
                            tintColor="#9DEC2C"
                            backgroundColor="#122003"
                            rotation={0}
                            lineCap="round"
                        >
                            {() => (
                                <LinearGradient
                                    colors={['#122003', '#213705']}
                                    style={{ width: 69, height: 69, borderRadius: 34.5, justifyContent: 'center', alignItems: 'center' }}
                                >
                                    {WorkoutIcon ? <WorkoutIcon width={68} height={68} fill="#9DEC2C" /> : null}
                                </LinearGradient>
                            )}
                        </AnimatedCircularProgress>
                    </View>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.workoutName}>{item.workoutName}</Text>
                        <Text style={styles.goalText}>Goal: {targetSets}x{targetReps}</Text>
                        <Text style={styles.timeRangeText}>{formatTimeRange(item.date, item.elapsedTime)}</Text>
                    </View>
                </View>
            </View>
            
            {/* Workout Details Card */}
            <TouchableOpacity onPress={toggleDetails} activeOpacity={0.7} style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Workout Details</Text>
                <Feather name={detailsOpen ? "chevron-down" : "chevron-right"} size={20} color="#8E8E93" />
            </TouchableOpacity>

            {detailsOpen && (
                <View style={styles.card}>
                    <View style={styles.statsGrid}>
                        {/* Row 1 */}
                        <View style={styles.statRow}>
                            <View style={[styles.statCol, { paddingLeft: 8 }]}>
                                <Text style={styles.statLabel}>Workout Time</Text>
                                <Text style={[styles.statValue, { color: '#FEE522' }]}>
                                    {formatDuration(activeTime > 0 ? activeTime : item.elapsedTime)}<Text style={styles.unitText}>MIN</Text>
                                </Text>
                            </View>
                            <View style={[styles.statCol, { paddingLeft: 32 }]}>
                                <Text style={styles.statLabel}>Avg. Workout</Text>
                                <Text style={[styles.statValue, { color: '#64D2FF' }]}>
                                    {formatDuration(avgWorkoutTime)}<Text style={styles.unitText}>MIN</Text>
                                </Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Row 2 */}
                        <View style={styles.statRow}>
                            <View style={[styles.statCol, { paddingLeft: 8 }]}>
                                <Text style={styles.statLabel}>Total Sets</Text>
                                <Text style={[styles.statValue, { color: '#F9104E' }]}>
                                    {totalSets}<Text style={styles.unitText}>{totalSets === 1 ? 'SET' : 'SETS'}</Text>
                                </Text>
                            </View>
                            <View style={[styles.statCol, { paddingLeft: 32 }]}>
                                <Text style={styles.statLabel}>Total Reps</Text>
                                <Text style={[styles.statValue, { color: '#F9104E' }]}>
                                    {totalReps}<Text style={styles.unitText}>{totalReps === 1 ? 'REP' : 'REPS'}</Text>
                                </Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Row 3 */}
                        <View style={styles.statRow}>
                            <View style={[styles.statCol, { paddingLeft: 8 }]}>
                                <Text style={styles.statLabel}>Weight</Text>
                                <Text style={[styles.statValue, { color: '#A358DF' }]}>
                                    {item.settings?.weight || '--'}<Text style={styles.unitText}>KG</Text>
                                </Text>
                            </View>
                            <View style={[styles.statCol, { paddingLeft: 32 }]}>
                                <Text style={styles.statLabel}>Elapsed Time</Text>
                                <Text style={[styles.statValue, { color: '#9DEC2C' }]}>
                                    {formatDuration(item.elapsedTime)}<Text style={styles.unitText}>MIN</Text>
                                </Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Row 4 */}
                        <View style={styles.statRow}>
                            <View style={[styles.statCol, { paddingLeft: 8 }]}>
                                <Text style={styles.statLabel}>Est. Calories</Text>
                                <Text style={[styles.statValue, { color: '#FF9500' }]}>
                                    {calories}<Text style={styles.unitText}>KCAL</Text>
                                </Text>
                            </View>
                            <View style={[styles.statCol, { paddingLeft: 32 }]} />
                        </View>
                    </View>
                </View>
            )}

            {/* Segments Card */}
            <TouchableOpacity onPress={toggleSegments} activeOpacity={0.7} style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Segments</Text>
                <Feather name={segmentsOpen ? "chevron-down" : "chevron-right"} size={20} color="#8E8E93" />
            </TouchableOpacity>
            
            {segmentsOpen && (
                <View style={styles.segmentsCard}>
                    <View style={styles.segmentHeader}>
                        <Text style={styles.segmentHeaderLabel}>Set</Text>
                        <Text style={styles.segmentHeaderLabel}>Workout</Text>
                        <Text style={styles.segmentHeaderLabel}>Rest</Text>
                    </View>
                    {item.greenLoopTimes && item.greenLoopTimes.map((time, i) => (
                        <View key={i} style={styles.segmentRow}>
                            <Text style={[styles.segmentIndex, { color: '#50B0E0' }]}>{i + 1}</Text>
                            <Text style={[styles.segmentValue, { color: '#FEE522' }]}>{time.toFixed(1)}s</Text>
                            <Text style={[styles.segmentValue, { color: '#FFF' }]}>
                                {item.redLoopTimes && item.redLoopTimes[i] ? item.redLoopTimes[i].toFixed(1) + 's' : '-'}
                            </Text>
                        </View>
                    ))}
                    {(!item.greenLoopTimes || item.greenLoopTimes.length === 0) && (
                        <Text style={styles.noSegmentsText}>No segment data available</Text>
                    )}
                </View>
            )}
        </View>
    );
};

export const WorkoutSummaryScreen = ({ route, navigation }: any) => {
    const { workoutId, workoutName } = route.params;
    const themeContext = useContext(ThemeContext);

    if (!themeContext) return null;
    const { colors } = themeContext;

    const [summaries, setSummaries] = useState<WorkoutSummary[]>([]);


    useEffect(() => {
        loadSummaries();
    }, [workoutId]);

    // Silme fonksiyonu
    const clearSummaries = async () => {
        try {
            const stored = await AsyncStorage.getItem('workoutSummaries');
            if (stored) {
                const allSummaries: WorkoutSummary[] = JSON.parse(stored);
                // Sadece bu workoutId'ye ait olanları sil
                const filtered = allSummaries.filter(s => s.workoutId !== workoutId);
                await AsyncStorage.setItem('workoutSummaries', JSON.stringify(filtered));
                setSummaries([]);
            }
        } catch (e) {
            console.error('Error clearing summaries:', e);
        }
    };

    const loadSummaries = async () => {
        try {
            const stored = await AsyncStorage.getItem('workoutSummaries');
            if (stored) {
                const allSummaries: WorkoutSummary[] = JSON.parse(stored);
                // Filter for this specific workout and sort by date descending
                const filtered = allSummaries
                    .filter(s => s.workoutId === workoutId)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setSummaries(filtered);
            }
        } catch (e) {
            console.error("Error loading summaries:", e);
        }
    };

    const workout = allWorkouts.find(w => w.workoutId === workoutId);
    const WorkoutIcon = workout?.SvgIcon;

    const latestSummary = summaries.length > 0 ? summaries[0] : null;

    const handleBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate('WorkoutMain');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    // Header içeriğini ListHeaderComponent'e taşı
    const listHeader = (
        <View style={styles.headerRow}>
            <TouchableOpacity style={styles.headerIconButton} onPress={clearSummaries} hitSlop={{top: 10, left: 10, bottom: 10, right: 10}}>
                <Feather name="trash-2" size={28} color="#FF3B30" />
            </TouchableOpacity>
            {latestSummary && (
                <Text style={styles.headerDateText}>{formatDate(latestSummary.date)}</Text>
            )}
            <TouchableOpacity style={styles.headerIconButton} onPress={() => { console.log('Check button pressed'); navigation.navigate('Main', { screen: 'Workout', params: { screen: 'WorkoutMain' } }); }}>
                <View style={styles.checkCircle}>
                    <Feather name="check" size={28} color="#000" />
                </View>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: '#000' }]}> 
            <StatusBar barStyle="light-content" />
            <FlatList
                contentContainerStyle={styles.content}
                data={summaries}
                keyExtractor={(_, index) => index.toString()}
                ListHeaderComponent={listHeader}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: '#FFF' }]}>No summary data yet.</Text>
                        <Text style={[styles.emptySubText, { color: '#8E8E93' }]}>Complete a workout to see stats here.</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <SummaryCard item={item} workoutIcon={WorkoutIcon} />
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 10,
        paddingLeft: 10,
        paddingRight: 2,
        paddingBottom: 10,
    },
    headerIconButton: {
        padding: 8,
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 40,
        paddingBottom: 40,
    },
    summaryContainer: {
        marginBottom: 40,
    },
    topHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        position: 'relative',
    },
    dateHeader: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
    mainInfoContainer: {
        marginBottom: 20,
    },
    iconRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    progressCircleContainer: {
        width: 85,
        height: 85,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    headerTextContainer: {
        flex: 1,
        marginTop: 4,
    },
    workoutName: {
        color: '#D1D1D6',
        fontSize: 20,
        fontWeight: '500',
        marginBottom: 2,
    },
    goalText: {
        color: '#50B0E0', // Darker Cyan/Blue
        fontSize: 19,
        fontWeight: '500',
        marginBottom: 2,
    },
    timeRangeText: {
        color: '#8E8E93',
        fontSize: 19,
    },
    checkContainer: {
        position: 'absolute',
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#9DEC2C',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        marginTop: 8,
    },
    sectionTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '700',
        marginRight: 4,
    },
    card: {
        backgroundColor: '#1C1C1E',
        borderRadius: 24,
        padding: 12,
        marginBottom: 10,
    },
    statsGrid: {
        gap: 8,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statCol: {
        flex: 1,
    },
    statLabel: {
        color: '#FFF',
        fontSize: 18,
        marginBottom: 0,
    },
    statValue: {
        fontSize: 30,
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
    },
    unitText: {
        fontSize: 20,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: '#38383A',
        marginVertical: 2,
    },
    segmentsCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 24,
        padding: 16,
        marginBottom: 10,
    },
    segmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#38383A',
        paddingBottom: 8,
    },
    segmentHeaderLabel: {
        color: '#8E8E93',
        fontSize: 14,
        width: '30%',
        textAlign: 'center',
    },
    segmentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    segmentIndex: {
        color: '#FFF',
        fontSize: 16,
        width: '30%',
        textAlign: 'center',
    },
    segmentValue: {
        color: '#FFF',
        fontSize: 16,
        width: '30%',
        textAlign: 'center',
        fontVariant: ['tabular-nums'],
    },
    noSegmentsText: {
        color: '#8E8E93',
        textAlign: 'center',
        marginTop: 10,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        opacity: 0.7,
    },
    headerDateText: {
        fontSize: 18,
        color: '#ffffffff',
    }
});
