import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = StackScreenProps<RootStackParamList, 'AdjustMoveGoal'>;

export default function AdjustMoveGoalScreen({ navigation }: Props) {
  const [goal, setGoal] = useState(500);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadTodayGoal();
  }, []);

  const loadTodayGoal = async () => {
    try {
        // Check for override first
        const todayStr = new Date().toDateString();
        const storedOverride = await AsyncStorage.getItem('dailyMoveGoalOverride');
        
        if (storedOverride) {
            const override = JSON.parse(storedOverride);
            if (override.date === todayStr) {
                setGoal(override.goal);
                return;
            }
        }

        // Fallback to schedule
        const storedSchedule = await AsyncStorage.getItem('moveGoalSchedule');
        if (storedSchedule) {
            const schedule = JSON.parse(storedSchedule);
            const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
            const dayItem = schedule.find((s: any) => s.day === dayName);
            if (dayItem) {
                setGoal(dayItem.goal);
            }
        }
    } catch (e) {
        console.error('Failed to load today goal', e);
    }
  };

  const saveTodayGoal = async () => {
    try {
        const todayStr = new Date().toDateString();
        const override = { date: todayStr, goal };
        await AsyncStorage.setItem('dailyMoveGoalOverride', JSON.stringify(override));
        navigation.goBack();
    } catch (e) {
        console.error('Failed to save today goal', e);
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
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Today's Move Goal</Text>
        <Text style={styles.description}>
          Set a temporary Move goal just for today based on how active you'd like to be. This does not affect your current goal schedule.
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
        <TouchableOpacity style={styles.actionButton} onPress={saveTodayGoal}>
          <Text style={styles.actionButtonText}>Change Move Goal for Today</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E', // Dark gray background like modal
  },
  header: {
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
      position: 'absolute',
      top: 0,
      backgroundColor: '#2C2C2E',
      padding: 12,
      borderRadius: 16,
      alignItems: 'center',
      width: '100%',
      marginBottom: 20,
      display: 'none' // Hiding this as it seems like a system notification in the screenshot
  },
  infoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4
  },
  infoTitle: {
      color: '#FFF',
      fontWeight: '600',
      marginLeft: 6
  },
  infoSubtitle: {
      color: '#8E8E93',
      fontSize: 12
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 40,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FA114F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueContainer: {
    alignItems: 'center',
  },
  valueText: {
    fontSize: 64,
    fontWeight: '600',
    color: '#FFF',
    fontVariant: ['tabular-nums'],
  },
  unitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  footer: {
    padding: 24,
  },
  actionButton: {
    backgroundColor: '#2C2C2E',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#CCFF00', // Lime green color from screenshot
    fontSize: 16,
    fontWeight: '600',
  },
});
