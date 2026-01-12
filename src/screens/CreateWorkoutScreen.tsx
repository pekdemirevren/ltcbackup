import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { StackScreenProps } from '@react-navigation/stack';

import Theme from '../constants/theme';
import { ThemeContext } from '../contexts/ThemeContext';
import { TimerContext } from '../contexts/TimerContext';
import { getStyles } from '../styles/CreateWorkoutScreen.styles';
import { RootStackParamList } from '../navigation/RootNavigator';

type CreateWorkoutScreenProps = StackScreenProps<RootStackParamList, any>; // Using any for screen name since it's not in the list yet

export function CreateWorkoutScreen({ navigation }: CreateWorkoutScreenProps) {
  const { colors, Icons } = useContext(ThemeContext)!;
  const { startTimerWithCurrentSettings } = useContext(TimerContext)!;
  const styles = getStyles(colors);

  const [selectedMode, setSelectedMode] = useState<'infinite' | 'custom'>('custom'); // 'infinite' or 'custom'

  const handleQuickStart = () => {
    // Call the global quick start method from TimerContext
    startTimerWithCurrentSettings(false); // Assuming quick start is not a custom workout
  };

  const handleCustomize = () => {
    // Navigate to the main settings screen
    navigation.navigate('Settings');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          {Icons.back.lib && <Icons.back.lib name={Icons.back.name} size={24} color={colors.text} />}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Workout</Text>
        <TouchableOpacity style={styles.headerIcon}>
          {/* This icon reference is from old App.js, replace with Theme.Icons or specific one */}
          <Feather name="bar-chart-2" size={24} color="white" style={{ transform: [{ rotate: '90deg' }] }} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Start Workout Button */}
        <TouchableOpacity onPress={handleQuickStart} activeOpacity={0.9}>
          <LinearGradient
            colors={colors.saveButtonGradient}
            style={[styles.startButton, { shadowColor: colors.time.primary }]}
          >
            <Text style={[styles.startButtonText, { color: colors.background }]}>Quick Start</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Customize Loop Button */}
        <TouchableOpacity
          style={[
            styles.modeButton,
            { backgroundColor: colors.lap.card, borderColor: colors.lap.card }
          ]}
          onPress={() => {
            setSelectedMode('custom');
            handleCustomize();
          }}
          activeOpacity={0.8}
        >
          <View style={styles.iconContainer}>
            {Icons.customize.lib && <Icons.customize.lib name={Icons.customize.name} size={32} color={colors.lap.primary} />}
          </View>
          <Text style={styles.modeButtonText}>Customize Loop</Text>
          <TouchableOpacity
            style={[styles.playIconContainer, { backgroundColor: colors.lap.primary }]}
            onPress={() => {
              setSelectedMode('custom');
              handleCustomize();
            }}
            activeOpacity={0.7}
          >
            {Icons.play.lib && <Icons.play.lib name={Icons.play.name} size={33} color={colors.playIconText} />}
          </TouchableOpacity>
        </TouchableOpacity>
      </View>

    </View>
  );
}
