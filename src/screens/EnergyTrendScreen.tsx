import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, StatusBar, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { PieChart } from '../components/PieChart';
import { allWorkouts } from '../constants/workoutData';

const COLORS = {
  background: '#000000',
  textWhite: '#FFFFFF',
  textGray: '#8E8E93',
  yellow: '#FFD60A', // Balance Rengi
  chartBar: '#3A3A3C',
  separator: '#2C2C2E',
  iconBg: '#1C1C1E',
  // Pie Slice Colors
  c1: '#FF3B30',
  c2: '#FF9500',
  c3: '#FFD60A',
  c4: '#32D74B',
  c5: '#64D2FF',
  c6: '#0A84FF',
  c7: '#5E5CE6',
  c8: '#BF5AF2',
};

const PIE_COLORS = [COLORS.c1, COLORS.c2, COLORS.c3, COLORS.c4, COLORS.c5, COLORS.c6, COLORS.c7, COLORS.c8];

const SCREEN_WIDTH = Dimensions.get('window').width;

type TimeFrame = 'W' | 'M' | 'Y' | 'ALL';

export default function EnergyTrendScreen({ navigation }) {
  const [selectedFrame, setSelectedFrame] = useState<TimeFrame>('W');
  const [pieData, setPieData] = useState<any[]>([]);
  const [topMuscle, setTopMuscle] = useState('None');

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

      // Map for quick lookup
      const workoutMap = new Map();
      allWorkouts.forEach(w => {
        if (w.workoutId) workoutMap.set(w.workoutId, w.muscleGroup);
        if (w.name) workoutMap.set(w.name, w.muscleGroup);
      });

      // Filter by date
      const isSameDay = (d1: Date, d2: Date) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

      let filtered = [];
      if (selectedFrame === 'W') {
        const start = new Date();
        start.setDate(now.getDate() - 7);
        filtered = allSummaries.filter((s: any) => new Date(s.date) >= start);
      } else if (selectedFrame === 'M') {
        const start = new Date();
        start.setDate(now.getDate() - 30);
        filtered = allSummaries.filter((s: any) => new Date(s.date) >= start);
      } else if (selectedFrame === 'Y') {
        const start = new Date();
        start.setDate(now.getDate() - 365);
        filtered = allSummaries.filter((s: any) => new Date(s.date) >= start);
      } else {
        filtered = allSummaries;
      }

      // Aggregate by Muscle Group
      const counts: { [key: string]: number } = {};
      filtered.forEach((s: any) => {
        // Determine muscle group
        let group = 'Other';
        // Try exact ID match
        if (s.workoutId && workoutMap.has(s.workoutId)) group = workoutMap.get(s.workoutId);
        // Try Name match
        else if (s.workoutName) {
          // Try exact name
          if (workoutMap.has(s.workoutName)) group = workoutMap.get(s.workoutName);
          // Try heuristic if not found (legacy data fallback)
          else {
            const n = s.workoutName.toLowerCase();
            if (n.includes('squat') || n.includes('leg') || n.includes('run')) group = 'Legs';
            else if (n.includes('bench') || n.includes('push')) group = 'Chest';
            else if (n.includes('row') || n.includes('pull')) group = 'Back';
            else group = 'Other';
          }
        }

        // Weight by Sets (more robust than count)
        counts[group] = (counts[group] || 0) + (s.completedSets || 1);
      });

      // Convert to Pie Data
      // Get total for percentage
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      const data = Object.keys(counts).map((key, index) => ({
        key,
        value: counts[key],
        label: key,
        color: PIE_COLORS[index % PIE_COLORS.length]
      })).sort((a, b) => b.value - a.value);

      setPieData(data);
      if (data.length > 0) setTopMuscle(data[0].key);

    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={28} color={COLORS.yellow} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Balance</Text>
          <View style={styles.selectorContainer}>
            {(['W', 'M', 'Y', 'ALL'] as TimeFrame[]).map((frame) => (
              <TouchableOpacity
                key={frame}
                style={[styles.selectorButton, selectedFrame === frame && styles.selectorButtonActive]}
                onPress={() => setSelectedFrame(frame)}
              >
                <Text style={[styles.selectorText, selectedFrame === frame && styles.selectorTextActive]}>{frame}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* TOP MUSCLE GROUP */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>TOP FOCUS</Text>
          <Text style={[styles.statValue, { color: COLORS.yellow }]}>{topMuscle.toUpperCase()}</Text>

          <View style={styles.chartContainer}>
            <PieChart
              data={pieData}
              size={200}
              centerLabel={pieData.length.toString()}
              centerSubLabel="Groups"
            />
          </View>
        </View>

        {/* LEGEND */}
        <View style={styles.legendContainer}>
          {pieData.map((item) => (
            <View key={item.key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.label}</Text>
              <Text style={styles.legendValue}>{Math.round((item.value / pieData.reduce((a, b) => a + b.value, 0)) * 100)}%</Text>
            </View>
          ))}
        </View>

        <View style={styles.descriptionFooter}>
          <Text style={styles.footerText}>
            Tracking muscle group balance ensures a well-rounded physique and prevents injury.
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    alignItems: 'flex-start',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  titleSection: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
  },
  mainTitle: {
    color: COLORS.textWhite,
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  selectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 2,
  },
  selectorButton: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 10,
  },
  selectorButtonActive: {
    backgroundColor: '#636366',
  },
  selectorText: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
  },
  selectorTextActive: {
    color: '#FFF',
  },
  chartSection: {
    borderTopWidth: 0.5,
    borderTopColor: COLORS.separator,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  chartTitle: {
    color: COLORS.textGray,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    alignSelf: 'flex-start',
    letterSpacing: 0.5,
  },
  statValue: {
    color: COLORS.textWhite,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  chartContainer: {
    marginBottom: 10,
  },
  legendContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 10,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    color: '#FFF',
    fontSize: 14,
    flex: 1,
  },
  legendValue: {
    color: COLORS.textGray,
    fontSize: 14,
  },
  descriptionFooter: {
    paddingHorizontal: 16,
    paddingTop: 20,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.separator,
    marginTop: 10,
  },
  footerText: {
    color: COLORS.textGray,
    fontSize: 15,
    lineHeight: 22,
  },
});
