import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { allWorkouts } from '../constants/workoutData';
import { calculateCalories } from '../utils/CalorieCalculator';
import MetricColors from '../constants/MetricColors';
import { TimerContext } from '../contexts/TimerContext';

type WorkoutCategoryDetailProps = StackScreenProps<RootStackParamList, 'WorkoutCategoryDetail'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TimeFilter = 'W' | 'M' | 'Y';

interface MetricData {
  label: string;
  value: number | string;
  todayValue: number | string;
  unit: string;
  color: string;
  chart: number[];
}

interface WorkoutStats {
  sets: number;
  strength: number;
  energy: number;
  cadence: number;
  intensity: string;
  density: number;
  consistency: number;
  endurance: number;
  balance: number;
  weeklySets: number;
  weeklyStrength: number;
  weeklyEnergy: number;
  weeklyCadence: number;
  weeklyIntensity: string;
  weeklyDensity: number;
  weeklyConsistency: number;
  weeklyEndurance: number;
  weeklyBalance: number;
  charts: {
    weeklySets: number[];
    weeklyStrength: number[];
    weeklyEnergy: number[];
    weeklyCadence: number[];
    weeklyIntensity: number[];
    weeklyDensity: number[];
    weeklyConsistency: number[];
    weeklyEndurance: number[];
    weeklyBalance: number[];
  };
}

const defaultStats: WorkoutStats = {
  sets: 0, strength: 0, energy: 0, cadence: 0, intensity: '0:1', density: 0, consistency: 0, endurance: 0, balance: 100,
  weeklySets: 0, weeklyStrength: 0, weeklyEnergy: 0, weeklyCadence: 0, weeklyIntensity: '0:1', weeklyDensity: 0, weeklyConsistency: 0, weeklyEndurance: 0, weeklyBalance: 100,
  charts: {
    weeklySets: [0,0,0,0,0,0,0], weeklyStrength: [0,0,0,0,0,0,0], weeklyEnergy: [0,0,0,0,0,0,0],
    weeklyCadence: [0,0,0,0,0,0,0], weeklyIntensity: [0,0,0,0,0,0,0], weeklyDensity: [0,0,0,0,0,0,0],
    weeklyConsistency: [0,0,0,0,0,0,0], weeklyEndurance: [0,0,0,0,0,0,0], weeklyBalance: [0,0,0,0,0,0,0],
  }
};

export default function WorkoutCategoryDetailScreen({ navigation, route }: WorkoutCategoryDetailProps) {
  const { workoutId, workoutName, categoryTitle, workoutIds, focusMetric } = route.params || {};
  const displayTitle = categoryTitle || workoutName || 'Workouts';
  const timerContext = useContext(TimerContext);
  const workout = allWorkouts.find(w => w.workoutId === workoutId);
  
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('W');
  const [stats, setStats] = useState<WorkoutStats>(defaultStats);

  useFocusEffect(
    useCallback(() => {
      loadWorkoutStats();
    }, [workoutId, workoutIds, timeFilter])
  );

  const loadWorkoutStats = async () => {
    try {
      const stored = await AsyncStorage.getItem('workoutSummaries');
      if (stored) {
        const allSummaries = JSON.parse(stored);
        const today = new Date();
        const todayStr = today.toDateString();
        
        // Filter by workout if specified
        let filteredSummaries = allSummaries;
        if (workoutId) {
          filteredSummaries = allSummaries.filter((s: any) => s.workoutId === workoutId);
        } else if (workoutIds && workoutIds.length > 0) {
          filteredSummaries = allSummaries.filter((s: any) => workoutIds.includes(s.workoutId));
        }

        const getDayIndex = (date: Date) => {
          const day = date.getDay();
          return day === 0 ? 6 : day - 1; // Monday = 0, Sunday = 6
        };

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);

        let wWeeklySets = 0, wWeeklyVolume = 0, wWeeklyActive = 0, wWeeklyRest = 0, wWeeklyReps = 0, wWeeklyElapsed = 0;
        let wTodaySets = 0, wTodayVolume = 0, wTodayActive = 0, wTodayRest = 0, wTodayReps = 0, wTodayElapsed = 0;

        const weeklySetsData = new Array(7).fill(0);
        const weeklyStrData = new Array(7).fill(0);
        const weeklyCadData = new Array(7).fill(0);
        const weeklyIntData = new Array(7).fill(0);
        const weeklyDenData = new Array(7).fill(0);
        const weeklyCounts = new Array(7).fill(0);
        const weeklyEnergyData = new Array(7).fill(0);

        filteredSummaries.forEach((s: any) => {
          const sDate = new Date(s.date);
          const activeTime = s.greenLoopTimes ? s.greenLoopTimes.reduce((a: any, b: any) => a + b, 0) : (s.elapsedTime || 0);
          const restTime = s.redLoopTimes ? s.redLoopTimes.reduce((a: any, b: any) => a + b, 0) : 0;
          const weightVal = s.settings?.weight ? parseFloat(s.settings.weight) : 0;
          const sets = (s.completedSets || 0);
          const reps = (s.completedReps || 0);
          const vol = weightVal * sets * reps;
          const cadence = reps > 0 ? (activeTime / reps) : 0;
          const density = (s.elapsedTime || 0) > 0 ? (activeTime / s.elapsedTime) * 100 : 0;
          const energy = Math.round(calculateCalories(s.workoutId, s.elapsedTime, weightVal, reps));

          if (sDate >= sevenDaysAgo) {
            wWeeklySets += sets;
            wWeeklyVolume += vol;
            wWeeklyActive += activeTime;
            wWeeklyRest += restTime;
            wWeeklyReps += reps;
            wWeeklyElapsed += (s.elapsedTime || 0);

            const dayIdx = getDayIndex(sDate);
            weeklySetsData[dayIdx] += sets;
            weeklyStrData[dayIdx] += vol;
            weeklyIntData[dayIdx] += activeTime > 0 ? (restTime / activeTime) : 0;
            weeklyCadData[dayIdx] += cadence;
            weeklyDenData[dayIdx] += density;
            weeklyEnergyData[dayIdx] += energy;
            weeklyCounts[dayIdx]++;
          }

          if (sDate.toDateString() === todayStr) {
            wTodaySets += sets;
            wTodayVolume += vol;
            wTodayActive += activeTime;
            wTodayRest += restTime;
            wTodayElapsed += (s.elapsedTime || 0);
            wTodayReps += reps;
          }
        });

        // Normalize weekly data by counts
        for (let i = 0; i < 7; i++) {
          if (weeklyCounts[i] > 0) {
            weeklyCadData[i] = parseFloat((weeklyCadData[i] / weeklyCounts[i]).toFixed(1));
            weeklyIntData[i] = parseFloat((weeklyIntData[i] / weeklyCounts[i]).toFixed(2));
            weeklyDenData[i] = Math.round(weeklyDenData[i] / weeklyCounts[i]);
          }
        }

        setStats({
          sets: wTodaySets,
          strength: Math.round(wTodayVolume / 1000),
          cadence: wTodayReps > 0 ? parseFloat((wTodayActive / wTodayReps).toFixed(1)) : 0,
          intensity: wTodayActive > 0 ? `${parseFloat((wTodayRest / wTodayActive).toFixed(1))}:1` : "0:1",
          density: wTodayElapsed > 0 ? Math.round((wTodayActive / wTodayElapsed) * 100) : 0,
          consistency: Math.round((weeklyCounts.filter(c => c > 0).length / 7) * 100),
          endurance: Math.round(wTodayElapsed / 60),
          balance: 100,
          energy: Math.round(calculateCalories(workoutId || '', wTodayElapsed, wTodayVolume > 0 ? wTodayVolume / (wTodaySets || 1) / (wTodayReps || 1) : 0, wTodayReps)),
          weeklySets: wWeeklySets,
          weeklyStrength: Math.round(wWeeklyVolume / 1000),
          weeklyIntensity: wWeeklyActive > 0 ? `${parseFloat((wWeeklyRest / wWeeklyActive).toFixed(1))}:1` : "0:1",
          weeklyCadence: wWeeklyReps > 0 ? parseFloat((wWeeklyActive / wWeeklyReps).toFixed(1)) : 0,
          weeklyDensity: wWeeklyElapsed > 0 ? Math.round((wWeeklyActive / wWeeklyElapsed) * 100) : 0,
          weeklyConsistency: Math.round((weeklyCounts.filter(c => c > 0).length / 7) * 100),
          weeklyEndurance: Math.round(wWeeklyElapsed / 60),
          weeklyBalance: 100,
          weeklyEnergy: weeklyEnergyData.reduce((a, b) => a + b, 0),
          charts: {
            weeklySets: weeklySetsData,
            weeklyStrength: weeklyStrData.map(v => Math.round(v / 1000)),
            weeklyIntensity: weeklyIntData,
            weeklyCadence: weeklyCadData,
            weeklyDensity: weeklyDenData,
            weeklyConsistency: weeklyCounts.map(c => c > 0 ? 100 : 0),
            weeklyEndurance: weeklyCounts.map((c, i) => c > 0 ? Math.round(weeklyDenData[i]) : 0),
            weeklyBalance: new Array(7).fill(100),
            weeklyEnergy: weeklyEnergyData,
          }
        });
      }
    } catch (e) {
      console.error('Error loading workout stats:', e);
    }
  };

  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const renderMetricCard = (metric: MetricData) => {
    const maxVal = Math.max(...metric.chart.slice(0, 7), 1);
    return (
      <View style={styles.metricCard}>
        <Text style={styles.metricLabel}>{metric.label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginVertical: 4 }}>
          <Text style={[styles.metricValue, { color: metric.color }]}>{metric.value}</Text>
          <Text style={[styles.metricUnit, { color: metric.color }]}>{metric.unit}</Text>
        </View>
        <View style={styles.chartRow}>
          {metric.chart.slice(0, 7).map((val: number, i: number) => {
            const barHeight = (val / maxVal) * 30;
            return (
              <View key={i} style={styles.chartBarContainer}>
                {i === 0 && <View style={styles.chartDivider} />}
                <View style={styles.chartBarWrapper}>
                  <View style={[styles.chartBar, { height: Math.max(barHeight, 3), backgroundColor: metric.color }]} />
                  <Text style={styles.chartDayLabel}>{weekDays[i]}</Text>
                </View>
                <View style={styles.chartDivider} />
              </View>
            );
          })}
        </View>
        <Text style={styles.todayLabel}>
          <Text style={{ color: '#8E8E93' }}>Today: </Text>
          <Text style={{ color: metric.color }}>{metric.todayValue} {metric.unit}</Text>
        </Text>
      </View>
    );
  };

  const allMetricsData: MetricData[] = [
    { label: 'Sets', value: stats.weeklySets, todayValue: stats.sets, unit: 'SET', color: MetricColors.sets, chart: stats.charts.weeklySets },
    { label: 'Strength', value: stats.weeklyStrength, todayValue: stats.strength, unit: 'KG', color: MetricColors.weight, chart: stats.charts.weeklyStrength },
    { label: 'Energy', value: stats.weeklyEnergy, todayValue: stats.energy, unit: 'KCAL', color: MetricColors.energy, chart: stats.charts.weeklyEnergy },
    { label: 'Cadence', value: stats.weeklyCadence, todayValue: stats.cadence, unit: 's/r', color: MetricColors.speed, chart: stats.charts.weeklyCadence },
    { label: 'Intensity', value: stats.weeklyIntensity, todayValue: stats.intensity, unit: '', color: MetricColors.energy, chart: stats.charts.weeklyIntensity },
    { label: 'Density', value: stats.weeklyDensity, todayValue: stats.density, unit: '%', color: '#9DEC2C', chart: stats.charts.weeklyDensity },
    { label: 'Consistency', value: stats.weeklyConsistency, todayValue: stats.consistency, unit: '%', color: '#00C7BE', chart: stats.charts.weeklyConsistency },
    { label: 'Endurance', value: stats.weeklyEndurance, todayValue: stats.endurance, unit: 'MIN', color: MetricColors.duration, chart: stats.charts.weeklyEndurance },
    { label: 'Balance', value: stats.weeklyBalance, todayValue: stats.balance, unit: '%', color: '#D1A3FF', chart: stats.charts.weeklyBalance },
  ];

  // Map focusMetric param to metric label
  const metricLabelMap: { [key: string]: string } = {
    'SetCount': 'Sets',
    'StrengthLevel': 'Strength',
    'Energy': 'Energy',
    'Cadence': 'Cadence',
    'Intensity': 'Intensity',
    'Density': 'Density',
    'Consistency': 'Consistency',
    'Endurance': 'Endurance',
    'Balance': 'Balance',
  };

  // Filter to show only the focused metric if specified
  const metricsData = focusMetric && metricLabelMap[focusMetric]
    ? allMetricsData.filter(m => m.label === metricLabelMap[focusMetric])
    : allMetricsData;

  const TIME_FILTERS: TimeFilter[] = ['W', 'M', 'Y'];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="chevron-left" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {workout?.SvgIcon && <workout.SvgIcon width={32} height={32} fill="#9DEC2C" />}
          <Text style={styles.title}>{displayTitle}</Text>
        </View>
        <Text style={styles.subtitle}>
          {focusMetric && metricLabelMap[focusMetric] ? `Weekly ${metricLabelMap[focusMetric]}` : 'Weekly Metrics'}
        </Text>
      </View>

      {/* Time Filter */}
      <View style={styles.filterContainer}>
        {TIME_FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              timeFilter === filter && styles.filterTabActive
            ]}
            onPress={() => setTimeFilter(filter)}
          >
            <Text style={[
              styles.filterText,
              timeFilter === filter && styles.filterTextActive
            ]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Metrics */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {metricsData.map((metric, idx) => (
          <View key={idx}>
            {renderMetricCard(metric)}
            {idx < metricsData.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
        
        {/* View All Metrics Button - only show when focusMetric is active */}
        {workout && focusMetric && (
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => {
              navigation.navigate('WorkoutCategoryDetail', {
                workoutId: workout.workoutId,
                workoutName: workout.name,
                focusMetric: undefined,
              });
            }}
            activeOpacity={0.8}
          >
            <Feather name="grid" size={18} color="#000" />
            <Text style={styles.startButtonText}>View All Metrics</Text>
          </TouchableOpacity>
        )}
        
        {/* Start Workout Button - only show when viewing all metrics */}
        {workout && !focusMetric && (
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => {
              timerContext?.startTimerWithWorkoutSettings(workout.workoutId, workout.name);
            }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="play-circle" size={20} color="#000" />
            <Text style={styles.startButtonText}>Start Workout</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 8,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  titleContainer: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 17,
    color: '#8E8E93',
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  filterTabActive: {
    backgroundColor: '#4A4A4C',
  },
  filterText: {
    color: '#8E8E93',
    fontSize: 15,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  chartCard: {
    marginHorizontal: 20,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 0,
  },
  chartLabel: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  chartValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chartContainer: {
    height: 100,
    position: 'relative',
  },
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: '#3A3A3C',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
  dayLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 10,
  },
  dayLabel: {
    color: '#8E8E93',
    fontSize: 12,
    flex: 1,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#3A3A3C',
    marginHorizontal: 20,
    marginVertical: 16,
  },
  metricCard: {
    marginHorizontal: 20,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
  },
  metricLabel: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  metricUnit: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 50,
    marginTop: 8,
  },
  chartBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: '100%',
  },
  chartDivider: {
    width: 0.8,
    height: 42,
    backgroundColor: '#606166',
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  chartBarWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  chartBar: {
    width: 6,
    borderRadius: 3,
  },
  chartDayLabel: {
    color: '#FFF',
    fontSize: 10,
    marginTop: 4,
  },
  todayLabel: {
    fontSize: 12,
    marginTop: 8,
    color: '#8E8E93',
  },
  startButton: {
    backgroundColor: '#9DEC2C',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 20,
  },
  startButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});
