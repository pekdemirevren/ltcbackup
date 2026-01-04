import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from './Theme';
import { getStyles } from './CreateWorkoutScreen.styles';
import { ThemeContext } from './ThemeContext';

export function CreateWorkoutScreen({ navigation, onInfiniteStart, onCustomize, onBack, onQuickStart, currentInfiniteLoopTime }) {
  const { colors } = useContext(ThemeContext);
  const styles = getStyles(colors);
  
  const [selectedMode, setSelectedMode] = useState('custom'); // 'infinite' or 'custom'

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Theme.Icons.back.lib name={Theme.Icons.back.name} size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Workout</Text>
        <TouchableOpacity style={styles.headerIcon}>
            {/* Bu ikon referans tasarımda var, şimdilik yer tutucu olarak ekledim. */}
            <Feather name="bar-chart-2" size={24} color="white" style={{ transform: [{ rotate: '90deg' }]}}/>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Start Workout Button */}
        <TouchableOpacity onPress={onQuickStart} activeOpacity={0.9}>
            <LinearGradient
                colors={colors.saveButtonGradient}
                style={[styles.startButton, { shadowColor: colors.time.primary }]}
            >
                <Text style={[styles.startButtonText, { color: colors.background }]}>Quick Start</Text>
            </LinearGradient>
        </TouchableOpacity>

        {/* Customize Loop Button (Pro Feature) */}
        <TouchableOpacity 
          style={[
            styles.modeButton, 
            { backgroundColor: colors.lap.card, borderColor: colors.lap.card }
          ]} 
          onPress={() => {
            // "Customize Loop" seçildiğinde, doğrudan ayarlar ekranına git
            setSelectedMode('custom');
            onCustomize(); // Bu fonksiyon artık App.js'de settings ekranını açacak
          }}
          activeOpacity={0.8}
        >
          <View style={styles.iconContainer}>
            <Theme.Icons.customize.lib name={Theme.Icons.customize.name} size={32} color={colors.lap.primary} />
          </View>
          <Text style={styles.modeButtonText}>Customize Loop</Text>
          <TouchableOpacity 
            style={[styles.playIconContainer, {backgroundColor: colors.lap.primary}]}
            onPress={() => {
              setSelectedMode('custom');
              onCustomize();
            }}
            activeOpacity={0.7}
          >
            <Theme.Icons.play.lib name={Theme.Icons.play.name} size={33} color={colors.playIconText} />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>

    </View>
  );
}