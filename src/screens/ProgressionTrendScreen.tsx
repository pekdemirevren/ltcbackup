import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { BackButtonStyles } from '../styles/BackButtonStyle';
import { calculate1RM, calculateStrengthRatio, DEFAULT_BODY_WEIGHT_KG, getRPELabel } from '../utils/StrengthCalculator';
import { getTotalVolume, get1RM } from '../utils/SessionSnapshotReader';

const COLORS = { background: '#000000', textWhite: '#FFFFFF', textGray: '#8E8E93', separator: '#2C2C2E' };
const METRIC_COLOR = '#FF9F0A'; // Orange for Progression

export default function ProgressionTrendScreen({ navigation }: { navigation: any }) {
    const [monthlyProgress, setMonthlyProgress] = useState<{ month: string, volume: number, oneRM: number }[]>([]);
    const [weeklyComparison, setWeeklyComparison] = useState({ thisWeek: 0, lastWeek: 0, change: 0 });
    const [progressMetrics, setProgressMetrics] = useState({
        volumeChange: 0,
        oneRMChange: 0,
        repsChange: 0,
        workoutsChange: 0,
    });
    const [trendDirection, setTrendDirection] = useState<'up' | 'down'>('up');

    useFocusEffect(useCallback(() => { loadData(); }, []));

    const loadData = async () => {
        try {
            const stored = await AsyncStorage.getItem('workoutSummaries');
            if (!stored) return;
            const allSummaries = JSON.parse(stored);
            const now = new Date();

            // Last 30 days vs previous 30 days comparison
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(now.getDate() - 30);
            const sixtyDaysAgo = new Date();
            sixtyDaysAgo.setDate(now.getDate() - 60);

            const recentSummaries = allSummaries.filter((s: any) => {
                const d = new Date(s.date);
                return d >= thirtyDaysAgo && d <= now;
            });

            const previousSummaries = allSummaries.filter((s: any) => {
                const d = new Date(s.date);
                return d >= sixtyDaysAgo && d < thirtyDaysAgo;
            });

            // Calculate metrics
            const calcMetrics = (summaries: any[]) => {
                let totalVolume = 0;
                let maxOneRM = 0;
                let totalReps = 0;
                const workoutDays = new Set<string>();

                summaries.forEach((s: any) => {
                    const volumeResult = getTotalVolume(s);
                    totalVolume += volumeResult.value ?? 0;
                    const sets = s.completedSets || 0;
                    const reps = s.completedReps || 0;
                    totalReps += reps;
                    const oneRM = get1RM(s).value ?? 0;
                    if (oneRM > maxOneRM) maxOneRM = oneRM;
                    workoutDays.add(new Date(s.date).toDateString());
                });

                return { totalVolume, maxOneRM, totalReps, workoutCount: workoutDays.size };
            };

            const recent = calcMetrics(recentSummaries);
            const previous = calcMetrics(previousSummaries);

            // Calculate changes
            const volumeChange = previous.totalVolume > 0
                ? ((recent.totalVolume - previous.totalVolume) / previous.totalVolume) * 100
                : 0;
            const oneRMChange = previous.maxOneRM > 0
                ? ((recent.maxOneRM - previous.maxOneRM) / previous.maxOneRM) * 100
                : 0;
            const repsChange = previous.totalReps > 0
                ? ((recent.totalReps - previous.totalReps) / previous.totalReps) * 100
                : 0;
            const workoutsChange = recent.workoutCount - previous.workoutCount;

            setProgressMetrics({
                volumeChange: Math.round(volumeChange),
                oneRMChange: Math.round(oneRMChange),
                repsChange: Math.round(repsChange),
                workoutsChange,
            });

            setTrendDirection(volumeChange >= 0 ? 'up' : 'down');

            // Weekly comparison (this week vs last week)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 7);
            const fourteenDaysAgo = new Date();
            fourteenDaysAgo.setDate(now.getDate() - 14);

            const thisWeekVolume = allSummaries.filter((s: any) => {
                const d = new Date(s.date);
                return d >= sevenDaysAgo && d <= now;
            }).reduce((acc: number, s: any) => {
                return acc + (getTotalVolume(s).value ?? 0);
            }, 0);

            const lastWeekVolume = allSummaries.filter((s: any) => {
                const d = new Date(s.date);
                return d >= fourteenDaysAgo && d < sevenDaysAgo;
            }).reduce((acc: number, s: any) => {
                return acc + (getTotalVolume(s).value ?? 0);
            }, 0);

            setWeeklyComparison({
                thisWeek: Math.round(thisWeekVolume / 1000),
                lastWeek: Math.round(lastWeekVolume / 1000),
                change: lastWeekVolume > 0 ? Math.round(((thisWeekVolume - lastWeekVolume) / lastWeekVolume) * 100) : 0,
            });

            // Monthly progression
            const monthlyData: { [key: string]: { volume: number, oneRM: number } } = {};
            allSummaries.forEach((s: any) => {
                const d = new Date(s.date);
                if (d.getFullYear() === now.getFullYear()) {
                    const monthKey = d.toLocaleString('en', { month: 'short' });
                    if (!monthlyData[monthKey]) monthlyData[monthKey] = { volume: 0, oneRM: 0 };
                    monthlyData[monthKey].volume += getTotalVolume(s).value ?? 0;
                    const oneRM = get1RM(s).value ?? 0;
                    if (oneRM > monthlyData[monthKey].oneRM) monthlyData[monthKey].oneRM = Math.round(oneRM);
                }
            });

            setMonthlyProgress(Object.entries(monthlyData).map(([month, data]) => ({
                month,
                volume: Math.round(data.volume / 1000),
                oneRM: data.oneRM,
            })));

        } catch (e) { console.error(e); }
    };

    const formatChange = (value: number, suffix: string = '%') => {
        const prefix = value > 0 ? '+' : '';
        return `${prefix}${value}${suffix}`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <TouchableOpacity style={[BackButtonStyles.topBackButton, BackButtonStyles.backButton, { backgroundColor: '#2C2C2E' }]} onPress={() => navigation.goBack()}>
                <Feather name="chevron-left" size={28} color={COLORS.textWhite} />
            </TouchableOpacity>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.mainTitle}>Progression</Text>

                {/* Main Summary */}
                <View style={styles.summaryCard}>
                    <View style={styles.arrowCircle}>
                        <MaterialCommunityIcons name={trendDirection === 'up' ? 'trending-up' : 'trending-down'} size={32} color={METRIC_COLOR} />
                    </View>
                    <View style={styles.summaryText}>
                        <Text style={[styles.summaryValue, { color: METRIC_COLOR }]}>
                            {formatChange(progressMetrics.volumeChange)}
                        </Text>
                        <Text style={styles.summarySubtitle}>Volume vs Last Month</Text>
                        <Text style={styles.summaryDescription}>
                            {trendDirection === 'up'
                                ? "You're making great progress! Keep it up."
                                : "Keep pushing! Every workout counts."}
                        </Text>
                    </View>
                </View>

                <View style={styles.separator} />

                {/* Weekly Comparison */}
                <Text style={styles.sectionTitle}>This Week vs Last Week</Text>
                <View style={styles.comparisonCard}>
                    <View style={styles.comparisonItem}>
                        <Text style={styles.comparisonLabel}>This Week</Text>
                        <Text style={[styles.comparisonValue, { color: METRIC_COLOR }]}>{weeklyComparison.thisWeek} T</Text>
                    </View>
                    <View style={styles.comparisonDivider} />
                    <View style={styles.comparisonItem}>
                        <Text style={styles.comparisonLabel}>Last Week</Text>
                        <Text style={styles.comparisonValue}>{weeklyComparison.lastWeek} T</Text>
                    </View>
                    <View style={styles.comparisonDivider} />
                    <View style={styles.comparisonItem}>
                        <Text style={styles.comparisonLabel}>Change</Text>
                        <Text style={[styles.comparisonValue, { color: weeklyComparison.change >= 0 ? '#9DEC2C' : '#FF3B30' }]}>
                            {formatChange(weeklyComparison.change)}
                        </Text>
                    </View>
                </View>

                <View style={styles.separator} />

                {/* Progress Metrics */}
                <Text style={styles.sectionTitle}>30-Day Progress</Text>
                <View style={styles.metricsGrid}>
                    <View style={styles.metricCard}>
                        <MaterialCommunityIcons name="weight-lifter" size={24} color="#F9104E" />
                        <Text style={styles.metricLabel}>Volume</Text>
                        <Text style={[styles.metricValue, { color: progressMetrics.volumeChange >= 0 ? '#9DEC2C' : '#FF3B30' }]}>
                            {formatChange(progressMetrics.volumeChange)}
                        </Text>
                    </View>
                    <View style={styles.metricCard}>
                        <MaterialCommunityIcons name="arm-flex" size={24} color="#00C7BE" />
                        <Text style={styles.metricLabel}>1RM</Text>
                        <Text style={[styles.metricValue, { color: progressMetrics.oneRMChange >= 0 ? '#9DEC2C' : '#FF3B30' }]}>
                            {formatChange(progressMetrics.oneRMChange)}
                        </Text>
                    </View>
                    <View style={styles.metricCard}>
                        <MaterialCommunityIcons name="repeat" size={24} color="#FF9F0A" />
                        <Text style={styles.metricLabel}>Reps</Text>
                        <Text style={[styles.metricValue, { color: progressMetrics.repsChange >= 0 ? '#9DEC2C' : '#FF3B30' }]}>
                            {formatChange(progressMetrics.repsChange)}
                        </Text>
                    </View>
                    <View style={styles.metricCard}>
                        <MaterialCommunityIcons name="calendar-check" size={24} color="#9DEC2C" />
                        <Text style={styles.metricLabel}>Workouts</Text>
                        <Text style={[styles.metricValue, { color: progressMetrics.workoutsChange >= 0 ? '#9DEC2C' : '#FF3B30' }]}>
                            {formatChange(progressMetrics.workoutsChange, '')}
                        </Text>
                    </View>
                </View>

                <View style={styles.separator} />

                {/* Description */}
                <View style={styles.descriptionSection}>
                    <Text style={styles.descriptionText}>
                        <Text style={{ fontWeight: '700' }}>Progressive Overload</Text> is the key to building strength.
                        Track your improvements over time and ensure you're consistently
                        lifting more weight, doing more reps, or training more frequently.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { paddingBottom: 40, paddingTop: 60, paddingHorizontal: 16 },
    mainTitle: { color: COLORS.textWhite, fontSize: 34, fontWeight: 'bold', marginBottom: 20 },
    sectionTitle: { color: COLORS.textWhite, fontSize: 17, fontWeight: '600', marginBottom: 12 },
    summaryCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
    arrowCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center' },
    summaryText: { flex: 1 },
    summaryValue: { fontSize: 32, fontWeight: 'bold', marginBottom: 2 },
    summarySubtitle: { color: '#00C7BE', fontSize: 16, fontWeight: '600', marginBottom: 4 },
    summaryDescription: { color: COLORS.textGray, fontSize: 14, lineHeight: 20 },
    separator: { height: 0.5, backgroundColor: COLORS.separator, marginVertical: 16 },
    comparisonCard: { flexDirection: 'row', backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16 },
    comparisonItem: { flex: 1, alignItems: 'center' },
    comparisonDivider: { width: 1, backgroundColor: COLORS.separator },
    comparisonLabel: { color: COLORS.textGray, fontSize: 13, marginBottom: 4 },
    comparisonValue: { color: COLORS.textWhite, fontSize: 22, fontWeight: '700' },
    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    metricCard: { width: '48%', backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, marginBottom: 12, alignItems: 'center' },
    metricLabel: { color: COLORS.textGray, fontSize: 13, marginTop: 8, marginBottom: 4 },
    metricValue: { fontSize: 24, fontWeight: '700' },
    descriptionSection: { marginTop: 8 },
    descriptionText: { color: COLORS.textGray, fontSize: 15, lineHeight: 22 },
});
