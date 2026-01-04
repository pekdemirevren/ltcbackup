import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, StatusBar } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { TrendChart } from '../components/TrendChart';
import MetricColors from '../constants/MetricColors';

type CadenceScreenProps = StackScreenProps<RootStackParamList, 'Cadence'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TimeFrame = 'D' | 'W' | 'M' | 'Y';

export default function CadenceScreen({ navigation }: CadenceScreenProps) {
    const [selectedFrame, setSelectedFrame] = useState<TimeFrame>('W');
    const [chartData, setChartData] = useState<number[]>([]);
    const [averageMetric, setAverageMetric] = useState(0);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [selectedFrame])
    );

    const loadData = async () => {
        try {
            const stored = await AsyncStorage.getItem('workoutSummaries');
            if (!stored) return;
            const allSummaries = JSON.parse(stored);
            const now = new Date();
            let data: number[] = [];

            const isSameDay = (d1: Date, d2: Date) =>
                d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

            const getCadence = (s: any) => {
                const activeTime = s.greenLoopTimes ? s.greenLoopTimes.reduce((a: number, b: number) => a + b, 0) : s.elapsedTime;
                const totalReps = s.completedReps || 1;
                return activeTime / totalReps;
            };

            const aggregate = (summaries: any[], index: number, targetData: number[]) => {
                if (summaries.length === 0) return;
                let total = 0;
                let count = 0;
                summaries.forEach((s: any) => {
                    const cad = getCadence(s);
                    if (cad > 0) {
                        total += cad;
                        count++;
                    }
                });
                targetData[index] = count > 0 ? parseFloat((total / count).toFixed(1)) : 0;
            };

            if (selectedFrame === 'D') {
                data = new Array(24).fill(0);
                const filtered = allSummaries.filter((s: any) => isSameDay(new Date(s.date), now));
                const hourGroups: { [key: number]: any[] } = {};
                filtered.forEach((s: any) => {
                    const h = new Date(s.date).getHours();
                    if (!hourGroups[h]) hourGroups[h] = [];
                    hourGroups[h].push(s);
                });
                Object.keys(hourGroups).forEach(h => {
                    aggregate(hourGroups[parseInt(h)], parseInt(h), data);
                });
            } else if (selectedFrame === 'W') {
                data = new Array(7).fill(0);
                for (let i = 0; i < 7; i++) {
                    const d = new Date();
                    d.setDate(now.getDate() - (6 - i));
                    const daySummaries = allSummaries.filter((s: any) => isSameDay(new Date(s.date), d));
                    aggregate(daySummaries, i, data);
                }
            } else if (selectedFrame === 'M') {
                const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                data = new Array(daysInMonth).fill(0);
                const filtered = allSummaries.filter((s: any) => {
                    const d = new Date(s.date);
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                });
                for (let i = 0; i < daysInMonth; i++) {
                    const daySummaries = filtered.filter((s: any) => new Date(s.date).getDate() === i + 1);
                    aggregate(daySummaries, i, data);
                }
            } else if (selectedFrame === 'Y') {
                data = new Array(12).fill(0);
                const filtered = allSummaries.filter((s: any) => new Date(s.date).getFullYear() === now.getFullYear());
                for (let i = 0; i < 12; i++) {
                    const monthSummaries = filtered.filter((s: any) => new Date(s.date).getMonth() === i);
                    aggregate(monthSummaries, i, data);
                }
            }

            setChartData(data);
            const valid = data.filter(v => v > 0);
            setAverageMetric(valid.length > 0 ? parseFloat((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1)) : 0);

        } catch (e) {
            console.error(e);
        }
    };

    const getLabels = () => {
        switch (selectedFrame) {
            case 'D': return ['00', '06', '12', '18'];
            case 'W': return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            case 'M': return ['1', '8', '15', '22', '29'];
            case 'Y': return ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="chevron-left" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cadence</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.selectorContainer}>
                    {(['D', 'W', 'M', 'Y'] as TimeFrame[]).map((frame) => (
                        <TouchableOpacity
                            key={frame}
                            style={[styles.selectorButton, selectedFrame === frame && styles.selectorButtonActive]}
                            onPress={() => setSelectedFrame(frame)}
                        >
                            <Text style={[styles.selectorText, selectedFrame === frame && styles.selectorTextActive]}>{frame}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.statContainer}>
                    <Text style={styles.statLabel}>AVERAGE CADENCE</Text>
                    <Text style={[styles.statValue, { color: MetricColors.speed }]}>{averageMetric} <Text style={styles.statUnit}>s/rep</Text></Text>
                    <Text style={styles.statSub}>Time per repetition</Text>
                </View>

                <View style={styles.chartCard}>
                    <TrendChart
                        data={chartData}
                        labels={getLabels() || []}
                        color={MetricColors.speed}
                        height={200}
                    />
                </View>
                <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={() => navigation.navigate('AllCadenceMetrics')}
                >
                    <Text style={styles.viewAllText}>View All Cadence Metrics</Text>
                </TouchableOpacity>

                <View style={styles.descriptionFooter}>
                    <Text style={styles.footerText}>
                        Cadence measures the time spent on each repetition. Controlling the tempo helps maintain "Time Under Tension" for optimal muscle development.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '600', color: '#FFF' },
    scrollContent: { padding: 16 },
    selectorContainer: { flexDirection: 'row', backgroundColor: '#1C1C1E', borderRadius: 12, padding: 2, marginBottom: 24 },
    selectorButton: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 10 },
    selectorButtonActive: { backgroundColor: '#636366' },
    selectorText: { color: '#8E8E93', fontSize: 13, fontWeight: '600' },
    selectorTextActive: { color: '#FFF' },
    statContainer: { marginBottom: 24 },
    statLabel: { color: '#8E8E93', fontSize: 13, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
    statValue: { fontSize: 34, fontWeight: 'bold', marginBottom: 4 },
    statUnit: { fontSize: 18, color: '#8E8E93' },
    statSub: { color: '#8E8E93', fontSize: 16 },
    chartCard: { backgroundColor: '#1C1C1E', borderRadius: 20, padding: 16, marginBottom: 24 },
    viewAllButton: { backgroundColor: '#1C1C1E', borderRadius: 30, paddingVertical: 18, alignItems: 'center', marginBottom: 24 },
    viewAllText: { color: '#9DEC2C', fontSize: 16, fontWeight: '600' },
    descriptionFooter: { paddingTop: 20, borderTopWidth: 0.5, borderTopColor: '#333' },
    footerText: { color: '#8E8E93', fontSize: 15, lineHeight: 22 },
});
