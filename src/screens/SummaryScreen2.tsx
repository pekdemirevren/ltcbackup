import React, { useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { allWorkouts } from '../constants/workoutData';
import { getSessionCalories } from '../utils/SnapshotCalorieReader';
import {
  getActiveTime,
  getCalories,
  getDSIForSession,
  get1RM,
  getRestTime,
  getTotalVolume,
} from '../utils/SessionSnapshotReader';

type SummaryScreenProps = StackScreenProps<RootStackParamList, 'SummaryOverview'>;

type SummaryNavigationTarget =
  | 'DailySummaryDetail'
  | 'Trends'
  | 'StrengthTrend'
  | 'OneRMTrend'
  | 'ProgressionTrend'
  | 'MoveScreen';

type SummaryRow = {
  label: string;
  value: string;
  detail?: string;
  route?: SummaryNavigationTarget;
  color?: string;
};

const formatMinutes = (seconds: number | null | undefined) => {
  if (!Number.isFinite(seconds) || seconds === null || seconds === undefined) return 'Not enough data yet';
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
};

const formatVolume = (value: number | null | undefined) => {
  if (!Number.isFinite(value) || value === null || value === undefined) return 'Not enough data yet';
  return `${Math.round(value).toLocaleString()} kg`;
};

const formatCalories = (value: number | null | undefined) => {
  if (!Number.isFinite(value) || value === null || value === undefined) return 'Not enough data yet';
  return `${Math.round(value).toLocaleString()} kcal`;
};

const formatShortDate = (date: string | number | Date | undefined) => {
  if (!date) return 'No recent sessions';
  const dateObj = new Date(date);
  if (Number.isNaN(dateObj.getTime())) return 'No recent sessions';
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const format1RM = (value: number | null | undefined) => {
  if (!Number.isFinite(value) || value === null || value === undefined) return 'Not enough data yet';
  return `${Math.round(value)} kg`;
};

export default function SummaryScreen({ navigation }: SummaryScreenProps) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem('workoutSummaries');
      const parsed = raw ? JSON.parse(raw) : [];
      const normalized = Array.isArray(parsed)
        ? parsed
            .filter((session) => session && session.date)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        : [];
      setSessions(normalized);
    } catch (error) {
      console.warn('SummaryScreen: failed to load workout history', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const summary = useMemo(() => {
    const now = new Date();
    const recentWindowMs = 7 * 24 * 60 * 60 * 1000;
    const recentSessions = sessions.filter((session) => {
      const date = new Date(session.date);
      return !Number.isNaN(date.getTime()) && now.getTime() - date.getTime() <= recentWindowMs;
    });

    const totalVolume = recentSessions.reduce((sum, session) => sum + (getTotalVolume(session).value ?? 0), 0);
    const totalActiveTime = recentSessions.reduce((sum, session) => sum + (getActiveTime(session).value ?? 0), 0);
    const totalRestTime = recentSessions.reduce((sum, session) => sum + (getRestTime(session).value ?? 0), 0);
    const totalCalories = recentSessions.reduce((sum, session) => sum + (getCalories(session).value ?? 0), 0);

    const oneRMValues = recentSessions
      .map((session) => get1RM(session).value)
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

    const dsiValues = recentSessions
      .map((session) => getDSIForSession(session).value)
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

    const lastSession = sessions[0];
    const lastWorkoutName = lastSession?.workoutName || lastSession?.workoutId || 'No recent workout';
    const lastWorkoutDate = formatShortDate(lastSession?.date);

    return {
      recentSessionCount: recentSessions.length,
      totalVolume,
      totalActiveTime,
      totalRestTime,
      totalCalories,
      peak1RM: oneRMValues.length > 0 ? Math.max(...oneRMValues) : null,
      averageDSI: dsiValues.length > 0 ? dsiValues.reduce((sum, value) => sum + value, 0) / dsiValues.length : null,
      lastSession,
      lastWorkoutName,
      lastWorkoutDate,
    };
  }, [sessions]);

  const quickStats: SummaryRow[] = [
    {
      label: 'Last workout',
      value: summary.lastWorkoutName,
      detail: summary.lastWorkoutDate,
      route: 'DailySummaryDetail',
      color: '#9DEC2C',
    },
    {
      label: 'Sessions',
      value: `${summary.recentSessionCount}`,
      detail: 'last 7 days',
      route: 'Trends',
      color: '#6AA8FF',
    },
    {
      label: 'Volume',
      value: formatVolume(summary.totalVolume),
      detail: 'recent load',
      route: 'StrengthTrend',
      color: '#FFB84D',
    },
    {
      label: 'Active time',
      value: formatMinutes(summary.totalActiveTime),
      detail: 'training time',
      route: 'StrengthTrend',
      color: '#D08CFF',
    },
  ];

  const trendRows: SummaryRow[] = [
    {
      label: 'Strength',
      value: summary.peak1RM ? format1RM(summary.peak1RM) : 'Not enough data yet',
      detail: 'peak 1RM',
      route: 'OneRMTrend',
      color: '#FF5F7A',
    },
    {
      label: 'DSI',
      value: summary.averageDSI ? `${summary.averageDSI.toFixed(2)}` : 'Not enough data yet',
      detail: 'recent index',
      route: 'StrengthTrend',
      color: '#B4E64B',
    },
    {
      label: 'Energy',
      value: summary.totalCalories ? formatCalories(summary.totalCalories) : 'Not enough data yet',
      detail: 'last 7 days',
      route: 'MoveScreen',
      color: '#FF7A7A',
    },
    {
      label: 'Progression',
      value: 'View trend',
      detail: 'volume + strength',
      route: 'ProgressionTrend',
      color: '#FFD166',
    },
  ];

  const goToWorkoutTab = useCallback(() => {
    const parent = navigation.getParent && navigation.getParent();
    if (parent && typeof (parent as any).navigate === 'function') {
      (parent as any).navigate('Workout');
      return;
    }
    navigation.navigate('Workout');
  }, [navigation]);

  const recentSessions = sessions.slice(0, 3).map((session) => {
    const workout = allWorkouts.find((item) => item.workoutId === session.workoutId);
    const workoutName = session.workoutName || workout?.name || session.workoutId || 'Workout';
    const calories = getSessionCalories(session.calories, {
      workoutId: session.workoutId || 'summary',
      durationSeconds: session.elapsedTime || 0,
      bodyWeightKg: session.bodyWeightKg,
      liftedWeightKg: session.liftedWeightKg || 0,
      reps: session.completedReps || 0,
    });
    const volume = getTotalVolume(session).value ?? null;
    const activeTime = getActiveTime(session).value ?? null;
    return {
      id: session.date || `${workoutName}-${Math.random()}`,
      workoutName,
      date: formatShortDate(session.date),
      calories: formatCalories(calories),
      volume: volume ? formatVolume(volume) : 'Not enough data yet',
      activeTime: activeTime ? formatMinutes(activeTime) : 'Not enough data yet',
    };
  });

  const cardPress = (route?: SummaryNavigationTarget) => {
    if (!route) return;
    navigation.navigate(route);
  };

  const hasRecentActivity = recentSessions.length > 0 || summary.recentSessionCount > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerWrap}>
          <Text style={styles.title}>Summary</Text>
          <Text style={styles.subtitle}>Recent training overview</Text>
        </View>

        {!hasRecentActivity && (
          <View style={styles.emptySummaryCard}>
            <Text style={styles.emptySummaryTitle}>No workouts logged yet</Text>
            <Text style={styles.emptySummaryText}>
              Start your first session to unlock your recent stats, energy trends, and strength history.
            </Text>
            <TouchableOpacity style={styles.primaryAction} onPress={goToWorkoutTab} activeOpacity={0.9}>
              <Text style={styles.primaryActionText}>Start workout</Text>
            </TouchableOpacity>
          </View>
        )}

        {hasRecentActivity && (
          <>
        <TouchableOpacity
          style={styles.heroCard}
          activeOpacity={0.9}
          onPress={() => cardPress(summary.lastSession ? 'DailySummaryDetail' : 'Trends')}
        >
          <Text style={styles.heroLabel}>Latest session</Text>
          <Text style={styles.heroValue}>{summary.lastWorkoutName}</Text>
          <View style={styles.heroMetaRow}>
            <Text style={styles.heroMeta}>{summary.lastWorkoutDate}</Text>
            {summary.lastSession && (
              <Text style={styles.heroMeta}>
                {getSessionCalories(summary.lastSession.calories, {
                  workoutId: summary.lastSession.workoutId || 'summary',
                  durationSeconds: summary.lastSession.elapsedTime || 0,
                  bodyWeightKg: summary.lastSession.bodyWeightKg,
                  liftedWeightKg: summary.lastSession.liftedWeightKg || 0,
                  reps: summary.lastSession.completedReps || 0,
                })
                  ? `${Math.round(
                      getSessionCalories(summary.lastSession.calories, {
                        workoutId: summary.lastSession.workoutId || 'summary',
                        durationSeconds: summary.lastSession.elapsedTime || 0,
                        bodyWeightKg: summary.lastSession.bodyWeightKg,
                        liftedWeightKg: summary.lastSession.liftedWeightKg || 0,
                        reps: summary.lastSession.completedReps || 0,
                      })
                    ).toLocaleString()} kcal`
                  : 'No recorded calories'}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.grid}>
          {quickStats.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.metricCard, { borderColor: `${item.color}55` }]}
              onPress={() => cardPress(item.route)}
              activeOpacity={0.9}
            >
              <Text style={styles.metricLabel}>{item.label}</Text>
              <Text style={[styles.metricValue, { color: item.color }]}>{item.value}</Text>
              <Text style={styles.metricDetail}>{item.detail}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Training load</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Trends')} activeOpacity={0.8}>
            <Text style={styles.linkText}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listCard}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Total volume</Text>
            <Text style={styles.rowValue}>{formatVolume(summary.totalVolume)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Active time</Text>
            <Text style={styles.rowValue}>{formatMinutes(summary.totalActiveTime)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Rest time</Text>
            <Text style={styles.rowValue}>{formatMinutes(summary.totalRestTime)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Energy</Text>
            <Text style={styles.rowValue}>{formatCalories(summary.totalCalories)}</Text>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Strength</Text>
          <TouchableOpacity onPress={() => navigation.navigate('StrengthTrend')} activeOpacity={0.8}>
            <Text style={styles.linkText}>Details</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {trendRows.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.metricCard, { borderColor: `${item.color}55` }]}
              onPress={() => cardPress(item.route)}
              activeOpacity={0.9}
            >
              <Text style={styles.metricLabel}>{item.label}</Text>
              <Text style={[styles.metricValue, { color: item.color }]}>{item.value}</Text>
              <Text style={styles.metricDetail}>{item.detail}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent sessions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('DailySummaryDetail')} activeOpacity={0.8}>
            <Text style={styles.linkText}>View details</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sessionList}>
          {recentSessions.length > 0 ? (
            recentSessions.map((session) => (
              <TouchableOpacity
                key={session.id}
                style={styles.sessionRow}
                onPress={() => navigation.navigate('DailySummaryDetail', { date: session.date })}
                activeOpacity={0.9}
              >
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionName}>{session.workoutName}</Text>
                  <Text style={styles.sessionDate}>{session.date}</Text>
                </View>
                <View style={styles.sessionStats}>
                  <Text style={styles.sessionStat}>{session.calories}</Text>
                  <Text style={styles.sessionStatSub}>{session.volume}</Text>
                  <Text style={styles.sessionStatSub}>{session.activeTime}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Not enough data yet</Text>
              <Text style={styles.emptySubText}>Your first workout will unlock trends and progress insights.</Text>
              <TouchableOpacity style={styles.secondaryAction} onPress={goToWorkoutTab} activeOpacity={0.9}>
                <Text style={styles.secondaryActionText}>Start first workout</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Quick views</Text>
        </View>

        <View style={styles.quickLinks}>
          <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Trends')}>
            <Text style={styles.linkButtonText}>Trends</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('OneRMTrend')}>
            <Text style={styles.linkButtonText}>1RM</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('ProgressionTrend')}>
            <Text style={styles.linkButtonText}>Progression</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('MoveScreen')}>
            <Text style={styles.linkButtonText}>Energy</Text>
          </TouchableOpacity>
        </View>
          </>
        )}

        {loading && (
          <View style={styles.loadingWrap}>
            <Text style={styles.loadingText}>Loading recent workouts…</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0C',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 48,
  },
  headerWrap: {
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  subtitle: {
    color: '#A9A9AE',
    fontSize: 14,
    marginTop: 6,
  },
  emptySummaryCard: {
    backgroundColor: '#171A1F',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2C2F33',
    padding: 20,
    marginBottom: 16,
  },
  emptySummaryTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  emptySummaryText: {
    color: '#C3C7CC',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  primaryAction: {
    marginTop: 16,
    backgroundColor: '#9DEC2C',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  primaryActionText: {
    color: '#0B0B0C',
    fontWeight: '700',
    fontSize: 14,
  },
  heroCard: {
    backgroundColor: '#16181C',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2C2F33',
    marginBottom: 16,
  },
  heroLabel: {
    color: '#9BA0A8',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
  },
  heroMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  heroMeta: {
    color: '#C7CBD1',
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#15181C',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    minHeight: 118,
    marginBottom: 12,
  },
  metricLabel: {
    color: '#A5ABB4',
    fontSize: 12,
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  metricDetail: {
    color: '#7C8189',
    fontSize: 11,
    marginTop: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  linkText: {
    color: '#9DEC2C',
    fontSize: 12,
    fontWeight: '600',
  },
  listCard: {
    backgroundColor: '#14171B',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2A2E33',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#23272B',
  },
  rowLabel: {
    color: '#D4D7DC',
    fontSize: 14,
  },
  rowValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  sessionList: {
    backgroundColor: '#14171B',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2A2E33',
    overflow: 'hidden',
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#23272B',
  },
  sessionInfo: {
    flex: 1,
    marginRight: 12,
  },
  sessionName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  sessionDate: {
    color: '#8B9198',
    fontSize: 12,
    marginTop: 4,
  },
  sessionStats: {
    alignItems: 'flex-end',
  },
  sessionStat: {
    color: '#9DEC2C',
    fontSize: 14,
    fontWeight: '700',
  },
  sessionStatSub: {
    color: '#C3C7CC',
    fontSize: 11,
    marginTop: 2,
  },
  quickLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  linkButton: {
    backgroundColor: '#171A1F',
    borderWidth: 1,
    borderColor: '#2C2F34',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  linkButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyState: {
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: '#A8ADB5',
    fontSize: 14,
  },
  emptySubText: {
    color: '#8A8F96',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  secondaryAction: {
    marginTop: 14,
    backgroundColor: '#1B2530',
    borderWidth: 1,
    borderColor: '#2C2F34',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  secondaryActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  loadingWrap: {
    marginTop: 12,
    alignItems: 'center',
  },
  loadingText: {
    color: '#A5ABB4',
    fontSize: 12,
  },
});
