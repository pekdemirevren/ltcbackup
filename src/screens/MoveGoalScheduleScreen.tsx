import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = StackScreenProps<RootStackParamList, 'MoveGoalSchedule'>;

export default function MoveGoalScheduleScreen({ navigation }: Props) {
  const [schedule, setSchedule] = useState([
    { day: 'Monday', goal: 500 },
    { day: 'Tuesday', goal: 500 },
    { day: 'Wednesday', goal: 500 },
    { day: 'Thursday', goal: 500 },
    { day: 'Friday', goal: 500 },
    { day: 'Saturday', goal: 500 },
    { day: 'Sunday', goal: 500 },
  ]);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      const storedSchedule = await AsyncStorage.getItem('moveGoalSchedule');
      if (storedSchedule) {
        setSchedule(JSON.parse(storedSchedule));
      }
    } catch (e) {
      console.error('Failed to load schedule', e);
    }
  };

  const saveSchedule = async () => {
    try {
      await AsyncStorage.setItem('moveGoalSchedule', JSON.stringify(schedule));
      navigation.goBack();
    } catch (e) {
      console.error('Failed to save schedule', e);
    }
  };

  const adjustGoal = (index: number, amount: number) => {
    setSchedule(prevSchedule => {
      const newSchedule = [...prevSchedule];
      newSchedule[index].goal = Math.max(10, newSchedule[index].goal + amount);
      return newSchedule;
    });
  };

  const startAdjusting = (index: number, amount: number) => {
    adjustGoal(index, amount);
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        adjustGoal(index, amount);
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

  const renderBarChart = () => {
    const maxGoal = Math.max(...schedule.map(s => s.goal), 100);
    return (
      <View style={styles.chartContainer}>
        <View style={styles.barsRow}>
          {schedule.map((item, index) => (
            <View key={index} style={styles.barWrapper}>
              <View style={[styles.bar, { height: (item.goal / maxGoal) * 60 }]} />
              <Text style={styles.barLabel}>{item.day.substring(0, 3)}</Text>
            </View>
          ))}
        </View>
        <View style={styles.chartAxis}>
          <Text style={styles.axisLabel}>{maxGoal}</Text>
          <Text style={styles.axisLabel}>0</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Feather name="x" size={24} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.calendarButton}
          onPress={() => navigation.navigate('DailyMoveGoal')}
        >
          <MaterialCommunityIcons name="calendar-month" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Move Goal Schedule</Text>
        <Text style={styles.description}>
          Set a goal based on how active you are, or how active you'd like to be, each day.
        </Text>

        {renderBarChart()}

        <View style={styles.listContainer}>
          {schedule.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={styles.dayText}>{item.day}</Text>
              <View style={styles.controls}>
                <TouchableOpacity
                  style={styles.smallControlButton}
                  onPressIn={() => startAdjusting(index, -10)}
                  onPressOut={stopAdjusting}
                >
                  <MaterialCommunityIcons name="minus" size={20} color="#000" />
                </TouchableOpacity>

                <Text style={styles.goalText}>{item.goal}<Text style={styles.unitText}>KCAL</Text></Text>

                <TouchableOpacity
                  style={styles.smallControlButton}
                  onPressIn={() => startAdjusting(index, 10)}
                  onPressOut={stopAdjusting}
                >
                  <MaterialCommunityIcons name="plus" size={20} color="#000" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.actionButton} onPress={saveSchedule}>
          <Text style={styles.actionButtonText}>Change Move Goal Schedule</Text>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 10,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 30,
    lineHeight: 22,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 100,
    marginBottom: 30,
    alignItems: 'flex-end',
  },
  barsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 10,
  },
  barWrapper: {
    alignItems: 'center',
  },
  bar: {
    width: 4,
    backgroundColor: '#FA114F',
    borderRadius: 2,
    marginBottom: 8,
  },
  barLabel: {
    color: '#8E8E93',
    fontSize: 10,
  },
  chartAxis: {
    justifyContent: 'space-between',
    height: '100%',
    paddingBottom: 20,
  },
  axisLabel: {
    color: '#8E8E93',
    fontSize: 10,
  },
  listContainer: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2C2C2E',
    padding: 16,
    borderRadius: 16,
  },
  dayText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  smallControlButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FA114F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
    width: 90,
    textAlign: 'center',
  },
  unitText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: '#1C1C1E', // Ensure background covers scroll content
  },
  actionButton: {
    backgroundColor: '#2C2C2E',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  actionButtonText: {
    color: '#CCFF00',
    fontSize: 16,
    fontWeight: '600',
  },
});
