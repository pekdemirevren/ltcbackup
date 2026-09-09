import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { BackButtonStyles } from '../styles/BackButtonStyle';
import { calculate1RM, calculateStrengthRatio, DEFAULT_BODY_WEIGHT_KG, getStrengthLevelLabel } from '../utils/StrengthCalculator';
import { get1RM } from '../utils/SessionSnapshotReader';

const COLORS = { background: '#000000', textWhite: '#FFFFFF', textGray: '#8E8E93', separator: '#2C2C2E' };
const METRIC_COLOR = '#F9104E'; // Red for 1RM

export default function OneRMTrendScreen({ navigation }: { navigation: any }) {
    const [monthlyData, setMonthlyData] = useState<number[]>(new Array(12).fill(0));
    const [weeklyData, setWeeklyData] = useState<number[]>(new Array(7).fill(0));
    const [best1RM, setBest1RM] = useState(0);
    const [weeklyBest1RM, setWeeklyBest1RM] = useState(0);
    const [strengthRatio, setStrengthRatio] = useState(0);
    const [strengthLevel, setStrengthLevel] = useState('');
    const [prCount, setPrCount] = useState(0);
    const [trendDirection, setTrendDirection] = useState<'up' | 'down'>('up');

    useFocusEffect(useCallback(() => { loadData(); }, []));

    const loadData = async () => {
        try {
            const stored = await AsyncStorage.getItem('workoutSummaries');
            if (!stored) return;
            const allSummaries = JSON.parse(stored);
            const now = new Date();

            // Calculate 1RM from each session
            const getHistorical1RM = (s: any) => get1RM(s).value ?? 0;

            // Monthly best 1RM
            const monthly = new Array(12).fill(0);
            const yearFiltered = allSummaries.filter((s: any) => new Date(s.date).getFullYear() === now.getFullYear());

            yearFiltered.forEach((s: any) => {
                const d = new Date(s.date);
                const month = d.getMonth();
                const oneRM = getHistorical1RM(s);
                if (oneRM > monthly[month]) monthly[month] = Math.round(oneRM);
            });
            setMonthlyData(monthly);

            // Weekly best 1RM
            const weekly = new Array(7).fill(0);
            const isSameDay = (d1: Date, d2: Date) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
            for (let i = 0; i < 7; i++) {
                const d = new Date(); d.setDate(now.getDate() - (6 - i));
                const daySummaries = allSummaries.filter((s: any) => isSameDay(new Date(s.date), d));
                let dayBest = 0;
                daySummaries.forEach((s: any) => {
                    const oneRM = getHistorical1RM(s);
                    if (oneRM > dayBest) dayBest = oneRM;
                });
                weekly[i] = Math.round(dayBest);
            }
            setWeeklyData(weekly);
            setWeeklyBest1RM(Math.max(...weekly, 0));

            // All-time best 1RM
            let allTimeBest = 0;
            allSummaries.forEach((s: any) => {
                const oneRM = getHistorical1RM(s);
                if (oneRM > allTimeBest) allTimeBest = oneRM;
            });
            setBest1RM(Math.round(allTimeBest));

            // Calculate ratio and level
            const ratio = calculateStrengthRatio(allTimeBest, DEFAULT_BODY_WEIGHT_KG);
            setStrengthRatio(ratio);
            setStrengthLevel(getStrengthLevelLabel(ratio));

            // Trend direction (current month vs previous)
            const currentMonth = now.getMonth();
            const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            setTrendDirection(monthly[currentMonth] >= monthly[prevMonth] ? 'up' : 'down');

            // Count PRs (months where 1RM was higher than any previous month)
            let prCountTemp = 0;
            let maxSoFar = 0;
            for (let i = 0; i < 12; i++) {
                if (monthly[i] > maxSoFar) {
                    prCountTemp++;
                    maxSoFar = monthly[i];
                }
            }
            setPrCount(prCountTemp);

        } catch (e) { console.error(e); }
    };

    const monthLabels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    const weekDayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    const renderYearlyChart = () => {
        const maxVal = Math.max(...monthlyData, 1);
        const chartHeight = 140;
        const currentMonth = new Date().getMonth();
        return (
            <View style={styles.yearlyChartContainer}>
                <Text style={styles.chartRightLabel}>KILOGRAMS (1RM)</Text>
                <View style={styles.chartWithLine}>
                    <View style={[styles.gridLine, { bottom: chartHeight + 20 }]} />
                    <View style={[styles.gridLine, { bottom: chartHeight * 0.5 + 20 }]} />
                    <View style={[styles.gridLine, { bottom: 20 }]} />
                    <View style={[styles.currentLine, { bottom: chartHeight + 20 - ((best1RM / maxVal) * chartHeight) }]}>
                        <View style={styles.currentLabelBubble}><Text style={styles.currentLineLabel}>PR {best1RM}</Text></View>
                    </View>
                    <View style={styles.barsRow}>
                        {monthlyData.map((val, idx) => {
                            const barHeight = maxVal > 0 ? (val / maxVal) * chartHeight : 0;
                            const isCurrentOrRecent = idx >= currentMonth - 2 && idx <= currentMonth;
                            const isPR = val === best1RM && val > 0;
                            return (
                                <View key={idx} style={styles.barWrapper}>
                                    <View style={[
                                        styles.bar,
                                        {
                                            height: Math.max(barHeight, 2),
                                            backgroundColor: isPR ? '#FFD700' : isCurrentOrRecent ? METRIC_COLOR : '#8E8E93'
                                        }
                                    ]} />
                                    <Text style={styles.barLabel}>{monthLabels[idx]}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
                <Text style={styles.yearLabel}>{new Date().getFullYear()}</Text>
            </View>
        );
    };

    const renderWeeklyChart = () => {
        const maxVal = Math.max(...weeklyData, 1);
        const chartHeight = 80;
        return (
            <View style={styles.weeklyChartContainer}>
                <View style={styles.weeklyChartHeader}>
                    <Text style={styles.weeklyTitle}>This Week's 1RM</Text>
                    <Text style={[styles.weeklyValue, { color: METRIC_COLOR }]}>{weeklyBest1RM} KG</Text>
                </View>
                <View style={styles.weeklyChartWithLines}>
                    <View style={[styles.weeklyGridLine, { top: 0 }]} />
                    <View style={[styles.weeklyGridLine, { top: chartHeight * 0.5 }]} />
                    <View style={[styles.weeklyGridLine, { top: chartHeight }]} />
                    <View style={styles.weeklyBarsRow}>
                        {weeklyData.map((val, idx) => {
                            const barHeight = maxVal > 0 ? (val / maxVal) * chartHeight : 0;
                            const isPR = val === weeklyBest1RM && val > 0;
                            return (
                                <View key={idx} style={styles.weeklyBarWrapper}>
                                    <View style={[
                                        styles.weeklyBar,
                                        {
                                            height: Math.max(barHeight, 4),
                                            backgroundColor: isPR ? METRIC_COLOR : '#8E8E93'
                                        }
                                    ]} />
                                    <Text style={styles.weeklyBarLabel}>{weekDayLabels[idx]}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <TouchableOpacity style={[BackButtonStyles.topBackButton, BackButtonStyles.backButton, { backgroundColor: '#2C2C2E' }]} onPress={() => navigation.goBack()}>
                <Feather name="chevron-left" size={28} color={COLORS.textWhite} />
            </TouchableOpacity>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.mainTitle}>1RM Progress</Text>

                {/* Main Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.arrowCircle}>
                        <MaterialCommunityIcons name={trendDirection === 'up' ? 'trending-up' : 'trending-down'} size={32} color={METRIC_COLOR} />
                    </View>
                    <View style={styles.summaryText}>
                        <Text style={[styles.summaryValue, { color: METRIC_COLOR }]}>
                            {best1RM}<Text style={styles.summaryUnit}> KG</Text>
                        </Text>
                        <Text style={styles.summarySubtitle}>
                            {strengthRatio.toFixed(2)}xBW • {strengthLevel}
                        </Text>
                        <Text style={styles.summaryDescription}>
                            {trendDirection === 'up'
                                ? `Great progress! You've hit ${prCount} PRs this year.`
                                : `Keep pushing! Your strength is building.`}
                        </Text>
                    </View>
                </View>

                <View style={styles.separator} />

                {/* Yearly Chart */}
                <Text style={styles.sectionTitle}>Yearly Progression</Text>
                {renderYearlyChart()}

                <View style={styles.separator} />

                {/* Weekly Chart */}
                {renderWeeklyChart()}

                <View style={styles.separator} />

                {/* Stats Section */}
                <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Best 1RM</Text>
                        <Text style={[styles.statValue, { color: METRIC_COLOR }]}>{best1RM} KG</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Strength Ratio</Text>
                        <Text style={[styles.statValue, { color: '#00C7BE' }]}>{strengthRatio.toFixed(2)}xBW</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Level</Text>
                        <Text style={[styles.statValue, { color: '#9DEC2C' }]}>{strengthLevel}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>PRs This Year</Text>
                        <Text style={[styles.statValue, { color: '#FFD700' }]}>{prCount}</Text>
                    </View>
                </View>

                <View style={styles.separator} />

                {/* Description */}
                <View style={styles.descriptionSection}>
                    <Text style={styles.descriptionText}>
                        Your <Text style={{ fontWeight: '700' }}>1RM (One Rep Max)</Text> is the maximum weight you can lift for a single rep.
                        It's calculated using the Epley formula: Weight × (1 + Reps / 30).
                        Tracking 1RM helps measure true strength progression.{' '}
                        <Text style={styles.learnMore}>Learn more...</Text>
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
    summaryUnit: { fontSize: 18, fontWeight: '600' },
    summarySubtitle: { color: '#00C7BE', fontSize: 16, fontWeight: '600', marginBottom: 4 },
    summaryDescription: { color: COLORS.textGray, fontSize: 14, lineHeight: 20 },
    separator: { height: 0.5, backgroundColor: COLORS.separator, marginVertical: 16 },
    yearlyChartContainer: { marginTop: 8 },
    chartRightLabel: { color: COLORS.textGray, fontSize: 11, fontWeight: '600', textAlign: 'right', marginBottom: 8, letterSpacing: 0.5 },
    chartWithLine: { height: 180, position: 'relative' },
    gridLine: { position: 'absolute', left: 0, right: 0, height: 0.5, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
    currentLine: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1, borderTopColor: '#FFD700', borderStyle: 'dashed' },
    currentLabelBubble: { position: 'absolute', right: 0, top: -12, backgroundColor: '#FFD700', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
    currentLineLabel: { color: '#000', fontSize: 11, fontWeight: '600' },
    barsRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 140, marginTop: 20 },
    barWrapper: { alignItems: 'center', flex: 1 },
    bar: { width: 8, borderRadius: 4, marginBottom: 4 },
    barLabel: { color: COLORS.textGray, fontSize: 10, marginTop: 4 },
    yearLabel: { color: COLORS.textGray, fontSize: 11, marginTop: 4 },
    weeklyChartContainer: { marginTop: 8 },
    weeklyChartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    weeklyTitle: { color: COLORS.textWhite, fontSize: 17, fontWeight: '600' },
    weeklyValue: { fontSize: 17, fontWeight: '700' },
    weeklyChartWithLines: { height: 100, position: 'relative' },
    weeklyGridLine: { position: 'absolute', left: 0, right: 0, height: 0.5, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
    weeklyBarsRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 80 },
    weeklyBarWrapper: { alignItems: 'center', flex: 1 },
    weeklyBar: { width: 6, borderRadius: 3, marginBottom: 4 },
    weeklyBarLabel: { color: COLORS.textGray, fontSize: 12, marginTop: 4 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    statItem: { width: '48%', marginBottom: 16 },
    statLabel: { color: COLORS.textGray, fontSize: 13, marginBottom: 4 },
    statValue: { fontSize: 24, fontWeight: '700' },
    descriptionSection: { marginTop: 8 },
    descriptionText: { color: COLORS.textGray, fontSize: 15, lineHeight: 22 },
    learnMore: { color: '#007AFF' },
});
