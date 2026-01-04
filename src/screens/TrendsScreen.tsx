import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Animated, Easing, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import Feather from 'react-native-vector-icons/Feather';
import { BackButtonStyles } from '../styles/BackButtonStyle';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import MetricColors from '../constants/MetricColors';
import { calculateCalories } from '../utils/CalorieCalculator';

type TrendsScreenProps = StackScreenProps<RootStackParamList, 'Trends'>;

const COLORS = {
  background: '#000000',
  cardBg: '#1C1C1E',
  textWhite: '#FFFFFF',
  textGray: '#8E8E93',
  red: MetricColors.energy,
  blue: MetricColors.sets,
  purple: MetricColors.weight,
  pink: MetricColors.duration,
  green: '#00C7BE',
  yellow: '#D1A3FF',
};

export default function TrendsScreen({ navigation }: TrendsScreenProps) {
  const [trendsData, setTrendsData] = useState({
    energy: { val: 0, dir: 'up' },
    strength: { val: 0, dir: 'up' },
    sets: { val: 0, dir: 'up' },
    endurance: { val: 0, dir: 'up' },
    consistency: { val: 0, dir: 'up' },
    balance: { val: 0, dir: 'up' },
    cadence: { val: 0, dir: 'up' },
    density: { val: 0, dir: 'up' },
    intensity: { val: '0:1', dir: 'up' }
  });

  const scrollY = useRef(new Animated.Value(50)).current;
  const SWAP_DIST = 50;

  useFocusEffect(
    useCallback(() => {
      loadTrendData();
    }, [])
  );

  const loadTrendData = async () => {
    try {
      const stored = await AsyncStorage.getItem('workoutSummaries');
      const settingsStr = await AsyncStorage.getItem('userSettings');
      const settings = settingsStr ? JSON.parse(settingsStr) : {};
      const userWeight = settings.weight ? parseFloat(settings.weight) : 70;

      if (stored) {
        const allSummaries = JSON.parse(stored);
        const now = new Date();

        // Define Periods (7 days vs Previous 7 days)
        const getPeriodData = (daysBackStart: number, daysBackEnd: number) => {
          const startDate = new Date();
          startDate.setDate(now.getDate() - daysBackEnd);
          const endDate = new Date();
          endDate.setDate(now.getDate() - daysBackStart);

          const filtered = allSummaries.filter((s: any) => {
            const d = new Date(s.date);
            return d >= startDate && d < endDate;
          });

          const grouped: any = {};
          filtered.forEach((s: any) => {
            const ds = new Date(s.date).toDateString();
            if (!grouped[ds]) grouped[ds] = { kcal: 0, volume: 0, sets: 0, duration: 0, reps: 0, activeTime: 0, restTime: 0 };
            const weight = s.settings?.weight ? parseFloat(s.settings.weight) : 0;
            const sets = s.completedSets || 0;
            const reps = s.completedReps || 0;
            const vol = weight * sets * reps;
            const kcal = s.activeCalories ? parseFloat(s.activeCalories) : calculateCalories(s.workoutType || 'Strength', s.elapsedTime || 0, s.intensity || 'Medium', userWeight);
            const activeTime = s.activeTime || 0;
            const restTime = s.restTime || 0;

            grouped[ds].kcal += kcal;
            grouped[ds].volume += vol;
            grouped[ds].sets += sets;
            grouped[ds].duration += (s.elapsedTime || 0);
            grouped[ds].reps += reps;
            grouped[ds].activeTime += activeTime;
            grouped[ds].restTime += restTime;
          });

          const count = Object.keys(grouped).length || 1;
          const totalReps = Object.values(grouped).reduce((a: number, b: any) => a + b.reps, 0);
          const totalDuration = Object.values(grouped).reduce((a: number, b: any) => a + b.duration, 0);
          const totalActiveTime = Object.values(grouped).reduce((a: number, b: any) => a + b.activeTime, 0);
          const totalRestTime = Object.values(grouped).reduce((a: number, b: any) => a + b.restTime, 0);
          const cadenceVal = totalReps > 0 && totalDuration > 0 ? (totalDuration / totalReps).toFixed(1) : 0;
          const densityVal = totalDuration > 0 ? Math.round((totalActiveTime / totalDuration) * 100) : 0;
          const intensityRatio = totalRestTime > 0 ? `${Math.round(totalActiveTime / 60)}:${Math.round(totalRestTime / 60)}` : '0:1';
          
          return {
            kcal: Object.values(grouped).reduce((a: number, b: any) => a + b.kcal, 0) / count,
            vol: Object.values(grouped).reduce((a: number, b: any) => a + b.volume, 0) / count,
            sets: Object.values(grouped).reduce((a: number, b: any) => a + b.sets, 0) / count,
            dur: (Object.values(grouped).reduce((a: number, b: any) => a + b.duration, 0) / count) / 60,
            activeDays: count,
            cadence: parseFloat(cadenceVal.toString()),
            density: densityVal,
            intensity: intensityRatio
          };
        };

        const current = getPeriodData(0, 7);
        const previous = getPeriodData(7, 14);

        const getDir = (curr: number, prev: number) => curr >= prev ? 'up' : 'down';

        setTrendsData({
          energy: { val: Math.round(current.kcal), dir: getDir(current.kcal, previous.kcal) },
          strength: { val: Math.round(current.vol), dir: getDir(current.vol, previous.vol) },
          sets: { val: Math.round(current.sets), dir: getDir(current.sets, previous.sets) },
          endurance: { val: Math.round(current.dur), dir: getDir(current.dur, previous.dur) },
          consistency: { val: Math.round((current.activeDays / 7) * 100), dir: getDir(current.activeDays, previous.activeDays) },
          balance: { val: Math.round(([current.kcal > 0, current.vol > 0, current.sets > 0, current.dur > 0].filter(Boolean).length / 4) * 100), dir: 'up' },
          cadence: { val: current.cadence || 0, dir: getDir(current.cadence || 0, previous.cadence || 0) },
          density: { val: current.density || 0, dir: getDir(current.density || 0, previous.density || 0) },
          intensity: { val: current.intensity || '0:1', dir: 'up' }
        });
      }
    } catch (e) {
      console.error("Error loading trends:", e);
    }
  };

  const trends = [
    { title: 'Energy', value: `${trendsData.energy.val}`, unit: 'KCAL/DAY', desc: 'Daily calorie burn average.', color: COLORS.red, screen: 'MoveScreen', direction: trendsData.energy.dir },
    { title: 'Strength', value: `${trendsData.strength.val}`, unit: 'KG/DAY', desc: 'Daily training volume average.', color: COLORS.purple, screen: 'StrengthTrend', direction: trendsData.strength.dir },
    { title: 'Sets', value: `${trendsData.sets.val}`, unit: 'SETS/DAY', desc: 'Average sets completed daily.', color: COLORS.blue, screen: 'SetsTrend', direction: trendsData.sets.dir },
    { title: 'Endurance', value: `${trendsData.endurance.val}`, unit: 'MIN/DAY', desc: 'Average workout duration.', color: COLORS.pink, screen: 'EnduranceTrend', direction: trendsData.endurance.dir },
    { title: 'Consistency', value: `${trendsData.consistency.val}%`, unit: 'FREQUENCY', desc: 'Workout frequency (last 7 days).', color: COLORS.green, screen: 'ConsistencyTrend', direction: trendsData.consistency.dir },
    { title: 'Balance', value: `${trendsData.balance.val}%`, unit: 'VARIETY', desc: 'Training variety score.', color: COLORS.yellow, screen: 'BalanceTrend', direction: trendsData.balance.dir },
    { title: 'Cadence', value: `${trendsData.cadence.val}`, unit: 's/REP', desc: 'Average time per rep.', color: MetricColors.speed, screen: 'CadenceTrend', direction: trendsData.cadence.dir },
    { title: 'Density', value: `${trendsData.density.val}%`, unit: 'ACTIVE', desc: 'Active time percentage.', color: '#9DEC2C', screen: 'DensityTrend', direction: trendsData.density.dir },
    { title: 'Intensity', value: `${trendsData.intensity.val}`, unit: 'RATIO', desc: 'Active to rest time ratio.', color: MetricColors.energy, screen: 'IntensityTrend', direction: trendsData.intensity.dir },
  ];

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, SWAP_DIST],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const largeTitleOpacity = scrollY.interpolate({
    inputRange: [0, SWAP_DIST],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const keepMovingTitleOpacity = scrollY.interpolate({
    inputRange: [0, SWAP_DIST],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[BackButtonStyles.backButton, { backgroundColor: '#2C2C2E' }]}>
          <Feather name="chevron-left" size={28} color={COLORS.textWhite} />
        </TouchableOpacity>
        <Animated.Text style={[styles.headerTitle, { opacity: headerOpacity }]}>Trends</Animated.Text>
        <View style={styles.headerIconStub} />
      </View>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentOffset={{ x: 0, y: SWAP_DIST }}
      >
        <Animated.View style={{ opacity: largeTitleOpacity, height: SWAP_DIST, justifyContent: 'center' }}>
          <Text style={styles.largeTitle}>Trends</Text>
        </Animated.View>

        <View style={styles.topInfoContainer}>
          <Animated.Text style={[styles.sectionTitleSmall, { opacity: keepMovingTitleOpacity }]}>Keep Moving</Animated.Text>
          <Text style={styles.infoText}>
            Earn your next trend by continuing to close your rings and doing workouts.
          </Text>
        </View>

        <View style={styles.grid}>
          {trends.map((trend) => (
            <TrendCard
              key={trend.title}
              data={trend}
              onPress={() => navigation.navigate(trend.title === 'Energy' ? 'MoveScreen' : trend.screen as any)}
            />
          ))}
        </View>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            Trends compares your last 7 days of activity to the previous 7.
            If you are doing the same or better, your arrow will be up.
          </Text>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const TrendArrow = ({ direction, color }: { direction: string, color: string }) => {
  const animValue = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(animValue, {
      toValue: 1,
      duration: 600,
      delay: 1000,
      useNativeDriver: true,
      easing: Easing.out(Easing.back(1.5)),
    }).start();
  }, []);

  const isUp = direction === 'up';
  const isDown = direction === 'down';
  let translateY = isUp ? 20 : -20;

  const animatedStyle = {
    transform: [
      { translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [translateY, 0] }) }
    ],
    opacity: animValue
  };

  return (
    <View style={styles.arrowCircleContainer}>
      <View style={styles.arrowCircleMask}>
        <Animated.View style={[styles.arrowContainer, animatedStyle]}>
          <Feather name={isUp ? 'chevron-up' : 'chevron-down'} size={40} color={color} />
        </Animated.View>
      </View>
    </View>
  );
};

const TrendCard = ({ data, onPress }: { data: any, onPress: () => void }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.leftColumn}><TrendArrow direction={data.direction} color={data.color} /></View>
    <View style={styles.cardContent}>
      <Text style={styles.cardTitle}>{data.title}</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.cardValue, { color: data.color }]}>{data.value}</Text>
        <Text style={[styles.cardUnit, { color: data.color }]}>{data.unit}</Text>
      </View>
      <Text style={styles.cardDesc} numberOfLines={2}>{data.desc}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingTop: 10, paddingBottom: 0 },
  headerTitle: { color: COLORS.textWhite, fontSize: 17, fontWeight: '600' },
  headerIconStub: { width: 44, height: 44 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 0, paddingBottom: 40 },
  largeTitle: { fontSize: 34, fontWeight: 'bold', color: COLORS.textWhite, marginBottom: 0, marginTop: 10 },
  topInfoContainer: { marginTop: 0, marginBottom: 24, paddingHorizontal: 0 },
  sectionTitleSmall: { color: COLORS.textWhite, fontSize: 17, fontWeight: 'bold', marginBottom: 8 },
  infoText: { color: COLORS.textGray, fontSize: 15, lineHeight: 20, textAlign: 'left' },
  grid: { marginBottom: 20 },
  card: { backgroundColor: COLORS.cardBg, borderRadius: 24, padding: 16, flexDirection: 'row', marginBottom: 12, alignItems: 'center', minHeight: 100 },
  leftColumn: { marginRight: 16, justifyContent: 'center', alignItems: 'center' },
  arrowCircleContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  arrowCircleMask: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  arrowContainer: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  cardContent: { flex: 1, justifyContent: 'center' },
  cardTitle: { color: '#EBEBF5', fontSize: 17, fontWeight: '500', marginBottom: 0 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 6 },
  cardValue: { fontSize: 22, fontWeight: 'bold' },
  cardUnit: { fontSize: 14, fontWeight: '600' },
  cardDesc: { color: COLORS.textGray, fontSize: 14, lineHeight: 18 },
  footerContainer: { marginTop: 20, marginBottom: 40, paddingHorizontal: 4 },
  footerText: { color: COLORS.textGray, fontSize: 15, lineHeight: 20, textAlign: 'left' },
});
