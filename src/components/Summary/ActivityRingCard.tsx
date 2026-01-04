
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import Feather from 'react-native-vector-icons/Feather';
import MetricColors from '../../constants/MetricColors';

interface ActivityRingCardProps {
  dailyCalories: number;
  dailyGoal: number;
  onPress: () => void;
  isEditing?: boolean;
}

export const ActivityRingCard: React.FC<ActivityRingCardProps> = ({
  dailyCalories,
  dailyGoal,
  onPress,
  isEditing,
}) => {
  return (
    <TouchableOpacity
      style={styles.activityCard}
      onPress={onPress}
      activeOpacity={1}
      disabled={isEditing}
    >
      <Text style={[styles.cardTitle, { marginBottom: 12 }]}>Activity Ring</Text>
      <View style={styles.activityContent}>
        <View style={styles.ringContainer}>
          <AnimatedCircularProgress
            size={140}
            width={30}
            fill={(dailyCalories / dailyGoal) * 100}
            tintColor="#FA114F"
            backgroundColor="#3E0E18"
            rotation={0}
            lineCap="round"
          >
            {() => (
              <View style={styles.arrowContainer}>
                <View style={styles.arrowCircle}>
                  <Feather name="arrow-right" size={22} color="#000" />
                </View>
              </View>
            )}
          </AnimatedCircularProgress>
        </View>
        <View style={styles.activityStats}>
          <Text style={styles.activityLabel}>Move</Text>
          <Text>
            <Text style={[styles.activityCurrent, { color: MetricColors.energy }]}>
              {Math.round(dailyCalories)}/{dailyGoal}
            </Text>
            <Text style={[styles.activityUnit, { color: MetricColors.energy }]}>KCAL</Text>
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  activityCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 16,
    height: 210,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
    flex: 1,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ringContainer: {
    marginRight: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingTop: 0,
  },
  arrowCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F9104F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityStats: {
    flex: 1,
  },
  activityLabel: {
    fontSize: 17,
    color: '#FFF',
    marginBottom: 0,
  },
  activityCurrent: {
    fontSize: 28,
    fontWeight: '600',
  },
  activityUnit: {
    fontSize: 18,
    fontWeight: '600',
  },
});
