import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, StatusBar, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { BackButtonStyles } from '../styles/BackButtonStyle';
import MetricColors from '../constants/MetricColors';
import { calculateCalories } from '../utils/CalorieCalculator';

const COLORS = {
  background: '#000000',
  textWhite: '#FFFFFF',
  textGray: '#8E8E93',
  separator: '#2C2C2E',
};

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function MoveScreen({ navigation }: { navigation: any }) {
  const [monthlyData, setMonthlyData] = useState<number[]>(new Array(12).fill(0));
  const [weeklyData, setWeeklyData] = useState<number[]>(new Array(7).fill(0));
  const [averageMetric, setAverageMetric] = useState(0);
  const [yearlyAverage, setYearlyAverage] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [activeDays, setActiveDays] = useState(0);
  const [last90Days, setLast90Days] = useState({ active: 0, total: 90 });
  const [trendDirection, setTrendDirection] = useState<'up' | 'down'>('down');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem('workoutSummaries');
      const settingsStr = await AsyncStorage.getItem('userSettings');
      const settings = settingsStr ? JSON.parse(settingsStr) : {};
      const userWeight = settings.weight ? parseFloat(settings.weight) : 70;

      if (!stored) return;
      const allSummaries = JSON.parse(stored);
      const now = new Date();

      const getCalories = (s: any) => {
        if (s.activeCalories) return parseFloat(s.activeCalories);
        return calculateCalories(
          s.workoutType || 'Strength',
          s.elapsedTime || 0,
          s.intensity || 'Medium',
          userWeight
        );
      };

      // Monthly data for the year (12 months)
      const monthly = new Array(12).fill(0);
      const yearFiltered = allSummaries.filter((s: any) => new Date(s.date).getFullYear() === now.getFullYear());
      
      const uniqueDaysPerMonth: Set<string>[] = Array.from({ length: 12 }, () => new Set());
      
      yearFiltered.forEach((s: any) => {
        const d = new Date(s.date);
        const month = d.getMonth();
        monthly[month] += getCalories(s);
        uniqueDaysPerMonth[month].add(d.toDateString());
      });

      // Calculate average per active day for each month
      for (let i = 0; i < 12; i++) {
        if (uniqueDaysPerMonth[i].size > 0) {
          monthly[i] = Math.round(monthly[i] / uniqueDaysPerMonth[i].size);
        }
      }
      setMonthlyData(monthly);

      // Weekly data (last 7 days)
      const weekly = new Array(7).fill(0);
      const isSameDay = (d1: Date, d2: Date) =>
        d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(now.getDate() - (6 - i));
        const daySummaries = allSummaries.filter((s: any) => isSameDay(new Date(s.date), d));
        let total = 0;
        daySummaries.forEach((s: any) => {
          total += getCalories(s);
        });
        weekly[i] = Math.round(total);
      }
      setWeeklyData(weekly);

      // Calculate weekly average
      const validWeekly = weekly.filter(v => v > 0);
      const weekAvg = validWeekly.length > 0 ? Math.round(validWeekly.reduce((a, b) => a + b, 0) / validWeekly.length) : 0;
      setAverageMetric(weekAvg);

      // Calculate yearly average
      const validMonthly = monthly.filter(v => v > 0);
      const yearAvg = validMonthly.length > 0 ? Math.round(validMonthly.reduce((a, b) => a + b, 0) / validMonthly.length) : 0;
      setYearlyAverage(yearAvg);

      // Trend direction (compare current month vs previous)
      const currentMonth = now.getMonth();
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      setTrendDirection(monthly[currentMonth] >= monthly[prevMonth] ? 'up' : 'down');

      // Calculate active days for rings closed
      const dailyGoal = 500; // Default goal
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      setTotalDays(dayOfYear);

      // Count days where goal was met
      const dailyTotals: { [key: string]: number } = {};
      allSummaries.forEach((s: any) => {
        const d = new Date(s.date);
        if (d.getFullYear() === now.getFullYear()) {
          const key = d.toDateString();
          if (!dailyTotals[key]) dailyTotals[key] = 0;
          dailyTotals[key] += getCalories(s);
        }
      });
      
      let activeDaysCount = 0;
      Object.values(dailyTotals).forEach(cal => {
        if (cal >= dailyGoal) activeDaysCount++;
      });
      setActiveDays(activeDaysCount);

      // Last 90 days calculation
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(now.getDate() - 90);
      const last90Totals: { [key: string]: number } = {};
      allSummaries.forEach((s: any) => {
        const d = new Date(s.date);
        if (d >= ninetyDaysAgo && d <= now) {
          const key = d.toDateString();
          if (!last90Totals[key]) last90Totals[key] = 0;
          last90Totals[key] += getCalories(s);
        }
      });
      
      let last90ActiveCount = 0;
      Object.values(last90Totals).forEach(cal => {
        if (cal >= dailyGoal) last90ActiveCount++;
      });
      setLast90Days({ active: last90ActiveCount, total: 90 });

    } catch (e) {
      console.error(e);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const formatDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${formatDate(startOfYear)} – ${formatDate(now)}`;
  };

  const monthLabels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  const weekDayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const renderYearlyChart = () => {
    const maxVal = Math.max(...monthlyData, 1);
    const chartHeight = 140;
    const currentMonth = new Date().getMonth();

    return (
      <View style={styles.yearlyChartContainer}>
        <Text style={styles.chartRightLabel}>KILOCALORIES</Text>
        <View style={styles.chartWithLine}>
          {/* Grid lines */}
          <View style={[styles.gridLine, { bottom: chartHeight + 20 }]} />
          <View style={[styles.gridLine, { bottom: chartHeight * 0.75 + 20 }]} />
          <View style={[styles.gridLine, { bottom: chartHeight * 0.5 + 20 }]} />
          <View style={[styles.gridLine, { bottom: chartHeight * 0.25 + 20 }]} />
          <View style={[styles.gridLine, { bottom: 20 }]} />
          {/* Average line */}
          <View style={[styles.averageLine, { bottom: chartHeight + 20 - ((yearlyAverage / maxVal) * chartHeight) }]}>
            <Text style={styles.averageLineLabel}>{yearlyAverage}</Text>
          </View>
          {/* Current average line (pink) */}
          <View style={[styles.currentLine, { bottom: chartHeight + 20 - ((averageMetric / maxVal) * chartHeight) }]}>
            <View style={styles.currentLabelBubble}>
              <Text style={styles.currentLineLabel}>{averageMetric}</Text>
            </View>
          </View>
          {/* Bars */}
          <View style={styles.barsRow}>
            {monthlyData.map((val, idx) => {
              const barHeight = maxVal > 0 ? (val / maxVal) * chartHeight : 0;
              const isCurrentOrRecent = idx >= currentMonth - 2 && idx <= currentMonth;
              return (
                <View key={idx} style={styles.barWrapper}>
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        height: Math.max(barHeight, 2), 
                        backgroundColor: isCurrentOrRecent ? MetricColors.energy : '#8E8E93' 
                      }
                    ]} 
                  />
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
          <Text style={styles.weeklyTitle}>Daily Averages</Text>
          <Text style={styles.weeklyValue}>{Math.max(...weeklyData)} KCAL</Text>
        </View>
        {/* Chart with grid lines */}
        <View style={styles.weeklyChartWithLines}>
          {/* Grid lines */}
          <View style={[styles.weeklyGridLine, { top: 0 }]} />
          <View style={[styles.weeklyGridLine, { top: chartHeight * 0.5 }]} />
          <View style={[styles.weeklyGridLine, { top: chartHeight }]} />
          <View style={[styles.weeklyLineLabel, { position: 'absolute', right: 0, top: 0 }]}>
            <Text style={styles.weeklyLineLabelText}>{Math.max(...weeklyData)}</Text>
          </View>
          <View style={[styles.weeklyLineLabel, { position: 'absolute', right: 0, top: chartHeight * 0.5 }]}>
            <Text style={styles.weeklyLineLabelText}>{Math.round(Math.max(...weeklyData) / 2)}</Text>
          </View>
          <View style={[styles.weeklyLineLabel, { position: 'absolute', right: 0, bottom: 16 }]}>
            <Text style={styles.weeklyLineLabelText}>0</Text>
          </View>
          <View style={styles.weeklyBarsRow}>
            {weeklyData.map((val, idx) => {
              const barHeight = maxVal > 0 ? (val / maxVal) * chartHeight : 0;
              const avgHeight = maxVal > 0 ? (averageMetric / maxVal) * chartHeight : 0;
              return (
                <View key={idx} style={styles.weeklyBarWrapper}>
                  <View style={styles.weeklyBarPair}>
                    <View 
                      style={[
                        styles.weeklyBarThin, 
                        { 
                          height: Math.max(avgHeight, 2), 
                          backgroundColor: '#8E8E93' 
                        }
                      ]} 
                    />
                    <View 
                      style={[
                        styles.weeklyBarThin, 
                        { 
                          height: Math.max(barHeight, 2), 
                          backgroundColor: MetricColors.energy 
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.weeklyBarLabel}>{weekDayLabels[idx]}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  const yearlyPercent = totalDays > 0 ? Math.round((activeDays / totalDays) * 100) : 0;
  const last90Percent = last90Days.total > 0 ? Math.round((last90Days.active / last90Days.total) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <TouchableOpacity
        style={[BackButtonStyles.topBackButton, BackButtonStyles.backButton, { backgroundColor: '#2C2C2E' }]}
        onPress={() => navigation.goBack()}
      >
        <Feather name="chevron-left" size={28} color={COLORS.textWhite} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <Text style={styles.mainTitle}>Move</Text>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.arrowCircle}>
            <MaterialCommunityIcons 
              name={trendDirection === 'up' ? 'chevron-up' : 'chevron-down'} 
              size={32} 
              color={MetricColors.energy} 
            />
          </View>
          <View style={styles.summaryText}>
            <Text style={styles.summaryValue}>{averageMetric}<Text style={styles.summaryUnit}>KCAL/DAY</Text></Text>
            <Text style={styles.summaryDescription}>
              {trendDirection === 'down' 
                ? `This arrow needs some love. Try to burn at least ${averageMetric + 10} kilocalories a day to turn things around.`
                : `Great job! You're on track with your daily calorie burn.`
              }
            </Text>
          </View>
        </View>

        <View style={styles.separator} />

        {/* Date Range */}
        <Text style={styles.dateRange}>{getDateRange()}</Text>

        {/* Yearly Chart */}
        {renderYearlyChart()}

        <View style={styles.separator} />

        {/* Weekly Chart */}
        {renderWeeklyChart()}

        <View style={styles.separator} />

        {/* Move Rings Closed */}
        <View style={styles.ringsSection}>
          <Text style={styles.ringsTitle}>Move Rings Closed</Text>
          <Text style={styles.ringsYearly}>{activeDays}/{totalDays} days (%{yearlyPercent})</Text>
          <Text style={[styles.rings90, { color: MetricColors.energy }]}>{last90Days.active}/{last90Days.total} days (%{last90Percent})</Text>
        </View>

        <View style={styles.separator} />

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionText}>
            Move is the amount of calories you burn by moving. This accounts for everything from light household chores and slow walks to biking or working out at the gym.{' '}
            <Text style={styles.learnMore}>Learn more...</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  mainTitle: {
    color: COLORS.textWhite,
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  arrowCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryText: {
    flex: 1,
  },
  summaryValue: {
    color: MetricColors.energy,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryUnit: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryDescription: {
    color: COLORS.textGray,
    fontSize: 14,
    lineHeight: 20,
  },
  separator: {
    height: 0.5,
    backgroundColor: COLORS.separator,
    marginVertical: 16,
  },
  dateRange: {
    color: COLORS.textWhite,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
  },
  yearlyChartContainer: {
    marginTop: 8,
  },
  chartRightLabel: {
    color: COLORS.textGray,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  chartWithLine: {
    height: 180,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  averageLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(142, 142, 147, 0.5)',
    borderStyle: 'dashed',
  },
  averageLineLabel: {
    position: 'absolute',
    left: 0,
    top: -10,
    color: COLORS.textGray,
    fontSize: 11,
    backgroundColor: COLORS.background,
    paddingHorizontal: 4,
  },
  currentLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: MetricColors.energy,
    borderStyle: 'dashed',
  },
  currentLabelBubble: {
    position: 'absolute',
    right: 0,
    top: -12,
    backgroundColor: MetricColors.energy,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  currentLineLabel: {
    color: '#000',
    fontSize: 11,
    fontWeight: '600',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    marginTop: 20,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  barLabel: {
    color: COLORS.textGray,
    fontSize: 10,
    marginTop: 4,
  },
  yearLabel: {
    color: COLORS.textGray,
    fontSize: 11,
    marginTop: 4,
  },
  weeklyChartContainer: {
    marginTop: 8,
  },
  weeklyChartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weeklyTitle: {
    color: COLORS.textWhite,
    fontSize: 17,
    fontWeight: '600',
  },
  weeklyValue: {
    color: COLORS.textGray,
    fontSize: 14,
  },
  weeklyChartWithLines: {
    height: 100,
    position: 'relative',
  },
  weeklyGridLine: {
    position: 'absolute',
    left: 0,
    right: 40,
    height: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  weeklyLineLabel: {
    backgroundColor: COLORS.background,
  },
  weeklyLineLabelText: {
    color: COLORS.textGray,
    fontSize: 10,
  },
  weeklyBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 80,
    paddingRight: 40,
  },
  weeklyBarWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  weeklyBar: {
    width: 16,
    borderRadius: 4,
    marginBottom: 4,
  },
  weeklyBarPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  weeklyBarThin: {
    width: 6,
    borderRadius: 3,
  },
  weeklyBarLabel: {
    color: COLORS.textGray,
    fontSize: 12,
    marginTop: 4,
  },
  ringsSection: {
    marginTop: 8,
  },
  ringsTitle: {
    color: COLORS.textWhite,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  ringsYearly: {
    color: COLORS.textGray,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 2,
  },
  rings90: {
    fontSize: 20,
    fontWeight: '600',
  },
  descriptionSection: {
    marginTop: 8,
  },
  descriptionText: {
    color: COLORS.textGray,
    fontSize: 15,
    lineHeight: 22,
  },
  learnMore: {
    color: '#007AFF',
  },
});
