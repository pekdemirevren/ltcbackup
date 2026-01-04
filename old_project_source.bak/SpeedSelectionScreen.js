import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme } from './Theme';
import { getCardButtonPickerStyles } from './cardbuttonpicker.style';
import { ThemeContext } from './ThemeContext';

export function SpeedSelectionScreen({ route, navigation }) {
  const { colors } = useContext(ThemeContext);
  const styles = getCardButtonPickerStyles(colors);
  
  // Get settings and callbacks from the new navigation parameters
  const { settings, workoutId, onSave } = route.params || {};
  
  // Default settings if not provided
  const defaultSettings = {
    greenSpeed: 1,
    redSpeed: 1
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
        <Text style={styles.headerTitle}>Speed Goal</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Green Speed Card */}
        <TouchableOpacity style={[styles.card, { backgroundColor: colors.speed.card }]} onPress={() => navigation.navigate('GreenSpeedSettingsScreen', { settings: currentSettings, onSave, workoutId })} activeOpacity={0.8}>
          <View style={styles.iconContainer}>
            {require('./assets/icons/speed.jsx').default ? (
              require('./assets/icons/speed.jsx').default({ width: 36, height: 36, color: colors.speed.primary })
            ) : null}
          </View>
          <Text style={styles.cardTitle}>Workout Speed</Text>
        </TouchableOpacity>

        {/* Red Speed Card */}
        <TouchableOpacity style={[styles.card, { backgroundColor: colors.speed.card }]} onPress={() => navigation.navigate('RedSpeedSettingsScreen', { settings: currentSettings, onSave, workoutId })} activeOpacity={0.8}>
          <View style={styles.iconContainer}>
            {require('./assets/icons/speed.jsx').default ? (
              require('./assets/icons/speed.jsx').default({ width: 36, height: 36, color: colors.speed.primary })
            ) : null}
          </View>
          <Text style={styles.cardTitle}>Break Speed</Text>
        </TouchableOpacity>

        {/* Start Workout Butonu */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.startButton, { backgroundColor: colors.speed.primary }]} activeOpacity={0.9}>
          <Text style={styles.startButtonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}