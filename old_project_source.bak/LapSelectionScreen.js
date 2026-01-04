import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme } from './Theme';
import { getCardButtonPickerStyles } from './cardbuttonpicker.style';
import { ThemeContext } from './ThemeContext';

export function LapSelectionScreen({ route, navigation }) {
  const { colors } = useContext(ThemeContext);
  const styles = getCardButtonPickerStyles(colors);

  const { settings, workoutId, onSave } = route.params || {};

  // Default settings if not provided
  const defaultSettings = {
    greenReps: '3',
    redReps: '3'
  };

  const currentSettings = settings || defaultSettings;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />

      {/* Top Back Button */}
      <View style={styles.topBackButton}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.backButtonBackground }]}>
          <Theme.Icons.back.lib name={Theme.Icons.back.name} size={32} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lap Goal</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Green Reps Card */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.lap.card }]}
          onPress={() => navigation.navigate('GreenLapSettingsScreen', { settings: currentSettings, onSave, workoutId })}
          activeOpacity={0.8}
        >
          <View style={styles.iconContainer}>
            <Theme.Icons.lap.lib name={Theme.Icons.lap.name} size={32} color={colors.lap.primary} />
          </View>
          <Text style={styles.cardTitle}>Workout Lap</Text>
        </TouchableOpacity>

        {/* Red Reps Card */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.lap.card }]}
          onPress={() => navigation.navigate('RedLapSettingsScreen', { settings: currentSettings, onSave, workoutId })}
          activeOpacity={0.8}
        >
          <View style={styles.iconContainer}>
            <Theme.Icons.lap.lib name={Theme.Icons.lap.name} size={32} color={colors.lap.primary} />
          </View>
          <Text style={styles.cardTitle}>Break Lap</Text>
        </TouchableOpacity>

        {/* Start Workout Butonu */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.startButton, { backgroundColor: colors.lap.primary }]} activeOpacity={0.9}>
          <Text style={styles.startButtonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}