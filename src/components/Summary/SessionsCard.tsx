
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { allWorkouts } from '../../constants/workoutData';
import { calculateCalories } from '../../utils/CalorieCalculator';
import MetricColors from '../../constants/MetricColors';
import { SessionsSquareCardStyle } from '../../styles/sessionssquarecardstyle';

interface SessionsCardProps {
  type: 'List' | 'Square';
  recentSessions: any[];
  onPress: () => void;
  onItemPress: (session: any) => void;
  isEditing?: boolean;
}

export const SessionsCard: React.FC<SessionsCardProps> = ({
  type,
  recentSessions,
  onPress,
  onItemPress,
  isEditing,
}) => {
  if (type === 'Square') {
    const session = recentSessions[0];
    if (!session) return null;

    const workout = allWorkouts.find(w => w.workoutId === session.workoutId);
    const SvgIcon = workout?.SvgIcon;
    const sessionDate = new Date(session.date);
    const isToday = sessionDate.toDateString() === new Date().toDateString();
    const dateLabel = isToday ? 'Today' : sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
    const weightVal = session.settings?.weight ? parseFloat(session.settings.weight) : 0;
    const cals = session.calories || calculateCalories(session.workoutId, session.elapsedTime, weightVal, session.completedReps);

    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={1}
        disabled={isEditing}
        style={SessionsSquareCardStyle.sessionSquareCard}
      >
        <Text style={SessionsSquareCardStyle.sessionSquareHeader}>Sessions</Text>
        <View style={SessionsSquareCardStyle.sessionSquareIconRow}>
          {SvgIcon && (
            <LinearGradient colors={['#122003', '#213705']} style={SessionsSquareCardStyle.sessionSquareIconCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <SvgIcon width={28} height={28} fill="#9DEC2C" />
            </LinearGradient>
          )}
        </View>
        <Text style={SessionsSquareCardStyle.sessionSquareWorkoutName} numberOfLines={1}>{session.workoutName}</Text>
        <Text style={SessionsSquareCardStyle.sessionSquareMetric}>
          {cals}<Text style={SessionsSquareCardStyle.sessionSquareUnit}>KCAL</Text>
        </Text>
        <Text style={SessionsSquareCardStyle.sessionSquareDate}>{dateLabel}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.sectionCard}>
      <TouchableOpacity
        style={styles.cardHeaderRow}
        onPress={onPress}
        activeOpacity={1}
        disabled={isEditing}
      >
        <Text style={styles.sessionsTitle}>Sessions</Text>
      </TouchableOpacity>

      {recentSessions.length > 0 ? (
        recentSessions.slice(0, 3).map((session, idx) => {
          const sessionDate = new Date(session.date);
          const workout = allWorkouts.find(w => w.workoutId === session.workoutId);
          const SvgIcon = workout?.SvgIcon;
          const weightVal = session.settings?.weight ? parseFloat(session.settings.weight) : 0;
          const cals = calculateCalories(session.workoutId, session.elapsedTime, weightVal, session.completedReps);
          const isToday = sessionDate.toDateString() === new Date().toDateString();
          const dateLabel = isToday ? 'Today' : sessionDate.toLocaleDateString('en-US', { weekday: 'long' });
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          const finalDateLabel = sessionDate < oneWeekAgo ? sessionDate.toLocaleDateString('de-DE') : dateLabel;

          return (
            <TouchableOpacity
              key={idx}
              style={[styles.sessionItem, idx === Math.min(recentSessions.length, 3) - 1 && { borderBottomWidth: 0 }]}
              onPress={() => onItemPress(session)}
              activeOpacity={1}
              disabled={isEditing}
            >
              <LinearGradient
                colors={['#122003', '#213705']}
                style={styles.sessionIconContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {SvgIcon && <SvgIcon width={39} height={39} fill="#9DEC2C" />}
              </LinearGradient>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionWorkoutName}>{session.workoutName}</Text>
                <Text style={styles.sessionMetric}>{cals}<Text style={styles.sessionUnit}>KCAL</Text></Text>
              </View>
              <Text style={styles.sessionDateLabel}>{finalDateLabel}</Text>
            </TouchableOpacity>
          );
        })
      ) : (
        <Text style={styles.emptyText}>No recent sessions</Text>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
    sectionCard: {
        backgroundColor: '#2A292A',
        borderRadius: 24,
        paddingTop: 12,
        paddingHorizontal: 16,
        paddingBottom: 2,
        marginBottom: 0,
        overflow: 'hidden',
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: 0,
        gap: 6,
    },
    sessionsTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFF',
        flex: 1,
    },
    sessionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    sessionIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    sessionInfo: {
        flex: 1,
    },
    sessionWorkoutName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 2,
    },
    sessionMetric: {
        fontSize: 29,
        color: MetricColors.energy,
        fontWeight: '600',
    },
    sessionUnit: {
        fontSize: 19,
        color: MetricColors.energy,
        fontWeight: '700',
    },
    sessionDateLabel: {
        fontSize: 12,
        color: '#8E8E93',
    },
    emptyText: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        paddingVertical: 20,
    },
});
