import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, StatusBar } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { allWorkouts } from '../constants/workoutData';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

type RepsCountScreenProps = StackScreenProps<RootStackParamList, 'RepsCount'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type TimeFrame = 'D' | 'W' | 'M' | 'Y';

export default function RepsCountScreen({ navigation }: RepsCountScreenProps) {
  const [selectedFrame, setSelectedFrame] = useState<TimeFrame>('D');
  const [chartData, setChartData] = useState<number[]>([]);
  const [averageWeight, setAverageWeight] = useState(0);
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
      let wData: number[] = [];

      // Helper to check if same day
      const isSameDay = (d1: Date, d2: Date) =>
        d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

      if (selectedFrame === 'D') {
        wData = new Array(24).fill(0);
        filtered = allSummaries.filter((s: any) => isSameDay(new Date(s.date), now));
        filtered.forEach((s: any) => {
          const h = new Date(s.date).getHours();
          const weightVal = s.settings?.weight ? parseFloat(s.settings.weight) : 0;
          const volume = weightVal * (s.completedSets || 0) * (s.completedReps || 0);
          wData[h] += volume;
        });
      } else if (selectedFrame === 'W') {
        wData = new Array(7).fill(0);
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(now.getDate() - (6 - i));
          const daySummaries = allSummaries.filter((s: any) => isSameDay(new Date(s.date), d));
          daySummaries.forEach((s: any) => {
            const weightVal = s.settings?.weight ? parseFloat(s.settings.weight) : 0;
            const volume = weightVal * (s.completedSets || 0) * (s.completedReps || 0);
            wData[i] += volume;
          });
        }
        const weekStart = new Date();
        weekStart.setDate(now.getDate() - 6);
        weekStart.setHours(0, 0, 0, 0);
        filtered = allSummaries.filter((s: any) => new Date(s.date) >= weekStart && new Date(s.date) <= now);

      } else if (selectedFrame === 'M') {
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        wData = new Array(daysInMonth).fill(0);
        filtered = allSummaries.filter((s: any) => {
          const d = new Date(s.date);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        filtered.forEach((s: any) => {
          const day = new Date(s.date).getDate() - 1;
          if (day >= 0 && day < daysInMonth) {
            const weightVal = s.settings?.weight ? parseFloat(s.settings.weight) : 0;
            const volume = weightVal * (s.completedSets || 0) * (s.completedReps || 0);
            wData[day] += volume;
          }
        });
      } else if (selectedFrame === 'Y') {
        wData = new Array(12).fill(0);
        filtered = allSummaries.filter((s: any) => new Date(s.date).getFullYear() === now.getFullYear());
        filtered.forEach((s: any) => {
          const m = new Date(s.date).getMonth();
          const weightVal = s.settings?.weight ? parseFloat(s.settings.weight) : 0;
          const volume = weightVal * (s.completedSets || 0) * (s.completedReps || 0);
          wData[m] += volume;
        });
      }

      setChartData(wData);

      // Calculate Average Weight
      let totalWeightVal = 0;
      let weightCount = 0;
      filtered.forEach((s: any) => {
        const w = s.settings?.weight ? parseFloat(s.settings.weight) : 0;
        if (w > 0) {
          totalWeightVal += w;
          weightCount++;
        }
      });
      setAverageWeight(weightCount > 0 ? Math.round(totalWeightVal / weightCount) : 0);

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
      return { label: 'TOTAL', value: `${averageWeight}`, unit: 'KG', sub: 'Today' };
    }
    if (selectedFrame === 'W') {
      return { label: 'DAILY AVERAGE', value: `${averageWeight}`, unit: 'KG', sub: 'This Week' };
    }
    if (selectedFrame === 'M') {
      const monthName = now.toLocaleString('default', { month: 'short' }).toUpperCase();
      return { label: 'DAILY AVERAGE', value: `${averageWeight}`, unit: 'KG', sub: `${monthName} ${now.getFullYear()}` };
    }
    if (selectedFrame === 'Y') {
      return { label: 'DAILY AVERAGE', value: `${averageWeight}`, unit: 'KG', sub: `${now.getFullYear()}` };
    }
    return { label: 'TOTAL', value: `${averageWeight}`, unit: 'KG', sub: 'Total' };
  };

  const renderChart = () => {
    const maxVal = Math.max(...chartData, 1);

    let yLabels = [0, 0];
    let scaleMax = 1;

    // Simple scaling logic
    yLabels = [Math.round(maxVal), Math.round(maxVal / 2)];
    scaleMax = maxVal;

    const CHART_HEIGHT = 280;

    // Determine vertical grid lines based on selectedFrame
    let verticalLines: number[] = [];
    if (selectedFrame === 'W') {
      for (let i = 0; i <= 7; i++) {
        verticalLines.push((i / 7) * 100);
      }
    } else {
      verticalLines = [0, 25, 50, 75, 100];
    }

    return (
      <View style={styles.chartWrapper}>
        <View style={styles.chartArea}>
          {/* Static Grid Background */}
          <View style={styles.gridContainer}>
            <View style={[styles.gridLine, { top: 0 }]} />
            <View style={[styles.gridLine, { top: '50%' }]} />
            <View style={[styles.gridLine, { bottom: 0 }]} />

            {verticalLines.map((leftPct, i) => (
              <View key={i} style={[styles.verticalGridLine, { left: `${leftPct}%` }]} />
            ))}
          </View>

          {/* Bars Layer */}
          <View style={[styles.barsContainer, { justifyContent: 'flex-start' }]}>
            {chartData.map((val, i) => {
              const barHeight = Math.min((val / scaleMax) * CHART_HEIGHT, CHART_HEIGHT);
              const barWidthPct = 100 / chartData.length;
              return (
                <View key={i} style={[styles.barColumn, { width: `${barWidthPct}%` }]}>
                  <View style={[styles.bar, { height: barHeight, backgroundColor: '#A358DF' }]} />
                </View>
              );
            })}
          </View>

          {/* X-Axis Labels */}
          <View style={styles.xAxisContainer}>
            {getLabels().map((label, i) => {
              const isGridAligned = selectedFrame === 'D' || selectedFrame === 'M';
              const isWeekly = selectedFrame === 'W';

              if (isWeekly) {
                return (
                  <Text key={i} style={[styles.xAxisLabel, {
                    position: 'absolute',
                    left: `${(i / 7) * 100}%`,
                    marginLeft: 5,
                    bottom: -20,
                    textAlign: 'left'
                  }]}>
                    {label}
                  </Text>
                );
              } else if (isGridAligned) {
                return (
                  <Text key={i} style={[styles.xAxisLabel, {
                    position: 'absolute',
                    left: `${i * 25}%`,
                    marginLeft: 5,
                    bottom: -20,
                    textAlign: 'left'
                  }]}>
                    {label}
                  </Text>
                );
              } else {
                const pct = (i / (getLabels().length - 1)) * 100;
                return (
                  <Text key={i} style={[styles.xAxisLabel, {
                    position: 'absolute',
                    left: `${pct}%`,
                    marginLeft: -15,
                    bottom: -20,
                    textAlign: 'center'
                  }]}>
                    {label}
                  </Text>
                );
              }
            })}
          </View>
        </View>

        {/* Y-Axis Labels (Right Side) */}
        <View style={styles.yAxis}>
          <Text style={[styles.axisLabel, { top: -6 }]}>{yLabels[0]}</Text>
          <Text style={[styles.axisLabel, { top: '50%', marginTop: -6 }]}>{yLabels[1]}</Text>
          <Text style={[styles.axisLabel, { bottom: 0 }]}>0</Text>
        </View>
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

    const weightVal = item.settings?.weight ? parseFloat(item.settings.weight) : 0;

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
            <Text style={[styles.workoutValue, { color: '#A358DF' }]}>{weightVal}</Text>
            <Text style={[styles.workoutUnit, { color: '#A358DF' }]}>KG</Text>
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

      {/* Mor Sis Efekti - Strength Level için */}
      <Svg
        height={SCREEN_HEIGHT}
        width={SCREEN_WIDTH}
        style={styles.backgroundGlow}
      >
        <Defs>
          <RadialGradient
            id="purpleGlow"
            cx="60%"        // Yatay merkez (Sağ taraf)
            cy="45%"        // Dikey merkez
            rx="130%"       // Yatay yayılma
            ry="70%"        // Dikey yayılma
            gradientUnits="userSpaceOnUse"
          >
            {/* Merkez: En yoğun mor */}
            <Stop
              offset="0%"
              stopColor="#A358DF"
              stopOpacity="0.25"
            />
            {/* Orta: Azalan yoğunluk */}
            <Stop
              offset="40%"
              stopColor="#A358DF"
              stopOpacity="0.1"
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
          height={SCREEN_HEIGHT}
          fill="url(#purpleGlow)"
        />
      </Svg>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="chevron-left" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Strength Level</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

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
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={styles.statValue}>{statDisplay.value}</Text>
            <Text style={styles.statUnit}>{statDisplay.unit}</Text>
          </View>
          <Text style={styles.statSub}>{statDisplay.sub}</Text>
        </View>

        {/* Chart */}
        <View style={styles.chartCard}>
          {renderChart()}
        </View>

        {/* View All Metrics Button */}
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => navigation.navigate('AllWeightMetrics')}
        >
          <Text style={styles.viewAllText}>View All Weight Metrics</Text>
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
    paddingBottom: 16,
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  selectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 18,
    padding: 2,
    marginBottom: 24,
  },
  selectorButton: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 16,
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
    alignItems: 'flex-start',
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
    color: '#A358DF', // Purple
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 0,
    lineHeight: 40,
  },
  statUnit: {
    color: '#A358DF', // Purple
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 4,
  },
  statSub: {
    color: '#8E8E93',
    fontSize: 16,
  },
  chartCard: {
    marginBottom: 4,
    height: 330,
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
    backgroundColor: '#333',
    width: '100%',
  },
  verticalGridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#333',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    zIndex: 1,
    paddingRight: 0,
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
    color: '#9DEC2C',
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
    borderRadius: 24,
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
    color: '#A358DF',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  workoutUnit: {
    color: '#A358DF',
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
