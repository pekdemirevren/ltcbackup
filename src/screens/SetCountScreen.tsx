import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, StatusBar, FlatList } from 'react-native';

import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { allWorkouts } from '../constants/workoutData';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import MetricColors from '../constants/MetricColors';

import { TrendChart } from '../components/TrendChart';

type SetCountScreenProps = StackScreenProps<RootStackParamList, 'SetCount'>;


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');


type TimeFrame = 'D' | 'W' | 'M' | 'Y';

export default function SetCountScreen({ navigation }: SetCountScreenProps) {
  const [selectedFrame, setSelectedFrame] = useState<TimeFrame>('D');
  const [chartData, setChartData] = useState<{ sets: number[], reps: number[] }>({ sets: [], reps: [] });
  const [totalSets, setTotalSets] = useState(0);
  const [totalReps, setTotalReps] = useState(0);
  const [workoutList, setWorkoutList] = useState<any[]>([]);

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
      let filtered = [];
      let setsData: number[] = [];
      let repsData: number[] = [];

      // Helper to check if same day
      const isSameDay = (d1: Date, d2: Date) =>
        d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

      if (selectedFrame === 'D') {
        setsData = new Array(24).fill(0);
        repsData = new Array(24).fill(0);
        filtered = allSummaries.filter((s: any) => isSameDay(new Date(s.date), now));
        filtered.forEach((s: any) => {
          const h = new Date(s.date).getHours();
          setsData[h] += (s.completedSets || 0);
          repsData[h] += (s.completedReps || 0);
        });
      } else if (selectedFrame === 'W') {
        setsData = new Array(7).fill(0);
        repsData = new Array(7).fill(0);
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(now.getDate() - (6 - i));
          const daySummaries = allSummaries.filter((s: any) => isSameDay(new Date(s.date), d));
          daySummaries.forEach((s: any) => {
            setsData[i] += (s.completedSets || 0);
            repsData[i] += (s.completedReps || 0);
          });
        }
        // Filter for the whole week for the list
        const weekStart = new Date();
        weekStart.setDate(now.getDate() - 6);
        weekStart.setHours(0, 0, 0, 0);
        filtered = allSummaries.filter((s: any) => new Date(s.date) >= weekStart && new Date(s.date) <= now);

      } else if (selectedFrame === 'M') {
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        setsData = new Array(daysInMonth).fill(0);
        repsData = new Array(daysInMonth).fill(0);
        filtered = allSummaries.filter((s: any) => {
          const d = new Date(s.date);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        filtered.forEach((s: any) => {
          const day = new Date(s.date).getDate() - 1;
          if (day >= 0 && day < daysInMonth) {
            setsData[day] += (s.completedSets || 0);
            repsData[day] += (s.completedReps || 0);
          }
        });
      } else if (selectedFrame === 'Y') {
        setsData = new Array(12).fill(0);
        repsData = new Array(12).fill(0);
        filtered = allSummaries.filter((s: any) => new Date(s.date).getFullYear() === now.getFullYear());
        filtered.forEach((s: any) => {
          const m = new Date(s.date).getMonth();
          setsData[m] += (s.completedSets || 0);
          repsData[m] += (s.completedReps || 0);
        });
      }

      setChartData({ sets: setsData, reps: repsData });
      setTotalSets(setsData.reduce((a, b) => a + b, 0));
      setTotalReps(repsData.reduce((a, b) => a + b, 0));

      // Sort filtered list by date desc
      filtered.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setWorkoutList(filtered);

    } catch (e) {
      console.error(e);
    }
  };

  const getStatDisplay = () => {
    const now = new Date();
    if (selectedFrame === 'D') {
      return { label: 'TOTAL', value: totalSets, sub: 'Today' };
    }
    if (selectedFrame === 'W') {
      const avg = Math.round(totalSets / 7);
      return { label: 'DAILY AVERAGE', value: avg, sub: 'This Week' };
    }
    if (selectedFrame === 'M') {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const avg = Math.round(totalSets / daysInMonth);
      const monthName = now.toLocaleString('default', { month: 'short' }).toUpperCase();
      return { label: 'DAILY AVERAGE', value: avg, sub: `${monthName} ${now.getFullYear()}` };
    }
    if (selectedFrame === 'Y') {
      const avg = Math.round(totalSets / 365);
      return { label: 'DAILY AVERAGE', value: avg, sub: `${now.getFullYear()}` };
    }
    return { label: 'TOTAL', value: totalSets, sub: 'Total' };
  };

  const renderChart = () => {
    return (
      <View style={styles.chartCard}>
        <TrendChart
          data={chartData.sets}
          labels={getLabels()}
          color={MetricColors.sets}
          height={280}
        />
      </View>
    );
  };

  const getLabels = () => {
    switch (selectedFrame) {
      case 'D': return ['00', '06', '12', '18'];
      case 'W': return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      case 'M': return ['1', '8', '15', '22', '29'];
      case 'Y': return ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    }
  };

  const renderWorkoutItem = ({ item }: { item: any }) => {
    const workoutDef = allWorkouts.find(w => w.workoutId === item.workoutId);
    const WorkoutIcon = workoutDef?.SvgIcon;
    const iconColor = '#9DEC2C';

    const now = new Date();
    let dateLabel = '';
    if (selectedFrame === 'D') dateLabel = 'Today';
    else if (selectedFrame === 'W') dateLabel = 'This Week';
    else if (selectedFrame === 'M') dateLabel = `${now.toLocaleString('default', { month: 'short' }).toUpperCase()} ${now.getFullYear()}`;
    else if (selectedFrame === 'Y') dateLabel = `${now.getFullYear()}`;

    return (
      <View style={styles.workoutCard}>
        <View style={styles.workoutIconContainer}>
          {WorkoutIcon ? (
            <WorkoutIcon width={24} height={24} fill={iconColor} />
          ) : (
            <MaterialCommunityIcons name="dumbbell" size={24} color={iconColor} />
          )}
        </View>
        <View style={styles.workoutInfo}>
          <Text style={styles.workoutTitle}>{item.workoutName || 'Workout'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={[styles.workoutValue, { color: MetricColors.sets }]}>{item.completedSets || 0}</Text>
            <Text style={[styles.workoutUnit, { color: MetricColors.sets }]}>SETS</Text>
            <Text style={[styles.workoutUnit, { marginLeft: 4, marginRight: 4, color: MetricColors.sets }]}>/</Text>
            <Text style={[styles.workoutValue, { color: MetricColors.sets }]}>{item.completedReps || 0}</Text>
            <Text style={[styles.workoutUnit, { color: MetricColors.sets }]}>REPS</Text>
          </View>
        </View>
        <Text style={styles.workoutDateLabel}>{dateLabel}</Text>
      </View>
    );
  };

  const statDisplay = getStatDisplay();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Blue Linear Gradient Background (Apple Health style) */}
      {/* Mavi Sis Efekti - Grafik Merkezinde Yoğunlaşan Radial Gradient */}
      <Svg
        height={SCREEN_HEIGHT} // Ensure it covers enough height or
        width={SCREEN_WIDTH}
        style={styles.backgroundGlow}
      >
        <Defs>
          <RadialGradient
            id="blueGlow"
            cx="60%"        // Yatay merkez (Sağ taraf)
            cy="45%"        // Dikey merkez (Geri alındı)
            rx="130%"       // Yatay yayılma
            ry="70%"        // Dikey yayılma
            gradientUnits="userSpaceOnUse"
          >
            {/* Merkez: En yoğun mavi */}
            <Stop
              offset="0%"
              stopColor={MetricColors.sets}
              stopOpacity="0.15"
            />
            {/* Orta: Azalan yoğunluk */}
            <Stop
              offset="40%"
              stopColor={MetricColors.sets}
              stopOpacity="0.05"
            />
            {/* Dış: Tamamen kaybolma */}
            <Stop
              offset="100%"
              stopColor="#000000"
              stopOpacity="0"
            />
          </RadialGradient>
        </Defs>

        <Rect
          x="0"
          y="0"
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT} // Match SVG height
          fill="url(#blueGlow)"
        />
      </Svg>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="chevron-left" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.largeTitle}>Set Count</Text>
        {/* Timeframe Selector */}
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

        {/* Main Stat (Left Aligned) */}
        <View style={styles.statContainer}>
          <Text style={styles.statLabel}>{statDisplay.label}</Text>
          <Text style={styles.statValue}>{statDisplay.value}</Text>
          <Text style={styles.statSub}>{statDisplay.sub}</Text>
        </View>

        {/* Chart */}
        <View style={styles.chartCard}>
          {renderChart()}
        </View>

        {/* View All Metrics Button */}
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => navigation.navigate('AllSetsMetrics')}
        >
          <Text style={styles.viewAllText}>View All Sets Metrics</Text>
        </TouchableOpacity>

        {/* Workouts List */}
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Workouts</Text>
          {workoutList.length > 0 ? (
            workoutList.map((item, index) => (
              <View key={index}>
                {renderWorkoutItem({ item })}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No workouts recorded for this period.</Text>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 0,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  selectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 18, // Increased from 8
    padding: 2,
    marginBottom: 10,
  },
  selectorButton: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 16, // Increased from 6
  },
  selectorButtonActive: {
    backgroundColor: '#636366',
  },
  selectorText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
  },
  selectorTextActive: {
    color: '#FFF',
  },
  statContainer: {
    alignItems: 'flex-start', // Left aligned
    marginBottom: 12,
  },
  statLabel: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statValue: {
    color: MetricColors.sets, // Updated to use MetricColors.sets
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 0,
    lineHeight: 40,
  },
  statSub: {
    color: '#8E8E93',
    fontSize: 16,
  },
  chartCard: {
    marginBottom: 4,
    height: 315,
  },
  chartWrapper: {
    flexDirection: 'row',
    height: 280,
  },
  chartArea: {
    flex: 1,
    height: 280,
    position: 'relative',
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  yAxis: {
    width: 30,
    height: 280,
    position: 'relative',
    marginLeft: 2,
  },
  axisLabel: {
    color: '#8E8E93',
    fontSize: 10,
    position: 'absolute',
    left: 0,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#333', // Solid line
    width: '100%',
  },
  verticalGridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#333', // Solid line
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    zIndex: 1,
    paddingRight: 0, // Allow bars to go to edge if desired, or add padding if needed
  },
  barColumn: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '60%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 0,
  },
  xAxisContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    justifyContent: 'flex-end',
  },
  xAxisLabel: {
    color: '#8E8E93',
    fontSize: 10,
    width: 30,
  },
  viewAllButton: {
    backgroundColor: '#1C1C1E',
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 24,
  },
  viewAllText: {
    color: '#9DEC2C', // Green text from screenshot
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  workoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 24, // Increased from 16
    padding: 16,
    marginBottom: 12,
  },
  workoutIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(157, 236, 44, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  workoutValue: {
    color: '#9DEC2C',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  workoutUnit: {
    color: '#9DEC2C',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
    marginLeft: 2,
  },
  workoutDateLabel: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  emptyText: {
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 20,
  },
});
