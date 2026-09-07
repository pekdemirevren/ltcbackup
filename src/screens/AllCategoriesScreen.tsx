import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { allWorkouts, Workout, findExerciseIcon } from '../constants/workoutData';
import { collectibleWorkouts, CollectibleWorkout } from '../constants/collectibleWorkouts';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import { LiquidGlass } from '../components/LiquidGlass';

type AllCategoriesScreenProps = StackScreenProps<RootStackParamList, 'AllCategories'>;

interface CategoryItem {
  id: string;
  title: string;
  icon: string;
  iconType: 'feather' | 'material' | 'svg';
  screen: keyof RootStackParamList | null;
  nestedScreen?: string;
  isWorkout?: boolean;
  workoutId?: string;
  SvgIcon?: React.FC<any>;
}

// Static categories
const STATIC_CATEGORIES: CategoryItem[] = [
  { id: 'activity-rings', title: 'Activity Rings', icon: 'circle-slice-8', iconType: 'material', screen: 'Summary', nestedScreen: 'DailySummaryDetail' },
  { id: 'steps', title: 'Steps', icon: 'shoe-print', iconType: 'material', screen: null },
  { id: 'sessions', title: 'Sessions', icon: 'clock-outline', iconType: 'material', screen: 'SessionsScreen' },
  { id: 'trends', title: 'Trends', icon: 'trending-up', iconType: 'feather', screen: 'Summary', nestedScreen: 'Trends' },
  { id: 'awards', title: 'Awards', icon: 'hexagon-outline', iconType: 'material', screen: null },
];

// Convert all project workouts to category items
const WORKOUT_CATEGORIES: CategoryItem[] = allWorkouts.map((workout: Workout) => {
  const isWorkout = true;
  const workoutId = workout.workoutId;
  let IconComponent = workout.SvgIcon;

  // Optimized icon lookup: try to find exercise icon from collectible data if available
  const cw = (collectibleWorkouts as CollectibleWorkout[]).find(w => w.id === workoutId);
  if (cw && cw.exercises && cw.exercises.length > 0) {
    IconComponent = findExerciseIcon(cw.exercises[0].name);
  }

  return {
    id: workout.id,
    title: workout.name,
    icon: '',
    iconType: 'svg' as const,
    screen: 'WorkoutEventDetailScreen' as any,
    isWorkout,
    workoutId,
    SvgIcon: IconComponent,
  };
});

// Combined list
const CATEGORIES: CategoryItem[] = [...STATIC_CATEGORIES, ...WORKOUT_CATEGORIES];

import { FlashList } from '@shopify/flash-list';

export default function AllCategoriesScreen({ navigation }: AllCategoriesScreenProps) {
  const handleCategoryPress = React.useCallback((category: CategoryItem) => {
    if (category.screen) {
      if (category.isWorkout && category.workoutId) {
        navigation.navigate('CollectibleWorkoutDetail' as any, {
          workoutId: category.workoutId,
          workoutName: category.title,
        });
      } else if (category.screen === 'SessionsScreen') {
        navigation.navigate('SessionsScreen' as any);
      } else if (category.id === 'trends') {
        navigation.navigate('Trends' as any);
      } else if (category.nestedScreen) {
        navigation.navigate('Main' as any, {
          screen: category.screen,
          params: {
            screen: category.nestedScreen
          }
        });
      } else {
        navigation.navigate(category.screen as any);
      }
    }
  }, [navigation]);

  const renderItem = React.useCallback(({ item: category }: { item: CategoryItem }) => {
    const isWorkout = category.isWorkout;
    const iconSize = 24;
    const iconColor = '#9DEC2C';

    const IconComponent = category.SvgIcon || (isWorkout ? findExerciseIcon(category.workoutId || category.title) : null);

    return (
      <TouchableOpacity
        style={[styles.staticCard, { backgroundColor: 'rgba(255,255,255,0.06)' }]}
        onPress={() => handleCategoryPress(category)}
        activeOpacity={0.7}
      >
        <View style={styles.staticLeft}>
          <View style={styles.staticIconContainer}>
            {isWorkout ? (
              IconComponent ? (
                <IconComponent width={iconSize} height={iconSize} fill={iconColor} />
              ) : (
                <MaterialCommunityIcons name="dumbbell" size={iconSize} color={iconColor} />
              )
            ) : (
              category.iconType === 'svg' && IconComponent ? (
                <IconComponent width={iconSize} height={iconSize} fill={iconColor} />
              ) : category.iconType === 'feather' ? (
                <Feather name={category.icon} size={iconSize} color={iconColor} />
              ) : (
                <MaterialCommunityIcons name={category.icon} size={iconSize} color={iconColor} />
              )
            )}
          </View>
          <Text style={styles.staticTitle}>{category.title}</Text>
        </View>
        <Feather name="chevron-right" size={20} color="#8E8E93" />
      </TouchableOpacity>
    );
  }, [handleCategoryPress]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="chevron-left" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text style={styles.title}>All Categories</Text>

      {/* Categories List */}
      <FlashList
        {...({
          data: CATEGORIES,
          renderItem: renderItem,
          keyExtractor: (item: CategoryItem) => item.id,
          estimatedItemSize: 80,
          contentContainerStyle: styles.scrollContent,
          showsVerticalScrollIndicator: false,
        } as any)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 8,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFF',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  listContainer: {
    flex: 1,
    marginHorizontal: 15, // Slightly thinner
    backgroundColor: 'transparent', // Clearer container
    borderRadius: 32,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  staticCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderRadius: 32,
    borderWidth: 0, // Changed from 1 to 0
    borderColor: 'rgba(255,255,255,0.05)', // Border removed, so this might be redundant but kept for consistency
  },
  staticLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  staticIconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  staticTitle: {
    fontSize: 17,
    color: '#FFF',
    fontWeight: '400',
  },
});
