import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = StackScreenProps<RootStackParamList, 'DailyMoveGoal'>;

export default function DailyMoveGoalScreen({ navigation }: Props) {
  const [goal, setGoal] = useState(500);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadCurrentGoal();
  }, []);

  const loadCurrentGoal = async () => {
    try {
      const storedSchedule = await AsyncStorage.getItem('moveGoalSchedule');
      if (storedSchedule) {
        const schedule = JSON.parse(storedSchedule);
        // Use the goal from the first day (Monday) as the baseline, or today's
        if (schedule.length > 0) {
          setGoal(schedule[0].goal);
        }
      }
    } catch (e) {
      console.error('Failed to load goal', e);
    }
  };

  const saveGoal = async () => {
    try {
      // When setting a daily move goal here, we update the entire schedule to this new value
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const newSchedule = days.map(day => ({ day, goal }));

      await AsyncStorage.setItem('moveGoalSchedule', JSON.stringify(newSchedule));

      // Also clear any temporary override for today since the user is setting a new main goal
      // Or we could leave it. Let's leave it for now to be safe, or clear it?
      // If I set a new goal of 600, I expect today to be 600.
      // So let's clear the override for today.
      const todayStr = new Date().toDateString();
      const storedOverride = await AsyncStorage.getItem('dailyMoveGoalOverride');
      if (storedOverride) {
        const override = JSON.parse(storedOverride);
        if (override.date === todayStr) {
          await AsyncStorage.removeItem('dailyMoveGoalOverride');
        }
      }

      navigation.goBack();
    } catch (e) {
      console.error('Failed to save goal', e);
    }
  };

  const adjustGoal = (amount: number) => {
    setGoal(prev => Math.max(10, prev + amount));
  };

  const startAdjusting = (amount: number) => {
    adjustGoal(amount);
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        adjustGoal(amount);
      }, 200);
    }, 500);
  };

  const stopAdjusting = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Feather name="x" size={24} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.listButton}
          onPress={() => navigation.navigate('MoveGoalSchedule')}
        >
          <MaterialCommunityIcons name="format-list-bulleted" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Daily Move Goal</Text>
        <Text style={styles.description}>
          Set a goal based on how active you are, or how active you'd like to be, each day.
        </Text>

        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={styles.controlButton}
            onPressIn={() => startAdjusting(-10)}
            onPressOut={stopAdjusting}
          >
            <MaterialCommunityIcons name="minus" size={32} color="#000" />
          </TouchableOpacity>

          <View style={styles.valueContainer}>
            <Text style={styles.valueText}>{goal}</Text>
            <Text style={styles.unitText}>KILOCALORIES/DAY</Text>
          </View>

          <TouchableOpacity
            style={styles.controlButton}
            onPressIn={() => startAdjusting(10)}
            onPressOut={stopAdjusting}
          >
            <MaterialCommunityIcons name="plus" size={32} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.actionButton} onPress={saveGoal}>
          <Text style={styles.actionButtonText}>Change Move Goal</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 22,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FA114F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueContainer: {
    alignItems: 'center',
  },
  valueText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFF',
    fontVariant: ['tabular-nums'],
  },
  unitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
  },
  actionButton: {
    backgroundColor: '#2C2C2E',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#9DEC2C',
  },
});
