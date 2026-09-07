import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { BackButtonStyles } from '../styles/BackButtonStyle';
import { getRPELabel } from '../utils/StrengthCalculator';

const COLORS = { background: '#000000', textWhite: '#FFFFFF', textGray: '#8E8E93', separator: '#2C2C2E' };
const METRIC_COLOR = '#BF5AF2'; // Purple for RPE/Intensity

export default function RPETrendScreen({ navigation }: { navigation: any }) {
    const [weeklyAvgRPE, setWeeklyAvgRPE] = useState(0);
    const [dailyRPEs, setDailyRPEs] = useState<number[]>(new Array(7).fill(0));
    const [rpeDistribution, setRpeDistribution] = useState<{ label: string, count: number, color: string }[]>([]);
    const [trendDirection, setTrendDirection] = useState<'up' | 'down' | 'stable'>('stable');

    useFocusEffect(useCallback(() => { loadData(); }, []));

    const loadData = async () => {
        try {
            const stored = await AsyncStorage.getItem('workoutSummaries');
            if (!stored) return;
            const allSummaries = JSON.parse(stored);
            const now = new Date();

            // Weekly Data
            const weekly = new Array(7).fill(0);
            const weeklyCounts = new Array(7).fill(0);
            const isSameDay = (d1: Date, d2: Date) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

            // Distribution counters
            let lowCount = 0; // 1-4
            let midCount = 0; // 5-7
            let highCount = 0; // 8-10

            // Filter for last 7 days for the chart
            for (let i = 0; i < 7; i++) {
                const d = new Date();
                d.setDate(now.getDate() - (6 - i));

                const daySummaries = allSummaries.filter((s: any) => isSameDay(new Date(s.date), d));

                if (daySummaries.length > 0) {
                    let dayTotalRPE = 0;
                    let daySetCount = 0;

                    daySummaries.forEach((s: any) => {
                        // Assuming RPE is stored in settings or calculated. 
                        // If not explicitly stored, we might need to rely on what's available.
                        // For now, let's assume 'rpe' field exists in session or we default to a value.
                        // Since RPE might not be fully populated in old data, we handle gracefully.
                        const rpe = s.rpe || (s.repsInReserve !== undefined ? 10 - s.repsInReserve : 0);

                        if (rpe > 0) {
                            dayTotalRPE += rpe;
                            daySetCount++;

                            if (rpe <= 4) lowCount++;
                            else if (rpe <= 7) midCount++;
                            else highCount++;
                        }
                    });

                    if (daySetCount > 0) {
                        weekly[i] = dayTotalRPE / daySetCount;
                        weeklyCounts[i] = daySetCount;
                    }
                }
            }

            setDailyRPEs(weekly);

            // Calculate Weekly Average
            const totalRPE = weekly.reduce((a, b) => a + b, 0);
            const activeDays = weekly.filter(v => v > 0).length;
            const avg = activeDays > 0 ? totalRPE / activeDays : 0;
            setWeeklyAvgRPE(parseFloat(avg.toFixed(1)));

            // Comparison with previous week for trend
            // Simplified trend logic for now
            setTrendDirection('stable');

            // Distribution Data
            const totalSets = lowCount + midCount + highCount;
            if (totalSets > 0) {
                setRpeDistribution([
                    { label: 'Low (1-4)', count: Math.round((lowCount / totalSets) * 100), color: '#32D74B' },
                    { label: 'Moderate (5-7)', count: Math.round((midCount / totalSets) * 100), color: '#FFD60A' },
                    { label: 'High (8-10)', count: Math.round((highCount / totalSets) * 100), color: '#FF453A' },
                ]);
            }

        } catch (e) { console.error(e); }
    };

    const weekDayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    const renderWeeklyChart = () => {
        const maxVal = 10; // RPE is usually max 10
        const chartHeight = 100;

        return (
            <View style={styles.chartContainer}>
                <View style={styles.chartHeader}>
                    <Text style={styles.chartTitle}>Average RPE (Last 7 Days)</Text>
                    <Text style={[styles.chartValue, { color: METRIC_COLOR }]}>{weeklyAvgRPE}</Text>
                </View>

                <View style={styles.chartBody}>
                    {/* Grid Lines */}
                    <View style={[styles.gridLine, { bottom: 0 }]} />
                    <View style={[styles.gridLine, { bottom: chartHeight * 0.5 }]} />
                    <View style={[styles.gridLine, { bottom: chartHeight }]} />

                    {/* Bars */}
                    <View style={styles.barsRow}>
                        {dailyRPEs.map((val, idx) => {
                            const barHeight = (val / maxVal) * chartHeight;
                            return (
                                <View key={idx} style={styles.barWrapper}>
                                    <View style={[
                                        styles.bar,
                                        {
                                            height: Math.max(barHeight, 4),
                                            backgroundColor: val > 8 ? '#FF453A' : val > 5 ? METRIC_COLOR : '#32D74B'
                                        }
                                    ]} />
                                    <Text style={styles.barLabel}>{weekDayLabels[idx]}</Text>
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
                <Text style={styles.mainTitle}>RPE / Intensity</Text>

                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.arrowCircle}>
                        <MaterialCommunityIcons name="speedometer" size={32} color={METRIC_COLOR} />
                    </View>
                    <View style={styles.summaryText}>
                        <Text style={[styles.summaryValue, { color: METRIC_COLOR }]}>
                            {weeklyAvgRPE} <Text style={styles.summaryUnit}>AVG</Text>
                        </Text>
                        <Text style={styles.summarySubtitle}>
                            {getRPELabel(Math.round(weeklyAvgRPE))}
                        </Text>
                        <Text style={styles.summaryDescription}>
                            Rate of Perceived Exertion (RPE) measures how hard you feel your body is working.
                        </Text>
                    </View>
                </View>

                <View style={styles.separator} />

                {/* Weekly Chart */}
                {renderWeeklyChart()}

                <View style={styles.separator} />

                {/* Distribution */}
                <Text style={styles.sectionTitle}>Intensity Distribution</Text>
                <View style={styles.distributionContainer}>
                    {rpeDistribution.map((item, idx) => (
                        <View key={idx} style={styles.distRow}>
                            <View style={styles.distLabelContainer}>
                                <View style={[styles.dot, { backgroundColor: item.color }]} />
                                <Text style={styles.distLabel}>{item.label}</Text>
                            </View>
                            <View style={styles.distBarBg}>
                                <View style={[styles.distBarFill, { width: `${item.count}%`, backgroundColor: item.color }]} />
                            </View>
                            <Text style={styles.distValue}>{item.count}%</Text>
                        </View>
                    ))}
                    {rpeDistribution.length === 0 && (
                        <Text style={{ color: COLORS.textGray, fontStyle: 'italic' }}>No RPE data recorded yet.</Text>
                    )}
                </View>

                <View style={styles.separator} />

                {/* RPE Scale Info */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>RPE Scale (1-10)</Text>
                    <View style={styles.scaleRow}><Text style={styles.scaleVal}>10</Text><Text style={styles.scaleDesc}>Max Effort (No reps left)</Text></View>
                    <View style={styles.scaleRow}><Text style={styles.scaleVal}>9</Text><Text style={styles.scaleDesc}>Very Hard (1 rep left)</Text></View>
                    <View style={styles.scaleRow}><Text style={styles.scaleVal}>7-8</Text><Text style={styles.scaleDesc}>Vigorous (2-3 reps left)</Text></View>
                    <View style={styles.scaleRow}><Text style={styles.scaleVal}>4-6</Text><Text style={styles.scaleDesc}>Moderate</Text></View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { paddingBottom: 40, paddingTop: 60, paddingHorizontal: 16 },
    mainTitle: { color: COLORS.textWhite, fontSize: 34, fontWeight: 'bold', marginBottom: 20 },
    sectionTitle: { color: COLORS.textWhite, fontSize: 17, fontWeight: '600', marginBottom: 16 },
    summaryCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
    arrowCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center' },
    summaryText: { flex: 1 },
    summaryValue: { fontSize: 32, fontWeight: 'bold', marginBottom: 2 },
    summaryUnit: { fontSize: 18, fontWeight: '600', color: COLORS.textGray },
    summarySubtitle: { color: METRIC_COLOR, fontSize: 16, fontWeight: '600', marginBottom: 4 },
    summaryDescription: { color: COLORS.textGray, fontSize: 14, lineHeight: 20 },
    separator: { height: 0.5, backgroundColor: COLORS.separator, marginVertical: 24 },

    chartContainer: { marginTop: 0 },
    chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    chartTitle: { color: COLORS.textWhite, fontSize: 17, fontWeight: '600' },
    chartValue: { fontSize: 17, fontWeight: '700' },
    chartBody: { height: 100, position: 'relative' },
    gridLine: { position: 'absolute', left: 0, right: 0, height: 0.5, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
    barsRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 100 },
    barWrapper: { alignItems: 'center', flex: 1 },
    bar: { width: 6, borderRadius: 3, marginBottom: 6 },
    barLabel: { color: COLORS.textGray, fontSize: 12 },

    distributionContainer: {},
    distRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    distLabelContainer: { flexDirection: 'row', alignItems: 'center', width: 120 },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    distLabel: { color: COLORS.textGray, fontSize: 14 },
    distBarBg: { flex: 1, height: 6, backgroundColor: '#2C2C2E', borderRadius: 3, marginHorizontal: 12 },
    distBarFill: { height: '100%', borderRadius: 3 },
    distValue: { color: COLORS.textWhite, fontSize: 14, fontWeight: '600', width: 40, textAlign: 'right' },

    infoCard: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16 },
    infoTitle: { color: COLORS.textWhite, fontSize: 15, fontWeight: '600', marginBottom: 12 },
    scaleRow: { flexDirection: 'row', marginBottom: 8 },
    scaleVal: { color: METRIC_COLOR, fontWeight: '700', width: 40 },
    scaleDesc: { color: COLORS.textGray },
});
