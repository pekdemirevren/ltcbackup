import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const WorkoutCard = ({ icon, iconLib, title, color, onPress, onPlayPress }) => {
  const IconComponent = iconLib === 'Feather' ? Feather : MaterialCommunityIcons;

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: color }]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <IconComponent name={icon} size={24} color="white" />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
        {onPlayPress && (
          <TouchableOpacity style={[styles.playIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]} onPress={onPlayPress}>
            <Feather name="play" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export function WorkoutSelectionScreen({ onBack, onSelectWorkout, onQuickStart }) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Feather name="chevron-left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Workout</Text>
        <View style={{ width: 40 }} /> {/* Başlığı ortalamak için boş view */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <WorkoutCard
          title="Quick Start"
          icon="play"
          iconLib="Feather"
          color="#192A02"
          onPress={onQuickStart}
        />
        <WorkoutCard
          title="Time"
          icon="clock"
          iconLib="Feather"
          color="#2E2A06"
          onPress={() => onSelectWorkout('time')}
          onPlayPress={onQuickStart ? () => onQuickStart('time') : undefined}
        />
        <WorkoutCard
          title="Speed"
          icon="zap"
          iconLib="Feather"
          color="#011E29"
          onPress={() => onSelectWorkout('speed')}
          onPlayPress={onQuickStart ? () => onQuickStart('speed') : undefined}
        />
        <WorkoutCard
          title="Repeat"
          icon="repeat"
          iconLib="Feather"
          color="#370411"
          onPress={() => onSelectWorkout('repeat')}
          onPlayPress={onQuickStart ? () => onQuickStart('repeat') : undefined}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 28,
    color: "white",
    fontWeight: "bold",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
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
    // İkon arkaplan rengi kart renginden biraz daha açık/farklı olabilir
    // Şimdilik transparan bırakıyoruz, istenirse eklenebilir.
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    color: 'white',
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