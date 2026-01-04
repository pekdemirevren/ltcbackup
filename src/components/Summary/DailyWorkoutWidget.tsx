import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { DailyWorkoutWidgetStyle, IconGradientColors } from '../../styles/dailyworkoutwidgetstyle';
import { allWorkouts, Workout } from '../../constants/workoutData';
import { loadWorkoutSettings, WorkoutSettings } from '../../utils/WorkoutSettingsManager';
import { loadWorkoutDayCards, WORKOUT_DAY_MUSCLE_GROUPS, WorkoutDayType } from '../../utils/WorkoutDayManager';

/**
 * DailyWorkoutWidget - Compact Version for Summary Screen
 * 
 * Workout Widget - Günlük antrenman özeti (Compact)
 * 
 * Layout (Summary/Compact):
 * - LEG DAY / CHEST DAY / SHOULDER DAY / BACK DAY / ABS DAY / BICEPS-TRICEPS DAY
 * - (5px) 5/7
 * - (10px) separator
 * - (10px) Saatlik: SET / kart ikonu (SVG) / KG (max 4 kart)
 * 
 * Full view opens in DailyWorkoutDetailScreen when tapped
 * 
 * Status sağ üstte: Takvim ikonu, "Today", "X Move"
 */

interface WorkoutCardData {
  workout: Workout;
  settings: WorkoutSettings;
}

// Re-export for backward compatibility
export type { WorkoutDayType };

// Workout day'e göre default workout'ları filtrele
const getDefaultWorkoutsByDay = (dayType: WorkoutDayType): Workout[] => {
  const muscleGroups = WORKOUT_DAY_MUSCLE_GROUPS[dayType];
  if (!muscleGroups) return allWorkouts.slice(0, 4);
  
  return allWorkouts.filter(w => muscleGroups.includes(w.muscleGroup));
};

interface DailyWorkoutWidgetProps {
  workoutDay?: WorkoutDayType;
  currentDay?: number;
  totalDays?: number;
  moveCount?: number;
  dailyCalorieGoal?: number;
  workoutIds?: string[]; // Override: specific workout IDs to show
  onPress?: () => void;
  onCalendarPress?: () => void;
}

export default function DailyWorkoutWidget({
  workoutDay = 'LEG DAY',
  currentDay = 5,
  totalDays = 7,
  moveCount,
  dailyCalorieGoal = 1000,
  workoutIds,
  onPress,
  onCalendarPress,
}: DailyWorkoutWidgetProps) {
  const [workoutCards, setWorkoutCards] = useState<WorkoutCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkoutData();
  }, [workoutIds, workoutDay]);

  const loadWorkoutData = async () => {
    try {
      // First check for saved cards for this workout day
      const savedIds = await loadWorkoutDayCards(workoutDay);
      
      let targetWorkouts: Workout[];
      
      if (savedIds.length > 0) {
        // Use saved card IDs
        targetWorkouts = savedIds
          .map(id => allWorkouts.find(w => w.workoutId === id))
          .filter((w): w is Workout => w !== undefined);
      } else if (workoutIds && workoutIds.length > 0) {
        // Use provided workout IDs
        targetWorkouts = workoutIds
          .map(id => allWorkouts.find(w => w.workoutId === id))
          .filter((w): w is Workout => w !== undefined);
      } else {
        // Filter by muscle group based on workout day (default)
        targetWorkouts = getDefaultWorkoutsByDay(workoutDay);
      }

      const cardsData: WorkoutCardData[] = [];
      
      // Get first 4 workouts for compact view
      for (const workout of targetWorkouts.slice(0, 4)) {
        const settings = await loadWorkoutSettings(workout.workoutId);
        cardsData.push({ workout, settings });
      }

      setWorkoutCards(cardsData);
    } catch (error) {
      console.error('Error loading workout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayMoveCount = moveCount ?? workoutCards.length;

  return (
    <TouchableOpacity 
      style={DailyWorkoutWidgetStyle.widgetContainer}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Üst Sol - Workout Day */}
      <Text style={[DailyWorkoutWidgetStyle.workoutDayLabel, { fontSize: 15 }]}>{workoutDay}</Text>
      
      {/* 5/7 büyük sayı (5px altında) */}
      <Text style={[DailyWorkoutWidgetStyle.workoutDayCount, { fontSize: 48 }]}>
        {currentDay}/{totalDays}
      </Text>

      {/* Sağ üst köşe - Status */}
      <View style={DailyWorkoutWidgetStyle.statusContainer}>
        <Text style={[DailyWorkoutWidgetStyle.statusText, { fontSize: 15 }]}>Today</Text>
        <Text style={[DailyWorkoutWidgetStyle.statusSubtext, { fontSize: 13 }]}>{displayMoveCount} Move</Text>
      </View>

      {/* Separator (10px margin) */}
      <View style={DailyWorkoutWidgetStyle.separator} />

      {/* Compact View - Kartlar: SET üstte, SVG ikon ortada, KG altta */}
      <View style={DailyWorkoutWidgetStyle.hourlyContainer}>
        <View style={DailyWorkoutWidgetStyle.hourlyRow}>
          {workoutCards.map((card) => {
            const SvgIcon = card.workout.SvgIcon;
            const sets = card.settings.targetSets || '3';
            const weight = card.settings.weight || '0';
            
            return (
              <View key={card.workout.workoutId} style={DailyWorkoutWidgetStyle.hourlyItem}>
                {/* SET sayısı (üstte) */}
                <Text style={[DailyWorkoutWidgetStyle.hourlyLabel, { fontSize: 13 }]}>
                  {sets}SET
                </Text>
                
                {/* Kart SVG ikonu (koyu yeşil gradient yuvarlak) */}
                <LinearGradient
                  colors={[IconGradientColors.start, IconGradientColors.end]}
                  style={[DailyWorkoutWidgetStyle.hourlyIconContainer, { width: 40, height: 40, borderRadius: 20 }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {SvgIcon && <SvgIcon width={22} height={22} fill="#9DEC2C" />}
                </LinearGradient>
                
                {/* KG (altta) */}
                <Text style={[DailyWorkoutWidgetStyle.hourlyValue, { fontSize: 14 }]}>
                  {weight}KG
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </TouchableOpacity>
  );
}

