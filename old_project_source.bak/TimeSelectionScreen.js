import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme } from './Theme';
import { getCardButtonPickerStyles } from './cardbuttonpicker.style';
import { ThemeContext } from './ThemeContext';

export function TimeSelectionScreen({ route, navigation }) {
  const { colors } = useContext(ThemeContext);
  const styles = getCardButtonPickerStyles(colors, false);
  
  // Get settings and callbacks from the new navigation parameters
  const { settings, workoutId, onSave } = route.params || {};
  
  // Default settings if not provided
  const defaultSettings = {
    greenTime: '30',
    redTime: '15',
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
        <Text style={styles.headerTitle}>Time Goal</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={[styles.card, { backgroundColor: colors.time.card }]} onPress={() => navigation.navigate('GreenTimeSettingsScreen', { settings: currentSettings, onSave, workoutId })} activeOpacity={0.8}>
          <View style={styles.iconContainer}>
            <Theme.Icons.time.lib name={Theme.Icons.time.name} size={32} color={colors.time.primary} />
          </View>
          <Text style={styles.cardTitle}>Workout Time</Text>
        </TouchableOpacity>

        {/* Red Loop Time Card */}
        <TouchableOpacity style={[styles.card, { backgroundColor: colors.time.card }]} onPress={() => navigation.navigate('RedTimeSettingsScreen', { settings: currentSettings, onSave, workoutId })} activeOpacity={0.8}>
          <View style={styles.iconContainer}>
            <Theme.Icons.time.lib name={Theme.Icons.time.name} size={32} color={colors.time.primary} />
          </View>
          <Text style={styles.cardTitle}>Break Time</Text>
        </TouchableOpacity>

        {/* Start Workout Butonu */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.startButton, { backgroundColor: colors.time.primary }]} activeOpacity={0.9}>
          <Text style={styles.startButtonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}