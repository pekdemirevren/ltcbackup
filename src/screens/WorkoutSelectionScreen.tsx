import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import TimeIcon from '../assets/icons/TimeIcon';
import { StackScreenProps } from '@react-navigation/stack';

import { ThemeContext } from '../styles/ThemeContext';
import { TimerContext } from '../contexts/TimerContext';
import { getStyles } from '../styles/WorkoutSelectionScreen.styles';
import { RootStackParamList } from '../App';

type WorkoutSelectionScreenProps = StackScreenProps<RootStackParamList, 'WorkoutSelectionScreen'>; // Assuming this screen will be added to RootStackParamList

interface LocalWorkoutCardProps {
  icon: string;
  iconLib: 'Feather' | 'MaterialCommunityIcons';
  title: string;
  color: string;
  onPress: () => void;
  onPlayPress?: () => void;
}

// Nested WorkoutCard component for this screen
const LocalWorkoutCard = ({ icon, iconLib, title, color, onPress, onPlayPress }: LocalWorkoutCardProps) => {
  const IconComponent = iconLib === 'Feather' ? Feather : MaterialCommunityIcons;
  const { colors } = useContext(ThemeContext)!; // Use ThemeContext for colors

  const localStyles = StyleSheet.create({
    card: {
      borderRadius: 16,
      marginBottom: 16,
      overflow: 'hidden',
    },
    cardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 24,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
      backgroundColor: 'rgba(255,255,255,0.1)',
      transform: [{ translateX: -5 }],
    },
    cardTitle: {
      flex: 1,
      fontSize: 18,
      color: 'white', // Directly using white, or could be colors.text
      fontWeight: '600',
    },
    playIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <TouchableOpacity style={[localStyles.card, { backgroundColor: color }]} onPress={onPress} activeOpacity={0.8}>
      <View style={localStyles.cardContent}>
        <View style={localStyles.iconContainer}>
          {icon === 'clock' ? (
            <TimeIcon width={19} height={19} color="white" />
          ) : (
            <IconComponent name={icon} size={19} color="white" />
          )}
        </View>
        <Text style={localStyles.cardTitle}>{title}</Text>
        {onPlayPress && (
          <TouchableOpacity style={[localStyles.playIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]} onPress={onPlayPress}>
            <Feather name="play" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};


export function WorkoutSelectionScreen({ navigation }: WorkoutSelectionScreenProps) {
  const { colors } = useContext(ThemeContext)!;
  const {
    startTimerWithCurrentSettings,
    setGreenTime,
    setRedTime,
    setGreenReps,
    setRedReps,
    setGreenCountdownSpeed,
    setRedCountdownSpeed,
    setInfiniteLoopTime,
    setInfiniteSpeed
  } = useContext(TimerContext)!;
  const styles = getStyles(colors);

  // Helper to load and set settings in context, then start timer
  const handleQuickStart = async (workoutType?: string) => {
    // Determine workoutId by type (for now, use type as id)
    const workoutId = workoutType || 'quickstart';
    try {
      const { loadWorkoutSettings } = await import('../utils/WorkoutSettingsManager');
      const settings = await loadWorkoutSettings(workoutId);
      setGreenTime(settings.greenTime);
      setRedTime(settings.restTime);
      setGreenReps(settings.greenReps);
      setRedReps(settings.redReps);
      setGreenCountdownSpeed(settings.greenCountdownSpeed);
      setRedCountdownSpeed(settings.redCountdownSpeed);
      if (settings.infiniteLoopTime) setInfiniteLoopTime(settings.infiniteLoopTime);
      if (settings.infiniteSpeed) setInfiniteSpeed(settings.infiniteSpeed);
      setTimeout(() => {
        startTimerWithCurrentSettings(false);
      }, 0);
    } catch (e) {
      // fallback: just start timer
      startTimerWithCurrentSettings(false);
    }
  };

  const handleSelectWorkout = (workoutType: string) => {
    switch (workoutType) {
      case 'time':
        navigation.navigate('TimeSelectionScreen', {}); // Navigate to TimeSelectionScreen
        break;
      case 'speed':
        navigation.navigate('SpeedSelectionScreen', {}); // Navigate to SpeedSelectionScreen
        break;
      case 'repeat':
        navigation.navigate('LapSelectionScreen', {}); // Navigate to LapSelectionScreen
        break;
      default:
        // Handle other workout types or fallback
        break;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="chevron-left" size={24} color="white" /> {/* Use Feather icon */}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Workout</Text>
        <View style={{ width: 40 }} /> {/* Başlığı ortalamak için boş view */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LocalWorkoutCard
          title="Quick Start"
          icon="play"
          iconLib="Feather"
          color="#192A02" // Hardcoded color from old file, ideally should come from theme
          onPress={() => handleQuickStart('quickstart')}
        />
        <LocalWorkoutCard
          title="Time"
          icon="clock"
          iconLib="Feather"
          color="#2E2A06" // Hardcoded color
          onPress={() => handleSelectWorkout('time')}
          onPlayPress={() => handleQuickStart('time')}
        />
        <LocalWorkoutCard
          title="Speed"
          icon="speedometer" // Using MaterialCommunityIcons for a better speed icon
          iconLib="MaterialCommunityIcons"
          color="#011E29" // Hardcoded color
          onPress={() => handleSelectWorkout('speed')}
          onPlayPress={() => handleQuickStart('speed')}
        />
        <LocalWorkoutCard
          title="Repeat"
          icon="repeat"
          iconLib="Feather"
          color="#370411" // Hardcoded color
          onPress={() => handleSelectWorkout('repeat')}
          onPlayPress={() => handleQuickStart('repeat')}
        />
      </ScrollView>
    </View>
  );
}
